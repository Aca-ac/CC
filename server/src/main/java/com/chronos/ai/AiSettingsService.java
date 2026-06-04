package com.chronos.ai;

import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.chronos.ai.dto.AiSettingsResponse;
import com.chronos.ai.dto.UpdateAiSettingsRequest;
import com.chronos.common.NotFoundException;
import com.chronos.entity.AiSettings;
import com.chronos.mapper.AiSettingsMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AiSettingsService {

    private static final Logger logger = LoggerFactory.getLogger(AiSettingsService.class);
    private static final String AES_GCM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;
    private static final SecureRandom secureRandom = new SecureRandom();

    private final AiSettingsMapper aiSettingsMapper;
    private final HttpServletRequest httpServletRequest;
    private final String masterKey;

    public AiSettingsService(
            AiSettingsMapper aiSettingsMapper,
            HttpServletRequest httpServletRequest,
            @Value("${chronos.ai.encryption.master-key:dev-master-key-change-me-32byte!}") String masterKey) {
        this.aiSettingsMapper = aiSettingsMapper;
        this.httpServletRequest = httpServletRequest;
        this.masterKey = masterKey;
    }

    /**
     * 列出当前用户的所有 AI 设置（仅返回 masked key，不返回明文或密文）。
     */
    public List<AiSettingsResponse> getSettings() {
        String userId = StpUtil.getLoginIdAsString();
        List<AiSettings> settings = aiSettingsMapper.selectList(
                new LambdaQueryWrapper<AiSettings>()
                        .eq(AiSettings::getUserId, userId)
        );
        return settings.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * 更新或创建指定 provider 的 AI Key。
     */
    @Transactional(rollbackFor = Exception.class)
    public AiSettingsResponse upsertSettings(UpdateAiSettingsRequest request) {
        String userId = StpUtil.getLoginIdAsString();

        // 安全检查：BYOK 写入必须走 HTTPS（localhost 例外）
        if (request.isCustom() && !isSecureRequest()) {
            throw new IllegalStateException("自定义 API Key 必须在 HTTPS 环境下设置");
        }

        // 加密 API Key
        String encryptedKey = encrypt(request.apiKey(), masterKey);

        // 生成 maskedKey（展示用，只显示首尾部分）
        String maskedKey = mask(request.apiKey());

        // 查找是否已有该 provider 的设置
        AiSettings existing = aiSettingsMapper.selectOne(
                new LambdaQueryWrapper<AiSettings>()
                        .eq(AiSettings::getUserId, userId)
                        .eq(AiSettings::getProvider, request.provider())
        );

        if (existing != null) {
            // 更新
            existing.setEncryptedKey(encryptedKey);
            existing.setIsCustom(request.isCustom());
            existing.setMaskedKey(maskedKey);
            existing.setUpdatedAt(LocalDateTime.now());
            aiSettingsMapper.updateById(existing);
            return toResponse(existing);
        } else {
            // 新建
            AiSettings settings = new AiSettings();
            settings.setId(UUID.randomUUID().toString());
            settings.setUserId(userId);
            settings.setProvider(request.provider());
            settings.setEncryptedKey(encryptedKey);
            settings.setIsCustom(request.isCustom());
            settings.setMaskedKey(maskedKey);
            settings.setCreatedAt(LocalDateTime.now());
            settings.setUpdatedAt(LocalDateTime.now());
            aiSettingsMapper.insert(settings);
            return toResponse(settings);
        }
    }

    /**
     * 删除指定 provider 的 AI Key。
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteSettings(String provider) {
        String userId = StpUtil.getLoginIdAsString();
        AiSettings existing = aiSettingsMapper.selectOne(
                new LambdaQueryWrapper<AiSettings>()
                        .eq(AiSettings::getUserId, userId)
                        .eq(AiSettings::getProvider, provider)
        );
        if (existing == null) {
            throw new NotFoundException("未找到指定 provider 的 AI 设置: " + provider);
        }
        aiSettingsMapper.deleteById(existing.getId());
    }

    /**
     * 获取用户的解密后的 API Key（供 #30 Provider Factory 使用）。
     */
    public String getDecryptedKey(String userId, String provider) {
        AiSettings settings = aiSettingsMapper.selectOne(
                new LambdaQueryWrapper<AiSettings>()
                        .eq(AiSettings::getUserId, userId)
                        .eq(AiSettings::getProvider, provider)
        );
        if (settings == null) {
            return null;
        }
        try {
            return decrypt(settings.getEncryptedKey(), masterKey);
        } catch (Exception e) {
            logger.error("解密 API Key 失败: provider={}, userId={}", provider, userId);
            return null;
        }
    }

    // ---------- 加密/解密 ----------

    /**
     * AES-GCM 加密，返回 Base64(IV || ciphertext)。
     */
    private String encrypt(String plainText, String key) {
        try {
            byte[] keyBytes = deriveKey(key);
            SecretKeySpec secretKey = new SecretKeySpec(keyBytes, "AES");

            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);

            Cipher cipher = Cipher.getInstance(AES_GCM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec);

            byte[] cipherText = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            // IV + ciphertext 合并后 Base64 编码
            byte[] combined = new byte[GCM_IV_LENGTH + cipherText.length];
            System.arraycopy(iv, 0, combined, 0, GCM_IV_LENGTH);
            System.arraycopy(cipherText, 0, combined, GCM_IV_LENGTH, cipherText.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("加密失败", e);
        }
    }

    /**
     * AES-GCM 解密，输入为 Base64(IV || ciphertext)。
     */
    private String decrypt(String encryptedBase64, String key) {
        try {
            byte[] keyBytes = deriveKey(key);
            SecretKeySpec secretKey = new SecretKeySpec(keyBytes, "AES");

            byte[] combined = Base64.getDecoder().decode(encryptedBase64);

            byte[] iv = new byte[GCM_IV_LENGTH];
            byte[] cipherText = new byte[combined.length - GCM_IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, GCM_IV_LENGTH);
            System.arraycopy(combined, GCM_IV_LENGTH, cipherText, 0, cipherText.length);

            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            Cipher cipher = Cipher.getInstance(AES_GCM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec);

            byte[] plainText = cipher.doFinal(cipherText);
            return new String(plainText, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("解密失败", e);
        }
    }

    /**
     * 从配置的 master key 派生 256-bit AES 密钥。
     * 简单处理：取 SHA-256 的低位或补齐/截断到 32 字节。
     */
    private byte[] deriveKey(String key) {
        byte[] keyBytes = key.getBytes(StandardCharsets.UTF_8);
        byte[] result = new byte[32]; // AES-256
        int len = Math.min(keyBytes.length, 32);
        System.arraycopy(keyBytes, 0, result, 0, len);
        return result;
    }

    /**
     * 对 API Key 进行脱敏显示。
     * sk-1234567890abcdef → sk-****cdef
     */
    private String mask(String apiKey) {
        if (apiKey == null || apiKey.length() <= 7) {
            return "****";
        }
        String prefix = apiKey.substring(0, Math.min(4, apiKey.length()));
        String suffix = apiKey.substring(Math.max(0, apiKey.length() - 4));
        return prefix + "****" + suffix;
    }

    /**
     * 判断当前请求是否通过 HTTPS（localhost 例外）。
     */
    private boolean isSecureRequest() {
        if (httpServletRequest == null) {
            return false;
        }
        String host = httpServletRequest.getServerName();
        // localhost/127.0.0.1 允许 HTTP
        if ("localhost".equals(host) || "127.0.0.1".equals(host) || "[::1]".equals(host)) {
            return true;
        }
        return httpServletRequest.isSecure();
    }

    private AiSettingsResponse toResponse(AiSettings settings) {
        return new AiSettingsResponse(
                settings.getId(),
                settings.getProvider(),
                Boolean.TRUE.equals(settings.getIsCustom()),
                settings.getMaskedKey(),
                settings.getUpdatedAt()
        );
    }
}

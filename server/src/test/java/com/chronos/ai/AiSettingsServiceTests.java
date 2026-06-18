package com.chronos.ai;

import cn.dev33.satoken.stp.StpUtil;
import com.chronos.ai.dto.AiSettingsResponse;
import com.chronos.ai.dto.UpdateAiSettingsRequest;
import com.chronos.common.NotFoundException;
import com.chronos.entity.AiSettings;
import com.chronos.entity.User;
import com.chronos.mapper.AiSettingsMapper;
import com.chronos.mapper.UserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AiSettingsServiceTests {

    @Autowired
    private AiSettingsService aiSettingsService;

    @Autowired
    private AiSettingsMapper aiSettingsMapper;

    @Autowired
    private UserMapper userMapper;

    private String testUserId;

    @BeforeEach
    void setUp() {
        testUserId = "aisettings-" + UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setId(testUserId);
        user.setName("AI设置测试用户");
        user.setEmail(testUserId + "@test.com");
        user.setPasswordHash("test-hash");
        userMapper.insert(user);
        StpUtil.login(testUserId);
    }

    @Test
    void shouldEncryptAndStoreApiKey() {
        UpdateAiSettingsRequest request = new UpdateAiSettingsRequest(
                "DEEPSEEK", "sk-1234567890abcdefghij123456", false);

        AiSettingsResponse response = aiSettingsService.upsertSettings(request);

        assertNotNull(response.id());
        assertEquals("DEEPSEEK", response.provider());
        assertFalse(response.isCustom());

        // 验证数据库中存储的是密文而非明文
        AiSettings dbRecord = aiSettingsMapper.selectById(response.id());
        assertNotNull(dbRecord.getEncryptedKey());
        assertNotEquals("sk-1234567890abcdefghij123456", dbRecord.getEncryptedKey());

        // 验证解密后可以得到明文
        String decrypted = aiSettingsService.getDecryptedKey(testUserId, "DEEPSEEK");
        assertEquals("sk-1234567890abcdefghij123456", decrypted);
    }

    @Test
    void shouldReturnMaskedKeyOnly() {
        aiSettingsService.upsertSettings(new UpdateAiSettingsRequest(
                "DEEPSEEK", "sk-1234567890abcdefghij123456", false));

        List<AiSettingsResponse> settings = aiSettingsService.getSettings();
        assertEquals(1, settings.size());

        AiSettingsResponse response = settings.get(0);
        // masked key 不应包含完整明文
        assertNotNull(response.maskedKey());
        assertTrue(response.maskedKey().contains("****"));
        assertNotEquals("sk-1234567890abcdefghij123456", response.maskedKey());
    }

    @Test
    void shouldOverwriteExistingKeyForSameProvider() {
        aiSettingsService.upsertSettings(new UpdateAiSettingsRequest(
                "DEEPSEEK", "sk-old-key-12345678901234567890", false));
        aiSettingsService.upsertSettings(new UpdateAiSettingsRequest(
                "DEEPSEEK", "sk-new-key-09876543210987654321", false));

        List<AiSettingsResponse> settings = aiSettingsService.getSettings();
        assertEquals(1, settings.size()); // 应只有一条记录

        String decrypted = aiSettingsService.getDecryptedKey(testUserId, "DEEPSEEK");
        assertEquals("sk-new-key-09876543210987654321", decrypted);
    }

    @Test
    void shouldSupportMultipleProviders() {
        aiSettingsService.upsertSettings(new UpdateAiSettingsRequest(
                "DEEPSEEK", "sk-deepseek-key-1234567890123456", false));
        aiSettingsService.upsertSettings(new UpdateAiSettingsRequest(
                "MIMO", "sk-mimo-key-65432109876543210987", true));

        List<AiSettingsResponse> settings = aiSettingsService.getSettings();
        assertEquals(2, settings.size());

        String deepseekKey = aiSettingsService.getDecryptedKey(testUserId, "DEEPSEEK");
        String mimoKey = aiSettingsService.getDecryptedKey(testUserId, "MIMO");
        assertEquals("sk-deepseek-key-1234567890123456", deepseekKey);
        assertEquals("sk-mimo-key-65432109876543210987", mimoKey);
    }

    @Test
    void shouldDeleteKey() {
        aiSettingsService.upsertSettings(new UpdateAiSettingsRequest(
                "DEEPSEEK", "sk-to-be-deleted-1234567890123456", false));

        aiSettingsService.deleteSettings("DEEPSEEK");

        List<AiSettingsResponse> settings = aiSettingsService.getSettings();
        assertTrue(settings.isEmpty());
        assertNull(aiSettingsService.getDecryptedKey(testUserId, "DEEPSEEK"));
    }

    @Test
    void shouldFailDeleteNonExistentKey() {
        assertThrows(NotFoundException.class,
                () -> aiSettingsService.deleteSettings("NONEXISTENT"));
    }

    @Test
    void shouldMarkIsCustomCorrectly() {
        aiSettingsService.upsertSettings(new UpdateAiSettingsRequest(
                "DEEPSEEK", "sk-custom-key-123456789012345678", true));

        List<AiSettingsResponse> settings = aiSettingsService.getSettings();
        assertEquals(1, settings.size());
        assertTrue(settings.get(0).isCustom());
    }

    @Test
    void shouldStoreEncryptedDataNotPlaintext() {
        aiSettingsService.upsertSettings(new UpdateAiSettingsRequest(
                "MIMO", "sk-plain-secret-should-not-be-stored", false));

        List<AiSettings> allRecords = aiSettingsMapper.selectList(null);
        for (AiSettings record : allRecords) {
            assertFalse(record.getEncryptedKey().contains("sk-plain-secret"));
        }
    }
}

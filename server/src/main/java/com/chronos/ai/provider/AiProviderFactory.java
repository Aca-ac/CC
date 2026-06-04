package com.chronos.ai.provider;

import com.chronos.ai.AiSettingsService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * AI 提供商工厂，根据配置和用户 BYOK 设置选择合适的提供商实例。
 * 优先级：用户自定义 Key > 服务器环境变量 Key > Mock
 */
@Component
public class AiProviderFactory {

    private final AiSettingsService aiSettingsService;

    private final String defaultProvider;
    private final boolean fallbackEnabled;
    private final String deepseekEndpoint;
    private final String deepseekModel;
    private final String deepseekApiKey;
    private final String mimoEndpoint;
    private final String mimoModel;
    private final String mimoApiKey;

    public AiProviderFactory(
            AiSettingsService aiSettingsService,
            @Value("${chronos.ai.provider:mock}") String defaultProvider,
            @Value("${chronos.ai.fallback-enabled:false}") boolean fallbackEnabled,
            @Value("${chronos.ai.providers.deepseek.endpoint:https://api.deepseek.com}") String deepseekEndpoint,
            @Value("${chronos.ai.providers.deepseek.model:deepseek-v4-flash}") String deepseekModel,
            @Value("${chronos.ai.api-key:}") String deepseekApiKey,
            @Value("${chronos.ai.providers.mimo.endpoint:https://api.minimaxi.com}") String mimoEndpoint,
            @Value("${chronos.ai.providers.mimo.model:mimo-v2.5-pro}") String mimoModel,
            @Value("${MIMO_API_KEY:}") String mimoApiKey) {
        this.aiSettingsService = aiSettingsService;
        this.defaultProvider = defaultProvider;
        this.fallbackEnabled = fallbackEnabled;
        this.deepseekEndpoint = deepseekEndpoint;
        this.deepseekModel = deepseekModel;
        this.deepseekApiKey = deepseekApiKey;
        this.mimoEndpoint = mimoEndpoint;
        this.mimoModel = mimoModel;
        this.mimoApiKey = mimoApiKey;
    }

    /**
     * 获取默认提供商（用于无需特定提供商的场景）。
     */
    public AiProvider getDefaultProvider(String userId) {
        return getProvider(userId, defaultProvider);
    }

    /**
     * 获取指定名称的提供商实例。
     * 优先使用用户的 BYOK Key，没有则使用服务器环境变量 Key。
     */
    public AiProvider getProvider(String userId, String providerName) {
        if (providerName == null) {
            providerName = "mock";
        }

        return switch (providerName.toLowerCase()) {
            case "deepseek" -> createDeepSeekProvider(userId);
            case "mimo" -> createMiMoProvider(userId);
            default -> new MockProvider();
        };
    }

    public boolean isFallbackEnabled() {
        return fallbackEnabled;
    }

    private AiProvider createDeepSeekProvider(String userId) {
        // 优先使用用户 BYOK
        String userKey = aiSettingsService.getDecryptedKey(userId, "DEEPSEEK");
        String key = (userKey != null) ? userKey : deepseekApiKey;
        if (key == null || key.isBlank()) {
            return new MockProvider();
        }
        return new DeepSeekProvider(deepseekEndpoint, deepseekModel, key);
    }

    private AiProvider createMiMoProvider(String userId) {
        // 优先使用用户 BYOK
        String userKey = aiSettingsService.getDecryptedKey(userId, "MIMO");
        String key = (userKey != null) ? userKey : mimoApiKey;
        if (key == null || key.isBlank()) {
            return new MockProvider();
        }
        return new MiMoProvider(mimoEndpoint, mimoModel, key);
    }
}

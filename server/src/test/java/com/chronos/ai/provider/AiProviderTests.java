package com.chronos.ai.provider;

import cn.dev33.satoken.stp.StpUtil;
import com.chronos.ai.AiSettingsService;
import com.chronos.ai.dto.UpdateAiSettingsRequest;
import com.chronos.ai.provider.dto.ChatCompletionRequest;
import com.chronos.ai.provider.dto.ChatCompletionResponse;
import com.chronos.entity.User;
import com.chronos.mapper.UserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AiProviderTests {

    @Autowired
    private AiProviderFactory providerFactory;

    @Autowired
    private AiSettingsService aiSettingsService;

    @Autowired
    private UserMapper userMapper;

    private String testUserId;

    @BeforeEach
    void setUp() {
        testUserId = "prov-test-" + UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setId(testUserId);
        user.setName("Provider测试用户");
        user.setEmail(testUserId + "@test.com");
        user.setPasswordHash("test-hash");
        userMapper.insert(user);
        StpUtil.login(testUserId);
    }

    @Test
    void shouldReturnMockProviderWhenConfigured() {
        AiProvider provider = providerFactory.getDefaultProvider(testUserId);
        assertNotNull(provider);
        assertTrue(provider instanceof MockProvider);
    }

    @Test
    void shouldGetProviderByName() {
        AiProvider mockProvider = providerFactory.getProvider(testUserId, "mock");
        assertEquals("mock", mockProvider.getProviderName());

        // 没有 API Key 时应回退到 Mock
        AiProvider deepseekProvider = providerFactory.getProvider(testUserId, "deepseek");
        assertNotNull(deepseekProvider);
    }

    @Test
    void shouldMockProviderReturnStructuredBreakdown() {
        MockProvider mock = new MockProvider();
        ChatCompletionRequest request = new ChatCompletionRequest(
                "你是一个项目规划助手", "请拆解目标：学习Java", 0.7, 2048, true);

        ChatCompletionResponse response = mock.chatCompletion(request);

        assertNotNull(response.content());
        assertTrue(response.content().contains("stages"));
        assertTrue(response.content().contains("基础入门"));
        assertEquals("mock-model", response.model());
    }

    @Test
    void shouldMockProviderReturnAdvice() {
        MockProvider mock = new MockProvider();
        ChatCompletionRequest request = new ChatCompletionRequest(
                "你是一个学习教练", "根据本周统计数据给出建议", 0.7, 2048, false);

        ChatCompletionResponse response = mock.chatCompletion(request);

        assertNotNull(response.content());
        assertTrue(response.content().contains("专注学习"));
        assertEquals("mock-model", response.model());
    }

    @Test
    void shouldMockProviderReturnGenericResponse() {
        MockProvider mock = new MockProvider();
        ChatCompletionRequest request = new ChatCompletionRequest(
                "你好", "随便聊聊", 0.7, 512, false);

        ChatCompletionResponse response = mock.chatCompletion(request);

        assertNotNull(response.content());
        assertTrue(response.content().contains("Mock"));
    }

    @Test
    void shouldUseUserKeyWhenAvailable() {
        // 保存用户自定义 DeepSeek Key
        aiSettingsService.upsertSettings(new UpdateAiSettingsRequest(
                "DEEPSEEK", "sk-user-custom-deepseek-key-123456", true));

        // 获取提供商（应使用用户 Key，但由于是测试环境，Key 无效 → 回退 Mock）
        AiProvider provider = providerFactory.getProvider(testUserId, "deepseek");
        assertNotNull(provider);

        // 验证设置已保存
        assertEquals("sk-user-custom-deepseek-key-123456",
                aiSettingsService.getDecryptedKey(testUserId, "DEEPSEEK"));
    }

    @Test
    void shouldFallbackNotEnabledByDefault() {
        assertFalse(providerFactory.isFallbackEnabled());
    }

    @Test
    void shouldGetMockProviderForUnknownProviderName() {
        AiProvider provider = providerFactory.getProvider(testUserId, "unknown-provider");
        assertNotNull(provider);
        assertEquals("mock", provider.getProviderName());
    }
}

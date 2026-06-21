package com.chronos.ai.provider.dto;

/**
 * 提供商无关的聊天补全请求。
 */
public record ChatCompletionRequest(
        String systemPrompt,
        String userMessage,
        double temperature,
        int maxTokens,
        boolean jsonMode,
        // 推理强度（如 deepseek-v4-pro 的 "high"）；为空则不传该参数。
        String reasoningEffort
) {
    public ChatCompletionRequest {
        if (temperature <= 0) temperature = 0.7;
        if (maxTokens <= 0) maxTokens = 2048;
    }

    /** 兼容旧调用：不指定推理强度。 */
    public ChatCompletionRequest(String systemPrompt, String userMessage, double temperature,
                                 int maxTokens, boolean jsonMode) {
        this(systemPrompt, userMessage, temperature, maxTokens, jsonMode, null);
    }
}

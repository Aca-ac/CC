package com.chronos.ai.provider.dto;

/**
 * 提供商无关的聊天补全请求。
 */
public record ChatCompletionRequest(
        String systemPrompt,
        String userMessage,
        double temperature,
        int maxTokens,
        boolean jsonMode
) {
    public ChatCompletionRequest {
        if (temperature <= 0) temperature = 0.7;
        if (maxTokens <= 0) maxTokens = 2048;
    }
}

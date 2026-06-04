package com.chronos.ai.provider.dto;

/**
 * 提供商无关的聊天补全响应。
 */
public record ChatCompletionResponse(
        String content,
        String model,
        int promptTokens,
        int completionTokens,
        String finishReason
) {}

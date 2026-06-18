package com.chronos.ai.provider;

import com.chronos.ai.provider.dto.ChatCompletionRequest;
import com.chronos.ai.provider.dto.ChatCompletionResponse;

/**
 * AI 服务提供商抽象接口，所有适配器统一实现此接口。
 * 遵循 OpenAI-compatible chat completions 协议。
 */
public interface AiProvider {
    /** 提供商名称，如 "deepseek", "mimo", "mock" */
    String getProviderName();

    /** 执行一次聊天补全请求 */
    ChatCompletionResponse chatCompletion(ChatCompletionRequest request);

    /** 提供商是否可用 */
    default boolean isAvailable() {
        return true;
    }
}

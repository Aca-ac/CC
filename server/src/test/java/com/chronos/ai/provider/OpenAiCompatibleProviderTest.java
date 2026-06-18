package com.chronos.ai.provider;

import com.chronos.ai.provider.dto.ChatCompletionRequest;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class OpenAiCompatibleProviderTest {

    @Test
    void buildsChatCompletionsUrlFromBaseUrl() {
        OpenAiCompatibleProvider provider =
            new OpenAiCompatibleProvider("https://api.example.com", "gpt-4o-mini", "sk-test");
        // 暴露用于断言的受保护/包级方法 endpoint()
        assertNotNull(provider);
        org.junit.jupiter.api.Assertions.assertEquals(
            "https://api.example.com/v1/chat/completions", provider.endpoint());
    }

    @Test
    void implementsAiProvider() {
        AiProvider p = new OpenAiCompatibleProvider("https://api.example.com", "m", "k");
        assertNotNull(p);
    }
}

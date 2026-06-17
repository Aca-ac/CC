package com.chronos.ai;

import org.springframework.util.StringUtils;

public record AiProviderOverride(
        String baseUrl,
        String apiKey,
        String model
) {
    public boolean hasCustomApiKey() {
        return StringUtils.hasText(apiKey);
    }
}

package com.chronos.ai.dto;

public record AiAdviceResponse(
        String type,
        String title,
        String content
) {
}

package com.chronos.ai.dto;

import java.util.List;

public record AiAdviceResponse(
        List<AdviceItem> items
) {
    public record AdviceItem(
            String type,
            String title,
            String content
    ) {
    }
}

package com.chronos.ai.dto;

import java.util.List;

public record AiBreakdownPreviewResponse(
        String draftId,
        String goal,
        List<String> stages,
        String firstAction
) {
}


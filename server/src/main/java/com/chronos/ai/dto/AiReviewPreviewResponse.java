package com.chronos.ai.dto;

import java.util.List;

public record AiReviewPreviewResponse(
        String draftId,
        String projectId,
        String summary,
        List<String> insights,
        List<String> suggestions
) {
}
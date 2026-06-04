package com.chronos.ai.dto;

import jakarta.validation.constraints.NotBlank;

public record AiReviewPreviewRequest(
        @NotBlank(message = "项目ID不能为空")
        String projectId
) {
}
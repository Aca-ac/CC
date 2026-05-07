package com.chronos.ai.dto;

import jakarta.validation.constraints.NotBlank;

public record AiFeedbackRequest(
        @NotBlank(message = "草稿 ID 不能为空")
        String draftId,

        boolean helpful,

        String comment
) {
}


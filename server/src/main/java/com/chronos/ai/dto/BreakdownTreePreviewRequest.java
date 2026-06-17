package com.chronos.ai.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record BreakdownTreePreviewRequest(
        @NotBlank(message = "学习目标不能为空")
        String goal,

        @Min(value = 1, message = "计划周期至少 1 周")
        Integer weeks,

        String projectId
) {
}

package com.chronos.task.dto;

import jakarta.validation.constraints.NotBlank;

public record TaskStatusRequest(
        @NotBlank(message = "任务状态不能为空")
        String status
) {
}


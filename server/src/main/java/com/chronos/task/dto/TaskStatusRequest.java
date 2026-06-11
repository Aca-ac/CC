package com.chronos.task.dto;

import com.chronos.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TaskStatusRequest(
        @NotNull(message = "任务状态不能为空")
        TaskStatus status
) {
}


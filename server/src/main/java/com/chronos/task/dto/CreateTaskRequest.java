package com.chronos.task.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.OffsetDateTime;

public record CreateTaskRequest(
        @NotBlank(message = "项目 ID 不能为空")
        String projectId,
        String description,
        String parentTaskId,

        @NotBlank(message = "任务标题不能为空")
        String title,

        String priority,

        @Min(value = 1, message = "预计时间至少 1 分钟")
        int estimatedMinutes,

        OffsetDateTime dueTime
) {
}


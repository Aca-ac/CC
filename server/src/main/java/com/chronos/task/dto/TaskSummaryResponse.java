package com.chronos.task.dto;

import com.chronos.enums.Priority;
import com.chronos.enums.TaskStatus;

import java.time.OffsetDateTime;

public record TaskSummaryResponse(
    String id,
    String projectId,
    String title,
    TaskStatus status,
    Priority priority,
    Integer estimatedMinutes,
    OffsetDateTime dueTime,
    String parentTaskId,
    String description,
    Integer actualMinutes,
    String[] tags
) {
}


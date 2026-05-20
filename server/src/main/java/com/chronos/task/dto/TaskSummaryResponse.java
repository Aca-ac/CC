package com.chronos.task.dto;

import com.chronos.enums.Priority;

import java.time.OffsetDateTime;

public record TaskSummaryResponse(
    String id,
    String projectId,
    String title,
    com.chronos.enums.TaskStatus status,
    Priority priority,
    int estimatedMinutes,
    OffsetDateTime dueTime,
    String parentTaskId,
    String description,
    Integer actualMinutes,
    String[] tags
) {
}


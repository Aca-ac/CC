package com.chronos.task.dto;

import java.time.OffsetDateTime;

public record TaskSummaryResponse(
        String id,
        String projectId,
        String title,
        String status,
        String priority,
        int estimatedMinutes,
        OffsetDateTime dueTime,
        String parentTaskId,
        String description,
        Integer actualMinutes,
        String[] tags
) {
}


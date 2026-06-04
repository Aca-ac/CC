package com.chronos.learninglog.dto;

import java.time.LocalDateTime;

public record LearningLogResponse(
        String id,
        String projectId,
        String taskId,
        String content,
        Integer actualMinutes,
        Integer difficulty,
        String[] links,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}

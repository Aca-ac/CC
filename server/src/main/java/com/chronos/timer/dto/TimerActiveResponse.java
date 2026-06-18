package com.chronos.timer.dto;

import java.time.LocalDateTime;

public record TimerActiveResponse(
        String id,
        String projectId,
        String taskId,
        LocalDateTime startedAt,
        long elapsedSeconds,
        String projectName,
        String taskTitle
) {}

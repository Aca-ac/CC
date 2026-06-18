package com.chronos.timer.dto;

public record TimerStartRequest(
        String projectId,
        String taskId
) {}

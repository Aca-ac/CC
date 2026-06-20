package com.chronos.timer.dto;

public record TimerStartRequest(
        String projectId,
        String taskId,
        String sessionId
) {
    public TimerStartRequest(String projectId, String taskId) {
        this(projectId, taskId, null);
    }
}

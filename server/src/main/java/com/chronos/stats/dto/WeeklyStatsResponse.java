package com.chronos.stats.dto;

import java.util.List;

public record WeeklyStatsResponse(
        String weekStart,
        String weekEnd,
        int totalTasks,
        int completedTasks,
        double completionRate,
        int totalFocusMinutes,
        int habitCheckins,
        int learningLogs,
        List<DailyStats> dailyStats,
        List<ProjectStats> projectDistribution
) {
    public record DailyStats(
            String date,
            int tasksCompleted,
            int focusMinutes,
            int checkins
    ) {}

    public record ProjectStats(
            String projectId,
            String projectName,
            int totalTasks,
            int completedTasks
    ) {}
}
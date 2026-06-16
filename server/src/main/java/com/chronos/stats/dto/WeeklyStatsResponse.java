package com.chronos.stats.dto;

import java.util.List;

public record WeeklyStatsResponse(
        int totalCompleted,
        double completionRate,
        List<DailyMinutes> dailyMinutes,
        List<ProjectDistribution> projectDistribution
) {
    public record DailyMinutes(
            String date,
            int minutes
    ) {
    }

    public record ProjectDistribution(
            String projectId,
            String projectName,
            int minutes
    ) {
    }
}

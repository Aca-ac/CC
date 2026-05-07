package com.chronos.dashboard.dto;

public record TodayDashboardResponse(
        int todayTaskTotal,
        int completedTaskTotal,
        int focusMinutes,
        int habitStreak,
        int syncPendingTotal
) {
}


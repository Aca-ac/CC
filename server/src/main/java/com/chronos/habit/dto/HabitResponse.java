package com.chronos.habit.dto;

import java.time.LocalDateTime;

public record HabitResponse(
        String id,
        String name,
        String ruleText,
        int streakCount,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

package com.chronos.habit.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record CheckinResponse(
        String id,
        String habitId,
        LocalDate checkedDate,
        LocalDateTime checkedAt,
        String note,
        int streakCount
) {
}

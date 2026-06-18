package com.chronos.habit.dto;

import java.time.LocalDate;

public record CheckinHabitRequest(
        LocalDate date,
        String note
) {
}

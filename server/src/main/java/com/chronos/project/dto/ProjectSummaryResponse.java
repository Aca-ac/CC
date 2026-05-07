package com.chronos.project.dto;

import java.time.LocalDate;

public record ProjectSummaryResponse(
        String id,
        String name,
        String goal,
        LocalDate startDate,
        LocalDate endDate,
        String status,
        int progress
) {
}


package com.chronos.habit.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateHabitRequest(
        @NotBlank(message = "习惯名称不能为空")
        String name,

        String ruleText
) {
}

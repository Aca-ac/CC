package com.chronos.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CreateProjectRequest(
        @NotBlank(message = "项目名称不能为空")
        String name,

        @NotBlank(message = "项目目标不能为空")
        String goal,

        @NotNull(message = "开始日期不能为空")
        LocalDate startDate,

        @NotNull(message = "截止日期不能为空")
        LocalDate endDate
) {
}


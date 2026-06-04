package com.chronos.learninglog.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateLearningLogRequest(
        @NotBlank(message = "项目ID不能为空")
        String projectId,

        String taskId,

        @NotBlank(message = "学习日志内容不能为空")
        String content,

        @NotNull(message = "实际学习时间不能为空")
        @Min(value = 1, message = "实际学习时间至少1分钟")
        Integer actualMinutes,

        @Min(value = 1, message = "学习难度最低为1")
        @Max(value = 5, message = "学习难度最高为5")
        Integer difficulty,

        String[] links
) {}

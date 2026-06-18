package com.chronos.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateAiSettingsRequest(
        @NotBlank(message = "AI提供商不能为空")
        String provider,

        @NotBlank(message = "API密钥不能为空")
        @Size(min = 8, message = "API密钥至少需要8个字符")
        String apiKey,

        boolean isCustom
) {}

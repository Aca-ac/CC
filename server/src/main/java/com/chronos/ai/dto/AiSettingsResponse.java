package com.chronos.ai.dto;

import java.time.LocalDateTime;

public record AiSettingsResponse(
        String id,
        String provider,
        boolean isCustom,
        String maskedKey,
        LocalDateTime updatedAt
) {}

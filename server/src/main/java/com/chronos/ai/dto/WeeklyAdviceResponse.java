package com.chronos.ai.dto;

import java.time.LocalDateTime;

/**
 * AI 周度学习建议响应。
 */
public record WeeklyAdviceResponse(
        String adviceId,
        String title,
        String content,
        String type,
        LocalDateTime generatedAt
) {}

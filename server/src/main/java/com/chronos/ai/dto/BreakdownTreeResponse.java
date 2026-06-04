package com.chronos.ai.dto;

import java.util.List;

/**
 * AI 生成的可编辑任务树预览响应。
 */
public record BreakdownTreeResponse(
        String draftId,
        String goal,
        int weeks,
        List<StageNode> stages
) {
    public record StageNode(
            String title,
            List<TaskDraft> tasks
    ) {}

    public record TaskDraft(
            String title,
            String description,
            int estimatedMinutes,
            String priority
    ) {}
}

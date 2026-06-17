package com.chronos.ai.dto;

import java.util.List;

public record AiBreakdownPreviewResponse(
        String draftId,
        String projectName,
        String goal,
        List<BreakdownPhase> phases,
        BreakdownTask firstAction
) {
    public record BreakdownPhase(
            String name,
            int weeks,
            List<BreakdownTask> tasks
    ) {
    }

    public record BreakdownTask(
            String title,
            String description,
            int estimatedMinutes,
            String priority,
            List<BreakdownTask> subTasks
    ) {
    }
}

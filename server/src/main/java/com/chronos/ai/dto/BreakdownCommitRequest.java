package com.chronos.ai.dto;

import com.chronos.enums.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户确认后的任务树提交请求。
 */
public record BreakdownCommitRequest(
        @NotBlank(message = "草稿ID不能为空")
        String draftId,

        @NotBlank(message = "项目ID不能为空")
        String projectId,

        @NotNull(message = "任务列表不能为空")
        List<CommitTaskNode> tasks
) {
    public record CommitTaskNode(
            String parentTaskId,
            @NotBlank(message = "任务标题不能为空")
            String title,
            String description,
            int estimatedMinutes,
            Priority priority,
            List<CommitTaskNode> subtasks,
            LocalDateTime dueTime
    ) {
        /** 向后兼容：不指定截止时间时默认 null。 */
        public CommitTaskNode(String parentTaskId, String title, String description,
                              int estimatedMinutes, Priority priority, List<CommitTaskNode> subtasks) {
            this(parentTaskId, title, description, estimatedMinutes, priority, subtasks, null);
        }
    }
}

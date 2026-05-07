package com.chronos.task;

import com.chronos.task.dto.CreateTaskRequest;
import com.chronos.task.dto.TaskStatusRequest;
import com.chronos.task.dto.TaskSummaryResponse;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class TaskService {

    public List<TaskSummaryResponse> listTasks() {
        // TODO(后端A): 支持 projectId、status、dueDate、keyword 等查询条件。
        return List.of(sampleTask());
    }

    public TaskSummaryResponse createTask(CreateTaskRequest request) {
        // TODO(后端A): 写入 tasks 表，支持 parentTaskId 形成任务树。
        return new TaskSummaryResponse(
                "task-new",
                request.projectId(),
                request.title(),
                "TODO",
                request.priority(),
                request.estimatedMinutes(),
                request.dueTime()
        );
    }

    public TaskSummaryResponse updateStatus(String taskId, TaskStatusRequest request) {
        // TODO(后端A): 校验状态流转规则，并记录状态变更时间。
        TaskSummaryResponse current = sampleTask();
        return new TaskSummaryResponse(
                taskId,
                current.projectId(),
                current.title(),
                request.status(),
                current.priority(),
                current.estimatedMinutes(),
                current.dueTime()
        );
    }

    private TaskSummaryResponse sampleTask() {
        return new TaskSummaryResponse(
                "task-api",
                "project-se",
                "整理第一版 REST API 草案",
                "IN_PROGRESS",
                "HIGH",
                90,
                OffsetDateTime.parse("2026-05-09T18:00:00+08:00")
        );
    }
}


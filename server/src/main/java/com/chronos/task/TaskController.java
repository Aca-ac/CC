package com.chronos.task;

import com.chronos.common.ApiResponse;
import com.chronos.task.dto.CreateTaskRequest;
import com.chronos.task.dto.TaskStatusRequest;
import com.chronos.task.dto.TaskSummaryResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ApiResponse<List<TaskSummaryResponse>> listTasks() {
        return ApiResponse.ok(taskService.listTasks());
    }

    @PostMapping
    public ApiResponse<TaskSummaryResponse> createTask(@Valid @RequestBody CreateTaskRequest request) {
        return ApiResponse.ok(taskService.createTask(request));
    }

    @PatchMapping("/{taskId}/status")
    public ApiResponse<TaskSummaryResponse> updateStatus(
            @PathVariable String taskId,
            @Valid @RequestBody TaskStatusRequest request
    ) {
        return ApiResponse.ok(taskService.updateStatus(taskId, request));
    }
}


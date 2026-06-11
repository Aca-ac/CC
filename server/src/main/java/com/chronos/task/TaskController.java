package com.chronos.task;

import com.chronos.common.ApiResponse;
import com.chronos.enums.TaskStatus;
import com.chronos.task.dto.CreateTaskRequest;
import com.chronos.task.dto.TaskStatusRequest;
import com.chronos.task.dto.TaskSummaryResponse;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ApiResponse<List<TaskSummaryResponse>> listTasks(
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dueTime,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder) {
        return ApiResponse.ok(taskService.listTasks(projectId, status, dueTime, keyword, page, size, sortBy, sortOrder));
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


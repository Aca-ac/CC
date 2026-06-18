package com.chronos.learninglog;

import com.chronos.common.ApiResponse;
import com.chronos.learninglog.dto.CreateLearningLogRequest;
import com.chronos.learninglog.dto.LearningLogResponse;
import com.chronos.learninglog.dto.UpdateLearningLogRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/learning-logs")
public class LearningLogController {

    private final LearningLogService learningLogService;

    public LearningLogController(LearningLogService learningLogService) {
        this.learningLogService = learningLogService;
    }

    @PostMapping
    public ApiResponse<LearningLogResponse> create(@Valid @RequestBody CreateLearningLogRequest request) {
        return ApiResponse.ok(learningLogService.create(request));
    }

    @GetMapping
    public ApiResponse<List<LearningLogResponse>> list(
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) String taskId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(learningLogService.listLogs(projectId, taskId, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<LearningLogResponse> detail(@PathVariable String id) {
        return ApiResponse.ok(learningLogService.getDetail(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<LearningLogResponse> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateLearningLogRequest request) {
        return ApiResponse.ok(learningLogService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        learningLogService.delete(id);
        return ApiResponse.ok(null);
    }
}

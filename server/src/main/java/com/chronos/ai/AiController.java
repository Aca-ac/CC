package com.chronos.ai;

import com.chronos.ai.dto.*;
import com.chronos.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {
    private final AiService aiService;
    private final AiSettingsService aiSettingsService;

    public AiController(AiService aiService, AiSettingsService aiSettingsService) {
        this.aiService = aiService;
        this.aiSettingsService = aiSettingsService;
    }

    // ---------- 原有端点 ----------

    @PostMapping("/breakdown-preview")
    public ApiResponse<AiBreakdownPreviewResponse> breakdownPreview(
            @Valid @RequestBody AiBreakdownPreviewRequest request) {
        return ApiResponse.ok(aiService.previewBreakdown(request));
    }

    @PostMapping("/feedback")
    public ApiResponse<Void> feedback(@Valid @RequestBody AiFeedbackRequest request) {
        aiService.recordFeedback(request);
        return ApiResponse.ok(null);
    }

    // ---------- #31 新增端点 ----------

    @PostMapping("/breakdown/preview")
    public ApiResponse<BreakdownTreeResponse> breakdownTreePreview(
            @Valid @RequestBody BreakdownTreePreviewRequest request) {
        return ApiResponse.ok(aiService.previewBreakdownTree(request.goal(), request.weeks(), request.projectId()));
    }

    @PostMapping("/breakdown/commit")
    public ApiResponse<Map<String, Object>> commitBreakdown(
            @Valid @RequestBody BreakdownCommitRequest request) {
        return ApiResponse.ok(aiService.commitBreakdown(request));
    }

    @PostMapping("/advice")
    public ApiResponse<WeeklyAdviceResponse> generateAdvice(
            @RequestParam(required = false) String projectId) {
        return ApiResponse.ok(aiService.generateWeeklyAdvice(projectId));
    }

    // ---------- AI Settings 端点 ----------

    @GetMapping("/settings")
    public ApiResponse<List<AiSettingsResponse>> getSettings() {
        return ApiResponse.ok(aiSettingsService.getSettings());
    }

    @PutMapping("/settings")
    public ApiResponse<AiSettingsResponse> updateSettings(
            @Valid @RequestBody UpdateAiSettingsRequest request) {
        return ApiResponse.ok(aiSettingsService.upsertSettings(request));
    }

    @DeleteMapping("/settings/key/{provider}")
    public ApiResponse<Void> deleteKey(@PathVariable String provider) {
        aiSettingsService.deleteSettings(provider);
        return ApiResponse.ok(null);
    }
}

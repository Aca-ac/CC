package com.chronos.ai;

import com.chronos.ai.dto.AiAdviceResponse;
import com.chronos.ai.dto.AiBreakdownPreviewRequest;
import com.chronos.ai.dto.AiBreakdownPreviewResponse;
import com.chronos.ai.dto.AiFeedbackRequest;
import com.chronos.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {
    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/breakdown-preview")
    public ApiResponse<AiBreakdownPreviewResponse> breakdownPreview(
            @Valid @RequestBody AiBreakdownPreviewRequest request,
            @RequestHeader(value = "X-Chronos-AI-Base-URL", required = false) String baseUrl,
            @RequestHeader(value = "X-Chronos-AI-API-Key", required = false) String apiKey,
            @RequestHeader(value = "X-Chronos-AI-Model", required = false) String model
    ) {
        return ApiResponse.ok(aiService.previewBreakdown(request, new AiProviderOverride(baseUrl, apiKey, model)));
    }

    @PostMapping("/breakdown-commit")
    public ApiResponse<Void> breakdownCommit(@Valid @RequestBody AiBreakdownPreviewResponse request) {
        aiService.commitBreakdown(request);
        return ApiResponse.ok(null);
    }

    @PostMapping("/feedback")
    public ApiResponse<Void> feedback(@Valid @RequestBody AiFeedbackRequest request) {
        aiService.recordFeedback(request);
        return ApiResponse.ok(null);
    }

    @GetMapping("/advice")
    public ApiResponse<AiAdviceResponse> advice() {
        return ApiResponse.ok(aiService.getWeeklyAdvice());
    }
}

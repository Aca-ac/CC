package com.chronos.ai;

import com.chronos.ai.dto.AiBreakdownPreviewRequest;
import com.chronos.ai.dto.AiBreakdownPreviewResponse;
import com.chronos.ai.dto.AiFeedbackRequest;
import com.chronos.common.ApiResponse;
import jakarta.validation.Valid;
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
            @Valid @RequestBody AiBreakdownPreviewRequest request
    ) {
        return ApiResponse.ok(aiService.previewBreakdown(request));
    }

    @PostMapping("/feedback")
    public ApiResponse<Void> feedback(@Valid @RequestBody AiFeedbackRequest request) {
        aiService.recordFeedback(request);
        return ApiResponse.ok(null);
    }
}


package com.chronos.ai;

import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chronos.ai.dto.AiBreakdownPreviewRequest;
import com.chronos.ai.dto.AiBreakdownPreviewResponse;
import com.chronos.ai.dto.AiFeedbackRequest;
import com.chronos.entity.AiAdvice;
import com.chronos.mapper.AiAdviceMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AiService extends ServiceImpl<AiAdviceMapper, AiAdvice> {

    private final ObjectMapper objectMapper;
    private final AiProperties aiProperties;
    private final OpenAiCompatibleClient openAiCompatibleClient;

    public AiService(
            ObjectMapper objectMapper,
            AiProperties aiProperties,
            OpenAiCompatibleClient openAiCompatibleClient
    ) {
        this.objectMapper = objectMapper;
        this.aiProperties = aiProperties;
        this.openAiCompatibleClient = openAiCompatibleClient;
    }

    @Transactional(rollbackFor = Exception.class)
    public AiBreakdownPreviewResponse previewBreakdown(
            AiBreakdownPreviewRequest request,
            AiProviderOverride override
    ) {
        String baseUrl = firstText(override.baseUrl(), aiProperties.getBaseUrl());
        String model = firstText(override.model(), aiProperties.getModel());
        String apiKey = firstText(override.apiKey(), aiProperties.getApiKey());

        if (!StringUtils.hasText(apiKey)) {
            throw new IllegalStateException("AI provider API key is not configured.");
        }
        if (!StringUtils.hasText(baseUrl)) {
            throw new IllegalStateException("AI provider base URL is not configured.");
        }
        if (!"openai-compatible".equalsIgnoreCase(aiProperties.getProvider())
                && !"openai".equalsIgnoreCase(aiProperties.getProvider())) {
            throw new IllegalStateException("Unsupported AI provider: " + aiProperties.getProvider());
        }

        AiBreakdownPreviewResponse preview = openAiCompatibleClient.generateBreakdown(
                request,
                baseUrl,
                apiKey,
                model
        );
        saveAdvice(request.goal(), preview, null);
        return preview;
    }

    @Transactional(rollbackFor = Exception.class)
    public void commitBreakdown(AiBreakdownPreviewResponse request) {
        saveAdvice(request.goal(), request, true);
    }

    @Transactional(rollbackFor = Exception.class)
    public void recordFeedback(AiFeedbackRequest request) {
        AiAdvice advice = this.getById(request.draftId());
        if (advice == null) {
            throw new IllegalArgumentException("AI advice draft not found: " + request.draftId());
        }
        advice.setAccepted(request.helpful());
        this.updateById(advice);
    }

    private void saveAdvice(String title, AiBreakdownPreviewResponse preview, Boolean accepted) {
        AiAdvice advice = new AiAdvice();
        advice.setType("BREAKDOWN");
        advice.setTitle(title);
        advice.setContent(preview.firstAction().title() + "\n" + preview.firstAction().description());
        advice.setAccepted(Boolean.TRUE.equals(accepted));
        advice.setGeneratedAt(LocalDateTime.now());
        advice.setUserId(StpUtil.getLoginIdAsString());
        try {
            advice.setSourceContext(objectMapper.writeValueAsString(preview));
        } catch (JsonProcessingException e) {
            advice.setSourceContext("{}");
        }
        this.save(advice);
    }

    private static String firstText(String primary, String fallback) {
        return StringUtils.hasText(primary) ? primary.trim() : fallback;
    }
}

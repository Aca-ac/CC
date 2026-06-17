package com.chronos.ai;

import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chronos.ai.dto.AiAdviceResponse;
import com.chronos.ai.dto.AiBreakdownPreviewRequest;
import com.chronos.ai.dto.AiBreakdownPreviewResponse;
import com.chronos.ai.dto.AiFeedbackRequest;
import com.chronos.entity.AiAdvice;
import com.chronos.mapper.AiAdviceMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
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

    public AiAdviceResponse getWeeklyAdvice() {
        String userId = StpUtil.getLoginIdAsString();
        List<AiAdvice> recent = this.lambdaQuery()
                .eq(AiAdvice::getUserId, userId)
                .orderByDesc(AiAdvice::getGeneratedAt)
                .last("LIMIT 10")
                .list();

        List<AiAdviceResponse.AdviceItem> items = new ArrayList<>();

        if (recent.isEmpty()) {
            items.add(new AiAdviceResponse.AdviceItem(
                    "TIP",
                    "开始记录你的学习",
                    "在「学习日志」中记录专注时间，或在「任务管理」中完成任务，AI 将为你生成个性化建议。"
            ));
        } else {
            long completed = recent.stream().filter(a -> Boolean.TRUE.equals(a.getAccepted())).count();
            long total = recent.size();
            double rate = total == 0 ? 0 : Math.round((double) completed / total * 100);

            items.add(new AiAdviceResponse.AdviceItem(
                    "REVIEW",
                    "本周 AI 建议采纳率：" + rate + "%",
                    "共收到 " + total + " 条建议，已采纳 " + completed + " 条。继续优化你的学习计划吧！"
            ));

            AiAdvice latest = recent.get(0);
            items.add(new AiAdviceResponse.AdviceItem(
                    "TIP",
                    "最新建议",
                    latest.getTitle() + "：" + latest.getContent()
            ));
        }

        return new AiAdviceResponse(items);
    }

    private static String firstText(String primary, String fallback) {
        return StringUtils.hasText(primary) ? primary.trim() : fallback;
    }
}

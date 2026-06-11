package com.chronos.ai;

import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chronos.ai.dto.AiBreakdownPreviewRequest;
import com.chronos.ai.dto.AiBreakdownPreviewResponse;
import com.chronos.ai.dto.AiFeedbackRequest;
import com.chronos.entity.AiAdvice;
import com.chronos.mapper.AiAdviceMapper;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class AiService extends ServiceImpl<AiAdviceMapper, AiAdvice> {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional(rollbackFor = Exception.class)
    public AiBreakdownPreviewResponse previewBreakdown(AiBreakdownPreviewRequest request) {
        List<String> stages = List.of("澄清目标范围", "拆分阶段任务", "确认本周最小行动");
        String firstAction = "先完成一个可运行的 P0 闭环，再扩展 AI 复盘和课程表导入。";
        Object loginId = StpUtil.getLoginId();
        AiAdvice advice = new AiAdvice();
        advice.setType("BREAKDOWN");
        advice.setTitle(request.goal());
        advice.setContent(firstAction);
        advice.setAccepted(null);
        advice.setGeneratedAt(LocalDateTime.now());
        advice.setUserId(String.valueOf(loginId));
        try {
            advice.setSourceContext(objectMapper.writeValueAsString(
                    Map.of("stages", stages, "weeks", request.weeks())
            ));
        } catch (JsonProcessingException e) {
            advice.setSourceContext("{\"stages\":[\"澄清目标范围\",\"拆分阶段任务\",\"确认本周最小行动\"],\"weeks\":" + request.weeks() + "}");
        }

        this.save(advice);

        return new AiBreakdownPreviewResponse(
                advice.getId(),
                request.goal(),
                stages,
                firstAction
        );
    }

    @Transactional(rollbackFor = Exception.class)
    public void recordFeedback(AiFeedbackRequest request) {
        AiAdvice advice = this.getById(request.draftId());
        if (advice == null) {
            throw new IllegalArgumentException("未找到指定的 AI 建议草稿，ID: " + request.draftId());
        }
        advice.setAccepted(request.helpful());
        this.updateById(advice);
    }
}

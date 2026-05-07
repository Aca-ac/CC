package com.chronos.ai;

import com.chronos.ai.dto.AiBreakdownPreviewRequest;
import com.chronos.ai.dto.AiBreakdownPreviewResponse;
import com.chronos.ai.dto.AiFeedbackRequest;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AiService {

    public AiBreakdownPreviewResponse previewBreakdown(AiBreakdownPreviewRequest request) {
        // TODO(AI 功能模块): 接入真实 LLM 前，先固定结构化草稿格式和超时降级策略。
        // 重要约束：这里返回的是草稿，不能直接写入正式项目或任务表。
        return new AiBreakdownPreviewResponse(
                "draft-preview",
                request.goal(),
                List.of("澄清目标范围", "拆分阶段任务", "确认本周最小行动"),
                "先完成一个可运行的 P0 闭环，再扩展 AI 复盘和课程表导入。"
        );
    }

    public void recordFeedback(AiFeedbackRequest request) {
        // TODO(AI 功能模块): 保存结果质量反馈，用于后续 Prompt 调优和演示闭环。
    }
}


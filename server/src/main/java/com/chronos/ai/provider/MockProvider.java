package com.chronos.ai.provider;

import com.chronos.ai.provider.dto.ChatCompletionRequest;
import com.chronos.ai.provider.dto.ChatCompletionResponse;

/**
 * Mock AI 提供商，用于本地开发和自动化测试。
 * 根据请求关键词返回预设回复，无需网络调用。
 */
public class MockProvider implements AiProvider {

    @Override
    public String getProviderName() {
        return "mock";
    }

    @Override
    public ChatCompletionResponse chatCompletion(ChatCompletionRequest request) {
        String content;
        String userMessage = request.userMessage();

        if (userMessage.contains("breakdown") || userMessage.contains("拆解")) {
            content = buildBreakdownResponse(userMessage);
        } else if (userMessage.contains("stats") || userMessage.contains("统计") || userMessage.contains("advice")) {
            content = buildAdviceResponse();
        } else if (userMessage.contains("review") || userMessage.contains("复盘")) {
            content = "{\"summary\":\"本周学习进展良好\",\"insights\":[\"保持每日学习习惯\"],\"suggestions\":[\"增加复习时间\"]}";
        } else {
            content = "这是一个 Mock 回复。请在 application.yml 中配置真实的 AI 提供商。";
        }

        return new ChatCompletionResponse(content, "mock-model", 0, 0, "stop");
    }

    private String buildBreakdownResponse(String goal) {
        return "{"
                + "\"goal\":\"" + escapeJson(goal) + "\","
                + "\"weeks\":4,"
                + "\"stages\":["
                + "  {\"title\":\"第一阶段：基础入门\",\"tasks\":["
                + "    {\"title\":\"了解核心概念\",\"description\":\"阅读官方文档和入门指南\",\"estimatedMinutes\":60,\"priority\":\"HIGH\"},"
                + "    {\"title\":\"搭建开发环境\",\"description\":\"安装必要的工具和依赖\",\"estimatedMinutes\":90,\"priority\":\"HIGH\"}"
                + "  ]},"
                + "  {\"title\":\"第二阶段：核心实践\",\"tasks\":["
                + "    {\"title\":\"完成第一个示例项目\",\"description\":\"跟着教程完成完整流程\",\"estimatedMinutes\":120,\"priority\":\"MEDIUM\"},"
                + "    {\"title\":\"理解关键概念\",\"description\":\"深入理解核心机制\",\"estimatedMinutes\":90,\"priority\":\"MEDIUM\"}"
                + "  ]},"
                + "  {\"title\":\"第三阶段：进阶应用\",\"tasks\":["
                + "    {\"title\":\"实现个人项目\",\"description\":\"基于所学内容独立完成一个项目\",\"estimatedMinutes\":180,\"priority\":\"HIGH\"}"
                + "  ]},"
                + "  {\"title\":\"第四阶段：总结回顾\",\"tasks\":["
                + "    {\"title\":\"整理学习笔记\",\"description\":\"将所学内容系统化记录\",\"estimatedMinutes\":60,\"priority\":\"LOW\"}"
                + "  ]}"
                + "]}";
    }

    private String buildAdviceResponse() {
        return "根据本周的学习数据，你完成了不错的任务量。"
                + "建议继续保持每天至少1小时的专注学习时间，"
                + "并尝试将大任务拆分为更小的可执行步骤。"
                + "下周可以适当提高学习难度，挑战更复杂的内容。";
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}

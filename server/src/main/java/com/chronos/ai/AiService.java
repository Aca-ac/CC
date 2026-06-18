package com.chronos.ai;

import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chronos.ai.dto.*;
import com.chronos.ai.provider.AiProvider;
import com.chronos.ai.provider.AiProviderFactory;
import com.chronos.ai.provider.dto.ChatCompletionRequest;
import com.chronos.common.NotFoundException;
import com.chronos.entity.AiAdvice;
import com.chronos.entity.Project;
import com.chronos.entity.Task;
import com.chronos.enums.Priority;
import com.chronos.enums.TaskStatus;
import com.chronos.mapper.AiAdviceMapper;
import com.chronos.mapper.ProjectMapper;
import com.chronos.mapper.TaskMapper;
import com.chronos.stats.StatsService;
import com.chronos.stats.dto.WeeklyStatsResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiService extends ServiceImpl<AiAdviceMapper, AiAdvice> {

    private static final Logger logger = LoggerFactory.getLogger(AiService.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private final AiProviderFactory providerFactory;
    private final TaskMapper taskMapper;
    private final ProjectMapper projectMapper;
    private final StatsService statsService;

    public AiService(AiProviderFactory providerFactory,
                     TaskMapper taskMapper,
                     ProjectMapper projectMapper,
                     StatsService statsService) {
        this.providerFactory = providerFactory;
        this.taskMapper = taskMapper;
        this.projectMapper = projectMapper;
        this.statsService = statsService;
    }

    // ========== 原有方法（兼容旧端点）==========

    @Transactional(rollbackFor = Exception.class)
    public AiBreakdownPreviewResponse previewBreakdown(AiBreakdownPreviewRequest request) {
        String userId = String.valueOf(StpUtil.getLoginId());
        AiProvider provider = providerFactory.getDefaultProvider(userId);

        String systemPrompt = "你是一个专业的项目规划助手。请根据用户的学习目标，分解为可执行的任务。"
                + "以 JSON 格式返回：{\"goal\":\"目标\",\"firstAction\":{\"title\":\"首要任务\",\"description\":\"描述\"}}";
        String userMessage = "请将以下学习目标拆解：" + request.goal();

        ChatCompletionRequest aiRequest = new ChatCompletionRequest(
                systemPrompt, userMessage, 0.7, 1024, false);
        var response = provider.chatCompletion(aiRequest);

        AiAdvice advice = new AiAdvice();
        advice.setType("BREAKDOWN");
        advice.setTitle(request.goal());
        advice.setContent(response.content());
        advice.setAccepted(null);
        advice.setGeneratedAt(LocalDateTime.now());
        advice.setUserId(userId);
        try {
            advice.setSourceContext(objectMapper.writeValueAsString(Map.of("goal", request.goal())));
        } catch (JsonProcessingException e) {
            advice.setSourceContext("{}");
        }
        this.save(advice);

        return new AiBreakdownPreviewResponse(
                advice.getId(),
                null,
                request.goal(),
                List.of(),
                new AiBreakdownPreviewResponse.BreakdownTask("AI 建议", response.content(), 30, "MEDIUM", List.of()));
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

    // ========== #31 新增方法 ==========

    /**
     * 使用 AI 提供商生成可编辑的任务树预览。
     */
    @Transactional(rollbackFor = Exception.class)
    public BreakdownTreeResponse previewBreakdownTree(String goal, int weeks, String projectId) {
        String userId = String.valueOf(StpUtil.getLoginId());

        // 可选：校验项目所有权
        if (projectId != null) {
            validateProjectOwnership(userId, projectId);
        }

        // 获取 AI 提供商
        AiProvider provider = providerFactory.getDefaultProvider(userId);

        // 构建请求
        String systemPrompt = "你是一个专业的项目规划助手。请根据用户的学习目标，按周分解为可执行的任务阶段。"
                + "你必须以严格的 JSON 格式返回，格式为："
                + "{\"goal\":\"目标\",\"weeks\":周数,\"stages\":[{\"title\":\"阶段名\",\"tasks\":[{\"title\":\"任务\",\"description\":\"描述\",\"estimatedMinutes\":分钟,\"priority\":\"HIGH|MEDIUM|LOW\"}]}]}";
        String userMessage = "请将以下学习目标拆解为 " + weeks + " 周的计划：" + goal;

        ChatCompletionRequest request = new ChatCompletionRequest(
                systemPrompt, userMessage, 0.7, 2048, true);
        var response = provider.chatCompletion(request);

        // 保存 AiAdvice 草稿
        AiAdvice advice = new AiAdvice();
        advice.setType("BREAKDOWN");
        advice.setTitle(goal);
        advice.setContent(response.content());
        advice.setAccepted(null);
        advice.setGeneratedAt(LocalDateTime.now());
        advice.setUserId(userId);
        advice.setProjectId(projectId);
        try {
            advice.setSourceContext(objectMapper.writeValueAsString(
                    Map.of("goal", goal, "weeks", weeks, "provider", provider.getProviderName())
            ));
        } catch (JsonProcessingException e) {
            advice.setSourceContext("{}");
        }
        this.save(advice);

        // 解析并返回结构化响应
        return parseBreakdownResponse(advice.getId(), goal, weeks, response.content());
    }

    /**
     * 原子性地提交确认后的任务树，批量创建 Task。
     */
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> commitBreakdown(BreakdownCommitRequest request) {
        String userId = String.valueOf(StpUtil.getLoginId());

        // 校验草稿存在且属于当前用户
        AiAdvice advice = this.getById(request.draftId());
        if (advice == null) {
            throw new NotFoundException("未找到指定的 AI 草稿");
        }
        if (!userId.equals(advice.getUserId())) {
            throw new NotFoundException("未找到指定的 AI 草稿");
        }

        // 校验项目所有权
        validateProjectOwnership(userId, request.projectId());

        // 递归创建任务
        int totalCreated = 0;
        for (BreakdownCommitRequest.CommitTaskNode node : request.tasks()) {
            totalCreated += createTaskTree(request.projectId(), null, node);
        }

        // 标记草稿已确认
        advice.setAccepted(true);
        this.updateById(advice);

        return Map.of("createdTasks", totalCreated, "projectId", request.projectId());
    }

    /**
     * 基于周统计生成 AI 学习建议。
     */
    @Transactional(rollbackFor = Exception.class)
    public WeeklyAdviceResponse generateWeeklyAdvice(String projectId) {
        String userId = String.valueOf(StpUtil.getLoginId());

        // 获取周统计
        WeeklyStatsResponse stats = statsService.getWeeklyStats(null);

        // 获取 AI 提供商
        AiProvider provider = providerFactory.getDefaultProvider(userId);

        // 构建请求
        String systemPrompt = "你是一个经验丰富的学习教练。请根据用户的一周学习统计数据，"
                + "提供 3-5 条具体、可操作的学习建议。建议应简洁有力，每条不超过50字。"
                + "如果数据为空，请鼓励用户开始记录学习活动。";
        String userMessage;
        try {
            userMessage = "本周学习统计：\n" + objectMapper.writeValueAsString(stats);
        } catch (JsonProcessingException e) {
            userMessage = "本周学习统计不可用";
        }

        ChatCompletionRequest aiRequest = new ChatCompletionRequest(
                systemPrompt, userMessage, 0.7, 1024, false);
        var response = provider.chatCompletion(aiRequest);

        // 保存 AiAdvice
        AiAdvice advice = new AiAdvice();
        advice.setType("WEEKLY_ADVICE");
        advice.setTitle("本周学习建议");
        advice.setContent(response.content());
        advice.setAccepted(null);
        advice.setGeneratedAt(LocalDateTime.now());
        advice.setUserId(userId);
        advice.setProjectId(projectId);
        try {
            advice.setSourceContext(objectMapper.writeValueAsString(Map.of(
                    "weekStart", stats.weekStart(),
                    "weekEnd", stats.weekEnd(),
                    "completedTasks", stats.completedTasks(),
                    "completionRate", stats.completionRate()
            )));
        } catch (JsonProcessingException e) {
            advice.setSourceContext("{}");
        }
        this.save(advice);

        return new WeeklyAdviceResponse(
                advice.getId(),
                "本周学习建议",
                response.content(),
                "WEEKLY_ADVICE",
                advice.getGeneratedAt()
        );
    }

    // ========== 私有辅助方法 ==========

    private void validateProjectOwnership(String userId, String projectId) {
        Project project = projectMapper.selectById(projectId);
        if (project == null || !userId.equals(project.getUserId())) {
            throw new IllegalArgumentException("项目不存在或无权访问");
        }
    }

    /**
     * 递归创建任务树，返回创建的任务总数。
     */
    private int createTaskTree(String projectId, String parentTaskId,
                                BreakdownCommitRequest.CommitTaskNode node) {
        Task task = new Task();
        task.setId(UUID.randomUUID().toString());
        task.setProjectId(projectId);
        task.setParentTaskId(parentTaskId);
        task.setTitle(node.title());
        task.setDescription(node.description());
        task.setEstimatedMinutes(node.estimatedMinutes() > 0 ? node.estimatedMinutes() : 30);
        task.setPriority(node.priority() != null ? node.priority() : Priority.MEDIUM);
        task.setStatus(TaskStatus.TODO);
        task.setCreatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());
        taskMapper.insert(task);

        int count = 1;
        if (node.subtasks() != null) {
            for (BreakdownCommitRequest.CommitTaskNode sub : node.subtasks()) {
                count += createTaskTree(projectId, task.getId(), sub);
            }
        }
        return count;
    }

    /**
     * 将 AI 返回的 JSON 解析为 BreakdownTreeResponse。
     * 解析失败时返回带有原始内容的简单结构。
     */
    private BreakdownTreeResponse parseBreakdownResponse(String draftId, String goal, int weeks, String content) {
        try {
            JsonNode root = objectMapper.readTree(content);
            List<BreakdownTreeResponse.StageNode> stages = new ArrayList<>();

            JsonNode stagesNode = root.path("stages");
            if (stagesNode.isArray()) {
                for (JsonNode stageNode : stagesNode) {
                    String stageTitle = stageNode.path("title").asText("未命名阶段");
                    List<BreakdownTreeResponse.TaskDraft> tasks = new ArrayList<>();

                    JsonNode tasksNode = stageNode.path("tasks");
                    if (tasksNode.isArray()) {
                        for (JsonNode taskNode : tasksNode) {
                            tasks.add(new BreakdownTreeResponse.TaskDraft(
                                    taskNode.path("title").asText(""),
                                    taskNode.path("description").asText(""),
                                    taskNode.path("estimatedMinutes").asInt(30),
                                    taskNode.path("priority").asText("MEDIUM")
                            ));
                        }
                    }
                    stages.add(new BreakdownTreeResponse.StageNode(stageTitle, tasks));
                }
            }

            return new BreakdownTreeResponse(draftId, goal, weeks, stages);
        } catch (Exception e) {
            logger.warn("解析 AI 返回的 JSON 失败，返回原始内容: {}", e.getMessage());
            // 降级：返回包含原始文本的简单结构
            List<BreakdownTreeResponse.StageNode> fallbackStages = List.of(
                    new BreakdownTreeResponse.StageNode("AI 建议", List.of(
                            new BreakdownTreeResponse.TaskDraft(content, "", 30, "MEDIUM")
                    ))
            );
            return new BreakdownTreeResponse(draftId, goal, weeks, fallbackStages);
        }
    }
}

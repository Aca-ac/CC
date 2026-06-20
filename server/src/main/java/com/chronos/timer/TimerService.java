package com.chronos.timer;

import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.chronos.common.NotFoundException;
import com.chronos.entity.FocusSession;
import com.chronos.entity.LearningLog;
import com.chronos.entity.Project;
import com.chronos.entity.SyncRecord;
import com.chronos.entity.Task;
import com.chronos.learninglog.dto.LearningLogResponse;
import com.chronos.mapper.FocusSessionMapper;
import com.chronos.mapper.LearningLogMapper;
import com.chronos.mapper.ProjectMapper;
import com.chronos.mapper.SyncRecordMapper;
import com.chronos.mapper.TaskMapper;
import com.chronos.timer.dto.TimerActiveResponse;
import com.chronos.timer.dto.TimerStartRequest;
import com.chronos.timer.dto.TimerStopResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TimerService {

    private static final Logger logger = LoggerFactory.getLogger(TimerService.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    /** 超过24小时的计时器视为过期，允许重新开始 */
    private static final long STALE_THRESHOLD_HOURS = 24;

    private final FocusSessionMapper focusSessionMapper;
    private final LearningLogMapper learningLogMapper;
    private final ProjectMapper projectMapper;
    private final TaskMapper taskMapper;
    private final SyncRecordMapper syncRecordMapper;

    @Transactional(rollbackFor = Exception.class)
    public TimerActiveResponse start(TimerStartRequest request) {
        String userId = StpUtil.getLoginIdAsString();

        // 1. 检查是否存在进行中的计时器
        FocusSession existing = getActiveSession(userId);
        if (existing != null) {
            long hoursElapsed = Duration.between(existing.getStartedAt(), LocalDateTime.now()).toHours();
            if (hoursElapsed < STALE_THRESHOLD_HOURS) {
                throw new IllegalStateException("已有进行中的计时器，请先结束当前计时");
            }
            // 过期计时器：标记为已丢弃（恢复重启）
            existing.setCompleted(false);
            existing.setInterruptionCount(
                    (existing.getInterruptionCount() != null ? existing.getInterruptionCount() : 0) + 1);
            focusSessionMapper.updateById(existing);
        }

        // 2. 校验可选的项目所有权
        if (StringUtils.hasText(request.projectId())) {
            validateProjectOwnership(userId, request.projectId());
        }

        // 3. 校验可选的任务关联
        if (StringUtils.hasText(request.taskId())) {
            Task task = taskMapper.selectById(request.taskId());
            if (task == null) {
                throw new IllegalArgumentException("任务不存在");
            }
            // 如果同时指定了 projectId，校验任务属于该项目
            if (StringUtils.hasText(request.projectId()) && !request.projectId().equals(task.getProjectId())) {
                throw new IllegalArgumentException("任务不属于指定的项目");
            }
        }

        // 4. 创建新的计时器
        FocusSession session = new FocusSession();
        session.setId(StringUtils.hasText(request.sessionId()) ? request.sessionId() : UUID.randomUUID().toString());
        session.setUserId(userId);
        session.setProjectId(request.projectId());
        session.setTaskId(request.taskId());
        session.setStartedAt(LocalDateTime.now());
        session.setDurationMinutes(0);
        session.setCompleted(false);
        session.setInterruptionCount(0);
        session.setCreatedAt(LocalDateTime.now());

        focusSessionMapper.insert(session);

        return buildActiveResponse(session);
    }

    public TimerActiveResponse getActive() {
        String userId = StpUtil.getLoginIdAsString();
        FocusSession session = getActiveSession(userId);
        if (session == null) {
            throw new NotFoundException("没有进行中的计时器");
        }
        return buildActiveResponse(session);
    }

    @Transactional(rollbackFor = Exception.class)
    public TimerStopResponse stop(String timerId) {
        String userId = StpUtil.getLoginIdAsString();
        FocusSession session = validateSessionOwnership(timerId, userId);

        if (Boolean.TRUE.equals(session.getCompleted())) {
            throw new IllegalStateException("计时器已结束，不能重复停止");
        }

        // 计算学习时长（分钟）
        long elapsedMinutes = Duration.between(session.getStartedAt(), LocalDateTime.now()).toMinutes();
        int durationMinutes = (int) Math.max(elapsedMinutes, 1);

        // 更新计时器状态
        session.setCompleted(true);
        session.setDurationMinutes(durationMinutes);
        focusSessionMapper.updateById(session);

        // 发送同步记录
        emitSyncRecord(session, "UPDATE");

        // 仅在有项目上下文时自动创建学习日志
        LearningLogResponse logResponse = null;
        if (StringUtils.hasText(session.getProjectId())) {
            LearningLog log = new LearningLog();
            log.setId(UUID.randomUUID().toString());
            log.setProjectId(session.getProjectId());
            log.setTaskId(session.getTaskId());
            log.setContent("专注学习 " + durationMinutes + " 分钟");
            log.setActualMinutes(durationMinutes);
            log.setCreatedAt(LocalDateTime.now());
            log.setUpdatedAt(LocalDateTime.now());
            learningLogMapper.insert(log);
            emitLearningLogSyncRecord(log, "CREATE");
            logResponse = convertLogToResponse(log);
        }

        return new TimerStopResponse(session, logResponse);
    }

    @Transactional(rollbackFor = Exception.class)
    public FocusSession discard(String timerId) {
        String userId = StpUtil.getLoginIdAsString();
        FocusSession session = validateSessionOwnership(timerId, userId);

        if (Boolean.TRUE.equals(session.getCompleted())) {
            throw new IllegalStateException("计时器已结束，不能丢弃");
        }

        // 丢弃：不创建学习日志，标记为未完成
        session.setCompleted(false);
        session.setInterruptionCount(
                (session.getInterruptionCount() != null ? session.getInterruptionCount() : 0) + 1);
        focusSessionMapper.updateById(session);

        emitSyncRecord(session, "DISCARD");

        return session;
    }

    // ---------- 私有辅助方法 ----------

    private FocusSession getActiveSession(String userId) {
        return focusSessionMapper.selectOne(
                new LambdaQueryWrapper<FocusSession>()
                        .eq(FocusSession::getUserId, userId)
                        .eq(FocusSession::getCompleted, false)
        );
    }

    private FocusSession validateSessionOwnership(String timerId, String userId) {
        FocusSession session = focusSessionMapper.selectById(timerId);
        if (session == null) {
            throw new NotFoundException("未找到指定的计时器");
        }
        if (!userId.equals(session.getUserId())) {
            throw new NotFoundException("未找到指定的计时器");
        }
        return session;
    }

    private void validateProjectOwnership(String userId, String projectId) {
        Project project = projectMapper.selectOne(
                new LambdaQueryWrapper<Project>()
                        .eq(Project::getId, projectId)
                        .eq(Project::getUserId, userId)
        );
        if (project == null) {
            throw new IllegalArgumentException("项目不存在或无权访问");
        }
    }

    private TimerActiveResponse buildActiveResponse(FocusSession session) {
        long elapsedSeconds = Duration.between(session.getStartedAt(), LocalDateTime.now()).getSeconds();

        String projectName = null;
        String taskTitle = null;

        if (StringUtils.hasText(session.getProjectId())) {
            Project project = projectMapper.selectById(session.getProjectId());
            if (project != null) {
                projectName = project.getName();
            }
        }
        if (StringUtils.hasText(session.getTaskId())) {
            Task task = taskMapper.selectById(session.getTaskId());
            if (task != null) {
                taskTitle = task.getTitle();
            }
        }

        return new TimerActiveResponse(
                session.getId(),
                session.getProjectId(),
                session.getTaskId(),
                session.getStartedAt(),
                elapsedSeconds,
                projectName,
                taskTitle
        );
    }

    private void emitSyncRecord(FocusSession session, String changeType) {
        try {
            SyncRecord syncRecord = new SyncRecord();
            syncRecord.setId(UUID.randomUUID().toString());
            syncRecord.setEntityType("FOCUS_SESSION");
            syncRecord.setEntityId(session.getId());
            syncRecord.setChangeType(changeType);
            syncRecord.setVersion(1L);
            syncRecord.setSyncStatus("PENDING");
            syncRecord.setLastModifiedAt(LocalDateTime.now());
            syncRecord.setPayload(objectMapper.writeValueAsString(Map.of(
                    "taskId", session.getTaskId() != null ? session.getTaskId() : "",
                    "durationMinutes", session.getDurationMinutes() != null ? session.getDurationMinutes() : 0,
                    "completed", session.getCompleted()
            )));
            syncRecordMapper.insert(syncRecord);
        } catch (JsonProcessingException e) {
            logger.error("同步记录序列化失败: {}", e.getMessage());
        }
    }

    private void emitLearningLogSyncRecord(LearningLog learningLog, String changeType) {
        try {
            SyncRecord syncRecord = new SyncRecord();
            syncRecord.setId(UUID.randomUUID().toString());
            syncRecord.setEntityType("LEARNING_LOG");
            syncRecord.setEntityId(learningLog.getId());
            syncRecord.setChangeType(changeType);
            syncRecord.setVersion(1L);
            syncRecord.setSyncStatus("PENDING");
            syncRecord.setLastModifiedAt(LocalDateTime.now());
            syncRecord.setPayload(objectMapper.writeValueAsString(Map.of(
                    "projectId", learningLog.getProjectId() != null ? learningLog.getProjectId() : "",
                    "taskId", learningLog.getTaskId() != null ? learningLog.getTaskId() : "",
                    "content", learningLog.getContent() != null ? learningLog.getContent() : ""
            )));
            syncRecordMapper.insert(syncRecord);
        } catch (JsonProcessingException e) {
            logger.error("同步记录序列化失败: {}", e.getMessage());
        }
    }

    private LearningLogResponse convertLogToResponse(LearningLog log) {
        return new LearningLogResponse(
                log.getId(),
                log.getProjectId(),
                log.getTaskId(),
                log.getContent(),
                log.getActualMinutes(),
                log.getDifficulty(),
                log.getLinks(),
                log.getCreatedAt(),
                log.getUpdatedAt()
        );
    }
}

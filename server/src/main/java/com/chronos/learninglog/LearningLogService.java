package com.chronos.learninglog;

import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chronos.common.NotFoundException;
import com.chronos.entity.LearningLog;
import com.chronos.entity.Project;
import com.chronos.entity.SyncRecord;
import com.chronos.entity.Task;
import com.chronos.learninglog.dto.CreateLearningLogRequest;
import com.chronos.learninglog.dto.LearningLogResponse;
import com.chronos.learninglog.dto.UpdateLearningLogRequest;
import com.chronos.mapper.LearningLogMapper;
import com.chronos.mapper.ProjectMapper;
import com.chronos.mapper.SyncRecordMapper;
import com.chronos.mapper.TaskMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LearningLogService extends ServiceImpl<LearningLogMapper, LearningLog> {

    private static final Logger logger = LoggerFactory.getLogger(LearningLogService.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private final ProjectMapper projectMapper;
    private final TaskMapper taskMapper;
    private final SyncRecordMapper syncRecordMapper;

    public LearningLogService(ProjectMapper projectMapper,
                              TaskMapper taskMapper,
                              SyncRecordMapper syncRecordMapper) {
        this.projectMapper = projectMapper;
        this.taskMapper = taskMapper;
        this.syncRecordMapper = syncRecordMapper;
    }

    /**
     * 获取当前用户的所有项目ID列表，用于数据隔离。
     */
    private List<String> getCurrentUserProjectIds() {
        String userId = StpUtil.getLoginIdAsString();
        return projectMapper.selectList(
                new LambdaQueryWrapper<Project>().eq(Project::getUserId, userId)
        ).stream().map(Project::getId).collect(Collectors.toList());
    }

    /**
     * 校验项目所有权：项目必须存在且属于当前用户。
     */
    private void validateProjectOwnership(String projectId) {
        String userId = StpUtil.getLoginIdAsString();
        Project project = projectMapper.selectOne(
                new LambdaQueryWrapper<Project>()
                        .eq(Project::getId, projectId)
                        .eq(Project::getUserId, userId)
        );
        if (project == null) {
            throw new IllegalArgumentException("项目不存在或无权访问");
        }
    }

    /**
     * 校验可选的任务关联：如果提供了 taskId，任务必须存在且属于指定的项目。
     */
    private void validateOptionalTask(String taskId, String projectId) {
        if (!StringUtils.hasText(taskId)) {
            return;
        }
        Task task = taskMapper.selectOne(
                new LambdaQueryWrapper<Task>()
                        .eq(Task::getId, taskId)
                        .eq(Task::getProjectId, projectId)
        );
        if (task == null) {
            throw new IllegalArgumentException("任务不存在或不属于指定项目");
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public LearningLogResponse create(CreateLearningLogRequest request) {
        // 0. 业务层校验
        if (request.actualMinutes() == null || request.actualMinutes() < 1) {
            throw new IllegalArgumentException("实际学习时间至少1分钟");
        }
        if (request.difficulty() != null && (request.difficulty() < 1 || request.difficulty() > 5)) {
            throw new IllegalArgumentException("学习难度需在1-5之间");
        }

        // 1. 校验项目所有权
        validateProjectOwnership(request.projectId());

        // 2. 校验任务关联（可选）
        validateOptionalTask(request.taskId(), request.projectId());

        // 3. 构建实体
        LearningLog log = new LearningLog();
        log.setId(UUID.randomUUID().toString());
        log.setProjectId(request.projectId());
        log.setTaskId(request.taskId());
        log.setContent(request.content());
        log.setActualMinutes(request.actualMinutes());
        log.setDifficulty(request.difficulty());
        log.setLinks(request.links());
        log.setCreatedAt(LocalDateTime.now());
        log.setUpdatedAt(LocalDateTime.now());

        this.save(log);

        // 4. 发送同步记录
        emitSyncRecord(log, "CREATE", 1L);

        return convertToResponse(log);
    }

    public List<LearningLogResponse> listLogs(String projectId, String taskId,
                                               int page, int size) {
        LambdaQueryWrapper<LearningLog> queryWrapper = new LambdaQueryWrapper<>();

        // 按用户项目隔离
        List<String> userProjectIds = getCurrentUserProjectIds();
        if (userProjectIds.isEmpty()) {
            return List.of();
        }
        queryWrapper.in(LearningLog::getProjectId, userProjectIds);

        // 可选过滤条件
        if (StringUtils.hasText(projectId)) {
            // 校验 projectId 属于当前用户
            if (!userProjectIds.contains(projectId)) {
                throw new IllegalArgumentException("项目不存在或无权访问");
            }
            queryWrapper.eq(LearningLog::getProjectId, projectId);
        }
        if (StringUtils.hasText(taskId)) {
            queryWrapper.eq(LearningLog::getTaskId, taskId);
        }

        queryWrapper.orderByDesc(LearningLog::getCreatedAt);

        Page<LearningLog> pageResult = this.page(new Page<>(page, size), queryWrapper);
        return pageResult.getRecords().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public LearningLogResponse getDetail(String id) {
        LearningLog log = this.getById(id);
        if (log == null) {
            throw new NotFoundException("未找到指定的学习日志");
        }

        // 校验所有权
        List<String> userProjectIds = getCurrentUserProjectIds();
        if (!userProjectIds.contains(log.getProjectId())) {
            throw new NotFoundException("未找到指定的学习日志");
        }

        return convertToResponse(log);
    }

    @Transactional(rollbackFor = Exception.class)
    public LearningLogResponse update(String id, UpdateLearningLogRequest request) {
        // 0. 业务层校验
        if (request.actualMinutes() == null || request.actualMinutes() < 1) {
            throw new IllegalArgumentException("实际学习时间至少1分钟");
        }
        if (request.difficulty() != null && (request.difficulty() < 1 || request.difficulty() > 5)) {
            throw new IllegalArgumentException("学习难度需在1-5之间");
        }

        // 1. 获取原日志
        LearningLog log = this.getById(id);
        if (log == null) {
            throw new NotFoundException("未找到指定的学习日志");
        }

        // 2. 校验所有权
        List<String> userProjectIds = getCurrentUserProjectIds();
        if (!userProjectIds.contains(log.getProjectId())) {
            throw new NotFoundException("未找到指定的学习日志");
        }

        // 3. 校验新项目所有权
        validateProjectOwnership(request.projectId());

        // 4. 校验任务关联
        validateOptionalTask(request.taskId(), request.projectId());

        // 5. 更新字段
        log.setProjectId(request.projectId());
        log.setTaskId(request.taskId());
        log.setContent(request.content());
        log.setActualMinutes(request.actualMinutes());
        log.setDifficulty(request.difficulty());
        log.setLinks(request.links());
        log.setUpdatedAt(LocalDateTime.now());

        this.updateById(log);

        // 6. 查找原同步记录版本号，递增后发送新的同步记录
        long newVersion = getNextSyncVersion("LEARNING_LOG", id);
        emitSyncRecord(log, "UPDATE", newVersion);

        return convertToResponse(log);
    }

    @Transactional(rollbackFor = Exception.class)
    public void delete(String id) {
        // 1. 获取日志
        LearningLog log = this.getById(id);
        if (log == null) {
            throw new NotFoundException("未找到指定的学习日志");
        }

        // 2. 校验所有权
        List<String> userProjectIds = getCurrentUserProjectIds();
        if (!userProjectIds.contains(log.getProjectId())) {
            throw new NotFoundException("未找到指定的学习日志");
        }

        // 3. 软删除
        this.removeById(id);

        // 4. 发送同步记录
        long newVersion = getNextSyncVersion("LEARNING_LOG", id);
        emitSyncRecord(log, "DELETE", newVersion);
    }

    /**
     * 发送同步记录到 sync_records 表。
     */
    private void emitSyncRecord(LearningLog log, String changeType, long version) {
        try {
            SyncRecord syncRecord = new SyncRecord();
            syncRecord.setId(UUID.randomUUID().toString());
            syncRecord.setEntityType("LEARNING_LOG");
            syncRecord.setEntityId(log.getId());
            syncRecord.setChangeType(changeType);
            syncRecord.setVersion(version);
            syncRecord.setSyncStatus("PENDING");
            syncRecord.setLastModifiedAt(LocalDateTime.now());
            syncRecord.setPayload(objectMapper.writeValueAsString(Map.of(
                    "projectId", log.getProjectId() != null ? log.getProjectId() : "",
                    "taskId", log.getTaskId() != null ? log.getTaskId() : "",
                    "content", log.getContent() != null ? log.getContent() : ""
            )));
            syncRecordMapper.insert(syncRecord);
        } catch (JsonProcessingException e) {
            // 序列化失败不应中断主流程，仅记录日志
            logger.error("同步记录序列化失败: {}", e.getMessage());
        }
    }

    /**
     * 获取下一次同步的版本号：查找已有的最高版本号 + 1。
     */
    private long getNextSyncVersion(String entityType, String entityId) {
        List<SyncRecord> records = syncRecordMapper.selectList(
                new LambdaQueryWrapper<SyncRecord>()
                        .eq(SyncRecord::getEntityType, entityType)
                        .eq(SyncRecord::getEntityId, entityId)
                        .orderByDesc(SyncRecord::getVersion)
        );
        if (!records.isEmpty() && records.get(0).getVersion() != null) {
            return records.get(0).getVersion() + 1;
        }
        return 1L;
    }

    private LearningLogResponse convertToResponse(LearningLog log) {
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

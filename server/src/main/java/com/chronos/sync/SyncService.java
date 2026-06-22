package com.chronos.sync;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chronos.entity.SyncRecord;
import com.chronos.entity.Project;
import com.chronos.entity.Task;
import com.chronos.entity.LearningLog;
import com.chronos.entity.FocusSession;
import com.chronos.mapper.SyncRecordMapper;
import com.chronos.mapper.ProjectMapper;
import com.chronos.mapper.TaskMapper;
import com.chronos.mapper.LearningLogMapper;
import com.chronos.mapper.FocusSessionMapper;
import com.chronos.enums.Priority;
import com.chronos.enums.TaskStatus;
import com.chronos.sync.dto.SyncPullResponse;
import com.chronos.sync.dto.SyncConflictDto;
import com.chronos.sync.dto.SyncPushRequest;
import com.chronos.sync.dto.SyncPushResponse;
import com.chronos.sync.dto.SyncRecordDto;
import com.chronos.sync.dto.SyncResolveRequest;
import com.chronos.sync.dto.SyncResolveResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SyncService extends ServiceImpl<SyncRecordMapper, SyncRecord> {

    private static final Logger log = LoggerFactory.getLogger(SyncService.class);
    private static final com.fasterxml.jackson.databind.ObjectMapper OBJECT_MAPPER =
            new com.fasterxml.jackson.databind.ObjectMapper();

    private final ProjectMapper projectMapper;
    private final TaskMapper taskMapper;
    private final LearningLogMapper learningLogMapper;
    private final FocusSessionMapper focusSessionMapper;

    @Transactional(rollbackFor = Exception.class)
    public SyncPushResponse push(String userId, SyncPushRequest request) {
        int acceptedTotal = 0;
        List<SyncConflictDto> conflicts = new java.util.ArrayList<>();

        for (SyncRecordDto dto : request.records()) {
            SyncRecord existing = this.getOne(
                new LambdaQueryWrapper<SyncRecord>()
                    .eq(SyncRecord::getUserId, userId)
                    .eq(SyncRecord::getEntityType, dto.entityType())
                    .eq(SyncRecord::getEntityId, dto.entityId())
            );

            if (existing != null && existing.getVersion() != null && existing.getVersion() > dto.version()) {
                conflicts.add(new SyncConflictDto(
                        existing.getId(),
                        dto.entityType(),
                        dto.entityId(),
                        dto.payload() == null ? Collections.emptyMap() : dto.payload(),
                        readPayload(existing)
                ));
                existing.setSyncStatus("CONFLICT");
                this.updateById(existing);
            } else {
                SyncRecord record = new SyncRecord();
                record.setId(UUID.randomUUID().toString());
                record.setUserId(userId);
                record.setEntityType(dto.entityType());
                record.setEntityId(dto.entityId());
                record.setChangeType(dto.changeType());
                record.setVersion(dto.version());
                record.setSyncStatus("PENDING");
                record.setLastModifiedAt(LocalDateTime.now());

                if (dto.payload() != null) {
                    try {
                        record.setPayload(OBJECT_MAPPER.writeValueAsString(dto.payload()));
                    } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                        record.setPayload("{}");
                    }
                } else {
                    record.setPayload("{}");
                }

                if (existing != null) {
                    record.setId(existing.getId());
                    record.setSyncedAt(existing.getSyncedAt());
                }

                this.saveOrUpdate(record);
                applyCanonicalData(userId, dto);
                acceptedTotal++;
            }
        }

        return new SyncPushResponse(acceptedTotal, conflicts);
    }

    public SyncPullResponse pull(String userId, String cursor) {
        long cursorVersion = parseCursor(cursor);
        List<SyncRecord> pendingRecords = this.list(
            new LambdaQueryWrapper<SyncRecord>()
                .eq(SyncRecord::getUserId, userId)
                .gt(cursorVersion > 0, SyncRecord::getVersion, cursorVersion)
                .orderByAsc(SyncRecord::getVersion)
        );

        List<SyncRecordDto> records = pendingRecords.stream()
            .map(record -> {
                Map<String, Object> payload = readPayload(record);
                return new SyncRecordDto(
                    record.getEntityType(),
                    record.getEntityId(),
                    record.getChangeType(),
                    record.getVersion() != null ? record.getVersion() : 0L,
                    payload
                );
            })
            .collect(Collectors.toList());

        String nextCursor = pendingRecords.isEmpty()
                ? String.valueOf(cursorVersion)
                : String.valueOf(pendingRecords.get(pendingRecords.size() - 1).getVersion());

        return new SyncPullResponse(records, nextCursor);
    }

    private long parseCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) return 0;
        try {
            return Long.parseLong(cursor);
        } catch (NumberFormatException exception) {
            log.warn("Ignoring invalid sync cursor={}", cursor);
            return 0;
        }
    }

    private Map<String, Object> readPayload(SyncRecord record) {
        String rawPayload = record.getPayload();
        if (rawPayload == null || rawPayload.isBlank()) return Collections.emptyMap();
        try {
            return OBJECT_MAPPER.readValue(rawPayload,
                    new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
        } catch (com.fasterxml.jackson.core.JsonProcessingException exception) {
            log.warn("Failed to parse sync payload for entityType={} entityId={}",
                    record.getEntityType(), record.getEntityId());
            return Collections.emptyMap();
        }
    }

    private void applyCanonicalData(String userId, SyncRecordDto dto) {
        switch (dto.entityType()) {
            case "PROJECT" -> applyProject(userId, dto);
            case "TASK" -> applyTask(userId, dto);
            case "LOG", "LEARNING_LOG" -> applyLearningLog(userId, dto);
            case "FOCUS", "FOCUS_SESSION" -> applyFocusSession(userId, dto);
            default -> log.debug("Keeping sync journal only for unsupported entityType={}", dto.entityType());
        }
    }

    private void applyProject(String userId, SyncRecordDto dto) {
        Project project = projectMapper.selectById(dto.entityId());
        if (project != null && !userId.equals(project.getUserId())) {
            throw new IllegalArgumentException("不能同步其他账户的项目");
        }
        if ("DELETE".equals(dto.changeType())) {
            if (project != null) {
                // 必须用 deleteById 走逻辑删除：@TableLogic 字段在 updateById 时会被忽略，
                // 直接 set deletedAt + updateById 不会真正软删（导致刷新后项目「复活」）。
                projectMapper.deleteById(project.getId());
                // 级联软删除该项目下的任务与学习日志，避免删项目后任务/日志残留。
                taskMapper.delete(new LambdaQueryWrapper<Task>().eq(Task::getProjectId, project.getId()));
                learningLogMapper.delete(
                        new LambdaQueryWrapper<LearningLog>().eq(LearningLog::getProjectId, project.getId()));
            }
            return;
        }

        Map<String, Object> payload = dto.payload() == null ? Collections.emptyMap() : dto.payload();
        boolean isNew = project == null;
        if (isNew) {
            project = new Project();
            project.setId(dto.entityId());
            project.setUserId(userId);
            project.setCreatedAt(LocalDateTime.now());
        }
        if (payload.containsKey("name")) project.setName(asString(payload.get("name")));
        if (payload.containsKey("goal")) project.setGoal(asString(payload.get("goal")));
        if (payload.containsKey("startDate")) project.setStartDate(LocalDate.parse(asString(payload.get("startDate"))));
        if (payload.containsKey("endDate")) project.setEndDate(LocalDate.parse(asString(payload.get("endDate"))));
        if (payload.containsKey("status")) project.setStatus(asString(payload.get("status")));
        if (payload.containsKey("progress")) project.setProgress(OBJECT_MAPPER.convertValue(payload.get("progress"), Integer.class));
        if (project.getStatus() == null) project.setStatus("ACTIVE");
        if (project.getProgress() == null) project.setProgress(0);
        project.setUpdatedAt(LocalDateTime.now());

        if (isNew) {
            projectMapper.insert(project);
        } else {
            projectMapper.updateById(project);
        }
    }

    private void applyTask(String userId, SyncRecordDto dto) {
        Task task = taskMapper.selectById(dto.entityId());
        Map<String, Object> payload = payload(dto);

        if ("DELETE".equals(dto.changeType())) {
            if (task != null) {
                assertProjectOwned(userId, task.getProjectId());
                taskMapper.deleteById(task.getId());
            }
            return;
        }

        boolean isNew = task == null;
        if (isNew) {
            task = new Task();
            task.setId(dto.entityId());
            task.setCreatedAt(asLocalDateTime(payload.get("createdAt"), LocalDateTime.now()));
        } else {
            assertProjectOwned(userId, task.getProjectId());
        }

        String projectId = asString(payload.get("projectId"));
        if (projectId != null) {
            assertProjectOwned(userId, projectId);
            task.setProjectId(projectId);
        }
        if (task.getProjectId() == null) {
            // Older clients emitted title-only task journal records. Preserve the
            // record for pull/conflict handling; a later complete mutation can
            // safely materialize the canonical row.
            return;
        }
        if (payload.containsKey("parentTaskId")) task.setParentTaskId(asString(payload.get("parentTaskId")));
        if (payload.containsKey("title")) task.setTitle(asString(payload.get("title")));
        if (payload.containsKey("description")) task.setDescription(asString(payload.get("description")));
        if (payload.containsKey("status")) task.setStatus(TaskStatus.valueOf(asString(payload.get("status"))));
        if (payload.containsKey("priority")) task.setPriority(Priority.valueOf(asString(payload.get("priority"))));
        if (payload.containsKey("dueTime")) task.setDueTime(asLocalDateTime(payload.get("dueTime"), null));
        if (payload.containsKey("estimatedMinutes")) task.setEstimatedMinutes(asInteger(payload.get("estimatedMinutes")));
        if (payload.containsKey("actualMinutes")) task.setActualMinutes(asInteger(payload.get("actualMinutes")));
        if (payload.containsKey("tags")) task.setTags(OBJECT_MAPPER.convertValue(payload.get("tags"), String[].class));
        if (task.getStatus() == null) task.setStatus(TaskStatus.TODO);
        if (task.getPriority() == null) task.setPriority(Priority.MEDIUM);
        if (task.getEstimatedMinutes() == null) task.setEstimatedMinutes(30);
        if (task.getActualMinutes() == null) task.setActualMinutes(0);
        if (task.getTags() == null) task.setTags(new String[0]);
        task.setUpdatedAt(LocalDateTime.now());

        if (isNew) taskMapper.insert(task);
        else taskMapper.updateById(task);
    }

    private void applyLearningLog(String userId, SyncRecordDto dto) {
        LearningLog logEntry = learningLogMapper.selectById(dto.entityId());
        Map<String, Object> payload = payload(dto);

        if ("DELETE".equals(dto.changeType())) {
            if (logEntry != null) {
                assertProjectOwned(userId, logEntry.getProjectId());
                learningLogMapper.deleteById(logEntry.getId());
            }
            return;
        }

        boolean isNew = logEntry == null;
        if (isNew) {
            logEntry = new LearningLog();
            logEntry.setId(dto.entityId());
            logEntry.setCreatedAt(asLocalDateTime(payload.get("createdAt"), LocalDateTime.now()));
        } else {
            assertProjectOwned(userId, logEntry.getProjectId());
        }

        String projectId = asString(payload.get("projectId"));
        if (projectId != null) {
            assertProjectOwned(userId, projectId);
            logEntry.setProjectId(projectId);
        }
        if (logEntry.getProjectId() == null) {
            // Keep compatibility with historic partial outbox records.
            return;
        }
        if (payload.containsKey("taskId")) logEntry.setTaskId(asString(payload.get("taskId")));
        if (payload.containsKey("content")) logEntry.setContent(asString(payload.get("content")));
        if (payload.containsKey("actualMinutes")) logEntry.setActualMinutes(asInteger(payload.get("actualMinutes")));
        if (payload.containsKey("difficulty")) logEntry.setDifficulty(asInteger(payload.get("difficulty")));
        if (payload.containsKey("links")) logEntry.setLinks(OBJECT_MAPPER.convertValue(payload.get("links"), String[].class));
        if (logEntry.getActualMinutes() == null) logEntry.setActualMinutes(0);
        if (logEntry.getLinks() == null) logEntry.setLinks(new String[0]);
        logEntry.setUpdatedAt(LocalDateTime.now());

        if (isNew) learningLogMapper.insert(logEntry);
        else learningLogMapper.updateById(logEntry);
    }

    private void applyFocusSession(String userId, SyncRecordDto dto) {
        FocusSession session = focusSessionMapper.selectById(dto.entityId());
        Map<String, Object> payload = payload(dto);

        if ("DELETE".equals(dto.changeType()) || Boolean.TRUE.equals(payload.get("discarded"))) {
            if (session != null && userId.equals(session.getUserId())) {
                focusSessionMapper.deleteById(session.getId());
            }
            return;
        }

        boolean isNew = session == null;
        if (isNew) {
            session = new FocusSession();
            session.setId(dto.entityId());
            session.setUserId(userId);
            session.setCreatedAt(asLocalDateTime(payload.get("createdAt"), LocalDateTime.now()));
        } else if (!userId.equals(session.getUserId())) {
            throw new IllegalArgumentException("Cannot sync another user's focus session");
        }

        String projectId = asString(payload.get("projectId"));
        if (projectId != null) {
            assertProjectOwned(userId, projectId);
            session.setProjectId(projectId);
        }
        if (payload.containsKey("taskId")) session.setTaskId(asString(payload.get("taskId")));
        if (payload.containsKey("startTime")) session.setStartedAt(asLocalDateTime(payload.get("startTime"), null));
        if (payload.containsKey("startedAt")) session.setStartedAt(asLocalDateTime(payload.get("startedAt"), null));
        if (payload.containsKey("durationMinutes")) session.setDurationMinutes(asInteger(payload.get("durationMinutes")));
        if (payload.containsKey("completed")) session.setCompleted(Boolean.valueOf(String.valueOf(payload.get("completed"))));
        if (payload.containsKey("interruptionCount")) session.setInterruptionCount(asInteger(payload.get("interruptionCount")));
        if (session.getStartedAt() == null) session.setStartedAt(LocalDateTime.now());
        if (session.getDurationMinutes() == null) session.setDurationMinutes(0);
        if (session.getCompleted() == null) session.setCompleted(false);
        if (session.getInterruptionCount() == null) session.setInterruptionCount(0);

        if (isNew) focusSessionMapper.insert(session);
        else focusSessionMapper.updateById(session);
    }

    private Map<String, Object> payload(SyncRecordDto dto) {
        return dto.payload() == null ? Collections.emptyMap() : dto.payload();
    }

    private void assertProjectOwned(String userId, String projectId) {
        if (projectId == null) return;
        Project project = projectMapper.selectById(projectId);
        if (project == null || !userId.equals(project.getUserId())) {
            throw new IllegalArgumentException("Referenced project does not belong to the current user");
        }
    }

    private Integer asInteger(Object value) {
        return value == null ? null : OBJECT_MAPPER.convertValue(value, Integer.class);
    }

    private LocalDateTime asLocalDateTime(Object value, LocalDateTime fallback) {
        if (value == null) return fallback;
        if (value instanceof Number number) {
            return LocalDateTime.ofInstant(Instant.ofEpochMilli(number.longValue()), ZoneId.of("Asia/Shanghai"));
        }
        String text = asString(value);
        if (text == null || text.isBlank()) return fallback;
        try {
            return LocalDateTime.parse(text);
        } catch (java.time.format.DateTimeParseException ignored) {
            return LocalDateTime.ofInstant(Instant.parse(text), ZoneId.of("Asia/Shanghai"));
        }
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    @Transactional(rollbackFor = Exception.class)
    public SyncResolveResponse resolve(String userId, SyncResolveRequest request) {
        SyncRecord existing = findConflict(userId, request);

        if (existing == null) {
            return new SyncResolveResponse(false, "未找到冲突记录");
        }

        if (!"CONFLICT".equals(existing.getSyncStatus())) {
            return new SyncResolveResponse(false, "该记录当前状态不是冲突状态");
        }

        boolean keepLocal = "keep-local".equals(request.resolveType()) || "local".equals(request.resolveType());
        if (keepLocal) {
            if (request.resolvedPayload() == null || request.resolvedPayload().isBlank()) {
                return new SyncResolveResponse(false, "Resolving with local data requires a payload");
            }
            Map<String, Object> payload = readPayload(request.resolvedPayload());
            applyCanonicalData(userId, new SyncRecordDto(
                    existing.getEntityType(),
                    existing.getEntityId(),
                    "UPDATE",
                    request.version() == null ? existing.getVersion() + 1 : request.version(),
                    payload
            ));
            existing.setPayload(request.resolvedPayload());
            existing.setChangeType("UPDATE");
            existing.setVersion(request.version() == null ? existing.getVersion() + 1 : request.version());
        }
        existing.setSyncStatus("PENDING");
        existing.setLastModifiedAt(LocalDateTime.now());
        this.updateById(existing);

        return new SyncResolveResponse(true, "冲突已解决，记录已更新为待同步状态");
    }

    private SyncRecord findConflict(String userId, SyncResolveRequest request) {
        if (request.id() != null && !request.id().isBlank()) {
            SyncRecord byId = this.getById(request.id());
            return byId != null && userId.equals(byId.getUserId()) ? byId : null;
        }
        if (request.entityType() == null || request.entityType().isBlank()
                || request.entityId() == null || request.entityId().isBlank()) {
            return null;
        }
        return this.getOne(
                new LambdaQueryWrapper<SyncRecord>()
                        .eq(SyncRecord::getUserId, userId)
                        .eq(SyncRecord::getEntityType, request.entityType())
                        .eq(SyncRecord::getEntityId, request.entityId())
        );
    }

    private Map<String, Object> readPayload(String rawPayload) {
        if (rawPayload == null || rawPayload.isBlank()) return Collections.emptyMap();
        try {
            return OBJECT_MAPPER.readValue(rawPayload,
                    new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
        } catch (com.fasterxml.jackson.core.JsonProcessingException exception) {
            throw new IllegalArgumentException("Resolved payload must be valid JSON", exception);
        }
    }
}

package com.chronos.sync;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.chronos.entity.SyncRecord;
import com.chronos.entity.User;
import com.chronos.mapper.SyncRecordMapper;
import com.chronos.mapper.UserMapper;
import com.chronos.mapper.ProjectMapper;
import com.chronos.mapper.TaskMapper;
import com.chronos.mapper.LearningLogMapper;
import com.chronos.mapper.FocusSessionMapper;
import com.chronos.sync.dto.SyncPushRequest;
import com.chronos.sync.dto.SyncPushResponse;
import com.chronos.sync.dto.SyncRecordDto;
import com.chronos.sync.dto.SyncResolveRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class SyncServiceTests {

    @Autowired
    private SyncService syncService;

    @Autowired
    private SyncRecordMapper syncRecordMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private ProjectMapper projectMapper;

    @Autowired
    private TaskMapper taskMapper;

    @Autowired
    private LearningLogMapper learningLogMapper;

    @Autowired
    private FocusSessionMapper focusSessionMapper;

    private String userId;
    private String otherUserId;

    @BeforeEach
    void setUp() {
        userId = "sync-user-" + UUID.randomUUID().toString().substring(0, 8);
        otherUserId = "sync-other-" + UUID.randomUUID().toString().substring(0, 8);
        insertUser(userId, "同步测试用户");
        insertUser(otherUserId, "其他同步用户");
    }

    @Test
    void pushWritesUserIdAndPullFiltersByUser() {
        String sharedEntityId = "task-" + UUID.randomUUID().toString().substring(0, 8);

        SyncPushResponse userPush = syncService.push(userId, new SyncPushRequest(List.of(
                new SyncRecordDto("TASK", sharedEntityId, "UPDATE", 1, Map.of("title", "我的任务"))
        )));
        SyncPushResponse otherPush = syncService.push(otherUserId, new SyncPushRequest(List.of(
                new SyncRecordDto("TASK", sharedEntityId, "UPDATE", 1, Map.of("title", "他人任务"))
        )));

        assertEquals(1, userPush.accepted());
        assertTrue(userPush.conflicts().isEmpty());
        assertEquals(1, otherPush.accepted());
        assertTrue(otherPush.conflicts().isEmpty());

        List<SyncRecord> stored = syncRecordMapper.selectList(
                new LambdaQueryWrapper<SyncRecord>().eq(SyncRecord::getEntityId, sharedEntityId)
        );
        assertEquals(2, stored.size());
        assertTrue(stored.stream().anyMatch(record -> userId.equals(record.getUserId())));
        assertTrue(stored.stream().anyMatch(record -> otherUserId.equals(record.getUserId())));

        var pulled = syncService.pull(userId, null);
        assertEquals(1, pulled.changes().size());
        assertEquals("我的任务", pulled.changes().get(0).payload().get("title"));
    }

    @Test
    void resolveOnlyTouchesCurrentUsersConflict() {
        String entityId = "task-conflict-" + UUID.randomUUID().toString().substring(0, 8);

        syncService.push(userId, new SyncPushRequest(List.of(
                new SyncRecordDto("TASK", entityId, "UPDATE", 5, Map.of("title", "server"))
        )));
        SyncPushResponse conflict = syncService.push(userId, new SyncPushRequest(List.of(
                new SyncRecordDto("TASK", entityId, "UPDATE", 1, Map.of("title", "client"))
        )));

        assertEquals(1, conflict.conflicts().size());
        assertEquals(entityId, conflict.conflicts().get(0).entityId());

        SyncResolveRequest request = new SyncResolveRequest(
                "TASK",
                entityId,
                6,
                "{\"title\":\"resolved\"}",
                "local"
        );

        assertFalse(syncService.resolve(otherUserId, request).success());
        assertTrue(syncService.resolve(userId, request).success());

        SyncRecord resolved = syncRecordMapper.selectOne(
                new LambdaQueryWrapper<SyncRecord>()
                        .eq(SyncRecord::getUserId, userId)
                        .eq(SyncRecord::getEntityType, "TASK")
                        .eq(SyncRecord::getEntityId, entityId)
        );
        assertEquals("PENDING", resolved.getSyncStatus());
        assertEquals(6, resolved.getVersion());
    }

    @Test
    void pushProjectCreatesCanonicalProjectForTheCurrentUser() {
        String projectId = "project-sync-" + UUID.randomUUID().toString().substring(0, 8);

        SyncPushResponse response = syncService.push(userId, new SyncPushRequest(List.of(
                new SyncRecordDto("PROJECT", projectId, "CREATE", 1, Map.of(
                        "id", projectId,
                        "name", "离线同步项目",
                        "goal", "写入业务表",
                        "startDate", "2026-06-19",
                        "endDate", "2026-06-30",
                        "status", "ACTIVE",
                        "progress", 0
                ))
        )));

        assertEquals(1, response.accepted());
        var project = projectMapper.selectById(projectId);
        assertNotNull(project);
        assertEquals(userId, project.getUserId());
        assertEquals("离线同步项目", project.getName());
    }

    @Test
    void pushTaskCreatesCanonicalTaskForAnOwnedProject() {
        String projectId = "project-task-" + UUID.randomUUID().toString().substring(0, 8);
        String taskId = "task-sync-" + UUID.randomUUID().toString().substring(0, 8);
        syncService.push(userId, new SyncPushRequest(List.of(
                new SyncRecordDto("PROJECT", projectId, "CREATE", 1, Map.of(
                        "name", "同步项目", "goal", "任务归属", "startDate", "2026-06-19", "endDate", "2026-06-30"
                ))
        )));

        syncService.push(userId, new SyncPushRequest(List.of(
                new SyncRecordDto("TASK", taskId, "CREATE", 2, Map.of(
                        "projectId", projectId, "title", "离线任务", "status", "TODO", "priority", "HIGH",
                        "estimatedMinutes", 45, "actualMinutes", 0, "tags", List.of("同步")
                ))
        )));

        var task = taskMapper.selectById(taskId);
        assertNotNull(task);
        assertEquals(projectId, task.getProjectId());
        assertEquals("离线任务", task.getTitle());
        assertEquals(45, task.getEstimatedMinutes());
    }

    @Test
    void pushLogCreatesCanonicalLearningLogForAnOwnedProject() {
        String projectId = "project-log-" + UUID.randomUUID().toString().substring(0, 8);
        String logId = "log-sync-" + UUID.randomUUID().toString().substring(0, 8);
        syncService.push(userId, new SyncPushRequest(List.of(
                new SyncRecordDto("PROJECT", projectId, "CREATE", 1, Map.of(
                        "name", "日志项目", "goal", "日志归属", "startDate", "2026-06-19", "endDate", "2026-06-30"
                )),
                new SyncRecordDto("LOG", logId, "CREATE", 2, Map.of(
                        "projectId", projectId, "content", "离线学习日志", "actualMinutes", 35,
                        "difficulty", 4, "links", List.of("https://example.com")
                ))
        )));

        var logEntry = learningLogMapper.selectById(logId);
        assertNotNull(logEntry);
        assertEquals(projectId, logEntry.getProjectId());
        assertEquals(35, logEntry.getActualMinutes());
    }

    @Test
    void pushFocusCreatesCanonicalFocusSessionForCurrentUser() {
        String projectId = "project-focus-" + UUID.randomUUID().toString().substring(0, 8);
        String focusId = "focus-sync-" + UUID.randomUUID().toString().substring(0, 8);
        syncService.push(userId, new SyncPushRequest(List.of(
                new SyncRecordDto("PROJECT", projectId, "CREATE", 1, Map.of(
                        "name", "专注项目", "goal", "专注归属", "startDate", "2026-06-19", "endDate", "2026-06-30"
                )),
                new SyncRecordDto("FOCUS", focusId, "CREATE", 2, Map.of(
                        "projectId", projectId, "startTime", 1_750_000_000_000L,
                        "durationMinutes", 25, "completed", true
                ))
        )));

        var session = focusSessionMapper.selectById(focusId);
        assertNotNull(session);
        assertEquals(userId, session.getUserId());
        assertEquals(25, session.getDurationMinutes());
    }

    private void insertUser(String id, String name) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        user.setEmail(id + "@test.com");
        user.setPasswordHash("test-hash");
        userMapper.insert(user);
    }
}

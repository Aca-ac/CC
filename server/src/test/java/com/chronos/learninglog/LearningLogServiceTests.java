package com.chronos.learninglog;

import cn.dev33.satoken.stp.StpUtil;
import com.chronos.entity.LearningLog;
import com.chronos.entity.Project;
import com.chronos.entity.SyncRecord;
import com.chronos.entity.Task;
import com.chronos.entity.User;
import com.chronos.learninglog.dto.CreateLearningLogRequest;
import com.chronos.learninglog.dto.LearningLogResponse;
import com.chronos.learninglog.dto.UpdateLearningLogRequest;
import com.chronos.mapper.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class LearningLogServiceTests {

    @Autowired
    private LearningLogService learningLogService;

    @Autowired
    private ProjectMapper projectMapper;

    @Autowired
    private TaskMapper taskMapper;

    @Autowired
    private SyncRecordMapper syncRecordMapper;

    @Autowired
    private UserMapper userMapper;

    private String testUserId;
    private String testProjectId;
    private String testTaskId;

    @BeforeEach
    void setUp() {
        // 创建测试用户并登录
        testUserId = "test-user-" + UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setId(testUserId);
        user.setName("测试用户");
        user.setEmail(testUserId + "@test.com");
        user.setPasswordHash("test-hash");
        userMapper.insert(user);
        StpUtil.login(testUserId);

        // 创建测试项目
        testProjectId = "test-proj-" + UUID.randomUUID().toString().substring(0, 8);
        Project project = new Project();
        project.setId(testProjectId);
        project.setUserId(testUserId);
        project.setName("测试项目");
        project.setGoal("测试目标");
        project.setStartDate(LocalDate.now());
        project.setEndDate(LocalDate.now().plusDays(30));
        projectMapper.insert(project);

        // 创建测试任务
        testTaskId = "test-task-" + UUID.randomUUID().toString().substring(0, 8);
        Task task = new Task();
        task.setId(testTaskId);
        task.setProjectId(testProjectId);
        task.setTitle("测试任务");
        taskMapper.insert(task);
    }

    @Test
    void shouldCreateLearningLogWithValidData() {
        CreateLearningLogRequest request = new CreateLearningLogRequest(
                testProjectId, testTaskId, "完成了Spring Boot入门学习", 120, 3, new String[]{"https://example.com"});

        LearningLogResponse response = learningLogService.create(request);

        assertNotNull(response.id());
        assertEquals(testProjectId, response.projectId());
        assertEquals(testTaskId, response.taskId());
        assertEquals("完成了Spring Boot入门学习", response.content());
        assertEquals(120, response.actualMinutes());
        assertEquals(3, response.difficulty());
        assertEquals(1, response.links().length);
        assertNotNull(response.createdAt());

        // 验证同步记录已创建
        List<SyncRecord> syncRecords = syncRecordMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<SyncRecord>()
                        .eq(SyncRecord::getEntityType, "LEARNING_LOG")
                        .eq(SyncRecord::getEntityId, response.id())
        );
        assertFalse(syncRecords.isEmpty());
        assertEquals("CREATE", syncRecords.get(0).getChangeType());
    }

    @Test
    void shouldFailCreateWithNonExistentProject() {
        CreateLearningLogRequest request = new CreateLearningLogRequest(
                "non-existent-project", null, "测试内容", 60, null, null);

        assertThrows(IllegalArgumentException.class, () -> learningLogService.create(request));
    }

    @Test
    void shouldFailCreateWithProjectNotOwnedByUser() {
        // 用另一个用户登录
        String otherUserId = "other-" + UUID.randomUUID().toString().substring(0, 8);
        User otherUser = new User();
        otherUser.setId(otherUserId);
        otherUser.setName("其他用户");
        otherUser.setEmail(otherUserId + "@test.com");
        otherUser.setPasswordHash("test-hash");
        userMapper.insert(otherUser);
        StpUtil.login(otherUserId);

        CreateLearningLogRequest request = new CreateLearningLogRequest(
                testProjectId, null, "尝试访问他人项目", 60, null, null);

        assertThrows(IllegalArgumentException.class, () -> learningLogService.create(request));

        // 恢复原用户登录
        StpUtil.login(testUserId);
    }

    @Test
    void shouldFailCreateWithTaskNotInProject() {
        // 创建另一个项目的任务
        String otherProjectId = "other-proj-" + UUID.randomUUID().toString().substring(0, 8);
        Project otherProject = new Project();
        otherProject.setId(otherProjectId);
        otherProject.setUserId(testUserId);
        otherProject.setName("其他项目");
        otherProject.setGoal("其他目标");
        otherProject.setStartDate(LocalDate.now());
        otherProject.setEndDate(LocalDate.now().plusDays(30));
        projectMapper.insert(otherProject);

        String otherTaskId = "other-task-" + UUID.randomUUID().toString().substring(0, 8);
        Task otherTask = new Task();
        otherTask.setId(otherTaskId);
        otherTask.setProjectId(otherProjectId);
        otherTask.setTitle("其他任务");
        taskMapper.insert(otherTask);

        // 尝试将 otherProjectId 下的任务关联到 testProjectId
        CreateLearningLogRequest request = new CreateLearningLogRequest(
                testProjectId, otherTaskId, "任务不属于该项目的测试", 60, null, null);

        assertThrows(IllegalArgumentException.class, () -> learningLogService.create(request));
    }

    @Test
    void shouldFailCreateWithZeroMinutes() {
        CreateLearningLogRequest request = new CreateLearningLogRequest(
                testProjectId, null, "零分钟测试", 0, null, null);

        // 业务层校验 actualMinutes < 1
        assertThrows(IllegalArgumentException.class, () -> learningLogService.create(request));
    }

    @Test
    void shouldFailCreateWithInvalidDifficulty() {
        CreateLearningLogRequest request = new CreateLearningLogRequest(
                testProjectId, null, "难度超出范围测试", 60, 10, null);

        // 业务层校验 difficulty 1-5
        assertThrows(IllegalArgumentException.class, () -> learningLogService.create(request));
    }

    @Test
    void shouldListOnlyOwnLogs() {
        // 当前用户创建2条日志
        learningLogService.create(new CreateLearningLogRequest(
                testProjectId, null, "日志A", 30, 2, null));
        learningLogService.create(new CreateLearningLogRequest(
                testProjectId, null, "日志B", 45, 3, null));

        List<LearningLogResponse> logs = learningLogService.listLogs(null, null, 1, 20);
        assertTrue(logs.size() >= 2);

        // 验证每条日志的 projectId 都属于当前用户
        List<String> userProjectIds = projectMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Project>()
                        .eq(Project::getUserId, testUserId)
        ).stream().map(Project::getId).toList();
        for (LearningLogResponse log : logs) {
            assertTrue(userProjectIds.contains(log.projectId()));
        }
    }

    @Test
    void shouldFilterByProjectId() {
        // 创建另一个项目
        String anotherProjectId = "another-proj-" + UUID.randomUUID().toString().substring(0, 8);
        Project anotherProject = new Project();
        anotherProject.setId(anotherProjectId);
        anotherProject.setUserId(testUserId);
        anotherProject.setName("另一项目");
        anotherProject.setGoal("另一目标");
        anotherProject.setStartDate(LocalDate.now());
        anotherProject.setEndDate(LocalDate.now().plusDays(30));
        projectMapper.insert(anotherProject);

        learningLogService.create(new CreateLearningLogRequest(
                testProjectId, null, "项目A的日志", 30, 2, null));
        learningLogService.create(new CreateLearningLogRequest(
                anotherProjectId, null, "项目B的日志", 45, 3, null));

        List<LearningLogResponse> filtered = learningLogService.listLogs(testProjectId, null, 1, 20);
        assertFalse(filtered.isEmpty());
        for (LearningLogResponse log : filtered) {
            assertEquals(testProjectId, log.projectId());
        }
    }

    @Test
    void shouldGetLogDetail() {
        LearningLogResponse created = learningLogService.create(new CreateLearningLogRequest(
                testProjectId, testTaskId, "详细日志", 90, 4,
                new String[]{"https://ref.com", "https://note.com"}));

        LearningLogResponse detail = learningLogService.getDetail(created.id());

        assertEquals(created.id(), detail.id());
        assertEquals(testProjectId, detail.projectId());
        assertEquals(testTaskId, detail.taskId());
        assertEquals("详细日志", detail.content());
        assertEquals(90, detail.actualMinutes());
        assertEquals(4, detail.difficulty());
        assertEquals(2, detail.links().length);
    }

    @Test
    void shouldFailGetLogOfOtherUser() {
        // 创建一条日志
        LearningLogResponse log = learningLogService.create(new CreateLearningLogRequest(
                testProjectId, null, "我的日志", 60, null, null));

        // 另一个用户尝试访问
        String otherUserId = "other2-" + UUID.randomUUID().toString().substring(0, 8);
        User otherUser = new User();
        otherUser.setId(otherUserId);
        otherUser.setName("其他用户2");
        otherUser.setEmail(otherUserId + "@test.com");
        otherUser.setPasswordHash("test-hash");
        userMapper.insert(otherUser);
        StpUtil.login(otherUserId);

        assertThrows(com.chronos.common.NotFoundException.class,
                () -> learningLogService.getDetail(log.id()));

        StpUtil.login(testUserId);
    }

    @Test
    void shouldUpdateLogSuccessfully() {
        LearningLogResponse created = learningLogService.create(new CreateLearningLogRequest(
                testProjectId, null, "原始内容", 30, 2, null));

        UpdateLearningLogRequest updateRequest = new UpdateLearningLogRequest(
                testProjectId, testTaskId, "更新后的内容", 60, 4,
                new String[]{"https://updated.com"});

        LearningLogResponse updated = learningLogService.update(created.id(), updateRequest);

        assertEquals("更新后的内容", updated.content());
        assertEquals(60, updated.actualMinutes());
        assertEquals(4, updated.difficulty());
        assertEquals(testTaskId, updated.taskId());
        assertEquals(1, updated.links().length);
        assertNotNull(updated.updatedAt());
    }

    @Test
    void shouldDeleteLogAndEmitSync() {
        LearningLogResponse created = learningLogService.create(new CreateLearningLogRequest(
                testProjectId, null, "待删除日志", 45, 1, null));

        learningLogService.delete(created.id());

        // 验证软删除
        LearningLog deleted = learningLogService.getById(created.id());
        assertNull(deleted);

        // 验证同步记录中包含了 DELETE 记录
        List<SyncRecord> syncRecords = syncRecordMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<SyncRecord>()
                        .eq(SyncRecord::getEntityType, "LEARNING_LOG")
                        .eq(SyncRecord::getEntityId, created.id())
                        .eq(SyncRecord::getChangeType, "DELETE")
        );
        assertFalse(syncRecords.isEmpty());
    }
}

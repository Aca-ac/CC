package com.chronos.ai;

import cn.dev33.satoken.stp.StpUtil;
import com.chronos.ai.dto.BreakdownCommitRequest;
import com.chronos.ai.dto.BreakdownTreeResponse;
import com.chronos.entity.AiAdvice;
import com.chronos.entity.Project;
import com.chronos.entity.Task;
import com.chronos.entity.User;
import com.chronos.mapper.AiAdviceMapper;
import com.chronos.mapper.ProjectMapper;
import com.chronos.mapper.TaskMapper;
import com.chronos.mapper.UserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.chronos.enums.Priority.HIGH;
import static com.chronos.enums.Priority.MEDIUM;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AiBreakdownServiceTests {

    @Autowired
    private AiService aiService;

    @Autowired
    private ProjectMapper projectMapper;

    @Autowired
    private TaskMapper taskMapper;

    @Autowired
    private AiAdviceMapper aiAdviceMapper;

    @Autowired
    private UserMapper userMapper;

    private String testUserId;
    private String testProjectId;

    @BeforeEach
    void setUp() {
        testUserId = "ai-bd-" + UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setId(testUserId);
        user.setName("Breakdown测试用户");
        user.setEmail(testUserId + "@test.com");
        user.setPasswordHash("test-hash");
        userMapper.insert(user);
        StpUtil.login(testUserId);

        testProjectId = "ai-bd-proj-" + UUID.randomUUID().toString().substring(0, 8);
        Project project = new Project();
        project.setId(testProjectId);
        project.setUserId(testUserId);
        project.setName("Breakdown测试项目");
        project.setGoal("测试AI拆解");
        project.setStartDate(LocalDate.now());
        project.setEndDate(LocalDate.now().plusDays(30));
        projectMapper.insert(project);
    }

    @Test
    void shouldPreviewBreakdownTreeWithMockProvider() {
        BreakdownTreeResponse response = aiService.previewBreakdownTree(
                "学习Spring Boot", 4, null);

        assertNotNull(response.draftId());
        assertEquals("学习Spring Boot", response.goal());
        assertEquals(4, response.weeks());
        assertNotNull(response.stages());
        assertFalse(response.stages().isEmpty());

        AiAdvice draft = aiAdviceMapper.selectById(response.draftId());
        assertNotNull(draft);
        assertEquals("BREAKDOWN", draft.getType());
        assertNotEquals(Boolean.TRUE, draft.getAccepted());
    }

    @Test
    void shouldCommitBreakdownAndCreateTasks() {
        BreakdownTreeResponse preview = aiService.previewBreakdownTree(
                "学习Vue.js", 3, null);

        BreakdownCommitRequest commitRequest = new BreakdownCommitRequest(
                preview.draftId(),
                testProjectId,
                List.of(
                        new BreakdownCommitRequest.CommitTaskNode(
                                null, "环境搭建", "安装Node.js和Vue CLI", 60, HIGH,
                                List.of(
                                        new BreakdownCommitRequest.CommitTaskNode(
                                                null, "安装Node.js", "", 30, MEDIUM, null),
                                        new BreakdownCommitRequest.CommitTaskNode(
                                                null, "创建项目", "", 30, MEDIUM, null)
                                )
                        ),
                        new BreakdownCommitRequest.CommitTaskNode(
                                null, "学习组件", "理解Vue组件系统", 120, MEDIUM, null)
                )
        );

        Map<String, Object> result = aiService.commitBreakdown(commitRequest);

        assertNotNull(result.get("createdTasks"));
        int count = ((Number) result.get("createdTasks")).intValue();
        assertTrue(count >= 3);

        List<Task> tasks = taskMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Task>()
                        .eq(Task::getProjectId, testProjectId)
        );
        assertTrue(tasks.size() >= 3);

        AiAdvice draft = aiAdviceMapper.selectById(preview.draftId());
        assertTrue(draft.getAccepted());
    }

    @Test
    void shouldCommitAtomically() {
        BreakdownTreeResponse preview = aiService.previewBreakdownTree(
                "学习React", 2, null);

        BreakdownCommitRequest invalidRequest = new BreakdownCommitRequest(
                preview.draftId(),
                "non-existent-project-id-12345",
                List.of(new BreakdownCommitRequest.CommitTaskNode(
                        null, "测试任务", "", 30, MEDIUM, null))
        );

        assertThrows(Exception.class, () -> aiService.commitBreakdown(invalidRequest));

        AiAdvice draft = aiAdviceMapper.selectById(preview.draftId());
        assertNotEquals(Boolean.TRUE, draft.getAccepted());
    }

    @Test
    void shouldNotBlockManualTaskCreation() {
        aiService.previewBreakdownTree("学习目标", 2, null);

        Task manualTask = new Task();
        manualTask.setId("manual-" + UUID.randomUUID().toString().substring(0, 8));
        manualTask.setProjectId(testProjectId);
        manualTask.setTitle("手动创建的任务");
        manualTask.setCreatedAt(java.time.LocalDateTime.now());
        manualTask.setUpdatedAt(java.time.LocalDateTime.now());
        taskMapper.insert(manualTask);

        Task found = taskMapper.selectById(manualTask.getId());
        assertNotNull(found);
        assertEquals("手动创建的任务", found.getTitle());
    }

    @Test
    void shouldSaveDraftOnPreview() {
        BreakdownTreeResponse response = aiService.previewBreakdownTree(
                "测试目标", 2, testProjectId);

        AiAdvice draft = aiAdviceMapper.selectById(response.draftId());
        assertNotNull(draft);
        assertEquals("BREAKDOWN", draft.getType());
        assertEquals("测试目标", draft.getTitle());
        assertEquals(testUserId, draft.getUserId());
        assertEquals(testProjectId, draft.getProjectId());
    }

    @Test
    void shouldReturnFallbackStructureWhenJsonParseFails() {
        BreakdownTreeResponse response = aiService.previewBreakdownTree(
                "测试降级", 1, null);

        assertNotNull(response.stages());
        assertFalse(response.stages().isEmpty());
        assertNotNull(response.stages().get(0).tasks());
    }
}

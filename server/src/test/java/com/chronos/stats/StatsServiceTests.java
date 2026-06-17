package com.chronos.stats;

import cn.dev33.satoken.stp.StpUtil;
import com.chronos.entity.*;
import com.chronos.enums.TaskStatus;
import com.chronos.mapper.*;
import com.chronos.stats.dto.WeeklyStatsResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class StatsServiceTests {

    @Autowired
    private StatsService statsService;

    @Autowired
    private ProjectMapper projectMapper;

    @Autowired
    private TaskMapper taskMapper;

    @Autowired
    private FocusSessionMapper focusSessionMapper;

    @Autowired
    private LearningLogMapper learningLogMapper;

    @Autowired
    private UserMapper userMapper;

    private String testUserId;
    private String testProjectId;

    @BeforeEach
    void setUp() {
        testUserId = "stats-user-" + UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setId(testUserId);
        user.setName("统计测试用户");
        user.setEmail(testUserId + "@test.com");
        user.setPasswordHash("test-hash");
        userMapper.insert(user);
        StpUtil.login(testUserId);

        testProjectId = "stats-proj-" + UUID.randomUUID().toString().substring(0, 8);
        Project project = new Project();
        project.setId(testProjectId);
        project.setUserId(testUserId);
        project.setName("统计测试项目");
        project.setGoal("测试统计");
        project.setStartDate(LocalDate.now());
        project.setEndDate(LocalDate.now().plusDays(30));
        projectMapper.insert(project);
    }

    @Test
    void shouldReturnWeeklyStatsWithCorrectWeekBoundaries() {
        WeeklyStatsResponse stats = statsService.getWeeklyStats(null);

        assertNotNull(stats.weekStart());
        assertNotNull(stats.weekEnd());

        // 默认应从周一开始
        LocalDate today = LocalDate.now();
        LocalDate expectedMonday = today.with(DayOfWeek.MONDAY);
        assertEquals(expectedMonday.toString(), stats.weekStart());
    }

    @Test
    void shouldReturnZeroStatsForEmptyWeek() {
        WeeklyStatsResponse stats = statsService.getWeeklyStats(null);

        assertEquals(0, stats.totalTasks());
        assertEquals(0, stats.completedTasks());
        assertEquals(0.0, stats.completionRate(), 0.01);
        assertEquals(0, stats.totalFocusMinutes());

        // 每日统计应有7天
        assertEquals(7, stats.dailyStats().size());
        for (var daily : stats.dailyStats()) {
            assertEquals(0, daily.tasksCompleted());
        }

        // 项目分布应为空
        assertTrue(stats.projectDistribution().isEmpty());
    }

    @Test
    void shouldComputeCompletionRateCorrectly() {
        // 创建4个任务，完成2个
        for (int i = 1; i <= 4; i++) {
            Task task = new Task();
            task.setId("completion-task-" + i + "-" + UUID.randomUUID().toString().substring(0, 4));
            task.setProjectId(testProjectId);
            task.setTitle("完成率测试任务 " + i);
            task.setCreatedAt(LocalDateTime.now());
            task.setUpdatedAt(LocalDateTime.now());
            if (i <= 2) {
                task.setStatus(TaskStatus.DONE);
            }
            taskMapper.insert(task);
        }

        WeeklyStatsResponse stats = statsService.getWeeklyStats(null);

        assertEquals(4, stats.totalTasks());
        assertEquals(2, stats.completedTasks());
        assertEquals(0.5, stats.completionRate(), 0.01);
    }

    @Test
    void shouldIncludeProjectDistribution() {
        // 创建第二个项目
        String secondProjectId = "second-proj-" + UUID.randomUUID().toString().substring(0, 8);
        Project secondProject = new Project();
        secondProject.setId(secondProjectId);
        secondProject.setUserId(testUserId);
        secondProject.setName("第二个测试项目");
        secondProject.setGoal("测试");
        secondProject.setStartDate(LocalDate.now());
        secondProject.setEndDate(LocalDate.now().plusDays(30));
        projectMapper.insert(secondProject);

        // 项目1: 3个任务
        for (int i = 0; i < 3; i++) {
            Task task = new Task();
            task.setId("dist-task-a-" + i + "-" + UUID.randomUUID().toString().substring(0, 4));
            task.setProjectId(testProjectId);
            task.setTitle("项目A任务" + i);
            task.setCreatedAt(LocalDateTime.now());
            task.setUpdatedAt(LocalDateTime.now());
            taskMapper.insert(task);
        }

        // 项目2: 2个任务
        for (int i = 0; i < 2; i++) {
            Task task = new Task();
            task.setId("dist-task-b-" + i + "-" + UUID.randomUUID().toString().substring(0, 4));
            task.setProjectId(secondProjectId);
            task.setTitle("项目B任务" + i);
            task.setCreatedAt(LocalDateTime.now());
            task.setUpdatedAt(LocalDateTime.now());
            taskMapper.insert(task);
        }

        WeeklyStatsResponse stats = statsService.getWeeklyStats(null);

        assertFalse(stats.projectDistribution().isEmpty());
        assertEquals(2, stats.projectDistribution().size());

        // 验证每个项目数据正确
        for (var proj : stats.projectDistribution()) {
            if (proj.projectName().equals("统计测试项目")) {
                assertEquals(3, proj.totalTasks());
            } else if (proj.projectName().equals("第二个测试项目")) {
                assertEquals(2, proj.totalTasks());
            }
        }
    }

    @Test
    void shouldFilterByOwnership() {
        // 为另一个用户创建项目
        String otherUserId = "other-stats-" + UUID.randomUUID().toString().substring(0, 8);
        User otherUser = new User();
        otherUser.setId(otherUserId);
        otherUser.setName("其他统计用户");
        otherUser.setEmail(otherUserId + "@test.com");
        otherUser.setPasswordHash("test-hash");
        userMapper.insert(otherUser);

        String otherProjectId = "other-stats-proj-" + UUID.randomUUID().toString().substring(0, 8);
        Project otherProject = new Project();
        otherProject.setId(otherProjectId);
        otherProject.setUserId(otherUserId);
        otherProject.setName("他人项目");
        otherProject.setGoal("不应出现在统计中");
        otherProject.setStartDate(LocalDate.now());
        otherProject.setEndDate(LocalDate.now().plusDays(30));
        projectMapper.insert(otherProject);

        Task otherTask = new Task();
        otherTask.setId("other-task-" + UUID.randomUUID().toString().substring(0, 8));
        otherTask.setProjectId(otherProjectId);
        otherTask.setTitle("他人任务");
        otherTask.setCreatedAt(LocalDateTime.now());
        otherTask.setUpdatedAt(LocalDateTime.now());
        taskMapper.insert(otherTask);

        // 当前用户的统计
        Task myTask = new Task();
        myTask.setId("my-task-" + UUID.randomUUID().toString().substring(0, 8));
        myTask.setProjectId(testProjectId);
        myTask.setTitle("我的任务");
        myTask.setCreatedAt(LocalDateTime.now());
        myTask.setUpdatedAt(LocalDateTime.now());
        taskMapper.insert(myTask);

        WeeklyStatsResponse stats = statsService.getWeeklyStats(null);

        assertEquals(1, stats.totalTasks());
        // 项目分布不应包含他人项目
        for (var proj : stats.projectDistribution()) {
            assertNotEquals("他人项目", proj.projectName());
        }
    }

    @Test
    void shouldHandleCustomWeekStart() {
        // 指定上周一
        LocalDate lastMonday = LocalDate.now().with(DayOfWeek.MONDAY).minusWeeks(1);
        WeeklyStatsResponse stats = statsService.getWeeklyStats(lastMonday);

        assertEquals(lastMonday.toString(), stats.weekStart());
        assertEquals(lastMonday.plusDays(6).toString(), stats.weekEnd());
    }

    @Test
    void shouldHandleBoundaryDates() {
        // 创建一个跨越统计边界（上个月末）的任务
        Task boundaryTask = new Task();
        boundaryTask.setId("boundary-task-" + UUID.randomUUID().toString().substring(0, 8));
        boundaryTask.setProjectId(testProjectId);
        boundaryTask.setTitle("边界测试任务");
        boundaryTask.setCreatedAt(LocalDateTime.now());
        boundaryTask.setUpdatedAt(LocalDateTime.now());
        boundaryTask.setStatus(TaskStatus.DONE);
        taskMapper.insert(boundaryTask);

        // 指定一个月前的周一
        LocalDate oldWeekStart = LocalDate.now().with(DayOfWeek.MONDAY).minusWeeks(4);
        WeeklyStatsResponse stats = statsService.getWeeklyStats(oldWeekStart);

        // 不应报错，且该周应该没有本期任务
        assertEquals(0, stats.totalTasks());
    }

    @Test
    void shouldReturnDailyStatsWithSevenDays() {
        WeeklyStatsResponse stats = statsService.getWeeklyStats(null);

        assertEquals(7, stats.dailyStats().size());

        // 验证每日数据包含零值日期
        for (int i = 0; i < 7; i++) {
            WeeklyStatsResponse.DailyStats daily = stats.dailyStats().get(i);
            assertNotNull(daily.date());
            assertTrue(daily.tasksCompleted() >= 0);
            assertTrue(daily.focusMinutes() >= 0);
            assertTrue(daily.checkins() >= 0);
        }
    }
}

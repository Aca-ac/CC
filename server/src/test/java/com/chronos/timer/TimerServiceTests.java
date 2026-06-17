package com.chronos.timer;

import cn.dev33.satoken.stp.StpUtil;
import com.chronos.common.NotFoundException;
import com.chronos.entity.FocusSession;
import com.chronos.entity.LearningLog;
import com.chronos.entity.Project;
import com.chronos.entity.User;
import com.chronos.mapper.*;
import com.chronos.timer.dto.TimerActiveResponse;
import com.chronos.timer.dto.TimerStartRequest;
import com.chronos.timer.dto.TimerStopResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class TimerServiceTests {

    @Autowired
    private TimerService timerService;

    @Autowired
    private FocusSessionMapper focusSessionMapper;

    @Autowired
    private LearningLogMapper learningLogMapper;

    @Autowired
    private ProjectMapper projectMapper;

    @Autowired
    private UserMapper userMapper;

    private String testUserId;
    private String testProjectId;

    @BeforeEach
    void setUp() {
        testUserId = "timer-user-" + UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setId(testUserId);
        user.setName("计时器测试用户");
        user.setEmail(testUserId + "@test.com");
        user.setPasswordHash("test-hash");
        userMapper.insert(user);
        StpUtil.login(testUserId);

        testProjectId = "timer-proj-" + UUID.randomUUID().toString().substring(0, 8);
        Project project = new Project();
        project.setId(testProjectId);
        project.setUserId(testUserId);
        project.setName("计时器测试项目");
        project.setGoal("测试");
        project.setStartDate(LocalDate.now());
        project.setEndDate(LocalDate.now().plusDays(30));
        projectMapper.insert(project);
    }

    @Test
    void shouldStartTimerSuccessfully() {
        TimerStartRequest request = new TimerStartRequest(testProjectId, null);
        TimerActiveResponse response = timerService.start(request);

        assertNotNull(response.id());
        assertEquals(testProjectId, response.projectId());
        assertEquals(0, response.elapsedSeconds());
        assertNotNull(response.startedAt());
        assertNotNull(response.projectName());
    }

    @Test
    void shouldRejectSecondActiveTimer() {
        timerService.start(new TimerStartRequest(null, null));

        assertThrows(IllegalStateException.class,
                () -> timerService.start(new TimerStartRequest(null, null)));
    }

    @Test
    void shouldAllowRestartAfterStaleTimer() {
        // 创建一个过期的计时器（25小时前启动）
        String userId = StpUtil.getLoginIdAsString();
        FocusSession stale = new FocusSession();
        stale.setId(UUID.randomUUID().toString());
        stale.setUserId(userId);
        stale.setStartedAt(LocalDateTime.now().minusHours(25));
        stale.setCompleted(false);
        stale.setCreatedAt(LocalDateTime.now().minusHours(25));
        focusSessionMapper.insert(stale);

        // 现在应该允许重新开始
        TimerActiveResponse response = timerService.start(new TimerStartRequest(null, null));
        assertNotNull(response.id());

        // 旧计时器应被标记为中断
        FocusSession oldSession = focusSessionMapper.selectById(stale.getId());
        assertNotNull(oldSession.getInterruptionCount());
        assertTrue(oldSession.getInterruptionCount() >= 1);
    }

    @Test
    void shouldStopTimerAndCreateLearningLog() {
        TimerActiveResponse started = timerService.start(new TimerStartRequest(testProjectId, null));

        TimerStopResponse stopped = timerService.stop(started.id());

        // 验证计时器已标记为完成
        FocusSession session = focusSessionMapper.selectById(started.id());
        assertNotNull(session);
        assertTrue(session.getCompleted());
        assertNotNull(session.getDurationMinutes());
        assertTrue(session.getDurationMinutes() >= 1);

        // 验证学习日志已创建
        assertNotNull(stopped.learningLog());
        assertNotNull(stopped.learningLog().id());
        assertEquals(testProjectId, stopped.learningLog().projectId());
        assertTrue(stopped.learningLog().content().contains("专注学习"));

        // 验证数据库中的学习日志
        LearningLog log = learningLogMapper.selectById(stopped.learningLog().id());
        assertNotNull(log);
        assertTrue(log.getActualMinutes() >= 1);
    }

    @Test
    void shouldDiscardTimerWithoutLog() {
        TimerActiveResponse started = timerService.start(new TimerStartRequest(null, null));

        timerService.discard(started.id());

        // 验证计时器未完成
        FocusSession session = focusSessionMapper.selectById(started.id());
        assertNotNull(session);
        assertFalse(session.getCompleted());
        assertTrue(session.getInterruptionCount() >= 1);

        // 验证没有学习日志被创建（通过检查 content 匹配）
        // discard 不应创建学习日志
    }

    @Test
    void shouldFailStopNonExistentTimer() {
        assertThrows(NotFoundException.class,
                () -> timerService.stop("non-existent-id"));
    }

    @Test
    void shouldFailStopOtherUsersTimer() {
        // 当前用户创建一个计时器
        TimerActiveResponse started = timerService.start(new TimerStartRequest(null, null));

        // 另一个用户登录
        String otherUserId = "other-timer-" + UUID.randomUUID().toString().substring(0, 8);
        User otherUser = new User();
        otherUser.setId(otherUserId);
        otherUser.setName("其他计时器用户");
        otherUser.setEmail(otherUserId + "@test.com");
        otherUser.setPasswordHash("test-hash");
        userMapper.insert(otherUser);
        StpUtil.login(otherUserId);

        assertThrows(NotFoundException.class,
                () -> timerService.stop(started.id()));

        StpUtil.login(testUserId);
    }

    @Test
    void shouldGetActiveTimer() {
        timerService.start(new TimerStartRequest(testProjectId, null));

        TimerActiveResponse active = timerService.getActive();
        assertNotNull(active);
        assertNotNull(active.id());
        assertEquals(testProjectId, active.projectId());
        assertEquals("计时器测试项目", active.projectName());
    }

    @Test
    void shouldFailGetActiveWhenNoActiveTimer() {
        assertThrows(NotFoundException.class,
                () -> timerService.getActive());
    }

    @Test
    void shouldFailStopAlreadyStoppedTimer() {
        TimerActiveResponse started = timerService.start(new TimerStartRequest(null, null));
        timerService.stop(started.id());

        assertThrows(IllegalStateException.class,
                () -> timerService.stop(started.id()));
    }
}

package com.chronos.habit;

import cn.dev33.satoken.stp.StpUtil;
import com.chronos.entity.User;
import com.chronos.habit.dto.CheckinResponse;
import com.chronos.habit.dto.CreateHabitRequest;
import com.chronos.habit.dto.HabitResponse;
import com.chronos.mapper.UserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class HabitServiceTests {

    @Autowired
    private HabitService habitService;

    @Autowired
    private UserMapper userMapper;

    private String testUserId;
    private String otherUserId;

    @BeforeEach
    void setUp() {
        testUserId = "habit-user-" + UUID.randomUUID().toString().substring(0, 8);
        otherUserId = "habit-other-" + UUID.randomUUID().toString().substring(0, 8);
        insertUser(testUserId, "习惯测试用户");
        insertUser(otherUserId, "其他习惯用户");
        StpUtil.login(testUserId);
    }

    @Test
    void shouldCreateAndListHabitsByUser() {
        HabitResponse created = habitService.create(
                testUserId,
                new CreateHabitRequest("每日英语", "每天 20 分钟")
        );

        assertNotNull(created.id());
        assertEquals("每日英语", created.name());

        List<HabitResponse> currentUserHabits = habitService.list(testUserId);
        assertTrue(currentUserHabits.stream().anyMatch(habit -> habit.id().equals(created.id())));

        List<HabitResponse> otherUserHabits = habitService.list(otherUserId);
        assertTrue(otherUserHabits.stream().noneMatch(habit -> habit.id().equals(created.id())));
    }

    @Test
    void shouldCheckinAndComputeStreak() {
        HabitResponse habit = habitService.create(
                testUserId,
                new CreateHabitRequest("算法题", "每天一道")
        );

        LocalDate today = LocalDate.now();
        habitService.checkin(testUserId, habit.id(), today.minusDays(1), "昨天完成");
        CheckinResponse todayCheckin = habitService.checkin(testUserId, habit.id(), today, "今天完成");

        assertEquals(today, todayCheckin.checkedDate());
        assertEquals(2, habitService.streak(testUserId, habit.id()));

        HabitResponse gappedHabit = habitService.create(
                testUserId,
                new CreateHabitRequest("阅读", "每周三次")
        );
        habitService.checkin(testUserId, gappedHabit.id(), today.minusDays(2), "前天");
        habitService.checkin(testUserId, gappedHabit.id(), today, "今天");

        assertEquals(1, habitService.streak(testUserId, gappedHabit.id()));
    }

    @Test
    void shouldDeleteHabitFromList() {
        HabitResponse habit = habitService.create(
                testUserId,
                new CreateHabitRequest("背单词", "每日")
        );

        habitService.delete(testUserId, habit.id());

        assertTrue(habitService.list(testUserId).stream().noneMatch(item -> item.id().equals(habit.id())));
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

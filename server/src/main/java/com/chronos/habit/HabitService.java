package com.chronos.habit;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.chronos.common.NotFoundException;
import com.chronos.entity.Habit;
import com.chronos.entity.HabitCheckin;
import com.chronos.habit.dto.CheckinResponse;
import com.chronos.habit.dto.CreateHabitRequest;
import com.chronos.habit.dto.HabitResponse;
import com.chronos.mapper.HabitCheckinMapper;
import com.chronos.mapper.HabitMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HabitService {

    private final HabitMapper habitMapper;
    private final HabitCheckinMapper habitCheckinMapper;

    public List<HabitResponse> list(String userId) {
        return habitMapper.selectList(
                        new LambdaQueryWrapper<Habit>()
                                .eq(Habit::getUserId, userId)
                                .orderByDesc(Habit::getCreatedAt)
                ).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(rollbackFor = Exception.class)
    public HabitResponse create(String userId, CreateHabitRequest request) {
        LocalDateTime now = LocalDateTime.now();
        Habit habit = new Habit();
        habit.setUserId(userId);
        habit.setName(request.name().trim());
        habit.setRuleText(StringUtils.hasText(request.ruleText()) ? request.ruleText().trim() : "");
        habit.setStreakCount(0);
        habit.setStatus("ACTIVE");
        habit.setCreatedAt(now);
        habit.setUpdatedAt(now);
        habitMapper.insert(habit);
        return toResponse(habit);
    }

    @Transactional(rollbackFor = Exception.class)
    public void delete(String userId, String habitId) {
        Habit habit = getOwnedHabit(userId, habitId);
        habitMapper.deleteById(habit.getId());
    }

    @Transactional(rollbackFor = Exception.class)
    public CheckinResponse checkin(String userId, String habitId, LocalDate date, String note) {
        Habit habit = getOwnedHabit(userId, habitId);
        LocalDate checkedDate = date != null ? date : LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        HabitCheckin checkin = habitCheckinMapper.selectOne(
                new LambdaQueryWrapper<HabitCheckin>()
                        .eq(HabitCheckin::getHabitId, habit.getId())
                        .eq(HabitCheckin::getCheckedDate, checkedDate)
        );

        if (checkin == null) {
            checkin = new HabitCheckin();
            checkin.setHabitId(habit.getId());
            checkin.setCheckedDate(checkedDate);
            checkin.setCheckedAt(now);
            checkin.setNote(note);
            habitCheckinMapper.insert(checkin);
        } else {
            checkin.setCheckedAt(now);
            checkin.setNote(note);
            habitCheckinMapper.updateById(checkin);
        }

        int streakCount = recalculateStreak(habit);
        return toCheckinResponse(checkin, streakCount);
    }

    public int streak(String userId, String habitId) {
        Habit habit = getOwnedHabit(userId, habitId);
        return recalculateStreak(habit);
    }

    private Habit getOwnedHabit(String userId, String habitId) {
        Habit habit = habitMapper.selectOne(
                new LambdaQueryWrapper<Habit>()
                        .eq(Habit::getId, habitId)
                        .eq(Habit::getUserId, userId)
        );
        if (habit == null) {
            throw new NotFoundException("未找到指定习惯");
        }
        return habit;
    }

    private int recalculateStreak(Habit habit) {
        List<HabitCheckin> checkins = habitCheckinMapper.selectList(
                new LambdaQueryWrapper<HabitCheckin>()
                        .eq(HabitCheckin::getHabitId, habit.getId())
                        .orderByDesc(HabitCheckin::getCheckedDate)
        );

        int streak = 0;
        LocalDate expected = null;
        for (HabitCheckin checkin : checkins) {
            LocalDate checkedDate = checkin.getCheckedDate();
            if (checkedDate == null) {
                continue;
            }

            if (expected == null) {
                streak = 1;
                expected = checkedDate.minusDays(1);
                continue;
            }

            if (checkedDate.isEqual(expected)) {
                streak += 1;
                expected = expected.minusDays(1);
            } else if (checkedDate.isBefore(expected)) {
                break;
            }
        }

        habit.setStreakCount(streak);
        habit.setUpdatedAt(LocalDateTime.now());
        habitMapper.updateById(habit);
        return streak;
    }

    private HabitResponse toResponse(Habit habit) {
        return new HabitResponse(
                habit.getId(),
                habit.getName(),
                habit.getRuleText(),
                habit.getStreakCount() != null ? habit.getStreakCount() : 0,
                habit.getStatus(),
                habit.getCreatedAt(),
                habit.getUpdatedAt()
        );
    }

    private CheckinResponse toCheckinResponse(HabitCheckin checkin, int streakCount) {
        return new CheckinResponse(
                checkin.getId(),
                checkin.getHabitId(),
                checkin.getCheckedDate(),
                checkin.getCheckedAt(),
                checkin.getNote(),
                streakCount
        );
    }
}

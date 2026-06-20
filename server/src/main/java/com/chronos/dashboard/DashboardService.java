package com.chronos.dashboard;

import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.chronos.dashboard.dto.TodayDashboardResponse;
import com.chronos.entity.FocusSession;
import com.chronos.entity.Habit;
import com.chronos.entity.Project;
import com.chronos.entity.SyncRecord;
import com.chronos.entity.Task;
import com.chronos.enums.TaskStatus;
import com.chronos.mapper.FocusSessionMapper;
import com.chronos.mapper.HabitMapper;
import com.chronos.mapper.ProjectMapper;
import com.chronos.mapper.SyncRecordMapper;
import com.chronos.mapper.TaskMapper;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
@RequiredArgsConstructor
@Service
public class DashboardService {

    private final TaskMapper taskMapper;
    private final FocusSessionMapper focusSessionMapper;
    private final HabitMapper habitMapper;
    private final SyncRecordMapper syncRecordMapper;
    private final ProjectMapper projectMapper;


    public TodayDashboardResponse getTodayDashboard() {
        String userId = String.valueOf(StpUtil.getLoginId());

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        // 查询当前用户的所有项目 ID
        List<String> projectIds = projectMapper.selectList(
                new LambdaQueryWrapper<Project>().eq(Project::getUserId, userId)
        ).stream().map(Project::getId).collect(Collectors.toList());

        // 今日任务总数（dueTime 在今天范围内的任务）
        int todayTaskTotal = 0;
        if (!projectIds.isEmpty()) {
            todayTaskTotal = taskMapper.selectCount(
                    new LambdaQueryWrapper<Task>()
                            .in(Task::getProjectId, projectIds)
                            .between(Task::getDueTime, startOfDay, endOfDay)
            ).intValue();
        }

        // 今日已完成任务数
        int completedTaskTotal = 0;
        if (!projectIds.isEmpty()) {
            completedTaskTotal = taskMapper.selectCount(
                    new LambdaQueryWrapper<Task>()
                            .in(Task::getProjectId, projectIds)
                            .eq(Task::getStatus, TaskStatus.DONE)
                            .between(Task::getUpdatedAt, startOfDay, endOfDay)
            ).intValue();
        }

        // 今日专注总时长（通过 task → project 关联过滤当前用户的数据）
        int focusMinutes = 0;
        if (!projectIds.isEmpty()) {
            List<Task> userTasks = taskMapper.selectList(
                    new LambdaQueryWrapper<Task>()
                            .select(Task::getId)
                            .in(Task::getProjectId, projectIds)
            );
            List<String> taskIds = userTasks.stream().map(Task::getId).collect(Collectors.toList());
            if (!taskIds.isEmpty()) {
                List<FocusSession> sessions = focusSessionMapper.selectList(
                        new LambdaQueryWrapper<FocusSession>()
                                .in(FocusSession::getTaskId, taskIds)
                                .between(FocusSession::getStartedAt, startOfDay, endOfDay)
                );
                focusMinutes = sessions.stream()
                        .mapToInt(s -> s.getDurationMinutes() != null ? s.getDurationMinutes() : 0)
                        .sum();
            }
        }

        // 最长习惯连续打卡天数
        List<Habit> habits = habitMapper.selectList(
                new LambdaQueryWrapper<Habit>().eq(Habit::getUserId, userId)
        );
        int habitStreak = habits.stream()
                .mapToInt(h -> h.getStreakCount() != null ? h.getStreakCount() : 0)
                .max()
                .orElse(0);

        // 待同步记录数必须按登录账户隔离，不能泄露其他用户的同步状态。
        int syncPendingTotal = syncRecordMapper.selectCount(
                new LambdaQueryWrapper<SyncRecord>()
                        .eq(SyncRecord::getUserId, userId)
                        .eq(SyncRecord::getSyncStatus, "PENDING")
        ).intValue();

        return new TodayDashboardResponse(
                todayTaskTotal,
                completedTaskTotal,
                focusMinutes,
                habitStreak,
                syncPendingTotal
        );
    }
}

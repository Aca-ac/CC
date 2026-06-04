package com.chronos.stats;

import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.chronos.entity.*;
import com.chronos.enums.TaskStatus;
import com.chronos.mapper.*;
import com.chronos.stats.dto.WeeklyStatsResponse;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StatsService {

    private final TaskMapper taskMapper;
    private final FocusSessionMapper focusSessionMapper;
    private final HabitCheckinMapper habitCheckinMapper;
    private final LearningLogMapper learningLogMapper;
    private final ProjectMapper projectMapper;

    public StatsService(TaskMapper taskMapper, FocusSessionMapper focusSessionMapper,
                        HabitCheckinMapper habitCheckinMapper, LearningLogMapper learningLogMapper,
                        ProjectMapper projectMapper) {
        this.taskMapper = taskMapper;
        this.focusSessionMapper = focusSessionMapper;
        this.habitCheckinMapper = habitCheckinMapper;
        this.learningLogMapper = learningLogMapper;
        this.projectMapper = projectMapper;
    }

    public WeeklyStatsResponse getWeeklyStats(LocalDate weekStartParam) {
        String userId = String.valueOf(StpUtil.getLoginId());

        // 确定统计周期（默认本周一）
        LocalDate today = LocalDate.now();
        LocalDate weekStart = (weekStartParam != null)
                ? weekStartParam.with(DayOfWeek.MONDAY)
                : today.with(DayOfWeek.MONDAY);
        LocalDate weekEnd = weekStart.plusDays(6); // 周日

        LocalDateTime weekStartDateTime = weekStart.atStartOfDay();
        LocalDateTime weekEndDateTime = weekEnd.atTime(LocalTime.MAX);

        // 获取当前用户的所有项目ID
        List<String> projectIds = projectMapper.selectList(
                new LambdaQueryWrapper<Project>().eq(Project::getUserId, userId)
        ).stream().map(Project::getId).collect(Collectors.toList());

        // 构建项目ID到名称的映射
        Map<String, String> projectNameMap = new HashMap<>();
        for (Project p : projectMapper.selectList(
                new LambdaQueryWrapper<Project>().eq(Project::getUserId, userId))) {
            projectNameMap.put(p.getId(), p.getName());
        }

        // --- 本周活跃任务总数（创建或更新在本周内的任务）---
        int totalTasks = 0;
        int completedTasks = 0;
        if (!projectIds.isEmpty()) {
            totalTasks = taskMapper.selectCount(
                    new LambdaQueryWrapper<Task>()
                            .in(Task::getProjectId, projectIds)
                            .and(w -> w.between(Task::getCreatedAt, weekStartDateTime, weekEndDateTime)
                                    .or()
                                    .between(Task::getUpdatedAt, weekStartDateTime, weekEndDateTime))
            ).intValue();

            completedTasks = taskMapper.selectCount(
                    new LambdaQueryWrapper<Task>()
                            .in(Task::getProjectId, projectIds)
                            .eq(Task::getStatus, TaskStatus.DONE)
                            .between(Task::getUpdatedAt, weekStartDateTime, weekEndDateTime)
            ).intValue();
        }

        // 完成率
        double completionRate = (totalTasks > 0) ? (double) completedTasks / totalTasks : 0.0;

        // --- 本周专注总时长 ---
        int totalFocusMinutes = 0;
        if (!projectIds.isEmpty()) {
            // 方式1: 通过 userId 直接查询（FocusSession 已添加 userId 字段）
            List<FocusSession> sessionsByUser = focusSessionMapper.selectList(
                    new LambdaQueryWrapper<FocusSession>()
                            .eq(FocusSession::getUserId, userId)
                            .between(FocusSession::getStartedAt, weekStartDateTime, weekEndDateTime)
                            .isNotNull(FocusSession::getDurationMinutes)
            );
            totalFocusMinutes = sessionsByUser.stream()
                    .mapToInt(s -> s.getDurationMinutes() != null ? s.getDurationMinutes() : 0)
                    .sum();

            // 方式2: 通过 taskId 链补充（兼容旧数据，旧 FocusSession 可能没有 userId）
            List<Task> userTasks = taskMapper.selectList(
                    new LambdaQueryWrapper<Task>()
                            .select(Task::getId)
                            .in(Task::getProjectId, projectIds)
            );
            List<String> taskIds = userTasks.stream().map(Task::getId).collect(Collectors.toList());
            if (!taskIds.isEmpty()) {
                List<FocusSession> sessionsByTask = focusSessionMapper.selectList(
                        new LambdaQueryWrapper<FocusSession>()
                                .in(FocusSession::getTaskId, taskIds)
                                .between(FocusSession::getStartedAt, weekStartDateTime, weekEndDateTime)
                                .isNull(FocusSession::getUserId)  // 只取未设置 userId 的旧数据
                );
                totalFocusMinutes += sessionsByTask.stream()
                        .mapToInt(s -> s.getDurationMinutes() != null ? s.getDurationMinutes() : 0)
                        .sum();
            }
        } else {
            // 无项目时也尝试通过 userId 直接查专注记录
            List<FocusSession> sessions = focusSessionMapper.selectList(
                    new LambdaQueryWrapper<FocusSession>()
                            .eq(FocusSession::getUserId, userId)
                            .between(FocusSession::getStartedAt, weekStartDateTime, weekEndDateTime)
                            .isNotNull(FocusSession::getDurationMinutes)
            );
            totalFocusMinutes = sessions.stream()
                    .mapToInt(s -> s.getDurationMinutes() != null ? s.getDurationMinutes() : 0)
                    .sum();
        }

        // --- 习惯打卡次数 ---
        int habitCheckins = habitCheckinMapper.selectCount(
                new LambdaQueryWrapper<HabitCheckin>()
                        .between(HabitCheckin::getCheckedAt, weekStartDateTime, weekEndDateTime)
        ).intValue();

        // --- 学习日志数 ---
        int learningLogs = 0;
        if (!projectIds.isEmpty()) {
            learningLogs = learningLogMapper.selectCount(
                    new LambdaQueryWrapper<LearningLog>()
                            .in(LearningLog::getProjectId, projectIds)
                            .between(LearningLog::getCreatedAt, weekStartDateTime, weekEndDateTime)
            ).intValue();
        }

        // --- 项目分布（本周内各项目的任务数及完成数）---
        List<WeeklyStatsResponse.ProjectStats> projectDistribution = new ArrayList<>();
        if (!projectIds.isEmpty()) {
            for (String pId : projectIds) {
                int projTotal = taskMapper.selectCount(
                        new LambdaQueryWrapper<Task>()
                                .eq(Task::getProjectId, pId)
                                .and(w -> w.between(Task::getCreatedAt, weekStartDateTime, weekEndDateTime)
                                        .or()
                                        .between(Task::getUpdatedAt, weekStartDateTime, weekEndDateTime))
                ).intValue();

                int projCompleted = taskMapper.selectCount(
                        new LambdaQueryWrapper<Task>()
                                .eq(Task::getProjectId, pId)
                                .eq(Task::getStatus, TaskStatus.DONE)
                                .between(Task::getUpdatedAt, weekStartDateTime, weekEndDateTime)
                ).intValue();

                if (projTotal > 0) {
                    projectDistribution.add(new WeeklyStatsResponse.ProjectStats(
                            pId,
                            projectNameMap.getOrDefault(pId, "未知项目"),
                            projTotal,
                            projCompleted
                    ));
                }
            }
        }

        // --- 每日统计 ---
        List<WeeklyStatsResponse.DailyStats> dailyStats = new ArrayList<>();
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (int i = 0; i < 7; i++) {
            LocalDate date = weekStart.plusDays(i);
            LocalDateTime dayStart = date.atStartOfDay();
            LocalDateTime dayEnd = date.atTime(LocalTime.MAX);

            int dayCompletedTasks = 0;
            int dayFocusMinutes = 0;
            int dayCheckins;

            if (!projectIds.isEmpty()) {
                dayCompletedTasks = taskMapper.selectCount(
                        new LambdaQueryWrapper<Task>()
                                .in(Task::getProjectId, projectIds)
                                .eq(Task::getStatus, TaskStatus.DONE)
                                .between(Task::getUpdatedAt, dayStart, dayEnd)
                ).intValue();

                // 每日专注分钟数（userId 直查 + taskId 链补充）
                List<FocusSession> daySessionsByUser = focusSessionMapper.selectList(
                        new LambdaQueryWrapper<FocusSession>()
                                .eq(FocusSession::getUserId, userId)
                                .between(FocusSession::getStartedAt, dayStart, dayEnd)
                                .isNotNull(FocusSession::getDurationMinutes)
                );
                dayFocusMinutes = daySessionsByUser.stream()
                        .mapToInt(s -> s.getDurationMinutes() != null ? s.getDurationMinutes() : 0)
                        .sum();
            }

            dayCheckins = habitCheckinMapper.selectCount(
                    new LambdaQueryWrapper<HabitCheckin>()
                            .between(HabitCheckin::getCheckedAt, dayStart, dayEnd)
            ).intValue();

            dailyStats.add(new WeeklyStatsResponse.DailyStats(
                    date.format(dateFormatter),
                    dayCompletedTasks,
                    dayFocusMinutes,
                    dayCheckins
            ));
        }

        return new WeeklyStatsResponse(
                weekStart.format(dateFormatter),
                weekEnd.format(dateFormatter),
                totalTasks,
                completedTasks,
                completionRate,
                totalFocusMinutes,
                habitCheckins,
                learningLogs,
                dailyStats,
                projectDistribution
        );
    }
}

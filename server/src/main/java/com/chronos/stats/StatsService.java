package com.chronos.stats;

import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.chronos.entity.FocusSession;
import com.chronos.entity.Project;
import com.chronos.entity.Task;
import com.chronos.enums.TaskStatus;
import com.chronos.mapper.FocusSessionMapper;
import com.chronos.mapper.ProjectMapper;
import com.chronos.mapper.TaskMapper;
import com.chronos.stats.dto.WeeklyStatsResponse;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StatsService {

    private final TaskMapper taskMapper;
    private final FocusSessionMapper focusSessionMapper;
    private final ProjectMapper projectMapper;

    public StatsService(TaskMapper taskMapper, FocusSessionMapper focusSessionMapper, ProjectMapper projectMapper) {
        this.taskMapper = taskMapper;
        this.focusSessionMapper = focusSessionMapper;
        this.projectMapper = projectMapper;
    }

    public WeeklyStatsResponse getWeeklyStats() {
        String userId = String.valueOf(StpUtil.getLoginId());

        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.minusDays(6);
        LocalDateTime weekStart = startOfWeek.atStartOfDay();
        LocalDateTime weekEnd = today.atTime(23, 59, 59);

        // 获取用户所有项目
        List<Project> projects = projectMapper.selectList(
                new LambdaQueryWrapper<Project>().eq(Project::getUserId, userId)
        );
        List<String> projectIds = projects.stream().map(Project::getId).collect(Collectors.toList());

        // 本周完成任务数
        int totalCompleted = 0;
        if (!projectIds.isEmpty()) {
            totalCompleted = taskMapper.selectCount(
                    new LambdaQueryWrapper<Task>()
                            .in(Task::getProjectId, projectIds)
                            .eq(Task::getStatus, TaskStatus.DONE)
                            .between(Task::getUpdatedAt, weekStart, weekEnd)
            ).intValue();
        }

        // 完成率 = 已完成 / (已完成 + 进行中 + 待办 + 暂停)
        int totalActive = 0;
        if (!projectIds.isEmpty()) {
            totalActive = taskMapper.selectCount(
                    new LambdaQueryWrapper<Task>()
                            .in(Task::getProjectId, projectIds)
                            .ne(Task::getStatus, TaskStatus.DONE)
                            .between(Task::getUpdatedAt, weekStart, weekEnd)
            ).intValue();
        }
        double completionRate = (totalCompleted + totalActive) == 0
                ? 0.0
                : Math.round((double) totalCompleted / (totalCompleted + totalActive) * 1000) / 10.0;

        // 每日专注时长
        List<WeeklyStatsResponse.DailyMinutes> dailyMinutes = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime dayStart = date.atStartOfDay();
            LocalDateTime dayEnd = date.atTime(23, 59, 59);

            int minutes = 0;
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
                                    .between(FocusSession::getStartedAt, dayStart, dayEnd)
                    );
                    minutes = sessions.stream()
                            .mapToInt(s -> s.getDurationMinutes() != null ? s.getDurationMinutes() : 0)
                            .sum();
                }
            }
            dailyMinutes.add(new WeeklyStatsResponse.DailyMinutes(date.format(fmt), minutes));
        }

        // 项目分布
        List<WeeklyStatsResponse.ProjectDistribution> projectDistribution = new ArrayList<>();
        Map<String, String> projectNameMap = projects.stream()
                .collect(Collectors.toMap(Project::getId, Project::getName));

        for (String projectId : projectIds) {
            List<Task> projectTasks = taskMapper.selectList(
                    new LambdaQueryWrapper<Task>()
                            .select(Task::getId)
                            .eq(Task::getProjectId, projectId)
            );
            List<String> taskIds = projectTasks.stream().map(Task::getId).collect(Collectors.toList());
            int minutes = 0;
            if (!taskIds.isEmpty()) {
                List<FocusSession> sessions = focusSessionMapper.selectList(
                        new LambdaQueryWrapper<FocusSession>()
                                .in(FocusSession::getTaskId, taskIds)
                                .between(FocusSession::getStartedAt, weekStart, weekEnd)
                );
                minutes = sessions.stream()
                        .mapToInt(s -> s.getDurationMinutes() != null ? s.getDurationMinutes() : 0)
                        .sum();
            }
            if (minutes > 0) {
                projectDistribution.add(new WeeklyStatsResponse.ProjectDistribution(
                        projectId,
                        projectNameMap.getOrDefault(projectId, "未知项目"),
                        minutes
                ));
            }
        }
        projectDistribution.sort(Comparator.comparingInt(WeeklyStatsResponse.ProjectDistribution::minutes).reversed());

        return new WeeklyStatsResponse(totalCompleted, completionRate, dailyMinutes, projectDistribution);
    }
}

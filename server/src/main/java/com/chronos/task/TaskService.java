package com.chronos.task;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chronos.entity.Task;
import com.chronos.task.dto.CreateTaskRequest;
import com.chronos.task.dto.TaskStatusRequest;
import com.chronos.task.dto.TaskSummaryResponse;
import java.time.ZoneId;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class TaskService extends ServiceImpl<TaskMapper, Task> {

    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Shanghai");

    public List<TaskSummaryResponse> listTasks(String projectId, String status,
                                               LocalDateTime dueTime, String keyword,
                                               int page, int size, String sortBy, String sortOrder) {
        LambdaQueryWrapper<Task> queryWrapper = new LambdaQueryWrapper<>();

        queryWrapper.eq(StringUtils.hasText(projectId), Task::getProjectId, projectId)
            .eq(StringUtils.hasText(status), Task::getStatus, status)
            .le(dueTime != null, Task::getDueTime, dueTime);

        if (StringUtils.hasText(keyword)) {
            queryWrapper.and(wrapper -> wrapper.like(Task::getTitle, keyword)
                .or()
                .like(Task::getDescription, keyword));
        }

        boolean asc = "asc".equalsIgnoreCase(sortOrder);
        if ("dueTime".equals(sortBy)) {
            queryWrapper.orderBy(true, asc, Task::getDueTime);
        } else if ("priority".equals(sortBy)) {
            queryWrapper.orderBy(true, asc, Task::getPriority);
        } else {
            queryWrapper.orderBy(true, asc, Task::getCreatedAt);
        }

        Page<Task> pageResult = this.page(new Page<>(page, size), queryWrapper);
        return pageResult.getRecords().stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    @Transactional(rollbackFor = Exception.class)
    public TaskSummaryResponse createTask(CreateTaskRequest request) {
        Task task = new Task();

        task.setProjectId(request.projectId());
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setPriority(request.priority());
        task.setEstimatedMinutes(request.estimatedMinutes());

        if (request.dueTime() != null) {
            task.setDueTime(request.dueTime().toLocalDateTime());
        }

        if (request.parentTaskId() != null) {
            task.setParentTaskId(request.parentTaskId());
        }

        if (task.getPriority() == null) {
            task.setPriority("MEDIUM");
        }
        task.setStatus("TODO");

        this.save(task);
        return convertToResponse(task);
    }

    @Transactional(rollbackFor = Exception.class)
    public TaskSummaryResponse updateStatus(String taskId, TaskStatusRequest request) {
        Task currentTask = this.getById(taskId);
        if (currentTask == null) {
            throw new IllegalArgumentException("未找到指定ID的任务，无法修改状态！");
        }

        String oldStatus = currentTask.getStatus();
        String newStatus = request.status();

        if ("DONE".equals(oldStatus) && "TODO".equals(newStatus)) {
            throw new IllegalStateException("已完成的任务不能直接打回未开始状态，请遵循研发规范！");
        }

        currentTask.setStatus(newStatus);
        this.updateById(currentTask);

        return convertToResponse(currentTask);
    }

    private TaskSummaryResponse convertToResponse(Task task) {
        OffsetDateTime odt = null;
        if (task.getDueTime() != null) {
            odt = task.getDueTime().atZone(APP_ZONE).toOffsetDateTime();
        }

        return new TaskSummaryResponse(
            task.getId(),
            task.getProjectId(),
            task.getTitle(),
            task.getStatus(),
            task.getPriority(),
            task.getEstimatedMinutes(),
            odt,
            task.getParentTaskId(),
            task.getDescription(),
            task.getActualMinutes(),
            task.getTags()
        );
    }
}

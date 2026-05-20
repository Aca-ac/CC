package com.chronos.project;
import com.chronos.common.NotFoundException;
import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chronos.entity.Project;
import com.chronos.mapper.ProjectMapper;
import com.chronos.project.dto.CreateProjectRequest;
import com.chronos.project.dto.ProjectSummaryResponse;
import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class ProjectService extends ServiceImpl<ProjectMapper, Project>  {

    public List<ProjectSummaryResponse> listProjects() {
        LambdaQueryWrapper<Project> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Project::getUserId, StpUtil.getLoginIdAsString());
        queryWrapper.orderByAsc(Project::getEndDate);

        return this.list(queryWrapper).stream()
            .map(this::toResponse)
            .toList();
    }
    private ProjectSummaryResponse toResponse(Project p) {
        return new ProjectSummaryResponse(
            p.getId(),
            p.getName(),
            p.getGoal(),
            p.getStartDate(),
            p.getEndDate(),
            p.getStatus(),
            p.getProgress() != null ? p.getProgress() : 0
        );
    }
    public ProjectSummaryResponse createProject(CreateProjectRequest request) {

        if (request.startDate() != null && request.endDate() != null) {
            if (request.startDate().isAfter(request.endDate())) {
                throw new  IllegalArgumentException("项目开始时间不能晚于结束时间，请重新检查日期！");
            }
        }

        String currentUserId = StpUtil.getLoginIdAsString();

        Project project = new Project();
        project.setName(request.name());
        project.setGoal(request.goal());
        project.setStartDate(request.startDate());
        project.setEndDate(request.endDate());


        project.setUserId(currentUserId);

        this.save(project);
        return toResponse(project);
    }

    public ProjectSummaryResponse getProject(String projectId)  {

        Project project = this.getById(projectId);
        if (project == null) {
            throw   new NotFoundException("未找到指定ID的项目");
        }
        return this.toResponse(project);
    }


}


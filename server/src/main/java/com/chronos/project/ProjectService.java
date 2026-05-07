package com.chronos.project;

import com.chronos.project.dto.CreateProjectRequest;
import com.chronos.project.dto.ProjectSummaryResponse;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ProjectService {

    public List<ProjectSummaryResponse> listProjects() {
        // TODO(后端A): 从 projects 表读取当前用户项目，并计算进度和剩余天数。
        return List.of(sampleProject());
    }

    public ProjectSummaryResponse createProject(CreateProjectRequest request) {
        // TODO(后端A): 校验日期合法性，写入 projects 表，并记录同步变更。
        return new ProjectSummaryResponse(
                "project-new",
                request.name(),
                request.goal(),
                request.startDate(),
                request.endDate(),
                "ACTIVE",
                0
        );
    }

    public ProjectSummaryResponse getProject(String projectId) {
        // TODO(后端A): 找不到项目时返回 NOT_FOUND，而不是继续返回 Mock 数据。
        return sampleProject();
    }

    private ProjectSummaryResponse sampleProject() {
        return new ProjectSummaryResponse(
                "project-se",
                "软件工程课程项目",
                "完成 Chronos 初始框架和核心功能演示。",
                LocalDate.of(2026, 4, 8),
                LocalDate.of(2026, 6, 4),
                "ACTIVE",
                42
        );
    }
}


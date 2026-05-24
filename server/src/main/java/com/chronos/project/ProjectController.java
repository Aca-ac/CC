package com.chronos.project;

import com.chronos.common.ApiResponse;
import com.chronos.project.dto.CreateProjectRequest;
import com.chronos.project.dto.ProjectSummaryResponse;
import jakarta.validation.Valid;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ApiResponse<List<ProjectSummaryResponse>> listProjects() {
        return ApiResponse.ok(projectService.listProjects());
    }

    @PostMapping
    public ApiResponse<ProjectSummaryResponse> createProject(
            @Valid @RequestBody CreateProjectRequest request
    ) {
        return ApiResponse.ok(projectService.createProject(request));
    }

    @GetMapping("/{projectId}")
    public ApiResponse<ProjectSummaryResponse> getProject(@PathVariable String projectId)  {
        return ApiResponse.ok(projectService.getProject(projectId));
    }
}


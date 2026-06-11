package com.chronos.dashboard;

import com.chronos.common.ApiResponse;
import com.chronos.dashboard.dto.TodayDashboardResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/today")
    public ApiResponse<TodayDashboardResponse> today() {
        return ApiResponse.ok(dashboardService.getTodayDashboard());
    }
}

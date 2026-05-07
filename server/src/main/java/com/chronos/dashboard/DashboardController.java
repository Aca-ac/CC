package com.chronos.dashboard;

import com.chronos.common.ApiResponse;
import com.chronos.dashboard.dto.TodayDashboardResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @GetMapping("/today")
    public ApiResponse<TodayDashboardResponse> today() {
        // TODO(前后端联调): 后续从任务、习惯、专注记录和同步队列聚合今日数据。
        return ApiResponse.ok(new TodayDashboardResponse(6, 2, 85, 5, 1));
    }
}


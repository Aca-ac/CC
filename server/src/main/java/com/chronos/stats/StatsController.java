package com.chronos.stats;

import com.chronos.common.ApiResponse;
import com.chronos.stats.dto.WeeklyStatsResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping("/weekly")
    public ApiResponse<WeeklyStatsResponse> weekly() {
        return ApiResponse.ok(statsService.getWeeklyStats());
    }
}

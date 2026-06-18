package com.chronos.habit;

import cn.dev33.satoken.stp.StpUtil;
import com.chronos.common.ApiResponse;
import com.chronos.habit.dto.CheckinHabitRequest;
import com.chronos.habit.dto.CheckinResponse;
import com.chronos.habit.dto.CreateHabitRequest;
import com.chronos.habit.dto.HabitResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/habits")
public class HabitController {

    private final HabitService habitService;

    public HabitController(HabitService habitService) {
        this.habitService = habitService;
    }

    @GetMapping
    public ApiResponse<List<HabitResponse>> list() {
        return ApiResponse.ok(habitService.list(StpUtil.getLoginIdAsString()));
    }

    @PostMapping
    public ApiResponse<HabitResponse> create(@Valid @RequestBody CreateHabitRequest request) {
        return ApiResponse.ok(habitService.create(StpUtil.getLoginIdAsString(), request));
    }

    @DeleteMapping("/{habitId}")
    public ApiResponse<Void> delete(@PathVariable String habitId) {
        habitService.delete(StpUtil.getLoginIdAsString(), habitId);
        return ApiResponse.ok(null);
    }

    @PostMapping("/{habitId}/checkin")
    public ApiResponse<CheckinResponse> checkin(
            @PathVariable String habitId,
            @RequestBody(required = false) CheckinHabitRequest request
    ) {
        LocalDate date = request != null ? request.date() : null;
        String note = request != null ? request.note() : null;
        return ApiResponse.ok(habitService.checkin(StpUtil.getLoginIdAsString(), habitId, date, note));
    }
}

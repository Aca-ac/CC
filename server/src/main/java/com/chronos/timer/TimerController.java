package com.chronos.timer;

import com.chronos.common.ApiResponse;
import com.chronos.entity.FocusSession;
import com.chronos.timer.dto.TimerActiveResponse;
import com.chronos.timer.dto.TimerStartRequest;
import com.chronos.timer.dto.TimerStopResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/timer")
public class TimerController {

    private final TimerService timerService;

    public TimerController(TimerService timerService) {
        this.timerService = timerService;
    }

    @PostMapping("/start")
    public ApiResponse<TimerActiveResponse> start(@Valid @RequestBody TimerStartRequest request) {
        return ApiResponse.ok(timerService.start(request));
    }

    @GetMapping("/active")
    public ApiResponse<TimerActiveResponse> getActive() {
        return ApiResponse.ok(timerService.getActive());
    }

    @PostMapping("/{id}/stop")
    public ApiResponse<TimerStopResponse> stop(@PathVariable String id) {
        return ApiResponse.ok(timerService.stop(id));
    }

    @PostMapping("/{id}/discard")
    public ApiResponse<FocusSession> discard(@PathVariable String id) {
        return ApiResponse.ok(timerService.discard(id));
    }
}

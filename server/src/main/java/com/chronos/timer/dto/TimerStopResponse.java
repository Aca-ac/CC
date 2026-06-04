package com.chronos.timer.dto;

import com.chronos.entity.FocusSession;
import com.chronos.learninglog.dto.LearningLogResponse;

public record TimerStopResponse(
        FocusSession session,
        LearningLogResponse learningLog
) {}

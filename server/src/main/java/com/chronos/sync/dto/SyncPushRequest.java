package com.chronos.sync.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record SyncPushRequest(
        @NotNull(message = "同步记录不能为空")
        List<SyncRecordDto> records
) {
}


package com.chronos.sync.dto;

import java.util.List;

public record SyncPushResponse(
        int accepted,
        List<SyncConflictDto> conflicts
) {
}

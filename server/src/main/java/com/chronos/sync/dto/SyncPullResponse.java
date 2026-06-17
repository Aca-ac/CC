package com.chronos.sync.dto;

import java.util.List;

public record SyncPullResponse(
        List<SyncRecordDto> records,
        String nextCursor
) {
}


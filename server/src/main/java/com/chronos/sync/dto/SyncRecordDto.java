package com.chronos.sync.dto;

import java.util.Map;

public record SyncRecordDto(
        String entityType,
        String entityId,
        String changeType,
        long version,
        Map<String, Object> payload
) {
}

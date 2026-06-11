package com.chronos.sync.dto;

public record SyncRecordDto(
        String entityType,
        String entityId,
        String changeType,
        long version,
        String payload
) {
}


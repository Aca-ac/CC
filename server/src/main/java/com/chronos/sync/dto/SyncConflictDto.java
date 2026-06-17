package com.chronos.sync.dto;

import java.util.Map;

public record SyncConflictDto(
        String id,
        String entityType,
        String entityId,
        Map<String, Object> clientPayload,
        Map<String, Object> serverPayload
) {
}

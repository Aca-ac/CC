package com.chronos.sync.dto;

public record SyncResolveRequest(
        String entityType,
        String entityId,
        Long version,
        String resolvedPayload,
        String resolveType,
        String id,
        String resolution
) {
    public SyncResolveRequest(
            String entityType,
            String entityId,
            long version,
            String resolvedPayload,
            String resolveType
    ) {
        this(entityType, entityId, version, resolvedPayload, resolveType, null, null);
    }
}

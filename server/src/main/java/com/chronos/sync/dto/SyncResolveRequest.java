package com.chronos.sync.dto;

public record SyncResolveRequest(
        String id,
        String resolution
) {
}

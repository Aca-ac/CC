package com.chronos.sync.dto;

public record SyncPushResponse(
        int accepted,
        int conflictTotal
) {
}

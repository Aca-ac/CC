package com.chronos.sync.dto;

public record SyncPushResponse(
        int acceptedTotal,
        int conflictTotal
) {
}


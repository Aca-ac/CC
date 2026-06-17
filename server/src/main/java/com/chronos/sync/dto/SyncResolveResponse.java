package com.chronos.sync.dto;

public record SyncResolveResponse(
        boolean success,
        String message
) {
}
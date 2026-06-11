package com.chronos.auth.dto;

public record AuthSessionResponse(
        String userId,
        String name,
        String email,
        String token
) {
}


package com.chronos.common;

/**
 * 第一版错误码只覆盖前后端联调最常用场景。
 * 业务变复杂后，再按模块拆分更细的错误码。
 */
public enum ErrorCode {
    OK,
    VALIDATION_ERROR,
    UNAUTHORIZED,
    FORBIDDEN,
    NOT_FOUND,
    CONFLICT,
    AI_PROVIDER_UNAVAILABLE,
    SYNC_FAILED,
    INTERNAL_ERROR
}


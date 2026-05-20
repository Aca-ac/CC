package com.chronos.common;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import static com.chronos.enums.ErrorCode.*;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 6. 拦截参数非法异常 (返回 400 状态码 JSON)
    @ExceptionHandler(IllegalArgumentException.class)
    public ApiResponse<Void> handleIllegalArgument(IllegalArgumentException e) {
        return ApiResponse.fail(VALIDATION_ERROR, e.getMessage());//暂时
    }

    // 6. 拦截业务状态机冲突异常 (返回 422 业务状态错误 JSON)
    @ExceptionHandler(IllegalStateException.class)
    public ApiResponse<Void> handleIllegalState(IllegalStateException e) {
        return ApiResponse.fail(CONFLICT, e.getMessage());//暂时
    }
    @ExceptionHandler(NotFoundException.class)
    public ApiResponse<Void> handleNotFound(NotFoundException e) {
        return ApiResponse.fail(NOT_FOUND, e.getMessage());
    }
}

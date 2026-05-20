package com.chronos.common;
import com.chronos.common.ApiResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import static com.chronos.common.ErrorCode.FORBIDDEN;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 6. 拦截参数非法异常 (返回 400 状态码 JSON)
    @ExceptionHandler(IllegalArgumentException.class)
    public ApiResponse<Void> handleIllegalArgument(IllegalArgumentException e) {
        return ApiResponse.fail(FORBIDDEN, e.getMessage());//暂时
    }

    // 6. 拦截业务状态机冲突异常 (返回 422 业务状态错误 JSON)
    @ExceptionHandler(IllegalStateException.class)
    public ApiResponse<Void> handleIllegalState(IllegalStateException e) {
        return ApiResponse.fail(FORBIDDEN, e.getMessage());//暂时
    }
}

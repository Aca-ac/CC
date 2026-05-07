package com.chronos.common;

/**
 * 统一 API 响应体。
 *
 * <p>前端只需要判断 success/code/message/data 四个字段即可处理大部分请求。
 * 后续如果要加入 traceId、分页信息或字段级校验错误，可以在这里统一扩展。</p>
 */
public record ApiResponse<T>(
        boolean success,
        String code,
        String message,
        T data
) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, ErrorCode.OK.name(), "操作成功", data);
    }

    public static <T> ApiResponse<T> fail(ErrorCode code, String message) {
        return new ApiResponse<>(false, code.name(), message, null);
    }
}


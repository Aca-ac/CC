package com.chronos.ai.provider.dto;

/**
 * AI 提供商调用异常，包含提供商名称、HTTP 状态码和错误描述。
 */
public class AiProviderException extends RuntimeException {
    private final String providerName;
    private final int httpStatus;

    public AiProviderException(String providerName, int httpStatus, String message) {
        super("[" + providerName + "] " + message);
        this.providerName = providerName;
        this.httpStatus = httpStatus;
    }

    public AiProviderException(String providerName, String message, Throwable cause) {
        super("[" + providerName + "] " + message, cause);
        this.providerName = providerName;
        this.httpStatus = 0;
    }

    public String getProviderName() {
        return providerName;
    }

    public int getHttpStatus() {
        return httpStatus;
    }
}

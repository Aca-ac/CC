package com.chronos.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateAiSettingsRequest(
        @NotBlank(message = "AI提供商不能为空")
        String provider,

        @NotBlank(message = "API密钥不能为空")
        @Size(min = 8, message = "API密钥至少需要8个字符")
        String apiKey,

        boolean isCustom,

        /** 用户指定的调用模型名；可空，空时使用服务端默认模型。 */
        @Size(max = 128, message = "模型名称过长")
        String model
) {
    /** 向后兼容：不指定模型时默认 null。 */
    public UpdateAiSettingsRequest(String provider, String apiKey, boolean isCustom) {
        this(provider, apiKey, isCustom, null);
    }
}

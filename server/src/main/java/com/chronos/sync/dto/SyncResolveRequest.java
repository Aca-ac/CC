package com.chronos.sync.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SyncResolveRequest(
        @NotBlank(message = "实体类型不能为空")
        String entityType,

        @NotBlank(message = "实体ID不能为空")
        String entityId,

        @NotNull(message = "版本号不能为空")
        long version,

        @NotBlank(message = "解决后的载荷不能为空")
        String resolvedPayload,

        @NotNull(message = "解决方式不能为空")
        String resolveType
) {
}
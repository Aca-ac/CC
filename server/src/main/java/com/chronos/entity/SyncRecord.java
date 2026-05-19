package com.chronos.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName(value = "sync_records", autoResultMap = true)
public class SyncRecord {
    @TableId(type = IdType.ASSIGN_ID)
    private String id;
    private String entityType;
    private String entityId;
    private String changeType;
    private Long version; // BIGINT 对应 Java 的 Long

    @TableField(typeHandler = JacksonTypeHandler.class)
    private String payload; // 变更载荷数据

    private String syncStatus;
    private LocalDateTime lastModifiedAt;
    private LocalDateTime syncedAt;
}

package com.chronos.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("ai_settings")
public class AiSettings {
    @TableId(type = IdType.ASSIGN_ID)
    private String id;
    private String userId;
    private String provider;
    private String encryptedKey;
    private Boolean isCustom;
    private String maskedKey;
    /** 用户指定的调用模型名（可空，空则使用服务端默认模型）。 */
    private String model;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

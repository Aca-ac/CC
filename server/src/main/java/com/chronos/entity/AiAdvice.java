package com.chronos.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName(value = "ai_advices", autoResultMap = true)
public class AiAdvice {
    @TableId(type = IdType.ASSIGN_ID)
    private String id;
    private String userId;
    private String projectId;
    private String type;
    private String title;
    private String content;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private String sourceContext; // 如果存储的是复杂的复杂JSON对象，这里也可以直接用 String 接收

    private Boolean accepted;
    private LocalDateTime generatedAt;
}

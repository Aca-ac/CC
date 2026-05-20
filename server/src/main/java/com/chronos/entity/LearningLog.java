package com.chronos.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName(value = "learning_logs", autoResultMap = true)
public class LearningLog {
    @TableId(type = IdType.ASSIGN_ID)
    private String id;
    private String projectId;
    private String taskId;
    private String content;
    private Integer actualMinutes;
    private Integer difficulty; // TINYINT 对应 Java 的 Integer

    @TableField(typeHandler = JacksonTypeHandler.class)
    private String[] links;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @TableLogic
    private LocalDateTime deletedAt;
}

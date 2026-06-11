package com.chronos.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import com.chronos.enums.Priority;
import com.chronos.enums.TaskStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName(value = "tasks", autoResultMap = true) // 必须加 autoResultMap 才能完美解析 JSON
public class Task {
    @TableId(type = IdType.ASSIGN_ID)
    private String id;
    private String projectId;
    private String parentTaskId;
    private String title;
    private String description;
    private TaskStatus status;
    private Priority priority;
    private LocalDateTime dueTime;
    private Integer estimatedMinutes;
    private Integer actualMinutes;

    @TableField(typeHandler = JacksonTypeHandler.class) // 自动把数据库的 JSON 字符串映射为 Java 字符串数组
    private String[] tags;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @TableLogic
    private LocalDateTime deletedAt;
}

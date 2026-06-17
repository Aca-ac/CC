package com.chronos.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("focus_sessions")
public class FocusSession {
    @TableId(type = IdType.ASSIGN_ID)
    private String id;
    private String taskId;
    private String userId;
    private String projectId;
    private LocalDateTime startedAt;
    private Integer durationMinutes;
    private Boolean completed;
    private Integer interruptionCount;
    private LocalDateTime createdAt;
}

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
    private LocalDateTime startedAt;
    private Integer duration_minutes;
    private Boolean completed;
    private Integer interruptionCount;
    private LocalDateTime createdAt;
}

package com.chronos.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("habit_checkins")
public class HabitCheckin {
    @TableId(type = IdType.ASSIGN_ID)
    private String id;
    private String habitId;
    private LocalDate checkedDate;
    private LocalDateTime checkedAt;
    private String note;
}

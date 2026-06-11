package com.chronos.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;

import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("users")
public class User {
    @TableId(type = IdType.ASSIGN_ID)
    private String id;
    private String name;
    private String email;
    private String passwordHash;
    private String role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @TableLogic
    private LocalDateTime deletedAt;
}

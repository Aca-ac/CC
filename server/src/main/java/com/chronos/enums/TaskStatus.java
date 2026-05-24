package com.chronos.enums;

/**
 * 任务状态枚举 — 对应 tasks.status 字段合法值。
 */
import com.baomidou.mybatisplus.annotation.IEnum;

public enum TaskStatus implements IEnum<String> {
    TODO("TODO", "待办"),
    IN_PROGRESS("IN_PROGRESS", "进行中"),
    DONE("DONE", "已完成"),
    PAUSED("PAUSED","暂停"),
    ARCHIVED("ARCHIVED","归档");

    private final String code;
    private final String description;

    TaskStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }

    @Override
    public String getValue() {
        return this.code; // 告诉 MyBatis-Plus：数据库里存的是这个值
    }

    public String getDescription() { return description; }
}

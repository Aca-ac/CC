package com.chronos.enums;

import com.baomidou.mybatisplus.annotation.IEnum;

import lombok.Getter;

public enum Priority implements IEnum<String> {
    LOW("LOW", "低"),
    MEDIUM("MEDIUM", "中"),
    HIGH("HIGH", "高"),
    URGENT("URGENT", "紧急");

    private final String code;
    @Getter
    private final String description; // 建议加上中文描述，方便业务系统流转

    Priority(String code, String description) {
        this.code = code;
        this.description = description;
    }

    @Override
    public String getValue() {
        return this.code;
    }

}

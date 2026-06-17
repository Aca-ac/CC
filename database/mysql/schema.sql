-- Chronos MySQL 云端数据库建表草案
-- 用途：Spring Boot 服务端持久化、同步协调和多端访问。
-- 说明：课程项目阶段先提供基础表结构，后续再迁入 Flyway 或 Liquibase。

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY COMMENT '用户 ID，建议使用 UUID 或雪花 ID',
    name VARCHAR(80) NOT NULL COMMENT '用户昵称',
    email VARCHAR(160) NOT NULL UNIQUE COMMENT '登录邮箱',
    password_hash VARCHAR(255) NULL COMMENT '加盐哈希后的密码，不保存明文',
    role VARCHAR(32) NOT NULL DEFAULT 'STUDENT' COMMENT '用户角色：STUDENT/ADMIN',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted_at DATETIME NULL COMMENT '软删除时间'
) COMMENT='用户表';

CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(64) PRIMARY KEY COMMENT '学习项目 ID',
    user_id VARCHAR(64) NOT NULL COMMENT '所属用户 ID',
    name VARCHAR(160) NOT NULL COMMENT '项目名称',
    goal TEXT NOT NULL COMMENT '目标描述',
    start_date DATE NOT NULL COMMENT '开始日期',
    end_date DATE NOT NULL COMMENT '截止日期',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' COMMENT '项目状态：ACTIVE/ARCHIVED',
    progress INT NOT NULL DEFAULT 0 COMMENT '项目进度百分比，0-100',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted_at DATETIME NULL COMMENT '软删除时间',
    CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES users(id)
) COMMENT='学习项目表';

CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(64) PRIMARY KEY COMMENT '任务 ID',
    project_id VARCHAR(64) NOT NULL COMMENT '所属项目 ID',
    parent_task_id VARCHAR(64) NULL COMMENT '父任务 ID，用于任务树和原子任务',
    title VARCHAR(220) NOT NULL COMMENT '任务标题',
    description TEXT NULL COMMENT '任务描述',
    status VARCHAR(32) NOT NULL DEFAULT 'TODO' COMMENT '任务状态：TODO/IN_PROGRESS/PAUSED/DONE/ARCHIVED',
    priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM' COMMENT '优先级：LOW/MEDIUM/HIGH/URGENT',
    due_time DATETIME NULL COMMENT '截止时间',
    estimated_minutes INT NOT NULL DEFAULT 30 COMMENT '预计耗时分钟数',
    actual_minutes INT NOT NULL DEFAULT 0 COMMENT '实际投入分钟数',
    tags JSON NULL COMMENT '标签数组',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted_at DATETIME NULL COMMENT '软删除时间',
    CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT fk_tasks_parent FOREIGN KEY (parent_task_id) REFERENCES tasks(id)
) COMMENT='任务表';

CREATE TABLE IF NOT EXISTS learning_logs (
    id VARCHAR(64) PRIMARY KEY COMMENT '学习日志 ID',
    project_id VARCHAR(64) NOT NULL COMMENT '所属项目 ID',
    task_id VARCHAR(64) NULL COMMENT '关联任务 ID',
    content TEXT NOT NULL COMMENT '学习日志正文',
    actual_minutes INT NOT NULL DEFAULT 0 COMMENT '本次实际投入分钟数',
    difficulty TINYINT NULL COMMENT '难度评分，1-5',
    links JSON NULL COMMENT '资料链接数组',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted_at DATETIME NULL COMMENT '软删除时间',
    CONSTRAINT fk_logs_project FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT fk_logs_task FOREIGN KEY (task_id) REFERENCES tasks(id)
) COMMENT='学习日志表';

CREATE TABLE IF NOT EXISTS habits (
    id VARCHAR(64) PRIMARY KEY COMMENT '习惯 ID',
    user_id VARCHAR(64) NOT NULL COMMENT '所属用户 ID',
    name VARCHAR(120) NOT NULL COMMENT '习惯名称',
    rule_text VARCHAR(255) NOT NULL COMMENT '周期规则描述，后续可替换为 RRULE',
    streak_count INT NOT NULL DEFAULT 0 COMMENT '连续打卡天数',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' COMMENT '习惯状态：ACTIVE/PAUSED/ARCHIVED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted_at DATETIME NULL COMMENT '软删除时间',
    CONSTRAINT fk_habits_user FOREIGN KEY (user_id) REFERENCES users(id)
) COMMENT='习惯表';

CREATE TABLE IF NOT EXISTS habit_checkins (
    id VARCHAR(64) PRIMARY KEY COMMENT '打卡记录 ID',
    habit_id VARCHAR(64) NOT NULL COMMENT '习惯 ID',
    checked_date DATE NOT NULL COMMENT '打卡日期',
    checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '实际打卡时间',
    note VARCHAR(255) NULL COMMENT '打卡备注',
    UNIQUE KEY uk_habit_checkins_day (habit_id, checked_date),
    CONSTRAINT fk_checkins_habit FOREIGN KEY (habit_id) REFERENCES habits(id)
) COMMENT='习惯打卡记录表';

CREATE TABLE IF NOT EXISTS focus_sessions (
    id VARCHAR(64) PRIMARY KEY COMMENT '专注记录 ID',
    task_id VARCHAR(64) NULL COMMENT '关联任务 ID',
    started_at DATETIME NOT NULL COMMENT '开始时间',
    duration_minutes INT NOT NULL COMMENT '专注时长分钟数',
    completed BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否完成完整番茄时段',
    interruption_count INT NOT NULL DEFAULT 0 COMMENT '中断次数',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    CONSTRAINT fk_focus_task FOREIGN KEY (task_id) REFERENCES tasks(id)
) COMMENT='番茄钟与专注记录表';

CREATE TABLE IF NOT EXISTS ai_advices (
    id VARCHAR(64) PRIMARY KEY COMMENT 'AI 建议 ID',
    user_id VARCHAR(64) NOT NULL COMMENT '所属用户 ID',
    project_id VARCHAR(64) NULL COMMENT '关联项目 ID',
    type VARCHAR(32) NOT NULL COMMENT '建议类型：BREAKDOWN/REVIEW/RISK',
    title VARCHAR(160) NOT NULL COMMENT '建议标题',
    content TEXT NOT NULL COMMENT '建议正文或草稿内容',
    source_context JSON NULL COMMENT '脱敏后的上下文摘要',
    accepted BOOLEAN NOT NULL DEFAULT FALSE COMMENT '用户是否接受',
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '生成时间',
    CONSTRAINT fk_ai_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_ai_project FOREIGN KEY (project_id) REFERENCES projects(id)
) COMMENT='AI 建议与草稿表';

CREATE TABLE IF NOT EXISTS sync_records (
    id VARCHAR(64) PRIMARY KEY COMMENT '同步记录 ID',
    user_id VARCHAR(64) NOT NULL DEFAULT 'legacy' COMMENT '所属用户 ID',
    entity_type VARCHAR(40) NOT NULL COMMENT '实体类型，如 PROJECT/TASK/LOG',
    entity_id VARCHAR(64) NOT NULL COMMENT '实体 ID',
    change_type VARCHAR(20) NOT NULL COMMENT '变更类型：CREATE/UPDATE/DELETE',
    version BIGINT NOT NULL DEFAULT 1 COMMENT '实体版本号',
    payload JSON NOT NULL COMMENT '变更载荷',
    sync_status VARCHAR(32) NOT NULL DEFAULT 'PENDING' COMMENT '同步状态：PENDING/SYNCED/CONFLICT/FAILED',
    last_modified_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '本地最后修改时间',
    synced_at DATETIME NULL COMMENT '同步成功时间'
) COMMENT='同步队列表';

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_due_time ON tasks(due_time);
CREATE INDEX idx_learning_logs_task_id ON learning_logs(task_id);
CREATE INDEX idx_sync_records_status ON sync_records(sync_status, last_modified_at);
CREATE INDEX idx_sync_records_user_cursor ON sync_records(user_id, version, id);

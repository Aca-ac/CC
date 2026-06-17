-- H2 test schema (MySQL compatibility mode)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(32) DEFAULT 'STUDENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    name VARCHAR(160) NOT NULL,
    goal TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(32) DEFAULT 'ACTIVE',
    progress INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL,
    parent_task_id VARCHAR(64) NULL,
    title VARCHAR(220) NOT NULL,
    description TEXT NULL,
    status VARCHAR(32) DEFAULT 'TODO',
    priority VARCHAR(32) DEFAULT 'MEDIUM',
    due_time TIMESTAMP NULL,
    estimated_minutes INT DEFAULT 30,
    actual_minutes INT DEFAULT 0,
    tags TEXT DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS learning_logs (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL,
    task_id VARCHAR(64) NULL,
    content TEXT,
    actual_minutes INT DEFAULT 0,
    difficulty INT NULL,
    links TEXT DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS habits (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    name VARCHAR(120) NOT NULL,
    rule_text VARCHAR(255),
    streak_count INT DEFAULT 0,
    status VARCHAR(32) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS habit_checkins (
    id VARCHAR(64) PRIMARY KEY,
    habit_id VARCHAR(64) NOT NULL,
    checked_date DATE NOT NULL,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    note VARCHAR(255) NULL,
    FOREIGN KEY (habit_id) REFERENCES habits(id),
    UNIQUE (habit_id, checked_date)
);

CREATE TABLE IF NOT EXISTS focus_sessions (
    id VARCHAR(64) PRIMARY KEY,
    task_id VARCHAR(64) NULL,
    user_id VARCHAR(64) NULL,
    project_id VARCHAR(64) NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_minutes INT,
    completed BOOLEAN DEFAULT FALSE,
    interruption_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_advices (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    project_id VARCHAR(64) NULL,
    type VARCHAR(32) NOT NULL,
    title VARCHAR(160),
    content TEXT,
    source_context TEXT,
    accepted BOOLEAN DEFAULT FALSE,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sync_records (
    id VARCHAR(64) PRIMARY KEY,
    entity_type VARCHAR(40) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    change_type VARCHAR(20) NOT NULL,
    version BIGINT DEFAULT 1,
    payload TEXT NOT NULL DEFAULT '{}',
    sync_status VARCHAR(32) DEFAULT 'PENDING',
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS ai_settings (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    provider VARCHAR(32) NOT NULL,
    encrypted_key TEXT NOT NULL,
    is_custom BOOLEAN DEFAULT FALSE,
    masked_key VARCHAR(80),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

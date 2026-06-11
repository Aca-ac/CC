# Chronos 数据库设计草案

## 核心对象

- `users`：用户身份和认证数据。
- `projects`：学习项目，承载目标、周期和进度。
- `tasks`：任务、子任务和原子任务，使用 `parent_task_id` 表达任务树。
- `learning_logs`：学习日志、资料链接和实际投入。
- `habits`、`habit_checkins`：习惯定义和每日打卡记录。
- `focus_sessions`：番茄钟与专注记录。
- `ai_advices`：AI 生成的草稿、复盘和建议。
- `sync_records`：本地到云端的变更队列和同步状态。

## 字段设计原则

- 所有核心表保留 `created_at`、`updated_at` 和 `deleted_at`，方便后续做软删除和增量同步。
- 任务状态统一使用枚举文本：`TODO`、`IN_PROGRESS`、`PAUSED`、`DONE`、`ARCHIVED`。
- 优先级统一使用 `LOW`、`MEDIUM`、`HIGH`、`URGENT`。
- AI 结果先存为草稿或建议，用户确认后再转换为项目或任务。
- SQLite 和 MySQL 字段尽量保持同名，降低前后端同步时的映射成本。

## 后续迁移建议

当前脚本是首版建表草案，不包含 Flyway 或 Liquibase。等后端实体稳定后，再选择一种迁移工具，并将 `database/` 下的脚本迁入规范化版本目录。


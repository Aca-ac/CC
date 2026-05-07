# Chronos API 草案

> 本文档只固定第一版接口边界，便于前后端并行开发。字段和错误码可在系统设计阶段继续细化。

## 通用响应

```json
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": {}
}
```

- `success`：请求是否按业务规则处理成功。
- `code`：机器可读的错误码，例如 `OK`、`VALIDATION_ERROR`、`UNAUTHORIZED`。
- `message`：面向用户或调试人员的简短说明。
- `data`：具体业务数据。

## 健康检查

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 检查后端服务是否启动。 |

## 认证

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/auth/register` | 用户注册，后续需要补邮箱格式、密码强度和重复校验。 |
| POST | `/api/auth/login` | 用户登录，返回 Token 和用户摘要。 |
| POST | `/api/auth/logout` | 退出登录，前端清理本地会话。 |

## 项目与任务

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/projects` | 查询学习项目列表。 |
| POST | `/api/projects` | 创建学习项目。 |
| GET | `/api/projects/{projectId}` | 查看项目详情。 |
| GET | `/api/tasks` | 按项目、状态、日期或关键字查询任务。 |
| POST | `/api/tasks` | 创建任务或子任务。 |
| PATCH | `/api/tasks/{taskId}/status` | 切换任务状态。 |

## 今日看板与统计

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/dashboard/today` | 今日任务、完成数、专注时长、习惯和 AI 提示摘要。 |
| GET | `/api/stats/weekly` | 周统计，后续用于图表和周报导出。 |

## AI 草稿

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/ai/breakdown-preview` | 根据目标生成学习路径草稿，不直接创建正式任务。 |
| POST | `/api/ai/review-preview` | 根据任务、日志和专注记录生成复盘草稿。 |
| POST | `/api/ai/feedback` | 用户反馈 AI 结果质量。 |

## 同步

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/sync/push` | 客户端推送本地变更队列。 |
| GET | `/api/sync/pull` | 客户端拉取云端增量变更。 |
| POST | `/api/sync/resolve` | 提交冲突解决结果。 |


# Chronos API 规范（M1 核心基线）

> **版本**: v1.0
> **发布日期**: 2026-06-04
> **适用里程碑**: M1 P0 核心闭环
> **适用范围**: 前后端 M1 阶段所有涉及项目、任务和同步功能的开发与联调。

本文档是 M1 阶段前后端开发的唯一事实标准。任何字段、接口、错误码的定义均以此为准。

---

## 0. 目标与原则

1. **契约先行**：本文档是 M1 阶段前后端开发的唯一事实标准。
2. **本地优先**：所有创建、更新、删除操作首先成功写入本地 SQLite，再通过同步队列上报云端。
3. **显式优于隐式**：客户端与服务端交互时，必须携带明确的标识（如 `uid`, `mutationId`）。
4. **简单冲突处理**：M1 阶段，冲突解决仅支持两种策略：**保留本地版本 (keep-local)** 或 **保留云端版本 (keep-cloud)**。

---

## 1. 通用规范

### 1.1 认证 (Authentication)

所有需要授权的 API 请求，必须在 HTTP 头中携带有效的 JWT Token。

```http
Authorization: Bearer <your_jwt_token>
```

| 场景 | HTTP 状态码 | 说明 |
| --- | --- | --- |
| 未携带 Token | 401 | 未认证 |
| Token 过期/无效 | 401 | 认证信息失效 |
| Token 有效但无权限 | 403 | Forbidden |

### 1.2 统一响应结构 (API Response Envelope)

```json
// 成功响应 (HTTP Status 2xx)
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": { ... },
  "timestamp": 1678886400000
}

// 业务/客户端异常响应 (HTTP Status 4xx)
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "任务标题不能为空",
  "data": null,
  "timestamp": 1678886400000
}

// 服务端异常响应 (HTTP Status 5xx)
{
  "success": false,
  "code": "INTERNAL_ERROR",
  "message": "服务器内部错误，请稍后重试",
  "data": null,
  "timestamp": 1678886400000
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `success` | boolean | 请求是否按业务规则处理成功 |
| `code` | string | 机器可读的错误码 |
| `message` | string | 对人类友好的提示信息 |
| `data` | any | 具体的业务数据，可以是对象、数组或 null |
| `timestamp` | number | Unix 时间戳（毫秒） |

### 1.3 错误码约定

| HTTP 状态码 | code | 说明 | 场景举例 |
| :---------- | :--- | :--- | :------- |
| **200** | `OK` | 请求成功 | 获取数据成功、创建成功 |
| **400** | `VALIDATION_ERROR` | 客户端请求错误（参数缺失、格式错误） | `title` 字段为空、日期格式不正确 |
| **401** | `UNAUTHORIZED` | 未认证或认证信息失效 | 未提供 Token、Token 过期 |
| **403** | `FORBIDDEN` | 已认证，但无权限访问目标资源 | 尝试修改或删除非本人创建的项目/任务 |
| **404** | `NOT_FOUND` | 请求的资源不存在 | 查询一个已被删除的任务 ID |
| **409** | `CONFLICT` | 数据冲突 | 版本冲突、同步冲突、状态转换非法 |
| **500** | `INTERNAL_ERROR` | 服务器内部错误 | 数据库连接失败、未知异常 |
| **503** | `AI_PROVIDER_UNAVAILABLE` | AI 服务不可用 | LLM API 调用失败 |

> **说明**：`CONFLICT` 统一处理所有数据冲突场景，包括版本冲突、同步冲突、状态转换非法等。

### 1.4 ID 与版本规范

#### ID 策略

| 类型 | 格式 | 生成位置 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | String | 服务端 | **服务端内部唯一标识**。创建时由服务端生成，可能随迁移变化。 |
| `uid` | UUID v4 | 客户端 | **客户端稳定标识**。创建时由客户端生成并持久化，用于离线时关联数据及确保幂等，永不改变。 |

#### 乐观锁字段

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `version` | long | **乐观锁版本号**。每次更新时，服务端自动递增此字段。客户端更新时必须带上此版本号。 |
| `createdAt` | ISO 8601 | 创建时间（UTC） |
| `updatedAt` | ISO 8601 | 最后更新时间（UTC） |

---

## 2. 核心实体契约 (DTO)

### 2.1 学习项目 (Project)

| 字段名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | string | 是 | **服务端内部唯一标识**。创建时由服务端生成。 |
| `uid` | string (UUID) | 是 | **客户端稳定标识**。由客户端在创建时生成，用于离线时关联数据及确保幂等。 |
| `name` | string | 是 | 项目名称，长度 1-100 字符。 |
| `goal` | string | 否 | 目标描述，最大 5000 字符。 |
| `startDate` | string (YYYY-MM-DD) | 否 | 开始日期。 |
| `endDate` | string (YYYY-MM-DD) | 否 | 结束日期。 |
| `status` | string | 是 | 项目状态枚举：`ACTIVE` (进行中), `ARCHIVED` (已归档), `DELETED` (已删除)。 |
| `progress` | int | 否 | 项目进度百分比，0-100。 |
| `version` | long | 是 | **乐观锁版本号**。每次更新时，服务端自动递增此字段。 |
| `createdAt` | string (ISO 8601) | 是 | 创建时间。 |
| `updatedAt` | string (ISO 8601) | 是 | 最后更新时间。 |

### 2.2 任务 (Task)

| 字段名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | string | 是 | 服务端唯一标识。创建时由服务端生成。 |
| `uid` | string (UUID) | 是 | 客户端稳定标识。由客户端在创建时生成。 |
| `projectUid` | string (UUID) | 否 | 所属项目的客户端 uid。若为 `null`，则为"收件箱"任务。 |
| `title` | string | 是 | 任务标题，长度 1-200 字符。 |
| `description` | string | 否 | 任务描述，最大 5000 字符。 |
| `status` | string | 是 | 任务状态枚举：`TODO` (未开始), `IN_PROGRESS` (进行中), `DONE` (已完成), `PAUSED` (暂停), `ARCHIVED` (已归档)。 |
| `priority` | string | 是 | 优先级枚举：`P0` (最高), `P1` (高), `P2` (中), `P3` (低)。默认 `P2`。 |
| `dueTime` | string (ISO 8601) | 否 | 截止时间。 |
| `estimatedMinutes` | int | 否 | 预估耗时（分钟）。 |
| `actualMinutes` | int | 否 | 实际耗时（分钟）。 |
| `parentTaskUid` | string (UUID) | 否 | 父任务的客户端 uid，用于构建任务树。根任务此字段为 `null`。 |
| `tags` | string[] | 否 | 任务标签数组。 |
| `version` | long | 是 | **乐观锁版本号**。每次更新时自动递增。 |
| `createdAt` | string (ISO 8601) | 是 | 创建时间。 |
| `updatedAt` | string (ISO 8601) | 是 | 更新时间。 |

### 2.3 学习日志 (LearningLog)

| 字段名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | string | 是 | 服务端唯一标识。 |
| `uid` | string (UUID) | 是 | 客户端稳定标识。 |
| `projectUid` | string (UUID) | 否 | 关联项目 uid。 |
| `taskUid` | string (UUID) | 是 | 关联任务 uid。 |
| `content` | string | 否 | 日志正文，支持 Markdown 基础语法。 |
| `actualMinutes` | int | 是 | 实际花费时间（分钟），不能为负数。 |
| `difficulty` | int | 否 | 难度评分，1-5。 |
| `links` | string[] | 否 | 资料链接数组。 |
| `highlightForReview` | boolean | 否 | 是否标记为复盘重点。 |
| `version` | long | 是 | 乐观锁版本号。 |
| `createdAt` | string (ISO 8601) | 是 | 创建时间。 |
| `updatedAt` | string (ISO 8601) | 是 | 更新时间。 |

### 2.4 习惯 (Habit)

| 字段名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | string | 是 | 服务端唯一标识。 |
| `uid` | string (UUID) | 是 | 客户端稳定标识。 |
| `name` | string | 是 | 习惯名称，长度 1-100 字符。 |
| `ruleText` | string | 否 | 周期规则描述。 |
| `streakCount` | int | 否 | 连续打卡天数。 |
| `status` | string | 是 | 状态枚举：`ACTIVE` (进行中), `PAUSED` (已暂停)。 |
| `checkedToday` | boolean | 否 | 今日是否已打卡（计算字段）。 |
| `version` | long | 是 | 乐观锁版本号。 |
| `createdAt` | string (ISO 8601) | 是 | 创建时间。 |
| `updatedAt` | string (ISO 8601) | 是 | 更新时间。 |

### 2.5 专注会话 (FocusSession)

| 字段名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | string | 是 | 服务端唯一标识。 |
| `uid` | string (UUID) | 是 | 客户端稳定标识。 |
| `taskUid` | string (UUID) | 否 | 关联任务 uid。 |
| `startedAt` | string (ISO 8601) | 是 | 开始时间。 |
| `durationMinutes` | int | 是 | 专注时长（分钟），必须为正数。默认 25 分钟（番茄钟）。 |
| `completed` | boolean | 否 | 是否已完成。 |
| `interruptionCount` | int | 否 | 中断次数。 |
| `createdAt` | string (ISO 8601) | 是 | 创建时间。 |

---

## 3. 接口定义

### 3.1 健康检查

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| GET | `/api/health` | 检查后端服务是否启动。 |

**成功响应**：
```json
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": { "status": "UP" },
  "timestamp": 1678886400000
}
```

**curl 示例**：
```bash
curl -X GET http://localhost:8080/api/health
```

---

### 3.2 认证 (Authentication)

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录，返回 Token |
| POST | `/api/auth/logout` | 退出登录 |

#### 用户注册

**请求体**：
```json
{
  "name": "张三",
  "email": "zhangsan@example.com",
  "password": "password123"
}
```

**成功响应** (200):
```json
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": {
    "userId": "uuid-xxx",
    "name": "张三",
    "email": "zhangsan@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": 1678886400000
}
```

**失败响应** (400):
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "该邮箱已被注册",
  "data": null,
  "timestamp": 1678886400000
}
```

**curl 示例**：
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"张三","email":"zhangsan@example.com","password":"password123"}'
```

#### 用户登录

**请求体**：
```json
{
  "email": "zhangsan@example.com",
  "password": "password123"
}
```

**成功响应** (200): 同注册成功响应结构

**失败响应** (401):
```json
{
  "success": false,
  "code": "UNAUTHORIZED",
  "message": "用户不存在或密码错误",
  "data": null,
  "timestamp": 1678886400000
}
```

**curl 示例**：
```bash
# 登录获取 token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"zhangsan@example.com","password":"password123"}'

# 登录后从响应中提取 token（需要 jq 工具）
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"zhangsan@example.com","password":"password123"}' | jq -r '.data.token')

# 使用 token 访问其他接口
curl -X GET http://localhost:8080/api/projects \
  -H "Authorization: Bearer $TOKEN"
```

#### 退出登录

**请求**：
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

**成功响应** (200):
```json
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": null,
  "timestamp": 1678886400000
}
```

**curl 示例**：
```bash
curl -X POST http://localhost:8080/api/auth/logout \
  -H "Authorization: Bearer {token}"
```

---

### 3.3 项目 (Project)

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| GET | `/api/projects` | 查询项目列表 |
| POST | `/api/projects` | 创建项目 |
| GET | `/api/projects/{projectUid}` | 查看项目详情 |
| PUT | `/api/projects/{projectUid}` | 更新项目 |
| DELETE | `/api/projects/{projectUid}` | 删除项目 |

#### 创建项目

**请求体**：
```json
{
  "uid": "uuid-project-xxx",
  "name": "软件工程课程项目",
  "goal": "在 6 月前完成 Chronos 开发",
  "startDate": "2026-04-08",
  "endDate": "2026-06-04"
}
```

**成功响应** (200):
```json
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": {
    "id": "project-se",
    "uid": "uuid-project-xxx",
    "name": "软件工程课程项目",
    "goal": "在 6 月前完成 Chronos 开发",
    "startDate": "2026-04-08",
    "endDate": "2026-06-04",
    "status": "ACTIVE",
    "progress": 0,
    "version": 1,
    "createdAt": "2026-04-08T10:00:00Z",
    "updatedAt": "2026-04-08T10:00:00Z"
  },
  "timestamp": 1678886400000
}
```

**失败响应** (400):
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "项目开始时间不能晚于结束时间",
  "data": null,
  "timestamp": 1678886400000
}
```

**curl 示例**：
```bash
curl -X POST http://localhost:8080/api/projects \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"uid":"uuid-project-xxx","name":"软件工程课程项目","goal":"完成课程项目","startDate":"2026-04-08","endDate":"2026-06-04"}'
```

#### 查询项目列表

**成功响应** (200):
```json
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": [
    {
      "id": "project-se",
      "uid": "uuid-project-xxx",
      "name": "软件工程课程项目",
      "goal": "在 6 月前完成 Chronos 开发",
      "startDate": "2026-04-08",
      "endDate": "2026-06-04",
      "status": "ACTIVE",
      "progress": 42,
      "version": 3,
      "createdAt": "2026-04-08T10:00:00Z",
      "updatedAt": "2026-05-09T08:00:00Z"
    }
  ],
  "timestamp": 1678886400000
}
```

**curl 示例**：
```bash
curl -X GET http://localhost:8080/api/projects \
  -H "Authorization: Bearer {token}"
```

#### 查询项目详情

**失败响应** (404):
```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "项目不存在",
  "data": null,
  "timestamp": 1678886400000
}
```

**失败响应** (403):
```json
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "无权限访问该项目",
  "data": null,
  "timestamp": 1678886400000
}
```

**curl 示例**：
```bash
curl -X GET http://localhost:8080/api/projects/uuid-project-xxx \
  -H "Authorization: Bearer {token}"
```

#### 删除项目（软删除）

**Query 参数**：

| 参数 | 类型 | 必填 | 说明 |
| :--- | :--- | :---: | :--- |
| `version` | number | 是 | 当前版本号，用于乐观锁校验 |

**成功响应** (200):
```json
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": null,
  "timestamp": 1678886400000
}
```

**失败响应** (409 - 版本冲突):
```json
{
  "success": false,
  "code": "CONFLICT",
  "message": "版本冲突，请刷新后重试",
  "data": null,
  "timestamp": 1678886400000
}
```

**curl 示例**：
```bash
curl -X DELETE "http://localhost:8080/api/projects/uuid-project-xxx?version=1" \
  -H "Authorization: Bearer {token}"
```

---

### 3.4 任务 (Task)

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| GET | `/api/tasks` | 查询任务列表 |
| POST | `/api/tasks` | 创建任务 |
| GET | `/api/tasks/{taskUid}` | 查看任务详情 |
| PATCH | `/api/tasks/{taskUid}/status` | 更新任务状态 |
| DELETE | `/api/tasks/{taskUid}` | 删除任务 |

#### 查询任务列表

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `projectUid` | string (UUID) | 否 | 项目 uid 过滤 |
| `status` | string | 否 | 任务状态：`TODO`/`IN_PROGRESS`/`PAUSED`/`DONE`/`ARCHIVED` |
| `dueTime` | datetime | 否 | 截止时间过滤 |
| `keyword` | string | 否 | 标题/描述关键词搜索 |
| `page` | int | 否 | 页码，默认 1 |
| `size` | int | 否 | 每页数量，默认 20 |

**成功响应** (200):
```json
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": [
    {
      "id": "task-api",
      "uid": "uuid-task-xxx",
      "projectUid": "uuid-project-xxx",
      "title": "整理 REST API 草案",
      "description": "覆盖认证、项目、任务、同步接口",
      "status": "IN_PROGRESS",
      "priority": "P1",
      "estimatedMinutes": 90,
      "actualMinutes": 45,
      "dueTime": "2026-05-09T10:00:00Z",
      "parentTaskUid": null,
      "tags": ["后端", "接口"],
      "version": 2,
      "createdAt": "2026-05-08T10:00:00Z",
      "updatedAt": "2026-05-08T14:30:00Z"
    }
  ],
  "timestamp": 1678886400000
}
```

**curl 示例**：
```bash
# 基础查询
curl -X GET "http://localhost:8080/api/tasks?projectUid=uuid-project-xxx&status=IN_PROGRESS" \
  -H "Authorization: Bearer {token}"

# 多条件组合查询
curl -X GET "http://localhost:8080/api/tasks?projectUid=uuid-project-xxx&status=IN_PROGRESS&priority=P0&keyword=API&page=1&size=20" \
  -H "Authorization: Bearer {token}"
```

#### 创建任务

**请求体**：
```json
{
  "uid": "uuid-task-new",
    "projectUid": "uuid-project-xxx",
    "title": "整理 REST API 草案",
    "description": "覆盖认证、项目、任务、同步接口",
    "parentTaskUid": null,
    "priority": "P1",
  "estimatedMinutes": 90,
  "dueTime": "2026-05-09T18:00:00+08:00",
  "tags": ["后端", "接口"]
}
```

**成功响应** (200):
```json
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": {
    "id": "task-api",
    "uid": "uuid-task-new",
    "projectUid": "uuid-project-xxx",
    "title": "整理 REST API 草案",
    "description": "覆盖认证、项目、任务、同步接口",
    "status": "TODO",
    "priority": "P1",
    "estimatedMinutes": 90,
    "actualMinutes": 0,
    "dueTime": "2026-05-09T10:00:00Z",
    "parentTaskUid": null,
    "tags": ["后端", "接口"],
    "version": 1,
    "createdAt": "2026-05-08T10:00:00Z",
    "updatedAt": "2026-05-08T10:00:00Z"
  },
  "timestamp": 1678886400000
}
```

**curl 示例**：
```bash
curl -X POST http://localhost:8080/api/tasks \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"uid":"uuid-task-new","projectUid":"uuid-project-xxx","title":"整理 API 草案","priority":"P1","estimatedMinutes":90,"tags":["后端"]}'
```

#### 更新任务状态

**状态转换规则**：

| 当前状态 | 允许转换到 |
| :--- | :--- |
| `TODO` | `IN_PROGRESS`, `ARCHIVED` |
| `IN_PROGRESS` | `DONE`, `PAUSED`, `TODO` |
| `PAUSED` | `IN_PROGRESS`, `TODO`, `ARCHIVED` |
| `DONE` | `ARCHIVED` |
| `ARCHIVED` | `TODO`（恢复） |

> **说明**：`ARCHIVED` 状态可恢复为 `TODO`，允许用户重新激活已归档的任务。

**请求体**：
```json
{
  "status": "DONE",
  "version": 2
}
```

**成功响应** (200):
```json
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": {
    "id": "task-api",
    "uid": "uuid-task-xxx",
    "status": "DONE",
    "version": 3,
    "updatedAt": "2026-05-08T15:00:00Z"
  },
  "timestamp": 1678886400000
}
```

**失败响应** (409 - 版本冲突):
```json
{
  "success": false,
  "code": "CONFLICT",
  "message": "版本冲突，请刷新后重试",
  "data": null,
  "timestamp": 1678886400000
}
```

**curl 示例**：
```bash
curl -X PATCH http://localhost:8080/api/tasks/uuid-task-xxx/status \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"status":"DONE","version":2}'
```

#### 删除任务（软删除）

**Query 参数**：

| 参数 | 类型 | 必填 | 说明 |
| :--- | :--- | :---: | :--- |
| `version` | number | 是 | 当前版本号，用于乐观锁校验 |

**成功响应** (200):
```json
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": null,
  "timestamp": 1678886400000
}
```

**失败响应** (409 - 版本冲突):
```json
{
  "success": false,
  "code": "CONFLICT",
  "message": "版本冲突，请刷新后重试",
  "data": null,
  "timestamp": 1678886400000
}
```

**curl 示例**：
```bash
curl -X DELETE "http://localhost:8080/api/tasks/uuid-task-xxx?version=2" \
  -H "Authorization: Bearer {token}"
```

---

### 3.5 学习日志 (LearningLog)

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| GET | `/api/logs` | 查询日志列表 |
| POST | `/api/logs` | 创建日志 |
| GET | `/api/logs/{logId}` | 查看日志详情 |
| DELETE | `/api/logs/{logId}` | 删除日志 |

**请求体字段**：`taskUid`(可选)、`projectUid`(可选)、`content`(必填)、`actualMinutes`(必填)、`difficulty`(1-5)、`links`(数组)、`highlightForReview`(布尔)

**响应结构**：统一响应格式，`data` 包含日志实体（参考 2.3 节）

---

### 3.6 习惯打卡 (Habit)

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| GET | `/api/habits` | 查询习惯列表 |
| POST | `/api/habits` | 创建习惯 |
| GET | `/api/habits/{habitId}` | 查看习惯详情 |
| POST | `/api/habits/{habitId}/checkin` | 今日打卡 |
| POST | `/api/habits/{habitId}/backfill` | 补签 |
| POST | `/api/habits/{habitId}/pause` | 暂停习惯 |
| DELETE | `/api/habits/{habitId}` | 删除习惯 |

**创建请求体**：`uid`(必填)、`name`(必填)、`ruleText`(可选)

**打卡响应**：`data` 包含 `habitId`、`streakCount`、`checkedToday`、`checkedAt`、`isBackfill`

---

### 3.7 专注记录 (FocusSession)

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| GET | `/api/focus/sessions` | 查询专注记录 |
| POST | `/api/focus/sessions` | 创建专注会话 |
| PUT | `/api/focus/sessions/{sessionId}/complete` | 完成专注 |
| PATCH | `/api/focus/sessions/{sessionId}/pause` | 暂停专注 |
| DELETE | `/api/focus/sessions/{sessionId}` | 删除记录 |

**创建请求体**：`taskUid`(可选)、`durationMinutes`(必填)、`startTime`(ISO8601)

---

### 3.8 今日看板 (Dashboard)

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| GET | `/api/dashboard/today` | 今日任务、完成数、专注时长、习惯和 AI 提示摘要 |

**响应字段**：`todayTaskTotal`、`completedTaskTotal`、`focusMinutes`、`habitStreak`、`syncPendingTotal`

---

### 3.9 AI 草稿 (AI)

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| POST | `/api/ai/breakdown-preview` | 根据目标生成学习路径草稿 |
| POST | `/api/ai/review-preview` | 根据任务、日志和专注记录生成复盘草稿 |
| POST | `/api/ai/feedback` | 用户反馈 AI 结果质量 |

**拆解请求体**：`goal`(目标文本)、`weeks`(计划周数)

**反馈请求体**：`draftId`、`rating`(1-5)、`feedback`(可选)

**拆解响应**：`draftId`、`goal`、`stages`(数组)、`firstAction`、`generatedAt`

**复盘响应**：`draftId`、`summary`、`insights`(数组)、`suggestions`(数组)

> **注意**：AI 接口可能返回 503 (`AI_PROVIDER_UNAVAILABLE`)，需前端降级处理

---

### 3.10 同步 (Sync)

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| POST | `/api/sync/push` | 客户端推送本地变更队列（含幂等ID） |
| GET | `/api/sync/pull` | 客户端拉取云端增量变更（游标分页） |
| POST | `/api/sync/resolve` | 提交冲突解决结果 |

#### 同步语义

| 概念 | 说明 |
| :--- | :--- |
| `mutationId` | **幂等ID**，客户端生成的 UUID，服务端记录已处理的 mutationId 防止重复执行 |
| `entityType` | 实体类型：`PROJECT` / `TASK` / `LOG` / `HABIT` / `FOCUS` |
| `entityUid` | 实体的客户端 uid |
| `changeType` | 变更类型：`CREATE` / `UPDATE` / `DELETE` |
| `version` | 本地实体版本号 |
| `cursor` | 同步游标，标记上次同步位置（使用 `updatedAt` 时间戳毫秒的字符串形式），首次同步传 `"0"` |

#### 删除操作语义

| 要点 | 说明 |
| :--- | :--- |
| **version 必填** | 删除操作必须携带 `version`，用于冲突检测 |
| **软删除** | 服务端采用软删除策略，标记 `status = DELETED` |
| **Pull 响应** | 已删除实体出现在 `deleted` 字段中，不再出现在 `entities` 列表 |
| **冲突处理** | 删除时若版本冲突，客户端可选择重新拉取或强制删除 |

#### 冲突解决策略（M1 仅支持两种）

| 策略 | 说明 |
| :--- | :--- |
| `keep-local` | 保留本地版本，覆盖云端 |
| `keep-cloud` | 采用云端版本，丢弃本地变更 |

> **注意**：M1 阶段不支持字段级自动合并，必须由用户明确选择。

#### 首次同步与全量拉取

| 场景 | 说明 |
| :--- | :--- |
| **首次同步** | `cursor` 不传或传 `"0"`，服务端返回所有非删除状态的实体 |
| **全量拉取** | 客户端可随时传入 `cursor="0"` 触发全量拉取，用于数据恢复场景 |
| **增量拉取** | 传入上次同步的 `nextCursor`，仅返回 `updatedAt > cursor` 的变更 |

> **cursor 保存规则**：每次同步完成后，客户端必须保存响应中的 `nextCursor`，作为下次同步的 `cursor` 参数。持续拉取直到 `hasMore=false`。

#### 推送本地变更（Push）

**请求体**：
```json
{
  "mutations": [
    {
      "mutationId": "550e8400-e29b-41d4-a716-446655440099",
      "entityType": "TASK",
      "entityUid": "550e8400-e29b-41d4-a716-446655440002",
      "changeType": "UPDATE",
      "data": {
        "status": "DONE",
        "version": 1
      },
      "timestamp": 1678886400000
    }
  ]
}
```

**幂等性要求**：
- 服务端必须基于 `mutationId` 记录已处理的变更
- 相同 `mutationId` 的重复请求，直接返回上一次的成功结果
- 客户端必须持久化 mutation 到本地队列，网络恢复后重试

**成功响应** (200):
```json
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": {
    "results": [
      {
        "mutationId": "550e8400-e29b-41d4-a716-446655440099",
        "success": true,
        "serverEntity": {
          "id": 200,
          "uid": "550e8400-e29b-41d4-a716-446655440002",
          "status": "DONE",
          "version": 2
        }
      }
    ]
  },
  "timestamp": 1678886400000
}
```

**冲突响应** (409):
```json
{
  "success": false,
  "code": "CONFLICT",
  "message": "版本冲突，请解决冲突后重新同步",
  "data": {
    "results": [
      {
        "mutationId": "550e8400-e29b-41d4-a716-446655440099",
        "success": false,
        "errorCode": "CONFLICT",
        "message": "本地版本 1 低于云端版本 2",
        "cloudEntity": {
          "uid": "550e8400-e29b-41d4-a716-446655440002",
          "status": "IN_PROGRESS",
          "version": 2
        }
      }
    ]
  },
  "timestamp": 1678886400000
}
```

**curl 示例**：
```bash
curl -X POST http://localhost:8080/api/sync/push \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "mutations": [{
      "mutationId": "550e8400-e29b-41d4-a716-446655440099",
      "entityType": "TASK",
      "entityUid": "550e8400-e29b-41d4-a716-446655440002",
      "changeType": "UPDATE",
      "data": {"status": "DONE", "version": 1}
    }]
  }'
```

#### 拉取云端变更（Pull）

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `cursor` | string | 否 | 上次同步的游标（updatedAt 时间戳毫秒），首次同步不传或传 `"0"` |
| `limit` | number | 否 | 每页数量，默认 100，最大 500 |

**成功响应** (200):
```json
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": {
    "entities": {
      "projects": [
        {
          "uid": "550e8400-e29b-41d4-a716-446655440001",
          "name": "软件工程课程项目",
          "status": "ACTIVE",
          "version": 3,
          "updatedAt": "2026-05-08T12:00:00Z"
        }
      ],
      "tasks": [
        {
          "uid": "550e8400-e29b-41d4-a716-446655440002",
          "title": "云端已修改的标题",
          "status": "IN_PROGRESS",
          "version": 2,
          "updatedAt": "2026-05-08T11:00:00Z"
        }
      ]
    },
    "deleted": {
      "projects": [],
      "tasks": ["550e8400-e29b-41d4-a716-446655440003"]
    },
    "nextCursor": "1678887000000",
    "hasMore": false
  },
  "timestamp": 1678886400000
}
```

**curl 示例**：
```bash
# 首次拉取
curl -X GET "http://localhost:8080/api/sync/pull?limit=100" \
  -H "Authorization: Bearer {token}"

# 增量拉取（携带游标）
curl -X GET "http://localhost:8080/api/sync/pull?cursor=1678886400000&limit=100" \
  -H "Authorization: Bearer {token}"
```

#### 提交冲突解决结果

**请求体**：
```json
{
  "resolutions": [
    {
      "entityType": "TASK",
      "entityUid": "550e8400-e29b-41d4-a716-446655440002",
      "resolution": "keep-cloud"
    }
  ]
}
```

**成功响应** (200):
```json
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": {
    "resolvedCount": 1,
    "failedCount": 0,
    "results": [
      {
        "entityUid": "550e8400-e29b-41d4-a716-446655440002",
        "success": true,
        "finalEntity": {
          "uid": "550e8400-e29b-41d4-a716-446655440002",
          "status": "IN_PROGRESS",
          "version": 2
        }
      }
    ]
  },
  "timestamp": 1678886400000
}
```

> **字段说明**：`finalEntity` 是冲突解决后的完整实体 DTO，结构与对应实体（项目/任务）的响应结构一致。

**curl 示例**：
```bash
curl -X POST http://localhost:8080/api/sync/resolve \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "resolutions": [{
      "entityType": "TASK",
      "entityUid": "550e8400-e29b-41d4-a716-446655440002",
      "resolution": "keep-cloud"
    }]
  }'
```

---

## 4. 重试语义

| HTTP 状态码 | 是否重试 | 重试间隔 |
| :--- | :--- | :--- |
| 400 (`VALIDATION_ERROR`) | 否 | - |
| 401 (`UNAUTHORIZED`) | 否（需重新登录） | - |
| 403 (`FORBIDDEN`) | 否 | - |
| 404 (`NOT_FOUND`) | 否 | - |
| 409 (`CONFLICT`) | 否（需手动解决） | - |
| 500 (`INTERNAL_ERROR`) | 是 | 1s, 2s, 4s（指数退避，最多 3 次） |
| 503 (`AI_PROVIDER_UNAVAILABLE`) | 是 | 30s 后重试一次，不重复重试 |
| 网络超时 | 是 | 1s, 2s, 4s（指数退避，最多 3 次） |

---

## 5. 附录

### 5.1 枚举值速查

| 类型 | 枚举值 |
| :--- | :--- |
| 优先级 | `P0`(最高), `P1`(高), `P2`(中), `P3`(低) |
| 项目状态 | `ACTIVE`, `ARCHIVED`, `DELETED` |
| 任务状态 | `TODO`, `IN_PROGRESS`, `PAUSED`, `DONE`, `ARCHIVED` |
| 习惯状态 | `ACTIVE`, `PAUSED` |

### 5.2 与 SQLite 文档差异

| 差异点 | 说明 |
| :--- | :--- |
| `uid` | 客户端稳定 ID（UUID） |
| `version` | 乐观锁版本号 |
| 时间格式 | ISO 8601 UTC |
| 响应格式 | 统一包含 `success/code/message/data/timestamp` |

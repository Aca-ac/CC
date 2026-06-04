# Chronos 开发联调指南 (M1 P0 核心闭环)

**版本**: v1.0
**发布日期**: 2026-05-08

---

## 1. 注释规范

### 1.1 通用规则

- 业务占位代码用 `TODO(负责人/模块): 具体任务` 标明
- 与需求文档直接对应的模块，在注释中标注 FR 或 UC 编号
- 不要逐行翻译代码，重点说明**业务原因、边界条件和后续接入点**

### 1.2 前端注释示例

```typescript
// TODO(任务模块): FR-03 状态流转，需校验 TODO -> DONE 是否跳过 IN_PROGRESS
// 边界条件: 子任务未完成时，父任务不允许标记为 DONE
```

### 1.3 后端注释示例

```java
// TODO(同步模块): UC-12 冲突检测，当前仅支持 version 对比
// 后续可扩展为字段级时间戳对比
```

---

## 2. Git 提交规范

| 类型 | 说明 | 示例 |
| --- | --- | --- |
| `feat:` | 新增用户可见功能 | `feat(task): add task status toggle` |
| `fix:` | 修复缺陷 | `fix(sync): fix cursor overflow issue` |
| `docs:` | 只修改文档 | `docs(api): update conflict resolution doc` |
| `style:` | 代码格式（不影响功能） | `style: format code with prettier` |
| `refactor:` | 重构（不改变功能） | `refactor(auth): extract token validator` |
| `test:` | 新增或修改测试 | `test(sync): add push idempotency test` |
| `chore:` | 工程配置、依赖 | `chore: upgrade spring boot to 3.2` |

---

## 3. 开发顺序建议

### Phase 0: 环境准备（第 1 天）
1. 后端：启动 Spring Boot，确认 `GET /api/health` 可访问
2. 前端：配置代理，确认可调用后端 API
3. 运维：搭建 CI 流水线（构建 + 单元测试）

### Phase 1: 认证 + 核心 CRUD（第 2-4 天）
1. 后端实现 `POST /api/auth/login` 和 `POST /api/auth/register`
2. 前端实现登录页 + Token 拦截器（401 跳转登录）
3. 后端实现项目/任务的最小 CRUD
4. 前端用真实接口替换 Mock，完成任务管理核心界面

### Phase 2: 今日看板 + 状态流转（第 5-7 天）
1. 后端实现 `GET /api/dashboard/today`
2. 前端实现今日看板页面
3. 后端实现 `PATCH /api/tasks/{taskUid}/status`
4. 前端实现任务状态切换 UI

### Phase 3: 同步机制（第 8-10 天）
1. 后端实现 `POST /api/sync/push`（含 mutationId 幂等）
2. 后端实现 `GET /api/sync/pull`（含 cursor 游标）
3. 后端实现 `POST /api/sync/resolve`（keep-local / keep-cloud）
4. 前端实现同步队列管理

### Phase 4: AI + 统计（第 11-14 天）
1. 后端实现 `POST /api/ai/breakdown-preview`（先接 Mock）
2. 前端实现 AI 拆解界面
3. 后端实现 `GET /api/stats/weekly`
4. 前端实现统计图表

### Phase 5: 测试 + 验收（第 15 天起）
1. 运维执行全量接口测试
2. 前后端联调冲突场景
3. 性能测试（1000 条任务数据）

---

## 4. 错误码处理指南

| 错误码 | 前端处理 |
| --- | --- |
| `UNAUTHORIZED` (401) | 清除本地 Token，跳转登录页 |
| `FORBIDDEN` (403) | Toast 提示“无权限操作”，刷新列表 |
| `CONFLICT` (409) | 弹出选择框，调用 `/sync/resolve` |
| `VALIDATION_ERROR` (400) | 提示用户修改输入 |
| `AI_PROVIDER_UNAVAILABLE` (503) | 提示“AI 暂时不可用，已切换为手动模式” |

---

## 5. 常见问题与解决方案

| 问题 | 可能原因 | 解决方案 |
| --- | --- | --- |
| 创建任务返回 400 | `title` 为空或超长（>200） | 前端增加长度校验 |
| 更新返回 409 | 客户端 `version` 与服务端不匹配 | 重新拉取最新数据，提示用户选择保留本地还是云端 |
| 同步 Push 重复创建 | 未实现 mutationId 幂等 | 后端检查 `mutationId` 是否已处理 |
| Pull 数据不完整 | `cursor` 计算错误 | 使用本次返回的 `nextCursor` 作为下次请求参数 |
| 登录后接口返回 401 | Token 未正确添加到 Header | 检查前端拦截器是否添加 `Authorization: Bearer {token}` |

---

## 6. 联调检查清单

### 6.1 后端自测

- [ ] `GET /api/health` 返回 200
- [ ] `POST /api/auth/register` 注册成功，密码加密存储
- [ ] `POST /api/auth/login` 登录成功，返回有效 Token
- [ ] `POST /api/projects` 创建项目，返回 `id` 和 `uid`
- [ ] `PUT /api/projects/{uid}` 携带错误 `version` 时返回 409
- [ ] `POST /api/tasks` 创建任务，支持 `parentTaskId`
- [ ] `PATCH /api/tasks/{uid}/status` 校验状态转换规则
- [ ] `POST /api/sync/push` 相同 `mutationId` 重复调用返回相同结果
- [ ] `GET /api/sync/pull` 支持 `cursor` 分页
- [ ] `POST /api/sync/resolve` 支持 `keep-local` 和 `keep-cloud`

### 6.2 前端自测

- [ ] 未登录时访问任何业务接口，跳转登录页
- [ ] Token 过期后，自动跳转登录页
- [ ] 创建任务时生成 UUID 作为 `uid`
- [ ] 更新任务时携带最新 `version`
- [ ] 收到 409 冲突时，弹出选择框并调用冲突解决接口
- [ ] 离线操作时，变更存入本地队列
- [ ] 网络恢复后，队列自动同步

---

## 7. 环境配置模板

### 7.1 后端 (application-dev.yml)

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/chronos
    username: root
    password: root
  jpa:
    hibernate:
      ddl-auto: update

chronos:
  jwt:
    secret: your-jwt-secret-key-min-256-bits
    expiration: 604800000  # 7 天
  ai:
    provider: openai
    api-key: ${AI_API_KEY}
    timeout: 30000  # 30 秒
```

### 7.2 前端 (.env.development)

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_AI_MOCK=true  # 开发阶段 Mock AI 接口
```

---

## 8. 枚举值速查表

### 8.1 项目状态

| 枚举值 | 说明 |
| --- | --- |
| `ACTIVE` | 进行中 |
| `ARCHIVED` | 已归档 |
| `DELETED` | 已删除（软删除） |

### 8.2 任务状态

| 枚举值 | 说明 | 可转换到 |
| --- | --- | --- |
| `TODO` | 未开始 | `IN_PROGRESS`, `ARCHIVED` |
| `IN_PROGRESS` | 进行中 | `DONE`, `PAUSED`, `TODO` |
| `PAUSED` | 暂停 | `IN_PROGRESS`, `TODO`, `ARCHIVED` |
| `DONE` | 已完成（纳入统计） | `ARCHIVED` |
| `ARCHIVED` | 已归档（不纳入统计） | 无 |

> **DONE vs ARCHIVED**：`DONE` 表示用户主动完成的正面结果，纳入成就统计；`ARCHIVED` 表示用户放弃或过期的任务，不计入成就。

### 8.3 优先级枚举

| 枚举值 | 说明 |
| --- | --- |
| `P0` | 最高优先级 |
| `P1` | 高优先级 |
| `P2` | 中优先级（默认） |
| `P3` | 低优先级 |

### 8.4 习惯状态

| 枚举值 | 说明 |
| --- | --- |
| `ACTIVE` | 进行中 |
| `PAUSED` | 已暂停 |

---

## 9. 本地队列持久化实现指导

### 9.1 队列数据结构设计

```typescript
interface SyncQueueItem {
  id: string;           // 本地自增ID，用于排序
  mutationId: string;   // 幂等ID，UUID v4
  entityType: 'PROJECT' | 'TASK';
  entityUid: string;    // 实体的客户端UID
  changeType: 'CREATE' | 'UPDATE' | 'DELETE';
  data: Record<string, any>;  // 变更数据（含version）
  timestamp: number;    // 创建时间戳（毫秒）
  status: 'pending' | 'syncing' | 'done' | 'failed';
  retryCount: number;   // 重试次数
  nextRetryTime: number; // 下次重试时间戳
}
```

### 9.2 队列存储（SQLite 表设计）

```sql
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mutation_id TEXT UNIQUE NOT NULL,
  entity_type TEXT NOT NULL,
  entity_uid TEXT NOT NULL,
  change_type TEXT NOT NULL,
  data TEXT NOT NULL,       -- JSON字符串
  timestamp INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  next_retry_time INTEGER DEFAULT 0
);

CREATE INDEX idx_sync_queue_status ON sync_queue(status);
CREATE INDEX idx_sync_queue_next_retry ON sync_queue(next_retry_time);
```

### 9.3 重试策略（指数退避）

| 重试次数 | 重试间隔 | 最大间隔 |
| --- | --- | --- |
| 1 | 1秒 | - |
| 2 | 2秒 | - |
| 3 | 4秒 | - |
| 4 | 8秒 | - |
| 5+ | 16秒（封顶） | 16秒 |

### 9.4 队列与本地 SQLite 的交互

```
用户操作 → 更新本地实体 → 写入队列 → 触发同步
              ↓                  ↓
           SQLite           sync_queue
              ↓                  ↓
         立即返回成功       后台异步推送
                              ↓
                         成功 → 从队列删除
                              ↓
                         失败 → 更新状态+重试
```

### 9.5 同步流程

1. **触发时机**：网络恢复时、应用启动时、后台定时任务（每30秒）
2. **获取待同步项**：查询 `status = 'pending' AND nextRetryTime <= 当前时间`
3. **批量推送**：每次最多推送 50 条，使用 Promise.all 并发
4. **更新状态**：根据响应更新每条记录的 status

---

## 10. 与 SQLite 文档的差异（工程层面）

| 差异点 | SQLite 文档 | 本指南 | 影响 |
| --- | --- | --- | --- |
| 数据标识 | 单一 ID | id + uid | 前端需生成 UUID |
| 乐观锁 | 无 | version 字段 | 更新接口必须携带 version |
| 冲突处理 | 自动覆盖 | 用户选择 | 前端需增加冲突弹窗 UI |
| 同步状态 | sync_status 字段 | API 响应码 | 前端不再依赖本地 sync_status 字段 |

---

## 附录：接口测试 cURL 快速参考

```bash
# 1. 注册
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"test","email":"test@example.com","password":"123456"}'

# 2. 登录（获取 TOKEN）
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}' | jq -r '.data.token')

# 3. 创建项目
curl -X POST http://localhost:8080/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uid":"'$(uuidgen)'","name":"测试项目"}'

# 4. 创建任务
curl -X POST http://localhost:8080/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uid":"'$(uuidgen)'","title":"测试任务"}'

# 5. 同步推送
curl -X POST http://localhost:8080/api/sync/push \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mutations":[{"mutationId":"'$(uuidgen)'","entityType":"TASK","entityUid":"task-uid","changeType":"UPDATE","data":{"status":"DONE"}}]}'

# 6. 同步拉取
curl -X GET "http://localhost:8080/api/sync/pull?limit=50" \
  -H "Authorization: Bearer $TOKEN"
```
# Chronos 冲突解决策略

## 核心原则

**不做字段级自动合并。** 当同一实体在本地和云端被同时修改时，系统不会尝试智能合并字段，而是将完整决策权交给用户。

## 冲突检测时机

冲突在 `syncPush` 阶段由服务端检测：

1. 客户端将 outbox 中待推送的变更批量发送到 `POST /api/sync/push`
2. 服务端比对每条变更的 `entityId` + `entityType` 与服务端当前版本
3. 如果服务端版本号高于客户端记录的版本号，判定为冲突
4. 服务端返回 `SyncPushResult`，其中 `conflicts` 数组包含所有冲突条目

## 冲突数据结构

```json
{
  "id": "conflict-uuid",
  "entityType": "TASK",
  "entityId": "task-123",
  "serverVersion": 5,
  "clientVersion": 3,
  "serverPayload": { "title": "云端版本", "status": "DONE" },
  "clientPayload": { "title": "本地版本", "status": "IN_PROGRESS" },
  "serverUpdatedAt": "2026-06-06T10:30:00+08:00",
  "clientUpdatedAt": "2026-06-06T10:25:00+08:00"
}
```

## 解决流程

```
syncPush → 服务端检测冲突 → 返回冲突列表
  → 前端写入 IndexedDB conflicts store
  → 前端显示 ConflictDialog
  → 用户选择「保留本地」或「保留云端」
  → 调用 POST /api/sync/conflicts/{id}/resolve
  → 更新本地 conflict store（标记为 resolved）
  → 恢复/清理 outbox 处理
```

## 两种解决策略

### 保留本地（keep-local）

- 服务端以客户端数据为准，覆盖服务端记录
- 本地 outbox 条目恢复为 `pending` 状态，等待下次推送
- 本地 conflict 标记为 `resolved`，resolution 为 `local`

### 保留云端（keep-cloud）

- 本地以服务端数据为准，覆盖本地 IndexedDB 中的对应实体
- 本地 outbox 条目被删除（不再需要推送）
- 本地 conflict 标记为 `resolved`，resolution 为 `remote`

## 不静默丢弃

- 任何冲突都必须经过用户确认，系统不会自动选择任何一方
- 冲突记录永久保存在 IndexedDB 中（`resolved: true`），可追溯
- 如果用户关闭冲突弹窗不处理，冲突仍然保留在列表中，下次同步时再次提醒

## 账户隔离

- 所有冲突记录通过 `accountId` 隔离
- 不同账户的冲突互不影响
- 冲突查询和解决操作均基于当前登录账户

## 相关 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/sync/push` | 推送变更，返回冲突列表 |
| POST | `/api/sync/conflicts/{id}/resolve` | 提交冲突解决结果 |
| GET | `/api/sync/pull?cursor=xxx` | 拉取远端变更 |

## 前端文件

| 文件 | 职责 |
|------|------|
| `src/services/apiClient.ts` | 同步 API 端点定义 |
| `src/services/syncService.ts` | 同步核心逻辑（push/pull/resolve） |
| `src/hooks/useConflict.ts` | 冲突状态管理 Hook |
| `src/components/ConflictDialog.tsx` | 冲突对比弹窗 UI |
| `src/storage/repositories/conflictRepository.ts` | IndexedDB 冲突存储 |
| `src/storage/repositories/outboxRepository.ts` | IndexedDB outbox 存储 |

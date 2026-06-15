/**
 * syncService — 离线同步核心服务
 *
 * 职责：
 * 1. 从 outbox 取出待推送的变更，调用 syncPush
 * 2. 处理服务端返回的冲突（写入本地 conflict store）
 * 3. 冲突解决后恢复 outbox 处理
 * 4. 从服务端拉取远端变更并写入本地 IndexedDB
 *
 * 策略：不做字段级自动合并，冲突必须由用户显式选择 keep-local 或 keep-cloud。
 */

import { apiClient, type SyncRecordItem } from "./apiClient";
import { conflictRepository } from "../storage/repositories/conflictRepository";
import { outboxRepository } from "../storage/repositories/outboxRepository";
import { syncCursorRepository } from "../storage/repositories/syncCursorRepository";
import type { ConflictValue } from "../storage/db";

// ── 类型 ────────────────────────────────────────────────────────

export interface SyncResult {
  pushed: number;
  conflicts: ConflictValue[];
  pulled: number;
  errors: string[];
}

// ── Push ─────────────────────────────────────────────────────────

/**
 * 将 outbox 中待推送的变更发送到服务端。
 * 返回被接受的条目数和产生的冲突列表。
 */
export async function pushPendingMutations(
  accountId: string
): Promise<{ pushed: number; conflicts: ConflictValue[]; errors: string[] }> {
  const pending = await outboxRepository.findPending(accountId);
  if (pending.length === 0) {
    return { pushed: 0, conflicts: [], errors: [] };
  }

  // 标记为 syncing
  for (const entry of pending) {
    await outboxRepository.updateStatus(entry.mutationId, "syncing");
  }

  const records: SyncRecordItem[] = pending
    .filter((e): e is typeof e & { entityType: "PROJECT" | "TASK" | "LOG" } =>
      e.entityType === "PROJECT" || e.entityType === "TASK" || e.entityType === "LOG"
    )
    .map((e) => ({
      entityType: e.entityType,
      entityId: e.entityId,
      changeType: e.operation,
      version: 0, // 由服务端比对
      payload: JSON.parse(e.payload),
    }));

  const conflicts: ConflictValue[] = [];
  const errors: string[] = [];
  let pushed = 0;

  try {
    const result = await apiClient.syncPush(records);
    pushed = result.accepted;

    // 将服务端返回的冲突写入本地 conflict store
    for (const dto of result.conflicts) {
      const localEntry = pending.find(
        (e) => e.entityId === dto.entityId && e.entityType === dto.entityType
      );

      const conflict: ConflictValue = {
        id: dto.id,
        accountId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        localData: localEntry ? localEntry.payload : JSON.stringify(dto.clientPayload),
        remoteData: JSON.stringify(dto.serverPayload),
        resolved: false,
        createdAt: Date.now(),
      };

      await conflictRepository.create(conflict);

      // 将对应的 outbox 条目标记为 conflict
      if (localEntry) {
        await outboxRepository.updateStatus(
          localEntry.mutationId,
          "conflict",
          "Version conflict"
        );
      }

      conflicts.push(conflict);
    }

    // 将被接受的 outbox 条目标记为 synced
    for (const entry of pending) {
      const hasConflict = conflicts.some(
        (c) => c.entityId === entry.entityId && c.entityType === entry.entityType
      );
      if (!hasConflict) {
        await outboxRepository.updateStatus(entry.mutationId, "synced");
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);

    // 推送失败，恢复 pending 状态
    for (const entry of pending) {
      await outboxRepository.updateStatus(entry.mutationId, "failed", msg);
    }
  }

  return { pushed, conflicts, errors };
}

// ── Pull ─────────────────────────────────────────────────────────

/**
 * 从服务端拉取远端变更并更新本地游标。
 * 返回拉取的变更条数。
 */
export async function pullRemoteChanges(
  accountId: string
): Promise<{ pulled: number; errors: string[] }> {
  const errors: string[] = [];
  let pulled = 0;

  try {
    const cursor = await syncCursorRepository.getCursor(accountId);
    const result = await apiClient.syncPull(cursor?.cursor);

    // 保存新游标
    if (result.cursor) {
      await syncCursorRepository.saveCursor(accountId, result.cursor);
    }

    // TODO(M1-07): 将远端变更应用到本地 IndexedDB
    // 目前只记录数量，实际写入逻辑在 M1-07 sync API 实现后补充
    pulled = result.changes.length;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
  }

  return { pulled, errors };
}

// ── Conflict Resolution ─────────────────────────────────────────

/**
 * 用户选择 keep-local 或 keep-cloud 后：
 * 1. 调用服务端 API 提交解决结果
 * 2. 更新本地 conflict store
 * 3. 恢复对应的 outbox 处理
 */
export async function resolveConflict(
  conflictId: string,
  accountId: string,
  resolution: "local" | "remote"
): Promise<{ success: boolean; error?: string }> {
  try {
    // 映射到服务端 API 的 resolution 格式
    const apiResolution = resolution === "local" ? "keep-local" : "keep-cloud";
    await apiClient.resolveConflict(conflictId, { resolution: apiResolution });

    // 更新本地 conflict store
    await conflictRepository.resolve(conflictId, resolution);

    if (resolution === "local") {
      // keep-local: 重新将 outbox 条目标记为 pending，等待下次推送
      const conflict = await findConflictById(conflictId);
      if (conflict) {
        const pending = await outboxRepository.findPending(accountId);
        const entry = pending.find(
          (e) => e.entityId === conflict.entityId && e.entityType === conflict.entityType
        );
        if (entry) {
          await outboxRepository.updateStatus(entry.mutationId, "pending");
        }
      }
    } else {
      // keep-cloud: 删除对应的 outbox 条目（云端版本已覆盖本地）
      const conflict = await findConflictById(conflictId);
      if (conflict) {
        const pending = await outboxRepository.findPending(accountId);
        const entry = pending.find(
          (e) => e.entityId === conflict.entityId && e.entityType === conflict.entityType
        );
        if (entry) {
          await outboxRepository.remove(entry.mutationId);
        }
      }
      // TODO(M1-07): 用云端数据覆盖本地 IndexedDB 中的对应实体
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

// ── Full Sync ────────────────────────────────────────────────────

/**
 * 完整同步流程：先 push 再 pull。
 * 如果 push 产生冲突，暂停后续 push 但继续 pull。
 */
export async function fullSync(accountId: string): Promise<SyncResult> {
  const errors: string[] = [];

  // 1. Push
  const pushResult = await pushPendingMutations(accountId);
  errors.push(...pushResult.errors);

  // 2. Pull（即使有冲突也继续拉取）
  const pullResult = await pullRemoteChanges(accountId);
  errors.push(...pullResult.errors);

  return {
    pushed: pushResult.pushed,
    conflicts: pushResult.conflicts,
    pulled: pullResult.pulled,
    errors,
  };
}

// ── Helpers ──────────────────────────────────────────────────────

async function findConflictById(
  conflictId: string
): Promise<ConflictValue | undefined> {
  // conflictRepository 没有 findById，直接从 db 读取
  const { getDB } = await import("../storage/db");
  const db = await getDB();
  return db.get("conflicts", conflictId) as Promise<ConflictValue | undefined>;
}

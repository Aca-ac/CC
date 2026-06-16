import { apiClient, type SyncRecordItem } from "./apiClient";
import { conflictRepository } from "../storage/repositories/conflictRepository";
import { outboxRepository } from "../storage/repositories/outboxRepository";
import { syncCursorRepository } from "../storage/repositories/syncCursorRepository";
import { getDB, type ConflictValue } from "../storage/db";

export interface SyncResult {
  pushed: number;
  conflicts: ConflictValue[];
  pulled: number;
  errors: string[];
}

export async function pushPendingMutations(
  accountId: string
): Promise<{ pushed: number; conflicts: ConflictValue[]; errors: string[] }> {
  const pending = await outboxRepository.findPending(accountId);
  if (pending.length === 0) {
    return { pushed: 0, conflicts: [], errors: [] };
  }

  for (const entry of pending) {
    await outboxRepository.updateStatus(entry.mutationId, "syncing");
  }

  const records: SyncRecordItem[] = pending
    .filter((entry): entry is typeof entry & { entityType: "PROJECT" | "TASK" | "LOG" } =>
      entry.entityType === "PROJECT" || entry.entityType === "TASK" || entry.entityType === "LOG"
    )
    .map((entry) => {
      const payload = JSON.parse(entry.payload) as Record<string, unknown>;
      return {
        entityType: entry.entityType,
        entityId: entry.entityId,
        changeType: entry.operation,
        version: typeof payload.updatedAt === "number" ? payload.updatedAt : entry.updatedAt,
        payload,
      };
    });

  const conflicts: ConflictValue[] = [];
  const errors: string[] = [];
  let pushed = 0;

  try {
    const result = await apiClient.syncPush(records);
    pushed = result.accepted;

    for (const dto of result.conflicts) {
      const localEntry = pending.find(
        (entry) => entry.entityId === dto.entityId && entry.entityType === dto.entityType
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
      if (localEntry) {
        await outboxRepository.updateStatus(localEntry.mutationId, "conflict", "Version conflict");
      }
      conflicts.push(conflict);
    }

    for (const entry of pending) {
      const hasConflict = conflicts.some(
        (conflict) => conflict.entityId === entry.entityId && conflict.entityType === entry.entityType
      );
      if (!hasConflict) {
        await outboxRepository.updateStatus(entry.mutationId, "synced");
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    for (const entry of pending) {
      await outboxRepository.updateStatus(entry.mutationId, "failed", msg);
    }
  }

  return { pushed, conflicts, errors };
}

export async function pullRemoteChanges(
  accountId: string
): Promise<{ pulled: number; errors: string[] }> {
  const errors: string[] = [];
  let pulled = 0;

  try {
    const cursor = await syncCursorRepository.getCursor(accountId);
    const result = await apiClient.syncPull(cursor?.cursor);

    for (const change of result.changes) {
      await applyRemoteChange(accountId, change);
    }

    if (result.cursor) {
      await syncCursorRepository.saveCursor(accountId, result.cursor);
    }
    pulled = result.changes.length;
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  return { pulled, errors };
}

export async function resolveConflict(
  conflictId: string,
  accountId: string,
  resolution: "local" | "remote"
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiResolution = resolution === "local" ? "keep-local" : "keep-cloud";
    await apiClient.resolveConflict(conflictId, { resolution: apiResolution });
    await conflictRepository.resolve(conflictId, resolution);

    const conflict = await findConflictById(conflictId);
    if (conflict && resolution === "remote") {
      const pending = await outboxRepository.findPending(accountId);
      const entry = pending.find(
        (item) => item.entityId === conflict.entityId && item.entityType === conflict.entityType
      );
      if (entry) {
        await outboxRepository.remove(entry.mutationId);
      }
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fullSync(accountId: string): Promise<SyncResult> {
  const pushResult = await pushPendingMutations(accountId);
  const pullResult = await pullRemoteChanges(accountId);

  return {
    pushed: pushResult.pushed,
    conflicts: pushResult.conflicts,
    pulled: pullResult.pulled,
    errors: [...pushResult.errors, ...pullResult.errors],
  };
}

async function applyRemoteChange(accountId: string, change: SyncRecordItem): Promise<void> {
  const db = await getDB();
  const storeName = storeFor(change.entityType);
  const existing = await db.get(storeName, change.entityId) as { createdAt?: number; updatedAt?: number } | undefined;
  const remoteVersion = change.version || Date.now();

  if (existing?.updatedAt && existing.updatedAt > remoteVersion) {
    return;
  }

  if (change.changeType === "DELETE") {
    if (existing) {
      await db.put(storeName, {
        ...existing,
        deleted: true,
        updatedAt: remoteVersion,
      });
    }
    return;
  }

  const payload = change.payload;
  await db.put(storeName, {
    ...existing,
    ...payload,
    id: change.entityId,
    accountId,
    createdAt: existing?.createdAt ?? asNumber(payload.createdAt) ?? remoteVersion,
    updatedAt: remoteVersion,
    deleted: Boolean(payload.deleted),
  });
}

function storeFor(entityType: SyncRecordItem["entityType"]): "projects" | "tasks" | "learningLogs" {
  if (entityType === "PROJECT") return "projects";
  if (entityType === "TASK") return "tasks";
  return "learningLogs";
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

async function findConflictById(conflictId: string): Promise<ConflictValue | undefined> {
  const db = await getDB();
  return db.get("conflicts", conflictId) as Promise<ConflictValue | undefined>;
}

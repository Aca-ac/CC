import { useCallback, useEffect, useState } from "react";
import { learningLogRepository } from "../storage/repositories/learningLogRepository";
import { focusSessionRepository } from "../storage/repositories/focusSessionRepository";
import { outboxRepository } from "../storage/repositories/outboxRepository";
import { useAccountId } from "./useAccountId";
import type { LearningLogValue, FocusSessionValue } from "../storage/db";

export interface UnifiedLog {
  id: string;
  type: "manual" | "timer";
  projectId: string;
  taskId?: string;
  content: string;
  actualMinutes: number;
  createdAt: number;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  links?: string[];
  discarded?: boolean;
}

export interface UseLearningLogsReturn {
  logs: UnifiedLog[];
  loading: boolean;
  error: string | null;
  createManualLog: (
    data: Omit<LearningLogValue, "id" | "accountId" | "createdAt" | "updatedAt" | "deleted">
  ) => Promise<void>;
  updateManualLog: (
    id: string,
    changes: Partial<Omit<LearningLogValue, "id" | "accountId" | "createdAt" | "updatedAt" | "deleted">>
  ) => Promise<void>;
  deleteManualLog: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

function manualToUnified(log: LearningLogValue): UnifiedLog {
  return {
    id: log.id,
    type: "manual",
    projectId: log.projectId,
    taskId: log.taskId,
    content: log.content,
    actualMinutes: log.actualMinutes,
    createdAt: log.createdAt,
    difficulty: log.difficulty,
    links: log.links,
  };
}

function focusToUnified(session: FocusSessionValue): UnifiedLog {
  return {
    id: session.id,
    type: "timer",
    projectId: session.projectId,
    taskId: session.taskId,
    content: `专注计时：${session.durationMinutes} 分钟`,
    actualMinutes: session.durationMinutes,
    createdAt: session.startTime,
    discarded: session.discarded,
  };
}

export function useLearningLogs(): UseLearningLogsReturn {
  const accountId = useAccountId();
  const [logs, setLogs] = useState<UnifiedLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLocal = useCallback(async () => {
    const [manualLogs, sessions] = await Promise.all([
      learningLogRepository.findAll(accountId),
      focusSessionRepository.findNonDiscarded(accountId),
    ]);

    const unified: UnifiedLog[] = [
      ...manualLogs.filter((l) => !l.deleted).map(manualToUnified),
      ...sessions.filter((s) => s.endTime && !s.discarded).map(focusToUnified),
    ];

    unified.sort((a, b) => b.createdAt - a.createdAt);
    setLogs(unified);
  }, [accountId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await loadLocal();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [loadLocal]);

  const enqueue = useCallback(
    async (operation: "CREATE" | "UPDATE" | "DELETE", entityId: string, payload: unknown) => {
      await outboxRepository.create({
        mutationId: crypto.randomUUID(),
        accountId,
        operation,
        entityType: "LOG",
        entityId,
        payload: JSON.stringify(payload),
        status: "pending",
        retryCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    },
    [accountId]
  );

  const createManualLog = useCallback(
    async (
      data: Omit<LearningLogValue, "id" | "accountId" | "createdAt" | "updatedAt" | "deleted">
    ) => {
      const now = Date.now();
      const log: LearningLogValue = {
        ...data,
        id: crypto.randomUUID(),
        accountId,
        createdAt: now,
        updatedAt: now,
        deleted: false,
      };
      await learningLogRepository.create(log);
      await enqueue("CREATE", log.id, log);
      setLogs((prev) => [manualToUnified(log), ...prev]);
    },
    [enqueue]
  );

  const updateManualLog = useCallback(
    async (
      id: string,
      changes: Partial<Omit<LearningLogValue, "id" | "accountId" | "createdAt" | "updatedAt" | "deleted">>
    ) => {
      await learningLogRepository.update(id, changes);
      await enqueue("UPDATE", id, changes);
      setLogs((prev) =>
        prev.map((log) => (log.id === id && log.type === "manual" ? { ...log, ...changes } : log))
      );
    },
    [enqueue]
  );

  const deleteManualLog = useCallback(
    async (id: string) => {
      await learningLogRepository.softDelete(id);
      await enqueue("DELETE", id, { id });
      setLogs((prev) => prev.filter((log) => log.id !== id));
    },
    [enqueue]
  );

  useEffect(() => {
    loadLocal();
  }, [loadLocal]);

  return {
    logs,
    loading,
    error,
    createManualLog,
    updateManualLog,
    deleteManualLog,
    refresh,
  };
}

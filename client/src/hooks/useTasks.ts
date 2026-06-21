import { useCallback, useEffect, useState } from "react";
import { taskRepository } from "../storage/repositories/taskRepository";
import { outboxRepository } from "../storage/repositories/outboxRepository";
import { apiClient } from "../services/apiClient";
import { useAccountId } from "./useAccountId";
import type { TaskValue } from "../storage/db";
import type { Task, TaskStatus } from "../types/domain";

function toDomain(t: TaskValue): Task {
  return {
    id: t.id,
    projectId: t.projectId,
    parentTaskId: t.parentTaskId,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueTime: t.dueTime,
    estimatedMinutes: t.estimatedMinutes,
    tags: t.tags,
    orderIndex: t.orderIndex,
  };
}

function orderValue(task: { orderIndex?: number; createdAt?: number }) {
  return task.orderIndex ?? task.createdAt ?? Number.MAX_SAFE_INTEGER;
}

// 截止时间排序权重：有截止时间的按时间先后，无截止时间的排在最后。
function dueRank(task: { dueTime?: string }) {
  if (!task.dueTime) return Number.MAX_SAFE_INTEGER;
  const ts = Date.parse(task.dueTime);
  return Number.isNaN(ts) ? Number.MAX_SAFE_INTEGER : ts;
}

// 先按截止日期，再按先后顺序（AI 拆解时写入的 orderIndex），最后用稳定 tie-breaker。
function sortTaskValues(values: TaskValue[]): TaskValue[] {
  return [...values].sort(
    (a, b) => dueRank(a) - dueRank(b) || orderValue(a) - orderValue(b) || a.createdAt - b.createdAt
  );
}

function sortTasks(values: Task[]): Task[] {
  return [...values].sort(
    (a, b) =>
      dueRank(a) - dueRank(b) ||
      orderValue(a) - orderValue(b) ||
      a.title.localeCompare(b.title, "zh-CN") ||
      a.id.localeCompare(b.id)
  );
}

export interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  online: boolean;
  createTask: (
    projectId: string,
    data: Omit<TaskValue, "id" | "accountId" | "projectId" | "createdAt" | "updatedAt" | "deleted" | "actualMinutes">
  ) => Promise<void>;
  updateTask: (id: string, changes: Partial<TaskValue>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  changeStatus: (id: string, status: TaskStatus) => Promise<void>;
  reorderTasks: (orderedIds: string[]) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useTasks(): UseTasksReturn {
  const accountId = useAccountId();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(navigator.onLine);

  const loadLocal = useCallback(async () => {
    const list = await taskRepository.findAll(accountId);
    setTasks(sortTaskValues(list.filter((t) => !t.deleted)).map(toDomain));
  }, [accountId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (navigator.onLine && accountId !== "local") {
        const remote = await apiClient.listTasks();
        for (const r of remote) {
          const existing = await taskRepository.findById(r.id);
          const value: TaskValue = {
            ...r,
            accountId,
            actualMinutes: existing?.actualMinutes ?? 0,
            orderIndex: existing?.orderIndex ?? r.orderIndex ?? Date.now(),
            createdAt: existing?.createdAt ?? Date.now(),
            updatedAt: Date.now(),
            deleted: false,
          };
          if (existing) {
            await taskRepository.update(r.id, value);
          } else {
            await taskRepository.create(value);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      await loadLocal();
      setLoading(false);
    }
  }, [accountId, loadLocal]);

  const enqueue = useCallback(
    async (operation: "CREATE" | "UPDATE" | "DELETE", entityId: string, payload: unknown) => {
      await outboxRepository.create({
        mutationId: crypto.randomUUID(),
        accountId,
        operation,
        entityType: "TASK",
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

  const createTask = useCallback(
    async (
      projectId: string,
      data: Omit<TaskValue, "id" | "accountId" | "projectId" | "createdAt" | "updatedAt" | "deleted" | "actualMinutes">
    ) => {
      const now = Date.now();
      const existingTasks = await taskRepository.findAll(accountId);
      const nextOrderIndex =
        existingTasks.reduce((max, task) => Math.max(max, task.orderIndex ?? -1), -1) + 1;
      const task: TaskValue = {
        ...data,
        id: crypto.randomUUID(),
        accountId,
        projectId,
        actualMinutes: 0,
        orderIndex: data.orderIndex ?? nextOrderIndex,
        createdAt: now,
        updatedAt: now,
        deleted: false,
      };
      await taskRepository.create(task);
      await enqueue("CREATE", task.id, task);
      setTasks((prev) => sortTasks([...prev, toDomain(task)]));
    },
    [accountId, enqueue]
  );

  const updateTask = useCallback(
    async (id: string, changes: Partial<TaskValue>) => {
      await taskRepository.update(id, changes);
      await enqueue("UPDATE", id, changes);
      setTasks((prev) => sortTasks(prev.map((t) => (t.id === id ? { ...t, ...changes } : t))));
    },
    [enqueue]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await taskRepository.softDelete(id);
      await enqueue("DELETE", id, { id });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    },
    [enqueue]
  );

  const changeStatus = useCallback(
    async (id: string, status: TaskStatus) => {
      await updateTask(id, { status });
    },
    [updateTask]
  );

  const reorderTasks = useCallback(
    async (orderedIds: string[]) => {
      const orderMap = new Map(orderedIds.map((id, index) => [id, index]));
      const now = Date.now();
      await Promise.all(
        orderedIds.map(async (id, index) => {
          const changes: Partial<TaskValue> = { orderIndex: index, updatedAt: now };
          await taskRepository.update(id, changes);
          await enqueue("UPDATE", id, changes);
        })
      );
      setTasks((prev) =>
        sortTasks(
          prev.map((task) =>
            orderMap.has(task.id) ? { ...task, orderIndex: orderMap.get(task.id)! } : task
          )
        )
      );
    },
    [enqueue]
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    loadLocal();
  }, [loadLocal]);

  useEffect(() => {
    if (online) refresh();
  }, [online, refresh]);

  return {
    tasks,
    loading,
    error,
    online,
    createTask,
    updateTask,
    deleteTask,
    changeStatus,
    reorderTasks,
    refresh,
  };
}

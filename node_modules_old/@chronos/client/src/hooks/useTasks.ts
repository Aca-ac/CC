import { useCallback, useEffect, useState } from "react";
import { taskRepository } from "../storage/repositories/taskRepository";
import { outboxRepository } from "../storage/repositories/outboxRepository";
import { apiClient } from "../services/apiClient";
import type { TaskValue } from "../storage/db";
import type { Task, TaskStatus } from "../types/domain";

const ACCOUNT_ID = "local"; // TODO: 从 auth context 获取真实 accountId

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
  };
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
  refresh: () => Promise<void>;
}

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(navigator.onLine);

  const loadLocal = useCallback(async () => {
    const list = await taskRepository.findAll(ACCOUNT_ID);
    setTasks(list.filter((t) => !t.deleted).map(toDomain));
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (navigator.onLine) {
        const remote = await apiClient.listTasks();
        for (const r of remote) {
          const existing = await taskRepository.findById(r.id);
          const value: TaskValue = {
            ...r,
            accountId: ACCOUNT_ID,
            actualMinutes: existing?.actualMinutes ?? 0,
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
  }, [loadLocal]);

  const enqueue = useCallback(
    async (operation: "CREATE" | "UPDATE" | "DELETE", entityId: string, payload: unknown) => {
      await outboxRepository.create({
        mutationId: crypto.randomUUID(),
        accountId: ACCOUNT_ID,
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
    []
  );

  const createTask = useCallback(
    async (
      projectId: string,
      data: Omit<TaskValue, "id" | "accountId" | "projectId" | "createdAt" | "updatedAt" | "deleted" | "actualMinutes">
    ) => {
      const now = Date.now();
      const task: TaskValue = {
        ...data,
        id: crypto.randomUUID(),
        accountId: ACCOUNT_ID,
        projectId,
        actualMinutes: 0,
        createdAt: now,
        updatedAt: now,
        deleted: false,
      };
      await taskRepository.create(task);
      await enqueue("CREATE", task.id, task);
      setTasks((prev) => [...prev, toDomain(task)]);
    },
    [enqueue]
  );

  const updateTask = useCallback(
    async (id: string, changes: Partial<TaskValue>) => {
      await taskRepository.update(id, changes);
      await enqueue("UPDATE", id, changes);
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...changes } : t))
      );
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
    refresh,
  };
}

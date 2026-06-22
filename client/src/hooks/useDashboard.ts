import { useCallback, useEffect, useState } from "react";
import { taskRepository } from "../storage/repositories/taskRepository";
import { outboxRepository } from "../storage/repositories/outboxRepository";
import { apiClient } from "../services/apiClient";
import { useAccountId } from "./useAccountId";
import type { DashboardSummary, Task } from "../types/domain";
import type { TaskValue } from "../storage/db";

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

export interface UseDashboardReturn {
  summary: DashboardSummary;
  todayTasks: Task[];
  loading: boolean;
  error: string | null;
  online: boolean;
  refresh: () => Promise<void>;
}

function computeSummary(tasks: TaskValue[]): DashboardSummary {
  const today = new Date().toISOString().slice(0, 10);
  const todayTaskTotal = tasks.filter(
    (t) => !t.deleted && t.dueTime && t.dueTime.startsWith(today)
  ).length;
  const completedTaskTotal = tasks.filter(
    (t) => !t.deleted && t.status === "DONE"
  ).length;
  const focusMinutes = tasks
    .filter((t) => !t.deleted)
    .reduce((sum, t) => sum + (t.actualMinutes ?? 0), 0);
  return {
    todayTaskTotal,
    completedTaskTotal,
    focusMinutes,
    habitStreak: 0, // TODO: 接入 habit repository
    syncPendingTotal: 0, // TODO: 接入 outbox 统计
  };
}

export function useDashboard(): UseDashboardReturn {
  const accountId = useAccountId();
  const [summary, setSummary] = useState<DashboardSummary>({
    todayTaskTotal: 0,
    completedTaskTotal: 0,
    focusMinutes: 0,
    habitStreak: 0,
    syncPendingTotal: 0,
  });
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(navigator.onLine);

  const loadLocal = useCallback(async () => {
    const allTasks = await taskRepository.findAll(accountId);
    const activeTasks = allTasks.filter((t) => !t.deleted);
    setSummary(computeSummary(activeTasks));

    const today = new Date().toISOString().slice(0, 10);
    const todayList = activeTasks
      .filter((t) => t.dueTime && t.dueTime.startsWith(today))
      .map(toDomain);
    setTodayTasks(todayList);
  }, [accountId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (navigator.onLine && accountId !== "local") {
        const remoteSummary = await apiClient.getTodayDashboard();
        // 拉取远端任务列表并合并到本地
        const remoteTasks = await apiClient.listTasks();
        // 跳过本地仍待同步删除的任务，避免被服务端列表「复活」。
        const pendingDeletes = new Set(
          (await outboxRepository.findPending(accountId))
            .filter((m) => m.entityType === "TASK" && m.operation === "DELETE")
            .map((m) => m.entityId)
        );
        for (const r of remoteTasks) {
          if (pendingDeletes.has(r.id)) continue;
          const existing = await taskRepository.findById(r.id);
          const value: TaskValue = {
            ...r,
            accountId,
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
        // 先用本地计算刷新 todayTasks/summary，确保本地编辑立即反映……
        await loadLocal();
        // ……再用服务端权威统计覆盖数字（连续打卡、专注时长等本地无法准确计算）。
        // 注意：此覆盖必须是最后一次 setSummary，不能再被 loadLocal 清掉。
        setSummary((prev) => ({ ...prev, ...remoteSummary }));
      } else {
        await loadLocal();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      await loadLocal();
    } finally {
      setLoading(false);
    }
  }, [accountId, loadLocal]);

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
    summary,
    todayTasks,
    loading,
    error,
    online,
    refresh,
  };
}

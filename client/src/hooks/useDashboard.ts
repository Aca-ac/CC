import { useCallback, useEffect, useState } from "react";
import { taskRepository } from "../storage/repositories/taskRepository";
import { apiClient } from "../services/apiClient";
import type { DashboardSummary, Task } from "../types/domain";
import type { TaskValue } from "../storage/db";

function getAccountId(): string {
  try {
    const raw = localStorage.getItem("chronos:session");
    if (raw) {
      const session = JSON.parse(raw) as { userId: string };
      if (session.userId) return session.userId;
    }
  } catch { /* ignore */ }
  return "local";
}

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
    const allTasks = await taskRepository.findAll(getAccountId());
    const activeTasks = allTasks.filter((t) => !t.deleted);
    setSummary(computeSummary(activeTasks));

    const today = new Date().toISOString().slice(0, 10);
    const todayList = activeTasks
      .filter((t) => t.dueTime && t.dueTime.startsWith(today))
      .map(toDomain);
    setTodayTasks(todayList);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (navigator.onLine) {
        const remoteSummary = await apiClient.getTodayDashboard();
        // 拉取远端任务列表并合并到本地
        const remoteTasks = await apiClient.listTasks();
        for (const r of remoteTasks) {
          const existing = await taskRepository.findById(r.id);
          const value: TaskValue = {
            ...r,
            accountId: getAccountId(),
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
        // 用本地计算刷新 summary，确保本地编辑立即反映
        await loadLocal();
        // 用远端 summary 校正数字（如果服务端返回了更准确的统计）
        setSummary((prev) => ({
          ...prev,
          todayTaskTotal: remoteSummary.todayTaskTotal,
          completedTaskTotal: remoteSummary.completedTaskTotal,
          focusMinutes: remoteSummary.focusMinutes,
          habitStreak: remoteSummary.habitStreak,
          syncPendingTotal: remoteSummary.syncPendingTotal,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      await loadLocal();
      setLoading(false);
    }
  }, [loadLocal]);

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

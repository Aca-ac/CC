import { useCallback, useEffect, useState } from "react";
import { apiClient, type CreateHabitRequest, type HabitDTO } from "../services/apiClient";

/**
 * 习惯打卡数据钩子（FR-习惯打卡 / UC-Habit）。
 *
 * 习惯模块依赖后端（无本地仓储/outbox），因此直连 `apiClient`。
 * 离线 / 本地演示（无后端）时优雅降级：列表为空 + 暴露 error，由页面提示，不崩溃。
 *
 * 「今日是否已打卡」后端列表未返回，改为按「日期 + 习惯 id」持久化到 localStorage，
 * 这样切换页面 / 重新进入后仍能正确显示当日打卡状态（跨天自动失效）。
 */
export type Habit = HabitDTO;

export interface UseHabitsReturn {
  habits: Habit[];
  loading: boolean;
  error: string | null;
  /** 今日已完成打卡的习惯 id */
  checkedToday: Set<string>;
  refresh: () => Promise<void>;
  createHabit: (input: CreateHabitRequest) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  /** 打卡成功后返回最新连续天数，便于页面展示庆祝动画 */
  checkin: (id: string) => Promise<number>;
}

const CHECKED_KEY = "chronos:habitChecked";

function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/** 从 localStorage 读取「今日已打卡」集合；跨天自动失效。 */
function loadCheckedToday(): Set<string> {
  try {
    const raw = localStorage.getItem(CHECKED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as { date?: string; ids?: string[] };
    if (parsed.date === todayISO() && Array.isArray(parsed.ids)) {
      return new Set(parsed.ids);
    }
  } catch {
    /* ignore */
  }
  return new Set();
}

function saveCheckedToday(ids: Set<string>): void {
  try {
    localStorage.setItem(CHECKED_KEY, JSON.stringify({ date: todayISO(), ids: [...ids] }));
  } catch {
    /* ignore */
  }
}

export function useHabits(): UseHabitsReturn {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedToday, setCheckedToday] = useState<Set<string>>(() => loadCheckedToday());

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.listHabits();
      setHabits(data ?? []);
    } catch (err) {
      setHabits([]);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const createHabit = useCallback(
    async (input: CreateHabitRequest) => {
      const created = await apiClient.createHabit(input);
      setHabits((prev) => [created, ...prev]);
    },
    [],
  );

  const deleteHabit = useCallback(async (id: string) => {
    await apiClient.deleteHabit(id);
    setHabits((prev) => prev.filter((habit) => habit.id !== id));
    setCheckedToday((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      saveCheckedToday(next);
      return next;
    });
  }, []);

  const checkin = useCallback(async (id: string): Promise<number> => {
    const result = await apiClient.checkinHabit(id, { date: todayISO() });
    setHabits((prev) =>
      prev.map((habit) =>
        habit.id === id ? { ...habit, streakCount: result.streakCount } : habit,
      ),
    );
    setCheckedToday((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveCheckedToday(next);
      return next;
    });
    return result.streakCount;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { habits, loading, error, checkedToday, refresh, createHabit, deleteHabit, checkin };
}

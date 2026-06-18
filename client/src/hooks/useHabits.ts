import { useCallback, useEffect, useState } from "react";
import { apiClient, type CreateHabitRequest, type HabitDTO } from "../services/apiClient";

/**
 * 习惯打卡数据钩子（FR-习惯打卡 / UC-Habit）。
 *
 * 习惯模块依赖后端（无本地仓储/outbox），因此直连 `apiClient`。
 * 离线 / 本地演示（无后端）时优雅降级：列表为空 + 暴露 error，由页面提示，不崩溃。
 * 「今日是否已打卡」后端列表未返回，改为会话内本地集合追踪（打卡接口幂等，重复打卡无副作用）。
 */
export type Habit = HabitDTO;

export interface UseHabitsReturn {
  habits: Habit[];
  loading: boolean;
  error: string | null;
  /** 本次会话内已完成今日打卡的习惯 id */
  checkedToday: Set<string>;
  refresh: () => Promise<void>;
  createHabit: (input: CreateHabitRequest) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  checkin: (id: string) => Promise<void>;
}

function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function useHabits(): UseHabitsReturn {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedToday, setCheckedToday] = useState<Set<string>>(new Set());

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
      return next;
    });
  }, []);

  const checkin = useCallback(async (id: string) => {
    const result = await apiClient.checkinHabit(id, { date: todayISO() });
    setHabits((prev) =>
      prev.map((habit) =>
        habit.id === id ? { ...habit, streakCount: result.streakCount } : habit,
      ),
    );
    setCheckedToday((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { habits, loading, error, checkedToday, refresh, createHabit, deleteHabit, checkin };
}

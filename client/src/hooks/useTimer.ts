import { useCallback, useEffect, useRef, useState } from "react";
import { focusSessionRepository } from "../storage/repositories/focusSessionRepository";
import { timerStateRepository } from "../storage/repositories/timerStateRepository";
import { outboxRepository } from "../storage/repositories/outboxRepository";
import { apiClient } from "../services/apiClient";
import { useAccountId } from "./useAccountId";
import type { FocusSessionValue } from "../storage/db";

export interface TimerState {
  active: boolean;
  elapsedSeconds: number;
  /** true when the active timer is temporarily paused（计时冻结，不计入新时长） */
  paused: boolean;
  projectId?: string;
  taskId?: string;
  sessionId?: string;
  /** true when restore from server is in progress */
  restoring: boolean;
  /** last operation error, cleared on next action */
  error: string | null;
}

export interface UseTimerReturn {
  timer: TimerState;
  startTimer: (projectId: string, taskId?: string) => Promise<void>;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => Promise<void>;
  discardTimer: () => Promise<void>;
  restoreTimer: () => Promise<void>;
  clearError: () => void;
}

export function useTimer(): UseTimerReturn {
  const accountId = useAccountId();
  const [timer, setTimer] = useState<TimerState>({
    active: false,
    elapsedSeconds: 0,
    paused: false,
    restoring: false,
    error: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 当前计时段的起点（毫秒）。
  const startTimeRef = useRef<number>(0);
  // 暂停前已累计的秒数；恢复后从这里继续累加，实现可暂停的计时。
  const baseSecondsRef = useRef<number>(0);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const now = Date.now();
    const elapsed = baseSecondsRef.current + Math.floor((now - startTimeRef.current) / 1000);
    setTimer((prev) => ({ ...prev, elapsedSeconds: elapsed }));
  }, []);

  const startTick = useCallback(() => {
    clearTick();
    intervalRef.current = setInterval(tick, 1000);
  }, [clearTick, tick]);

  const enqueue = useCallback(
    async (operation: "CREATE" | "UPDATE" | "DELETE", entityId: string, payload: unknown) => {
      await outboxRepository.create({
        mutationId: crypto.randomUUID(),
        accountId,
        operation,
        entityType: "FOCUS",
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

  const startTimer = useCallback(
    async (projectId: string, taskId?: string) => {
      setTimer((prev) => ({ ...prev, error: null }));

      // 每个账户只能有一个活跃计时器
      const existing = await focusSessionRepository.findActive(accountId);
      if (existing) {
        setTimer((prev) => ({ ...prev, error: "已有一个活跃计时器，请先停止或丢弃当前计时器" }));
        return;
      }

      const now = Date.now();
      const sessionId = crypto.randomUUID();
      const session: FocusSessionValue = {
        id: sessionId,
        accountId,
        projectId,
        taskId,
        startTime: now,
        durationMinutes: 0,
        discarded: false,
        createdAt: now,
        updatedAt: now,
      };

      // 本地持久化（确保重启可恢复）
      await focusSessionRepository.create(session);
      await timerStateRepository.set({
        accountId,
        active: true,
        sessionId: session.id,
        projectId,
        taskId,
        startTime: now,
        updatedAt: now,
      });
      await enqueue("CREATE", session.id, session);

      // 尝试通知服务端（失败不阻塞本地）
      try {
        await apiClient.startTimer({ projectId, taskId, sessionId });
      } catch {
        // 离线时进入 outbox，后续同步
      }

      startTimeRef.current = now;
      baseSecondsRef.current = 0;
      setTimer({
        active: true,
        elapsedSeconds: 0,
        paused: false,
        projectId,
        taskId,
        sessionId: session.id,
        restoring: false,
        error: null,
      });
      startTick();
    },
    [accountId, enqueue, startTick]
  );

  const pauseTimer = useCallback(() => {
    setTimer((prev) => {
      if (!prev.active || prev.paused) return prev;
      // 冻结已累计秒数，停止计时器（不再累加运行时间）。
      const elapsed = baseSecondsRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000);
      baseSecondsRef.current = elapsed;
      clearTick();
      return { ...prev, paused: true, elapsedSeconds: elapsed };
    });
  }, [clearTick]);

  const resumeTimer = useCallback(() => {
    setTimer((prev) => {
      if (!prev.active || !prev.paused) return prev;
      startTimeRef.current = Date.now();
      startTick();
      return { ...prev, paused: false };
    });
  }, [startTick]);

  const stopTimer = useCallback(async () => {
    if (!timer.active || !timer.sessionId) return;
    setTimer((prev) => ({ ...prev, error: null }));

    const now = Date.now();
    const elapsedMinutes = Math.ceil(timer.elapsedSeconds / 60);

    await focusSessionRepository.update(timer.sessionId, {
      endTime: now,
      durationMinutes: elapsedMinutes,
    });
    await timerStateRepository.clear(accountId);
    await enqueue("UPDATE", timer.sessionId, {
      endTime: now,
      durationMinutes: elapsedMinutes,
    });

    // 尝试通知服务端
    try {
      await apiClient.stopTimer(timer.sessionId, { durationMinutes: elapsedMinutes });
    } catch {
      // 离线时进入 outbox
    }

    clearTick();
    baseSecondsRef.current = 0;
    setTimer({ active: false, elapsedSeconds: 0, paused: false, restoring: false, error: null });
  }, [accountId, timer.active, timer.sessionId, timer.elapsedSeconds, enqueue, clearTick]);

  const discardTimer = useCallback(async () => {
    if (!timer.active || !timer.sessionId) return;
    setTimer((prev) => ({ ...prev, error: null }));

    await focusSessionRepository.update(timer.sessionId, {
      discarded: true,
      endTime: Date.now(),
    });
    await timerStateRepository.clear(accountId);
    await enqueue("UPDATE", timer.sessionId, { discarded: true });

    try {
      await apiClient.discardTimer(timer.sessionId);
    } catch {
      // 离线时进入 outbox
    }

    clearTick();
    baseSecondsRef.current = 0;
    setTimer({ active: false, elapsedSeconds: 0, paused: false, restoring: false, error: null });
  }, [accountId, timer.active, timer.sessionId, enqueue, clearTick]);

  const restoreTimer = useCallback(async () => {
    setTimer((prev) => ({ ...prev, restoring: true, error: null }));

    try {
      // 优先从服务端恢复
      const serverActive = await apiClient.getActiveTimer();
      if (serverActive) {
        const serverStart = new Date(serverActive.startedAt).getTime();
        const elapsed = Math.floor((Date.now() - serverStart) / 1000);

        // 同步到本地
        const existing = await focusSessionRepository.findById(serverActive.id);
        if (!existing) {
          await focusSessionRepository.create({
            id: serverActive.id,
            accountId,
            projectId: serverActive.projectId,
            taskId: serverActive.taskId,
            startTime: serverStart,
            durationMinutes: 0,
            discarded: false,
            createdAt: serverStart,
            updatedAt: Date.now(),
          });
        }
        await timerStateRepository.set({
          accountId,
          active: true,
          sessionId: serverActive.id,
          projectId: serverActive.projectId,
          taskId: serverActive.taskId,
          startTime: serverStart,
          updatedAt: Date.now(),
        });

        startTimeRef.current = serverStart;
        baseSecondsRef.current = 0;
        setTimer({
          active: true,
          elapsedSeconds: elapsed,
          paused: false,
          projectId: serverActive.projectId,
          taskId: serverActive.taskId,
          sessionId: serverActive.id,
          restoring: false,
          error: null,
        });
        startTick();
        return;
      }
    } catch {
      // 服务端不可用（离线/未部署），回退到本地恢复
    }

    // 回退：从本地 IndexedDB 恢复
    const state = await timerStateRepository.get(accountId);
    if (!state || !state.active || !state.sessionId || !state.startTime) {
      setTimer((prev) => ({ ...prev, restoring: false }));
      return;
    }

    const session = await focusSessionRepository.findById(state.sessionId);
    if (!session || session.endTime || session.discarded) {
      await timerStateRepository.clear(accountId);
      setTimer((prev) => ({ ...prev, restoring: false }));
      return;
    }

    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    startTimeRef.current = state.startTime;
    baseSecondsRef.current = 0;
    setTimer({
      active: true,
      elapsedSeconds: elapsed,
      paused: false,
      projectId: state.projectId,
      taskId: state.taskId,
      sessionId: state.sessionId,
      restoring: false,
      error: null,
    });
    startTick();
  }, [accountId, startTick]);

  const clearError = useCallback(() => {
    setTimer((prev) => ({ ...prev, error: null }));
  }, []);

  // 应用重新打开时恢复活跃计时器
  useEffect(() => {
    restoreTimer();
    return () => clearTick();
  }, [clearTick, restoreTimer]);

  return {
    timer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    discardTimer,
    restoreTimer,
    clearError,
  };
}

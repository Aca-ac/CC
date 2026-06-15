import { useCallback, useEffect, useRef, useState } from "react";
import { focusSessionRepository } from "../storage/repositories/focusSessionRepository";
import { timerStateRepository } from "../storage/repositories/timerStateRepository";
import { outboxRepository } from "../storage/repositories/outboxRepository";
import type { FocusSessionValue } from "../storage/db";

const ACCOUNT_ID = "local"; // TODO: 从 auth context 获取真实 accountId

export interface TimerState {
  active: boolean;
  elapsedSeconds: number;
  projectId?: string;
  taskId?: string;
  sessionId?: string;
}

export interface UseTimerReturn {
  timer: TimerState;
  startTimer: (projectId: string, taskId?: string) => Promise<void>;
  stopTimer: () => Promise<void>;
  discardTimer: () => Promise<void>;
  restoreTimer: () => Promise<void>;
}

export function useTimer(): UseTimerReturn {
  const [timer, setTimer] = useState<TimerState>({
    active: false,
    elapsedSeconds: 0,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const now = Date.now();
    const elapsed = Math.floor((now - startTimeRef.current) / 1000);
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
        accountId: ACCOUNT_ID,
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
    []
  );

  const startTimer = useCallback(
    async (projectId: string, taskId?: string) => {
      // 每个账户只能有一个活跃计时器
      const existing = await focusSessionRepository.findActive(ACCOUNT_ID);
      if (existing) {
        throw new Error("已有一个活跃计时器，请先停止或丢弃当前计时器");
      }

      const now = Date.now();
      const session: FocusSessionValue = {
        id: crypto.randomUUID(),
        accountId: ACCOUNT_ID,
        projectId,
        taskId,
        startTime: now,
        durationMinutes: 0,
        discarded: false,
        createdAt: now,
        updatedAt: now,
      };

      await focusSessionRepository.create(session);
      await timerStateRepository.set({
        accountId: ACCOUNT_ID,
        active: true,
        sessionId: session.id,
        projectId,
        taskId,
        startTime: now,
        updatedAt: now,
      });
      await enqueue("CREATE", session.id, session);

      startTimeRef.current = now;
      setTimer({
        active: true,
        elapsedSeconds: 0,
        projectId,
        taskId,
        sessionId: session.id,
      });
      startTick();
    },
    [enqueue, startTick]
  );

  const stopTimer = useCallback(async () => {
    if (!timer.active || !timer.sessionId) return;

    const now = Date.now();
    const elapsedMinutes = Math.ceil(timer.elapsedSeconds / 60);

    await focusSessionRepository.update(timer.sessionId, {
      endTime: now,
      durationMinutes: elapsedMinutes,
    });
    await timerStateRepository.clear(ACCOUNT_ID);
    await enqueue("UPDATE", timer.sessionId, {
      endTime: now,
      durationMinutes: elapsedMinutes,
    });

    clearTick();
    setTimer({ active: false, elapsedSeconds: 0 });
  }, [timer.active, timer.sessionId, timer.elapsedSeconds, enqueue, clearTick]);

  const discardTimer = useCallback(async () => {
    if (!timer.active || !timer.sessionId) return;

    await focusSessionRepository.update(timer.sessionId, {
      discarded: true,
      endTime: Date.now(),
    });
    await timerStateRepository.clear(ACCOUNT_ID);
    await enqueue("UPDATE", timer.sessionId, { discarded: true });

    clearTick();
    setTimer({ active: false, elapsedSeconds: 0 });
  }, [timer.active, timer.sessionId, enqueue, clearTick]);

  const restoreTimer = useCallback(async () => {
    const state = await timerStateRepository.get(ACCOUNT_ID);
    if (!state || !state.active || !state.sessionId || !state.startTime) return;

    const session = await focusSessionRepository.findById(state.sessionId);
    if (!session || session.endTime || session.discarded) {
      await timerStateRepository.clear(ACCOUNT_ID);
      return;
    }

    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    startTimeRef.current = state.startTime;
    setTimer({
      active: true,
      elapsedSeconds: elapsed,
      projectId: state.projectId,
      taskId: state.taskId,
      sessionId: state.sessionId,
    });
    startTick();
  }, [startTick]);

  // 应用重新打开时恢复活跃计时器
  useEffect(() => {
    restoreTimer();
    return () => clearTick();
  }, []);

  return {
    timer,
    startTimer,
    stopTimer,
    discardTimer,
    restoreTimer,
  };
}

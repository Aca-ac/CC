import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useTimer } from "../useTimer";
import { focusSessionRepository } from "../../storage/repositories/focusSessionRepository";
import { timerStateRepository } from "../../storage/repositories/timerStateRepository";
import { deleteDB } from "../../storage/db";

const ACCOUNT_ID = "local";

describe("useTimer", () => {
  beforeEach(async () => {
    await deleteDB();
  }, 30000);

  it("should start a new timer", async () => {
    const { result } = renderHook(() => useTimer());

    await act(async () => {
      await result.current.startTimer("project-1", "task-1");
    });

    expect(result.current.timer.active).toBe(true);
    expect(result.current.timer.projectId).toBe("project-1");
    expect(result.current.timer.taskId).toBe("task-1");
    expect(result.current.timer.elapsedSeconds).toBe(0);
  });

  it("should prevent multiple active timers", async () => {
    const { result } = renderHook(() => useTimer());

    await act(async () => {
      await result.current.startTimer("project-1");
    });

    await expect(
      act(async () => {
        await result.current.startTimer("project-2");
      })
    ).rejects.toThrow("已有一个活跃计时器");
  });

  it("should stop timer and save duration", async () => {
    const { result } = renderHook(() => useTimer());

    await act(async () => {
      await result.current.startTimer("project-1");
    });

    // 等待 65 秒让计时器走一会儿
    await act(async () => {
      await new Promise((r) => setTimeout(r, 65000));
    });

    await act(async () => {
      await result.current.stopTimer();
    });

    expect(result.current.timer.active).toBe(false);

    const sessions = await focusSessionRepository.findNonDiscarded(ACCOUNT_ID);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].durationMinutes).toBeGreaterThanOrEqual(1);
    expect(sessions[0].endTime).toBeDefined();

    const state = await timerStateRepository.get(ACCOUNT_ID);
    expect(state).toBeUndefined();
  }, 120000);

  it("should discard timer", async () => {
    const { result } = renderHook(() => useTimer());

    await act(async () => {
      await result.current.startTimer("project-1");
    });

    await act(async () => {
      await result.current.discardTimer();
    });

    expect(result.current.timer.active).toBe(false);

    const sessions = await focusSessionRepository.findAll(ACCOUNT_ID);
    expect(sessions[0].discarded).toBe(true);

    const state = await timerStateRepository.get(ACCOUNT_ID);
    expect(state).toBeUndefined();
  });

  it("should restore active timer on mount", async () => {
    // 先启动一个计时器
    const { result: first, unmount } = renderHook(() => useTimer());

    await act(async () => {
      await first.current.startTimer("project-1", "task-1");
    });

    // 等待 2 分钟
    await act(async () => {
      await new Promise((r) => setTimeout(r, 120000));
    });

    unmount();

    // 模拟应用重新打开，挂载新 hook
    const { result: second } = renderHook(() => useTimer());

    await waitFor(() => {
      expect(second.current.timer.active).toBe(true);
    }, { timeout: 30000 });

    expect(second.current.timer.projectId).toBe("project-1");
    expect(second.current.timer.taskId).toBe("task-1");
    expect(second.current.timer.elapsedSeconds).toBeGreaterThanOrEqual(120);
  }, 240000);

  it("should clear stale timer state if session already ended", async () => {
    const { result: first, unmount } = renderHook(() => useTimer());

    await act(async () => {
      await first.current.startTimer("project-1");
    });

    await act(async () => {
      await first.current.stopTimer();
    });

    unmount();

    const { result: second } = renderHook(() => useTimer());

    await waitFor(() => {
      expect(second.current.timer.active).toBe(false);
    });

    const state = await timerStateRepository.get(ACCOUNT_ID);
    expect(state).toBeUndefined();
  });
});

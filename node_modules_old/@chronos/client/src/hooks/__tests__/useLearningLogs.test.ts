import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useLearningLogs } from "../useLearningLogs";
import { learningLogRepository } from "../../storage/repositories/learningLogRepository";
import { focusSessionRepository } from "../../storage/repositories/focusSessionRepository";
import { deleteDB } from "../../storage/db";

const ACCOUNT_ID = "local";

describe("useLearningLogs", () => {
  beforeEach(async () => {
    await deleteDB();
  });

  it("should show empty state initially", async () => {
    const { result } = renderHook(() => useLearningLogs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.logs).toHaveLength(0);
  });

  it("should create manual log and appear in list", async () => {
    const { result } = renderHook(() => useLearningLogs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.createManualLog({
        projectId: "project-1",
        taskId: "task-1",
        content: "学习了 React Hooks",
        actualMinutes: 45,
        difficulty: 3,
        links: ["https://react.dev"],
      });
    });

    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0].type).toBe("manual");
    expect(result.current.logs[0].content).toBe("学习了 React Hooks");
    expect(result.current.logs[0].actualMinutes).toBe(45);
  });

  it("should include completed timer sessions in unified list", async () => {
    // 先创建一个已完成的计时器 session
    const session = {
      id: "session-1",
      accountId: ACCOUNT_ID,
      projectId: "project-1",
      taskId: "task-1",
      startTime: Date.now() - 3600000,
      endTime: Date.now(),
      durationMinutes: 30,
      discarded: false,
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now(),
    };
    await focusSessionRepository.create(session);

    const { result } = renderHook(() => useLearningLogs());

    await waitFor(() => {
      expect(result.current.logs.length).toBeGreaterThan(0);
    });

    const timerLog = result.current.logs.find((l) => l.type === "timer");
    expect(timerLog).toBeDefined();
    expect(timerLog?.actualMinutes).toBe(30);
  });

  it("should not include discarded or active timer sessions", async () => {
    const discardedSession = {
      id: "session-discarded",
      accountId: ACCOUNT_ID,
      projectId: "project-1",
      startTime: Date.now() - 3600000,
      endTime: Date.now(),
      durationMinutes: 20,
      discarded: true,
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now(),
    };
    const activeSession = {
      id: "session-active",
      accountId: ACCOUNT_ID,
      projectId: "project-1",
      startTime: Date.now() - 1800000,
      durationMinutes: 0,
      discarded: false,
      createdAt: Date.now() - 1800000,
      updatedAt: Date.now(),
    };
    await focusSessionRepository.create(discardedSession);
    await focusSessionRepository.create(activeSession);

    const { result } = renderHook(() => useLearningLogs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.logs).toHaveLength(0);
  });

  it("should sort logs by createdAt descending", async () => {
    await act(async () => {
      await learningLogRepository.create({
        id: "log-1",
        accountId: ACCOUNT_ID,
        projectId: "project-1",
        content: "旧日志",
        actualMinutes: 30,
        difficulty: 3,
        links: [],
        createdAt: Date.now() - 7200000,
        updatedAt: Date.now() - 7200000,
        deleted: false,
      });
    });

    await act(async () => {
      await learningLogRepository.create({
        id: "log-2",
        accountId: ACCOUNT_ID,
        projectId: "project-1",
        content: "新日志",
        actualMinutes: 45,
        difficulty: 4,
        links: [],
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now() - 3600000,
        deleted: false,
      });
    });

    const { result } = renderHook(() => useLearningLogs());

    await waitFor(() => {
      expect(result.current.logs.length).toBe(2);
    });

    expect(result.current.logs[0].content).toBe("新日志");
    expect(result.current.logs[1].content).toBe("旧日志");
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAiAdvice } from "../useAiAdvice";
import { apiClient } from "../../services/apiClient";

const accountMock = vi.hoisted(() => ({ value: "user-1" }));

vi.mock("../useAccountId", () => ({ useAccountId: () => accountMock.value }));

vi.mock("../../services/apiClient", () => ({
  apiClient: { aiAdvice: vi.fn() },
}));

const mocked = vi.mocked(apiClient);

describe("useAiAdvice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    accountMock.value = "user-1";
  });

  it("loads advice from POST /ai/advice for a real account", async () => {
    mocked.aiAdvice.mockResolvedValue({
      adviceId: "a1",
      title: "本周学习建议",
      content: "保持每天专注 1 小时。",
      type: "WEEKLY_ADVICE",
      generatedAt: "2026-06-18T09:00:00",
    });

    const { result } = renderHook(() => useAiAdvice());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mocked.aiAdvice).toHaveBeenCalledTimes(1);
    expect(result.current.advice).toHaveLength(1);
    expect(result.current.advice[0].content).toContain("专注");
  });

  it("does not call the API for the local demo account", async () => {
    accountMock.value = "local";
    const { result } = renderHook(() => useAiAdvice());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mocked.aiAdvice).not.toHaveBeenCalled();
    expect(result.current.advice).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });
});

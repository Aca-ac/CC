import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useHabits } from "../useHabits";
import { apiClient, type HabitDTO } from "../../services/apiClient";

vi.mock("../../services/apiClient", () => ({
  apiClient: {
    listHabits: vi.fn(),
    createHabit: vi.fn(),
    deleteHabit: vi.fn(),
    checkinHabit: vi.fn(),
  },
}));

const mocked = vi.mocked(apiClient);

function habit(overrides: Partial<HabitDTO> = {}): HabitDTO {
  return {
    id: "h1",
    name: "每天阅读",
    ruleText: "30 分钟",
    streakCount: 0,
    status: "ACTIVE",
    createdAt: "2026-06-18T00:00:00",
    updatedAt: "2026-06-18T00:00:00",
    ...overrides,
  };
}

describe("useHabits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.listHabits.mockResolvedValue([]);
  });

  it("loads habits on mount", async () => {
    mocked.listHabits.mockResolvedValue([habit({ id: "h1", streakCount: 3 })]);
    const { result } = renderHook(() => useHabits());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.habits).toHaveLength(1);
    expect(result.current.habits[0].streakCount).toBe(3);
    expect(result.current.error).toBeNull();
  });

  it("surfaces an error (offline) without throwing", async () => {
    mocked.listHabits.mockRejectedValue(new Error("HTTP 401: Unauthorized"));
    const { result } = renderHook(() => useHabits());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.habits).toHaveLength(0);
    expect(result.current.error).toContain("401");
  });

  it("prepends a created habit", async () => {
    const { result } = renderHook(() => useHabits());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mocked.createHabit.mockResolvedValue(habit({ id: "h2", name: "背单词" }));
    await act(async () => {
      await result.current.createHabit({ name: "背单词" });
    });

    expect(result.current.habits[0].name).toBe("背单词");
  });

  it("checks in and updates streak + checkedToday", async () => {
    mocked.listHabits.mockResolvedValue([habit({ id: "h1", streakCount: 1 })]);
    const { result } = renderHook(() => useHabits());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mocked.checkinHabit.mockResolvedValue({
      id: "c1",
      habitId: "h1",
      checkedDate: "2026-06-18",
      checkedAt: "2026-06-18T09:00:00",
      note: null,
      streakCount: 2,
    });
    await act(async () => {
      await result.current.checkin("h1");
    });

    expect(result.current.habits[0].streakCount).toBe(2);
    expect(result.current.checkedToday.has("h1")).toBe(true);
  });

  it("removes a deleted habit", async () => {
    mocked.listHabits.mockResolvedValue([habit({ id: "h1" }), habit({ id: "h2" })]);
    const { result } = renderHook(() => useHabits());
    await waitFor(() => expect(result.current.habits).toHaveLength(2));

    mocked.deleteHabit.mockResolvedValue(undefined);
    await act(async () => {
      await result.current.deleteHabit("h1");
    });

    expect(result.current.habits.map((h) => h.id)).toEqual(["h2"]);
  });
});

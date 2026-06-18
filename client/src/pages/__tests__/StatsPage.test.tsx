import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { StatsPage } from "../StatsPage";

const statsMocks = vi.hoisted(() => ({
  useStats: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("../../hooks/useStats", () => ({
  useStats: statsMocks.useStats,
}));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("StatsPage", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserverStub);
    statsMocks.refresh.mockReset();
    statsMocks.useStats.mockReturnValue({
      stats: {
        totalCompleted: 6,
        completionRate: 75,
        dailyMinutes: [
          { date: "2026-06-16", minutes: 45 },
          { date: "2026-06-17", minutes: 60 },
          { date: "2026-06-18", minutes: 75 },
        ],
        projectDistribution: [
          { projectId: "p1", projectName: "代数", minutes: 180 },
        ],
      },
      loading: false,
      error: null,
      cached: false,
      refresh: statsMocks.refresh,
    });
  });

  it("renders redesigned stats dashboard with project distribution", async () => {
    render(<StatsPage />);

    await waitFor(() => {
      expect(screen.getByText("学习统计")).toBeDefined();
    });

    expect(screen.getByText("本周完成数")).toBeDefined();
    expect(screen.getByText("代数")).toBeDefined();
    expect(screen.getAllByText("180 分钟").length).toBeGreaterThan(0);
  });
});

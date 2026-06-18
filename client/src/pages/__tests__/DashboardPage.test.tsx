import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "../DashboardPage";
import { deleteDB } from "../../storage/db";
import { taskRepository } from "../../storage/repositories/taskRepository";

// DashboardPage 现在使用 <Link>，渲染时需要 Router 上下文。
function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

describe("DashboardPage", () => {
  beforeEach(async () => {
    await deleteDB();
  }, 30000);

  it("renders empty dashboard with zero metrics", async () => {
    renderDashboard();

    // 四张统计卡（StatCard 渲染为 <article>）
    await waitFor(() => {
      expect(screen.getAllByRole("article").length).toBe(4);
    });

    // 空状态下各指标为 0（含 "0"、"0 天"、"0%" 等以 0 开头的数值）
    expect(screen.getAllByText(/^0/).length).toBeGreaterThanOrEqual(4);
  });

  it("reflects local task changes immediately", async () => {
    const today = new Date().toISOString().slice(0, 10);

    await taskRepository.create({
      id: "task-1",
      accountId: "local",
      projectId: "project-1",
      title: "线性代数复习",
      status: "TODO",
      priority: "HIGH",
      estimatedMinutes: 30,
      actualMinutes: 0,
      tags: [],
      dueTime: `${today}T10:00:00.000Z`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deleted: false,
    });

    renderDashboard();

    // 任务标题出现在「今日下一步」列表中
    await waitFor(() => {
      expect(screen.getByText("线性代数复习")).toBeDefined();
    });
    // 「今日任务」统计标签存在
    expect(screen.getByText("今日任务")).toBeDefined();
  });

  it("shows offline badge when navigator is offline", async () => {
    const originalOnLine = Object.getOwnPropertyDescriptor(navigator, "onLine");
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true, writable: true });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("离线模式")).toBeDefined();
    });

    if (originalOnLine) {
      Object.defineProperty(navigator, "onLine", originalOnLine);
    }
  });
});

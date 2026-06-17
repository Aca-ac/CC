import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DashboardPage } from "../DashboardPage";
import { deleteDB } from "../../storage/db";
import { taskRepository } from "../../storage/repositories/taskRepository";

describe("DashboardPage", () => {
  beforeEach(async () => {
    await deleteDB();
  }, 30000);

  it("renders empty dashboard with zero metrics", async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("今日看板")).toBeDefined();
    });

    // Check metrics are 0
    const cards = screen.getAllByRole("article");
    expect(cards.length).toBe(4);

    expect(screen.getByText("0")).toBeDefined();
  });

  it("reflects local task changes immediately", async () => {
    const today = new Date().toISOString().slice(0, 10);

    await taskRepository.create({
      id: "task-1",
      accountId: "local",
      projectId: "project-1",
      title: "今日任务",
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

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("今日任务")).toBeDefined();
    });

    expect(screen.getByText("1")).toBeDefined(); // todayTaskTotal
  });

  it("shows offline badge when navigator is offline", async () => {
    const originalOnLine = Object.getOwnPropertyDescriptor(navigator, "onLine");
    Object.defineProperty(navigator, "onLine", { value: false, writable: true });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("离线模式")).toBeDefined();
    });

    if (originalOnLine) {
      Object.defineProperty(navigator, "onLine", originalOnLine);
    }
  });
});

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

    let cards: HTMLElement[] = [];
    await waitFor(() => {
      cards = screen.getAllByRole("article");
      expect(cards.length).toBe(4);
    });

    // Check metrics are 0
    expect(cards.length).toBe(4);

    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(4);
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
      expect(screen.getAllByText("今日任务").length).toBeGreaterThan(0);
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

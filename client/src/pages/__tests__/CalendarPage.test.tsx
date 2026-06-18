import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CalendarPage } from "../CalendarPage";
import { deleteDB } from "../../storage/db";
import { taskRepository } from "../../storage/repositories/taskRepository";

function renderCalendar() {
  return render(
    <MemoryRouter>
      <CalendarPage />
    </MemoryRouter>
  );
}

describe("CalendarPage", () => {
  beforeEach(async () => {
    await deleteDB();
  }, 30000);

  it("renders the redesigned weekly calendar with local due tasks", async () => {
    const today = new Date().toISOString().slice(0, 10);

    await taskRepository.create({
      id: "task-calendar-1",
      accountId: "local",
      projectId: "project-1",
      title: "线性代数复习",
      status: "TODO",
      priority: "HIGH",
      estimatedMinutes: 45,
      actualMinutes: 0,
      tags: ["math"],
      dueTime: `${today}T10:00:00.000Z`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deleted: false,
    });

    renderCalendar();

    await waitFor(() => {
      expect(screen.getByText("日历计划")).toBeDefined();
    });

    expect(screen.getByText("周视图")).toBeDefined();
    await waitFor(() => {
      expect(screen.getByText("线性代数复习")).toBeDefined();
    });
  });

  it("switches from week view to month view", async () => {
    renderCalendar();

    await waitFor(() => {
      expect(screen.getByText("日历计划")).toBeDefined();
    });

    fireEvent.click(screen.getByRole("button", { name: /月视图/ }));

    expect(screen.getByText("月度安排")).toBeDefined();
  });
});

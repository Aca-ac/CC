import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TasksPage } from "../TasksPage";
import { deleteDB } from "../../storage/db";
import { projectRepository } from "../../storage/repositories/projectRepository";
import { taskRepository } from "../../storage/repositories/taskRepository";

vi.stubGlobal("crypto", {
  ...globalThis.crypto,
  randomUUID: () => "task-uuid-456",
});

describe("TasksPage", () => {
  beforeEach(async () => {
    await deleteDB();
  }, 30000);

  it("renders empty state and shows validation error without projectId", async () => {
    render(<TasksPage />);

    await waitFor(() => {
      expect(screen.getByText(/暂无任务/)).toBeDefined();
    });

    expect(screen.getByLabelText(/状态筛选/)).toBeDefined();
    expect(screen.getByLabelText(/优先级筛选/)).toBeDefined();

    fireEvent.click(screen.getByText("新建任务"));

    fireEvent.change(screen.getByLabelText(/标题/), {
      target: { value: "测试任务" },
    });

    fireEvent.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(screen.getByText(/请选择所属项目/)).toBeDefined();
    });
  });

  it("shows offline badge when navigator is offline", async () => {
    const originalOnLine = Object.getOwnPropertyDescriptor(navigator, "onLine");
    Object.defineProperty(navigator, "onLine", { value: false, writable: true });

    render(<TasksPage />);

    await waitFor(() => {
      expect(screen.getByText("离线模式")).toBeDefined();
    });

    if (originalOnLine) {
      Object.defineProperty(navigator, "onLine", originalOnLine);
    }
  });

  it("filters by tag and exposes existing tasks as parent options", async () => {
    await projectRepository.create({
      id: "project-1",
      accountId: "local",
      name: "测试项目",
      goal: "完成测试",
      startDate: "2026-06-18",
      endDate: "",
      status: "ACTIVE",
      progress: 0,
      createdAt: 100,
      updatedAt: 100,
      deleted: false,
    });
    await taskRepository.create({
      id: "task-parent",
      accountId: "local",
      projectId: "project-1",
      title: "章节复习",
      status: "TODO",
      priority: "MEDIUM",
      estimatedMinutes: 45,
      actualMinutes: 0,
      tags: ["数学"],
      orderIndex: 0,
      createdAt: 100,
      updatedAt: 100,
      deleted: false,
    });
    await taskRepository.create({
      id: "task-child",
      accountId: "local",
      projectId: "project-1",
      parentTaskId: "task-parent",
      title: "公式整理",
      status: "TODO",
      priority: "LOW",
      estimatedMinutes: 20,
      actualMinutes: 0,
      tags: ["写作"],
      orderIndex: 1,
      createdAt: 200,
      updatedAt: 200,
      deleted: false,
    });

    render(<TasksPage />);

    await waitFor(() => {
      expect(screen.getByText("章节复习")).toBeDefined();
      expect(screen.getByText("公式整理")).toBeDefined();
    });

    fireEvent.change(screen.getByLabelText(/标签筛选/), {
      target: { value: "写作" },
    });

    await waitFor(() => {
      expect(screen.queryByText("章节复习")).toBeNull();
      expect(screen.getByText("公式整理")).toBeDefined();
    });

    fireEvent.click(screen.getByText("新建任务"));

    const parentSelect = screen.getByLabelText(/父任务/) as HTMLSelectElement;
    expect(Array.from(parentSelect.options).map((option) => option.text)).toContain("章节复习");
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TasksPage } from "../TasksPage";
import { deleteDB } from "../../storage/db";

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
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProjectsPage } from "../ProjectsPage";
import { deleteDB } from "../../storage/db";

// Mock crypto.randomUUID for predictable IDs
vi.stubGlobal("crypto", {
  ...globalThis.crypto,
  randomUUID: () => "test-uuid-123",
});

describe("ProjectsPage", () => {
  beforeEach(async () => {
    await deleteDB();
  }, 30000);

  it("renders empty state and allows creating a project", async () => {
    render(<ProjectsPage />);

    // Wait for loading to finish, then check empty state
    await waitFor(() => {
      expect(screen.getByText(/暂无项目/)).toBeDefined();
    });

    // Open create form
    fireEvent.click(screen.getByText("新建项目"));
    expect(screen.getByText("新建项目")).toBeDefined();

    // Fill form
    fireEvent.change(screen.getByLabelText(/名称/), {
      target: { value: "测试项目" },
    });
    fireEvent.change(screen.getByLabelText(/目标/), {
      target: { value: "测试目标" },
    });

    // Submit
    fireEvent.click(screen.getByText("保存"));

    // Wait for project to appear
    await waitFor(() => {
      expect(screen.getByText("测试项目")).toBeDefined();
    });

    // Edit
    fireEvent.click(screen.getByText("编辑"));
    expect(screen.getByDisplayValue("测试项目")).toBeDefined();

    fireEvent.change(screen.getByLabelText(/名称/), {
      target: { value: "修改后项目" },
    });
    fireEvent.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(screen.getByText("修改后项目")).toBeDefined();
    });

    // Delete
    const deleteBtn = screen.getByText("删除");
    // Mock confirm
    vi.stubGlobal("confirm", () => true);
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.queryByText("修改后项目")).toBeNull();
    });
  });

  it("shows offline badge when navigator is offline", async () => {
    // Mock offline
    const originalOnLine = Object.getOwnPropertyDescriptor(navigator, "onLine");
    Object.defineProperty(navigator, "onLine", { value: false, writable: true });

    render(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText("离线模式")).toBeDefined();
    });

    // Restore
    if (originalOnLine) {
      Object.defineProperty(navigator, "onLine", originalOnLine);
    }
  });
});

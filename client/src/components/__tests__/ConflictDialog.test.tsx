import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConflictDialog } from "../ConflictDialog";
import type { ConflictValue } from "../../storage/db";

const conflicts: ConflictValue[] = [
  {
    id: "conflict-1",
    accountId: "local",
    entityType: "TASK",
    entityId: "task-1",
    localData: JSON.stringify({ title: "本地任务", status: "TODO" }),
    remoteData: JSON.stringify({ title: "云端任务", status: "DONE" }),
    resolved: false,
    createdAt: 1_720_000_000_000,
  },
  {
    id: "conflict-2",
    accountId: "local",
    entityType: "PROJECT",
    entityId: "project-1",
    localData: JSON.stringify({ name: "本地项目" }),
    remoteData: JSON.stringify({ name: "云端项目" }),
    resolved: false,
    createdAt: 1_720_000_001_000,
  },
];

describe("ConflictDialog", () => {
  it("renders redesigned local/cloud comparison and resolves current conflict", async () => {
    const onResolve = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();

    render(
      <ConflictDialog
        open
        conflicts={conflicts}
        resolving={false}
        error={null}
        onClose={onClose}
        onResolve={onResolve}
      />
    );

    expect(screen.getByRole("dialog", { name: "数据冲突" })).toBeDefined();
    expect(screen.getByText("第 1 / 2 个冲突")).toBeDefined();
    expect(screen.getByText("本机副本")).toBeDefined();
    expect(screen.getByText("云端副本")).toBeDefined();

    fireEvent.click(screen.getByText("保留本机副本"));

    await waitFor(() => {
      expect(onResolve).toHaveBeenCalledWith("conflict-1", "local");
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});

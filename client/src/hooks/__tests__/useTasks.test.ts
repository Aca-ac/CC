import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { deleteDB } from "../../storage/db";
import { taskRepository } from "../../storage/repositories/taskRepository";
import { useTasks } from "../useTasks";

describe("useTasks", () => {
  beforeEach(async () => {
    await deleteDB();
  });

  it("sorts by orderIndex and persists manual reordering", async () => {
    await taskRepository.create({
      id: "task-a",
      accountId: "local",
      projectId: "project-1",
      title: "A",
      status: "TODO",
      priority: "MEDIUM",
      estimatedMinutes: 20,
      actualMinutes: 0,
      tags: [],
      orderIndex: 2,
      createdAt: 100,
      updatedAt: 100,
      deleted: false,
    });
    await taskRepository.create({
      id: "task-b",
      accountId: "local",
      projectId: "project-1",
      title: "B",
      status: "TODO",
      priority: "MEDIUM",
      estimatedMinutes: 20,
      actualMinutes: 0,
      tags: [],
      orderIndex: 1,
      createdAt: 200,
      updatedAt: 200,
      deleted: false,
    });

    const { result } = renderHook(() => useTasks());

    await waitFor(() => {
      expect(result.current.tasks.map((task) => task.id)).toEqual(["task-b", "task-a"]);
    });

    await act(async () => {
      await result.current.reorderTasks(["task-a", "task-b"]);
    });

    expect(result.current.tasks.map((task) => task.id)).toEqual(["task-a", "task-b"]);
    expect((await taskRepository.findById("task-a"))?.orderIndex).toBe(0);
    expect((await taskRepository.findById("task-b"))?.orderIndex).toBe(1);
  });
});

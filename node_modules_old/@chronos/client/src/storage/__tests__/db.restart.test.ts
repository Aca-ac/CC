import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { closeDB, deleteDB } from "../db";
import {
  projectRepository,
  taskRepository,
  outboxRepository,
} from "../repositories";
import { createMutation } from "../mutation";

describe("IndexedDB Restart Persistence", () => {
  beforeEach(async () => {
    await deleteDB();
  });

  afterEach(async () => {
    await closeDB();
  });

  it("should retain offline create operations after restart", async () => {
    const accountId = "user-123";

    const project = await projectRepository.createProject(accountId, {
      name: "Offline Project",
      goal: "Created while offline",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      status: "ACTIVE",
      progress: 0,
    });

    await taskRepository.createTask(accountId, project.id, {
      title: "Offline Task",
      description: "A task created offline",
      status: "TODO",
      priority: "HIGH",
      estimatedMinutes: 60,
      actualMinutes: 0,
      tags: [],
    });

    await closeDB();

    const projects = await projectRepository.findAll(accountId);
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe("Offline Project");

    const tasks = await taskRepository.findAll(accountId);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Offline Task");
  });

  it("should retain outbox entries with retry state after restart", async () => {
    const accountId = "user-456";
    const mutation = createMutation("CREATE", "PROJECT", "proj-1", {
      name: "Test",
    });

    await outboxRepository.create({
      mutationId: mutation.mutationId,
      accountId,
      operation: mutation.operation,
      entityType: mutation.entityType,
      entityId: mutation.entityId,
      payload: JSON.stringify(mutation.payload),
      status: "pending",
      retryCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await closeDB();

    const entries = await outboxRepository.findPending(accountId);
    expect(entries).toHaveLength(1);
    expect(entries[0].mutationId).toBe(mutation.mutationId);
    expect(entries[0].status).toBe("pending");
    expect(entries[0].retryCount).toBe(0);
  });

  it("should isolate data between different accounts", async () => {
    const accountA = "account-a";
    const accountB = "account-b";

    await projectRepository.createProject(accountA, {
      name: "Project A",
      goal: "Belongs to A",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      status: "ACTIVE",
      progress: 0,
    });

    await projectRepository.createProject(accountB, {
      name: "Project B",
      goal: "Belongs to B",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      status: "ACTIVE",
      progress: 0,
    });

    await closeDB();

    const projectsA = await projectRepository.findAll(accountA);
    expect(projectsA).toHaveLength(1);
    expect(projectsA[0].name).toBe("Project A");

    const projectsB = await projectRepository.findAll(accountB);
    expect(projectsB).toHaveLength(1);
    expect(projectsB[0].name).toBe("Project B");

    const crossCheck = await projectRepository.findAll(accountA);
    expect(crossCheck.some((p) => p.name === "Project B")).toBe(false);
  });
});

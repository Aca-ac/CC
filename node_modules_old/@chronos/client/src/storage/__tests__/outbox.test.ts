import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { closeDB, deleteDB } from "../db";
import { outboxRepository } from "../repositories";
import { createMutation } from "../mutation";

describe("Outbox Repository", () => {
  const accountId = "test-account";

  beforeEach(async () => {
    await deleteDB();
  });

  afterEach(async () => {
    await closeDB();
  });

  it("should create and retrieve pending entries", async () => {
    const mutation = createMutation("CREATE", "TASK", "task-1", {
      title: "Test Task",
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

    const pending = await outboxRepository.findPending(accountId);
    expect(pending).toHaveLength(1);
    expect(pending[0].status).toBe("pending");
  });

  it("should update status to failed and increment retry count", async () => {
    const mutation = createMutation("UPDATE", "PROJECT", "proj-1", {
      name: "Updated",
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

    await outboxRepository.updateStatus(mutation.mutationId, "failed", "Network timeout");

    const entries = await outboxRepository.findAll(accountId);
    expect(entries[0].status).toBe("failed");
    expect(entries[0].retryCount).toBe(1);
    expect(entries[0].lastError).toBe("Network timeout");
  });

  it("should update status to conflict", async () => {
    const mutation = createMutation("DELETE", "LOG", "log-1", {});

    await outboxRepository.create({
      mutationId: mutation.mutationId,
      accountId,
      operation: mutation.operation,
      entityType: mutation.entityType,
      entityId: mutation.entityId,
      payload: JSON.stringify(mutation.payload),
      status: "syncing",
      retryCount: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await outboxRepository.updateStatus(mutation.mutationId, "conflict", "Version mismatch");

    const entries = await outboxRepository.findAll(accountId);
    expect(entries[0].status).toBe("conflict");
    expect(entries[0].lastError).toBe("Version mismatch");
  });

  it("should clear synced entries", async () => {
    const mutation = createMutation("CREATE", "TASK", "task-2", {});

    await outboxRepository.create({
      mutationId: mutation.mutationId,
      accountId,
      operation: mutation.operation,
      entityType: mutation.entityType,
      entityId: mutation.entityId,
      payload: JSON.stringify(mutation.payload),
      status: "synced",
      retryCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await outboxRepository.clearSynced(accountId);

    const entries = await outboxRepository.findAll(accountId);
    expect(entries).toHaveLength(0);
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { closeDB, deleteDB } from "../db";
import { conflictRepository } from "../repositories";
import type { ConflictValue } from "../db";

function makeConflict(overrides: Partial<ConflictValue> = {}): ConflictValue {
  return {
    id: `conflict-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    accountId: "test-account",
    entityType: "TASK",
    entityId: "task-1",
    localData: JSON.stringify({ title: "本地标题", status: "TODO" }),
    remoteData: JSON.stringify({ title: "云端标题", status: "DONE" }),
    resolved: false,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe("Conflict Repository", () => {
  const accountId = "test-account";

  beforeEach(async () => {
    await deleteDB();
  });

  afterEach(async () => {
    await closeDB();
  });

  it("should create and retrieve conflicts by account", async () => {
    const conflict = makeConflict();
    await conflictRepository.create(conflict);

    const all = await conflictRepository.findAll(accountId);
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(conflict.id);
    expect(all[0].entityType).toBe("TASK");
    expect(all[0].resolved).toBe(false);
  });

  it("should filter unresolved conflicts", async () => {
    const unresolved = makeConflict({ id: "c1", resolved: false });
    const resolved = makeConflict({
      id: "c2",
      resolved: true,
      resolution: "local",
    });

    await conflictRepository.create(unresolved);
    await conflictRepository.create(resolved);

    const pending = await conflictRepository.findUnresolved(accountId);
    expect(pending).toHaveLength(1);
    expect(pending[0].id).toBe("c1");
  });

  it("should resolve a conflict with local or remote", async () => {
    const conflict = makeConflict({ id: "c-resolve" });
    await conflictRepository.create(conflict);

    await conflictRepository.resolve("c-resolve", "local");

    const all = await conflictRepository.findAll(accountId);
    expect(all[0].resolved).toBe(true);
    expect(all[0].resolution).toBe("local");
  });

  it("should isolate conflicts by accountId", async () => {
    const conflictA = makeConflict({ id: "c-a", accountId: "account-A" });
    const conflictB = makeConflict({ id: "c-b", accountId: "account-B" });

    await conflictRepository.create(conflictA);
    await conflictRepository.create(conflictB);

    const allA = await conflictRepository.findAll("account-A");
    const allB = await conflictRepository.findAll("account-B");

    expect(allA).toHaveLength(1);
    expect(allA[0].id).toBe("c-a");
    expect(allB).toHaveLength(1);
    expect(allB[0].id).toBe("c-b");
  });
});

import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { closeDB, deleteDB } from "../../storage/db";
import { outboxRepository } from "../../storage/repositories/outboxRepository";
import { conflictRepository } from "../../storage/repositories/conflictRepository";
import { createMutation } from "../../storage/mutation";
import { pushPendingMutations } from "../syncService";

// 对 apiClient 进行 mock，使用真实的 fake-indexeddb 支持的仓库
vi.mock("../apiClient", () => ({
  apiClient: {
    syncPush: vi.fn(),
    syncPull: vi.fn(),
    resolveConflict: vi.fn(),
  },
}));

// 导入 mock 后的 apiClient 以便在测试中配置返回值
import { apiClient } from "../apiClient";

describe("syncService — pushPendingMutations", () => {
  const accountId = "test-sync-account";

  beforeEach(async () => {
    await deleteDB();
    vi.clearAllMocks();
    // syncPull 的默认 mock（fullSync 内部会调用，但本测试只关注 pushPendingMutations）
    vi.mocked(apiClient.syncPull).mockResolvedValue({ changes: [], cursor: "" });
  });

  afterEach(async () => {
    await closeDB();
  });

  it("push success → 返回 pushed=1，outbox 条目状态变为 synced", async () => {
    // 准备：向 outbox 写入一条 pending 的 TASK CREATE 记录
    const mutation = createMutation("CREATE", "TASK", "task-push-1", {
      title: "测试任务",
      updatedAt: Date.now(),
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

    // mock syncPush 返回成功、无冲突
    vi.mocked(apiClient.syncPush).mockResolvedValue({ accepted: 1, conflicts: [] });

    const result = await pushPendingMutations(accountId);

    // 断言：pushed 计数正确
    expect(result.pushed).toBe(1);
    expect(result.conflicts).toHaveLength(0);
    expect(result.errors).toHaveLength(0);

    // 断言：outbox 条目最终状态为 synced
    const entries = await outboxRepository.findAll(accountId);
    expect(entries).toHaveLength(1);
    expect(entries[0].status).toBe("synced");
  });

  it("push conflict → outbox 条目状态变为 conflict，冲突被持久化到 conflictRepository", async () => {
    // 准备：向 outbox 写入一条 pending 的 PROJECT UPDATE 记录
    const mutation = createMutation("UPDATE", "PROJECT", "proj-conflict-1", {
      name: "本地修改的项目名",
      updatedAt: Date.now(),
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

    // mock syncPush 返回冲突
    vi.mocked(apiClient.syncPush).mockResolvedValue({
      accepted: 0,
      conflicts: [
        {
          id: "c1",
          entityType: "PROJECT",
          entityId: mutation.entityId, // 与 outbox 条目的 entityId 对应，确保 syncService 能匹配
          clientPayload: { name: "本地修改的项目名" },
          serverPayload: { name: "服务端最新项目名" },
        },
      ],
    });

    const result = await pushPendingMutations(accountId);

    // 断言：conflicts 返回列表非空
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].entityId).toBe(mutation.entityId);

    // 断言：outbox 条目最终状态为 conflict
    const entries = await outboxRepository.findAll(accountId);
    expect(entries).toHaveLength(1);
    expect(entries[0].status).toBe("conflict");

    // 断言：冲突已持久化到 conflictRepository
    const unresolved = await conflictRepository.findUnresolved(accountId);
    expect(unresolved).toHaveLength(1);
    expect(unresolved[0].entityId).toBe(mutation.entityId);
    expect(unresolved[0].resolved).toBe(false);
  });
});

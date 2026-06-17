import { getDB } from "../db";
import type { OutboxValue, OutboxStatus } from "../db";

export class OutboxRepository {
  async findAll(accountId: string): Promise<OutboxValue[]> {
    const db = await getDB();
    const index = db.transaction("outbox").store.index("by-account");
    return index.getAll(accountId) as Promise<OutboxValue[]>;
  }

  async findPending(accountId: string): Promise<OutboxValue[]> {
    const db = await getDB();
    const store = db.transaction("outbox").store;
    const accountIndex = store.index("by-account");
    const all = await accountIndex.getAll(accountId);
    return all.filter(
      (e) => e.status === "pending" || e.status === "failed" || e.status === "conflict"
    );
  }

  async create(entry: OutboxValue): Promise<void> {
    const db = await getDB();
    await db.add("outbox", entry);
  }

  async updateStatus(
    mutationId: string,
    status: OutboxStatus,
    error?: string
  ): Promise<void> {
    const db = await getDB();
    const existing = await db.get("outbox", mutationId);
    if (!existing) throw new Error(`Outbox entry ${mutationId} not found`);

    const retryCount =
      status === "failed" ? existing.retryCount + 1 : existing.retryCount;

    await db.put("outbox", {
      ...existing,
      status,
      retryCount,
      lastError: error,
      updatedAt: Date.now(),
    });
  }

  async remove(mutationId: string): Promise<void> {
    const db = await getDB();
    await db.delete("outbox", mutationId);
  }

  async clearSynced(accountId: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction("outbox", "readwrite");
    const index = tx.store.index("by-account");
    const entries = await index.getAll(accountId);

    for (const entry of entries) {
      if (entry.status === "synced") {
        await tx.store.delete(entry.mutationId);
      }
    }
  }
}

export const outboxRepository = new OutboxRepository();

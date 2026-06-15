import { getDB } from "../db";
import type { FocusSessionValue } from "../db";

export class FocusSessionRepository {
  protected storeName = "focusSessions" as const;

  async findAll(accountId: string): Promise<FocusSessionValue[]> {
    const db = await getDB();
    const index = db.transaction(this.storeName).store.index("by-account");
    return index.getAll(accountId) as Promise<FocusSessionValue[]>;
  }

  async findById(id: string): Promise<FocusSessionValue | undefined> {
    const db = await getDB();
    return db.get(this.storeName, id) as Promise<FocusSessionValue | undefined>;
  }

  async create(entity: FocusSessionValue): Promise<void> {
    const db = await getDB();
    await db.add(this.storeName, entity as unknown as Record<string, unknown>);
  }

  async update(id: string, changes: Partial<FocusSessionValue>): Promise<void> {
    const db = await getDB();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`FocusSession ${id} not found`);
    const updated = { ...existing, ...changes, updatedAt: Date.now() };
    await db.put(this.storeName, updated as unknown as Record<string, unknown>);
  }

  async findActive(accountId: string): Promise<FocusSessionValue | undefined> {
    const all = await this.findAll(accountId);
    return all.find((s) => !s.endTime && !s.discarded);
  }

  async findNonDiscarded(accountId: string): Promise<FocusSessionValue[]> {
    const all = await this.findAll(accountId);
    return all.filter((s) => !s.discarded).sort((a, b) => b.startTime - a.startTime);
  }
}

export const focusSessionRepository = new FocusSessionRepository();

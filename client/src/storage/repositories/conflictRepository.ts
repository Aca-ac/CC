import { getDB } from "../db";
import type { ConflictValue } from "../db";

export class ConflictRepository {
  async findAll(accountId: string): Promise<ConflictValue[]> {
    const db = await getDB();
    const index = db.transaction("conflicts").store.index("by-account");
    return index.getAll(accountId) as Promise<ConflictValue[]>;
  }

  async findUnresolved(accountId: string): Promise<ConflictValue[]> {
    const all = await this.findAll(accountId);
    return all.filter((c) => !c.resolved);
  }

  async create(conflict: ConflictValue): Promise<void> {
    const db = await getDB();
    await db.add("conflicts", conflict);
  }

  async resolve(
    id: string,
    resolution: "local" | "remote" | "merge"
  ): Promise<void> {
    const db = await getDB();
    const existing = await db.get("conflicts", id);
    if (!existing) throw new Error(`Conflict ${id} not found`);

    await db.put("conflicts", {
      ...existing,
      resolved: true,
      resolution,
    });
  }
}

export const conflictRepository = new ConflictRepository();

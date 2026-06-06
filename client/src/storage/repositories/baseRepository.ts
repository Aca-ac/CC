import { getDB } from "../db";

export interface Repository<T> {
  findAll(accountId: string): Promise<T[]>;
  findById(id: string): Promise<T | undefined>;
  create(entity: T): Promise<void>;
  update(id: string, changes: Partial<T>): Promise<void>;
  softDelete(id: string): Promise<void>;
  findByAccount(accountId: string): Promise<T[]>;
}

export abstract class BaseRepository<T extends { id: string; accountId: string }>
  implements Repository<T>
{
  protected abstract storeName: "projects" | "tasks" | "learningLogs";

  async findAll(accountId: string): Promise<T[]> {
    const db = await getDB();
    const index = db.transaction(this.storeName).store.index("by-account");
    return index.getAll(accountId) as Promise<T[]>;
  }

  async findById(id: string): Promise<T | undefined> {
    const db = await getDB();
    return db.get(this.storeName, id) as Promise<T | undefined>;
  }

  async create(entity: T): Promise<void> {
    const db = await getDB();
    await db.add(this.storeName, entity as unknown as Record<string, unknown>);
  }

  async update(id: string, changes: Partial<T>): Promise<void> {
    const db = await getDB();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Entity ${id} not found`);

    const updated = { ...existing, ...changes, updatedAt: Date.now() };
    await db.put(this.storeName, updated as unknown as Record<string, unknown>);
  }

  async softDelete(id: string): Promise<void> {
    const db = await getDB();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Entity ${id} not found`);

    const updated = { ...existing, deleted: true, updatedAt: Date.now() };
    await db.put(this.storeName, updated as unknown as Record<string, unknown>);
  }

  async findByAccount(accountId: string): Promise<T[]> {
    return this.findAll(accountId);
  }
}

import { getDB } from "../db";
import type { SyncCursorValue } from "../db";

export class SyncCursorRepository {
  async getCursor(accountId: string): Promise<SyncCursorValue | undefined> {
    const db = await getDB();
    return db.get("syncCursors", accountId) as Promise<SyncCursorValue | undefined>;
  }

  async saveCursor(accountId: string, cursor: string): Promise<void> {
    const db = await getDB();
    await db.put("syncCursors", {
      accountId,
      cursor,
      updatedAt: Date.now(),
    });
  }
}

export const syncCursorRepository = new SyncCursorRepository();

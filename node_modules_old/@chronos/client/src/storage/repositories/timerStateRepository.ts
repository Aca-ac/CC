import { getDB } from "../db";
import type { TimerStateValue } from "../db";

export class TimerStateRepository {
  protected storeName = "timerState" as const;

  async get(accountId: string): Promise<TimerStateValue | undefined> {
    const db = await getDB();
    return db.get(this.storeName, accountId) as Promise<TimerStateValue | undefined>;
  }

  async set(state: TimerStateValue): Promise<void> {
    const db = await getDB();
    await db.put(this.storeName, { ...state, updatedAt: Date.now() } as unknown as Record<string, unknown>);
  }

  async clear(accountId: string): Promise<void> {
    const db = await getDB();
    await db.delete(this.storeName, accountId);
  }
}

export const timerStateRepository = new TimerStateRepository();

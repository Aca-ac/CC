import { BaseRepository } from "./baseRepository";
import type { LearningLogValue } from "../db";

export class LearningLogRepository extends BaseRepository<LearningLogValue> {
  protected storeName = "learningLogs" as const;

  async createLog(
    accountId: string,
    projectId: string,
    data: Omit<LearningLogValue, "id" | "accountId" | "projectId" | "createdAt" | "updatedAt" | "deleted">
  ): Promise<LearningLogValue> {
    const now = Date.now();
    const log: LearningLogValue = {
      ...data,
      id: crypto.randomUUID(),
      accountId,
      projectId,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    };
    await this.create(log);
    return log;
  }
}

export const learningLogRepository = new LearningLogRepository();

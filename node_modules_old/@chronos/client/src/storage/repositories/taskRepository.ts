import { getDB } from "../db";
import { BaseRepository } from "./baseRepository";
import type { TaskValue } from "../db";

export class TaskRepository extends BaseRepository<TaskValue> {
  protected storeName = "tasks" as const;

  async createTask(
    accountId: string,
    projectId: string,
    data: Omit<TaskValue, "id" | "accountId" | "projectId" | "createdAt" | "updatedAt" | "deleted">
  ): Promise<TaskValue> {
    const now = Date.now();
    const task: TaskValue = {
      ...data,
      id: crypto.randomUUID(),
      accountId,
      projectId,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    };
    await this.create(task);
    return task;
  }

  async findByProject(projectId: string): Promise<TaskValue[]> {
    const db = await getDB();
    const index = db.transaction("tasks").store.index("by-project");
    return index.getAll(projectId) as Promise<TaskValue[]>;
  }
}

export const taskRepository = new TaskRepository();

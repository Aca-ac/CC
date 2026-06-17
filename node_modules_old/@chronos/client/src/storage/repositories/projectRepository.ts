import { BaseRepository } from "./baseRepository";
import type { ProjectValue } from "../db";

export class ProjectRepository extends BaseRepository<ProjectValue> {
  protected storeName = "projects" as const;

  async createProject(
    accountId: string,
    data: Omit<ProjectValue, "id" | "accountId" | "createdAt" | "updatedAt" | "deleted">
  ): Promise<ProjectValue> {
    const now = Date.now();
    const project: ProjectValue = {
      ...data,
      id: crypto.randomUUID(),
      accountId,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    };
    await this.create(project);
    return project;
  }
}

export const projectRepository = new ProjectRepository();

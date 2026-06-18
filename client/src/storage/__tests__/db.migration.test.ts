import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getDB, closeDB, deleteDB } from "../db";
import { projectRepository } from "../repositories";

describe("IndexedDB Migration", () => {
  beforeEach(async () => {
    await deleteDB();
  });

  afterEach(async () => {
    await closeDB();
  });

  it("should create database with version 3 schema", async () => {
    const db = await getDB();
    expect(db.version).toBe(3);
    expect(db.objectStoreNames).toContain("projects");
    expect(db.objectStoreNames).toContain("tasks");
    expect(db.objectStoreNames).toContain("learningLogs");
    expect(db.objectStoreNames).toContain("syncCursors");
    expect(db.objectStoreNames).toContain("conflicts");
    expect(db.objectStoreNames).toContain("outbox");
    expect(db.objectStoreNames).toContain("focusSessions");
    expect(db.objectStoreNames).toContain("timerState");
    expect(db.transaction("tasks").store.indexNames).toContain("by-order");
  });

  it("should persist data across multiple connections", async () => {
    await projectRepository.createProject("account-1", {
      name: "Test Project",
      goal: "A test project",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      status: "ACTIVE",
      progress: 0,
    });

    await closeDB();

    const projects = await projectRepository.findAll("account-1");
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe("Test Project");
  });
});

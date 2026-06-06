import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "chronos";
const DB_VERSION = 1;

export interface ProjectValue {
  id: string;
  accountId: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "ARCHIVED";
  progress: number;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
}

export interface TaskValue {
  id: string;
  accountId: string;
  projectId: string;
  parentTaskId?: string;
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "PAUSED" | "DONE" | "ARCHIVED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueTime?: string;
  estimatedMinutes: number;
  actualMinutes: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
}

export interface LearningLogValue {
  id: string;
  accountId: string;
  projectId: string;
  taskId?: string;
  content: string;
  actualMinutes: number;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  links: string[];
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
}

export interface SyncCursorValue {
  accountId: string;
  cursor: string;
  updatedAt: number;
}

export interface ConflictValue {
  id: string;
  accountId: string;
  entityType: "PROJECT" | "TASK" | "LOG";
  entityId: string;
  localData: string;
  remoteData: string;
  resolved: boolean;
  resolution?: "local" | "remote" | "merge";
  createdAt: number;
}

export type OutboxStatus = "pending" | "syncing" | "failed" | "conflict" | "synced";

export interface OutboxValue {
  mutationId: string;
  accountId: string;
  operation: "CREATE" | "UPDATE" | "DELETE";
  entityType: "PROJECT" | "TASK" | "LOG";
  entityId: string;
  payload: string;
  status: OutboxStatus;
  retryCount: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDB(): Promise<IDBPDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const projectStore = db.createObjectStore("projects", { keyPath: "id" });
        projectStore.createIndex("by-account", "accountId");
        projectStore.createIndex("by-updated", "updatedAt");

        const taskStore = db.createObjectStore("tasks", { keyPath: "id" });
        taskStore.createIndex("by-account", "accountId");
        taskStore.createIndex("by-project", "projectId");
        taskStore.createIndex("by-status", "status");

        const logStore = db.createObjectStore("learningLogs", { keyPath: "id" });
        logStore.createIndex("by-account", "accountId");
        logStore.createIndex("by-project", "projectId");

        db.createObjectStore("syncCursors", { keyPath: "accountId" });

        const conflictStore = db.createObjectStore("conflicts", { keyPath: "id" });
        conflictStore.createIndex("by-account", "accountId");
        conflictStore.createIndex("by-resolved", "resolved");

        const outboxStore = db.createObjectStore("outbox", { keyPath: "mutationId" });
        outboxStore.createIndex("by-account", "accountId");
        outboxStore.createIndex("by-status", "status");
        outboxStore.createIndex("by-created", "createdAt");
      }
    },
  });

  return dbPromise;
}

export async function closeDB(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
}

export async function deleteDB(): Promise<void> {
  await closeDB();
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

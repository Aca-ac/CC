import { useCallback, useEffect, useState } from "react";
import { projectRepository } from "../storage/repositories/projectRepository";
import { outboxRepository } from "../storage/repositories/outboxRepository";
import { apiClient } from "../services/apiClient";
import { useAccountId } from "./useAccountId";
import type { ProjectValue } from "../storage/db";
import type { Project } from "../types/domain";

function toDomain(p: ProjectValue): Project {
  return {
    id: p.id,
    name: p.name,
    goal: p.goal,
    startDate: p.startDate,
    endDate: p.endDate,
    status: p.status,
    progress: p.progress,
  };
}

export interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  online: boolean;
  createProject: (data: Omit<ProjectValue, "id" | "accountId" | "createdAt" | "updatedAt" | "deleted">) => Promise<Project>;
  updateProject: (id: string, changes: Partial<ProjectValue>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useProjects(): UseProjectsReturn {
  const accountId = useAccountId();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(navigator.onLine);

  const loadLocal = useCallback(async () => {
    const list = await projectRepository.findAll(accountId);
    setProjects(list.filter((p) => !p.deleted).map(toDomain));
  }, [accountId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (navigator.onLine && accountId !== "local") {
        const remote = await apiClient.listProjects();
        // 本地已软删除但尚未同步到服务端的项目：不要被服务端列表「复活」。
        const pendingDeletes = new Set(
          (await outboxRepository.findPending(accountId))
            .filter((m) => m.entityType === "PROJECT" && m.operation === "DELETE")
            .map((m) => m.entityId)
        );
        // 将远端数据写入本地 IndexedDB（简单覆盖策略）
        for (const r of remote) {
          if (pendingDeletes.has(r.id)) continue;
          const existing = await projectRepository.findById(r.id);
          const value: ProjectValue = {
            ...r,
            accountId,
            createdAt: existing?.createdAt ?? Date.now(),
            updatedAt: Date.now(),
            deleted: false,
          };
          if (existing) {
            await projectRepository.update(r.id, value);
          } else {
            await projectRepository.create(value);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      await loadLocal();
      setLoading(false);
    }
  }, [accountId, loadLocal]);

  const enqueue = useCallback(
    async (operation: "CREATE" | "UPDATE" | "DELETE", entityId: string, payload: unknown) => {
      await outboxRepository.create({
        mutationId: crypto.randomUUID(),
        accountId,
        operation,
        entityType: "PROJECT",
        entityId,
        payload: JSON.stringify(payload),
        status: "pending",
        retryCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    },
    [accountId]
  );

  const createProject = useCallback(
    async (data: Omit<ProjectValue, "id" | "accountId" | "createdAt" | "updatedAt" | "deleted">) => {
      const now = Date.now();
      const project: ProjectValue = {
        ...data,
        id: crypto.randomUUID(),
        accountId,
        createdAt: now,
        updatedAt: now,
        deleted: false,
      };
      await projectRepository.create(project);
      await enqueue("CREATE", project.id, project);
      const domain = toDomain(project);
      setProjects((prev) => [...prev, domain]);
      return domain;
    },
    [enqueue]
  );

  const updateProject = useCallback(
    async (id: string, changes: Partial<ProjectValue>) => {
      await projectRepository.update(id, changes);
      await enqueue("UPDATE", id, changes);
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...changes } : p))
      );
    },
    [enqueue]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      await projectRepository.softDelete(id);
      await enqueue("DELETE", id, { id });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    },
    [enqueue]
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    loadLocal();
  }, [loadLocal]);

  // 上线后自动刷新
  useEffect(() => {
    if (online) refresh();
  }, [online, refresh]);

  return {
    projects,
    loading,
    error,
    online,
    createProject,
    updateProject,
    deleteProject,
    refresh,
  };
}

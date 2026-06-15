import type { DashboardSummary, Project, Task } from "../types/domain";

export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
}

/** 同步推送请求中的单条变更记录 */
export interface SyncRecordItem {
  entityType: "PROJECT" | "TASK" | "LOG";
  entityId: string;
  changeType: "CREATE" | "UPDATE" | "DELETE";
  version: number;
  payload: unknown;
}

/** 同步推送响应 */
export interface SyncPushResult {
  accepted: number;
  conflictTotal: number;
  conflicts: ConflictDto[];
}

/** 冲突记录 DTO（服务端返回） */
export interface ConflictDto {
  id: string;
  entityType: "PROJECT" | "TASK" | "LOG";
  entityId: string;
  serverVersion: number;
  clientVersion: number;
  serverPayload: unknown;
  clientPayload: unknown;
  serverUpdatedAt: string;
  clientUpdatedAt: string;
}

/** 同步拉取响应 */
export interface SyncPullResult {
  cursor: string;
  changes: SyncRecordItem[];
}

/** 冲突解决请求 */
export interface ResolveConflictRequest {
  resolution: "keep-local" | "keep-cloud";
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const body = (await response.json()) as ApiResponse<T>;
  if (!body.success) {
    throw new Error(`${body.code}: ${body.message}`);
  }

  return body.data;
}

export const apiClient = {
  health: () => request<{ status: string; service: string }>("/health"),
  get: <T>(path: string) => request<T>(path),
  getTodayDashboard: () =>
    request<DashboardSummary>("/dashboard/today"),
  listProjects: () => request<Project[]>("/projects"),
  listTasks: () => request<Task[]>("/tasks"),
  // TODO(前后端联调): AI 接口必须返回草稿结构，前端确认前不能直接创建正式任务。
  previewAiBreakdown: (payload: { goal: string; weeks: number }) =>
    request<unknown>("/ai/breakdown-preview", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // ── Sync & Conflict ──────────────────────────────────────────

  /** 推送本地变更到服务端，返回被接受的条目数和冲突列表 */
  syncPush: (records: SyncRecordItem[]) =>
    request<SyncPushResult>("/sync/push", {
      method: "POST",
      body: JSON.stringify({ records }),
    }),

  /** 从服务端拉取远端变更 */
  syncPull: (cursor?: string) => {
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return request<SyncPullResult>(`/sync/pull${query}`);
  },

  /** 提交冲突解决结果：keep-local 或 keep-cloud */
  resolveConflict: (conflictId: string, body: ResolveConflictRequest) =>
    request<void>(`/sync/conflicts/${conflictId}/resolve`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};


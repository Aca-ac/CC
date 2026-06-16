import type { AuthSession, DashboardSummary, Project, Task } from "../types/domain";

export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface SyncRecordItem {
  entityType: "PROJECT" | "TASK" | "LOG";
  entityId: string;
  changeType: "CREATE" | "UPDATE" | "DELETE";
  version: number;
  payload: Record<string, unknown>;
}

const API_URL_KEY = "chronos:apiUrl";
const TOKEN_KEY = "chronos:session";

function getApiBaseUrl(): string {
  return localStorage.getItem(API_URL_KEY) ?? import.meta.env.VITE_API_BASE_URL ?? "/api";
}

function getToken(): string | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    return session.token ?? null;
  } catch { return null; }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> ?? {}),
  };
  if (token) headers["satoken"] = token;

  const response = await fetch(`${getApiBaseUrl()}${path}`, { headers, ...init });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.hash = "#/login";
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const body = (await response.json()) as ApiResponse<T>;
  if (!body.success) throw new Error(`${body.code}: ${body.message}`);
  return body.data;
}

export const apiClient = {
  health: () => request<{ status: string; service: string }>("/health"),

  login: (payload: LoginRequest) =>
    request<AuthSession>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),

  register: (payload: RegisterRequest) =>
    request<void>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),

  logout: () => request<void>("/auth/logout", { method: "POST" }),

  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),

  getTodayDashboard: () => request<DashboardSummary>("/dashboard/today"),
  listProjects: () => request<Project[]>("/projects"),
  listTasks: () => request<Task[]>("/tasks"),
  // TODO(前后端联调): AI 接口必须返回草稿结构，前端确认前不能直接创建正式任务。
  previewAiBreakdown: (payload: { goal: string; weeks: number }) =>
    request<unknown>("/ai/breakdown-preview", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  previewAiBreakdown: (payload: { goal: string; weeks: number }) =>
    request<unknown>("/ai/breakdown-preview", { method: "POST", body: JSON.stringify(payload) }),

  syncPush: (records: SyncRecordItem[]) =>
    request<{ accepted: number; conflicts: Array<{ id: string; entityType: string; entityId: string; clientPayload: unknown; serverPayload: unknown }> }>("/sync/push", { method: "POST", body: JSON.stringify({ records }) }),

  syncPull: (cursor?: string) =>
    request<{ changes: SyncRecordItem[]; cursor: string }>(`/sync/pull${cursor ? `?cursor=${cursor}` : ""}`),

  resolveConflict: (conflictId: string, payload: { resolution: "keep-local" | "keep-cloud" }) =>
    request<void>("/sync/resolve", { method: "POST", body: JSON.stringify({ id: conflictId, ...payload }) }),
};

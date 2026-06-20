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
  entityType: "PROJECT" | "TASK" | "LOG" | "FOCUS";
  entityId: string;
  changeType: "CREATE" | "UPDATE" | "DELETE";
  version: number;
  payload: Record<string, unknown>;
}

export interface SyncResolvePayload {
  id: string;
  entityType: string;
  entityId: string;
  version: number;
  resolvedPayload: string;
  resolveType: "keep-local" | "keep-cloud";
}

export interface ActiveTimerResponse {
  id: string;
  projectId: string;
  taskId?: string;
  startedAt: string;
}

export interface TimerStartRequest {
  projectId: string;
  taskId?: string;
  sessionId?: string;
}

export interface TimerStopRequest {
  durationMinutes: number;
}

export interface HabitDTO {
  id: string;
  name: string;
  ruleText: string;
  streakCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface HabitCheckinDTO {
  id: string;
  habitId: string;
  checkedDate: string;
  checkedAt: string;
  note: string | null;
  streakCount: number;
}

export interface CreateHabitRequest {
  name: string;
  ruleText?: string;
}

// ── AI breakdown / advice / settings ─────────────────────────
export interface BreakdownTaskDraft {
  title: string;
  description: string;
  estimatedMinutes: number;
  priority: string;
}

export interface BreakdownStage {
  title: string;
  tasks: BreakdownTaskDraft[];
}

export interface BreakdownTree {
  draftId: string;
  goal: string;
  weeks: number;
  stages: BreakdownStage[];
}

export interface CommitTaskNode {
  parentTaskId?: string | null;
  title: string;
  description: string;
  estimatedMinutes: number;
  priority: string;
  subtasks?: CommitTaskNode[];
  /** ISO LocalDateTime（如 2026-07-01T23:59:00），可空 */
  dueTime?: string | null;
}

export interface BreakdownCommitPayload {
  draftId: string;
  projectId: string;
  tasks: CommitTaskNode[];
}

export interface WeeklyAdvice {
  adviceId: string;
  title: string;
  content: string;
  type: string;
  generatedAt: string;
}

export interface AiSettingsItem {
  id: string;
  provider: string;
  isCustom: boolean;
  maskedKey: string;
  model: string | null;
  updatedAt: string;
}

export interface UpdateAiSettingsPayload {
  provider: string;
  apiKey: string;
  isCustom: boolean;
  model?: string;
}

const API_URL_KEY = "chronos:apiUrl";
const TOKEN_KEY = "chronos:session";
export const SESSION_INVALIDATED_EVENT = "chronos:session-invalidated";

export function getApiBaseUrl(): string {
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

function invalidateSession() {
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(SESSION_INVALIDATED_EVENT));
  if (window.location.hash !== "#/login") {
    window.location.hash = "#/login";
  }
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
    if (response.status === 401) invalidateSession();
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const body = (await response.json()) as ApiResponse<T>;
  if (!body.success) {
    if (body.code === "UNAUTHORIZED") invalidateSession();
    throw new Error(`${body.code}: ${body.message}`);
  }
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
  postWithHeaders: <T>(path: string, body: unknown, headers: Record<string, string>) =>
    request<T>(path, { method: "POST", headers, body: JSON.stringify(body) }),

  getTodayDashboard: () => request<DashboardSummary>("/dashboard/today"),
  listProjects: () => request<Project[]>("/projects"),
  listTasks: () => request<Task[]>("/tasks"),

  // ── Timer ────────────────────────────────────────────────────
  getActiveTimer: () => request<ActiveTimerResponse | null>("/timer/active"),
  startTimer: (payload: TimerStartRequest) =>
    request<ActiveTimerResponse>("/timer/start", { method: "POST", body: JSON.stringify(payload) }),
  stopTimer: (sessionId: string, payload: TimerStopRequest) =>
    request<void>(`/timer/${sessionId}/stop`, { method: "POST", body: JSON.stringify(payload) }),
  discardTimer: (sessionId: string) =>
    request<void>(`/timer/${sessionId}/discard`, { method: "POST" }),

  getWeeklyStats: () => request<{
    totalCompleted: number;
    completionRate: number;
    dailyMinutes: Array<{ date: string; minutes: number }>;
    projectDistribution: Array<{ projectId: string; projectName: string; minutes: number }>;
  }>("/stats/weekly"),

  // ── AI（FR-AI 拆解 / UC-AI；BYOK 服务端加密存储）────────────
  aiBreakdownPreview: (payload: { goal: string; weeks: number; projectId?: string }) =>
    request<BreakdownTree>("/ai/breakdown/preview", { method: "POST", body: JSON.stringify(payload) }),
  aiBreakdownCommit: (payload: BreakdownCommitPayload) =>
    request<{ createdTasks: number; projectId: string }>("/ai/breakdown/commit", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  aiAdvice: (projectId?: string) =>
    request<WeeklyAdvice>(`/ai/advice${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ""}`, {
      method: "POST",
    }),
  listAiSettings: () => request<AiSettingsItem[]>("/ai/settings"),
  updateAiSettings: (payload: UpdateAiSettingsPayload) =>
    request<AiSettingsItem>("/ai/settings", { method: "PUT", body: JSON.stringify(payload) }),
  deleteAiSettings: (provider: string) =>
    request<void>(`/ai/settings/key/${encodeURIComponent(provider)}`, { method: "DELETE" }),

  syncPush: (records: SyncRecordItem[]) =>
    request<{ accepted: number; conflicts: Array<{ id: string; entityType: string; entityId: string; clientPayload: unknown; serverPayload: unknown }> }>("/sync/push", { method: "POST", body: JSON.stringify({ records }) }),

  syncPull: (cursor?: string) =>
    request<{ changes: SyncRecordItem[]; cursor: string }>(`/sync/pull${cursor ? `?cursor=${cursor}` : ""}`),

  resolveConflict: (payload: SyncResolvePayload) =>
    request<void>("/sync/resolve", { method: "POST", body: JSON.stringify(payload) }),

  // ── Habits (FR-习惯打卡 / UC-Habit) ──────────────────────────
  listHabits: () => request<HabitDTO[]>("/habits"),
  createHabit: (payload: CreateHabitRequest) =>
    request<HabitDTO>("/habits", { method: "POST", body: JSON.stringify(payload) }),
  deleteHabit: (habitId: string) =>
    request<void>(`/habits/${habitId}`, { method: "DELETE" }),
  checkinHabit: (habitId: string, payload?: { date?: string; note?: string }) =>
    request<HabitCheckinDTO>(`/habits/${habitId}/checkin`, {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    }),
};

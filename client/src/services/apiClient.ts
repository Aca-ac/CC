import type {
  AiBreakdownPreviewResponse,
  AuthSession,
  DashboardSummary,
  Project,
  Task,
  TaskPriority,
  TaskStatus,
} from "../types/domain";

export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

/** 当前注入的认证 token，由 AuthContext 通过 setAuthToken 管理 */
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> ?? {}),
  };
  if (authToken) {
    headers["satoken"] = authToken;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
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

export interface ListTasksParams {
  projectId?: string;
  status?: TaskStatus;
  keyword?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: string;
}

export const apiClient = {
  auth: {
    login: (payload: { email: string; password: string }) =>
      request<AuthSession>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    register: (payload: { name: string; email: string; password: string }) =>
      request<AuthSession>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    logout: () =>
      request<void>("/auth/logout", { method: "POST" }),
  },

  health: () => request<{ status: string; service: string }>("/health"),

  getTodayDashboard: () =>
    request<DashboardSummary>("/dashboard/today"),

  listProjects: () => request<Project[]>("/projects"),
  createProject: (payload: {
    name: string;
    goal: string;
    startDate: string;
    endDate: string;
  }) =>
    request<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listTasks: (params?: ListTasksParams) => {
    const query = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          query.set(key, String(value));
        }
      }
    }
    const qs = query.toString();
    return request<Task[]>(`/tasks${qs ? `?${qs}` : ""}`);
  },
  createTask: (payload: {
    projectId: string;
    title: string;
    description?: string;
    parentTaskId?: string;
    priority?: TaskPriority;
    estimatedMinutes: number;
    dueTime?: string;
  }) =>
    request<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTaskStatus: (taskId: string, status: TaskStatus) =>
    request<Task>(`/tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  previewAiBreakdown: (payload: { goal: string; weeks: number }) =>
    request<AiBreakdownPreviewResponse>("/ai/breakdown-preview", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  submitAiFeedback: (payload: {
    draftId: string;
    helpful: boolean;
    comment?: string;
  }) =>
    request<void>("/ai/feedback", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};


import type { DashboardSummary, Project, Task } from "../types/domain";

export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
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
};


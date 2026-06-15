import { apiClient } from "./apiClient";

export type AiProvider = "openai" | "anthropic" | "deepseek" | "local";

export interface AiSettings {
  provider: AiProvider;
  model: string;
  apiKey: string;
  fallbackEnabled: boolean;
}

export interface BreakdownPhase {
  name: string;
  weeks: number;
  tasks: BreakdownTask[];
}

export interface BreakdownTask {
  title: string;
  description: string;
  estimatedMinutes: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  subTasks?: BreakdownTask[];
}

export interface BreakdownPreview {
  projectName: string;
  goal: string;
  phases: BreakdownPhase[];
  firstAction: BreakdownTask;
}

export interface LearningAdvice {
  type: "BREAKDOWN" | "REVIEW" | "RISK" | "TIP";
  title: string;
  content: string;
}

const SETTINGS_KEY = "chronos_ai_settings";

export function loadAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    provider: "openai",
    model: "gpt-4o-mini",
    apiKey: "",
    fallbackEnabled: true,
  };
}

export function saveAiSettings(settings: AiSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function maskKey(key: string): string {
  if (!key || key.length <= 8) return key ? "已配置" : "";
  return `已配置 ···${key.slice(-4)}`;
}

export function isPublicHttp(): boolean {
  const url = import.meta.env.VITE_API_BASE_URL ?? "";
  return url.startsWith("http://") && !url.includes("localhost") && !url.includes("127.0.0.1");
}

export const aiService = {
  async previewBreakdown(goal: string, weeks: number): Promise<BreakdownPreview> {
    return apiClient.post<BreakdownPreview>("/ai/breakdown-preview", { goal, weeks });
  },

  async commitBreakdown(preview: BreakdownPreview): Promise<void> {
    return apiClient.post<void>("/ai/breakdown-commit", preview);
  },

  async getAdvice(): Promise<LearningAdvice[]> {
    return apiClient.get<LearningAdvice[]>("/ai/advice");
  },
};

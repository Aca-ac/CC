import { apiClient } from "./apiClient";

export type AiProviderMode = "server" | "custom";

export interface AiSettings {
  mode: AiProviderMode;
  baseUrl: string;
  model: string;
  apiKey: string;
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
  draftId?: string;
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
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AiSettings> & {
        provider?: string;
        fallbackEnabled?: boolean;
      };

      return {
        mode: parsed.mode ?? (parsed.apiKey ? "custom" : "server"),
        baseUrl: parsed.baseUrl ?? "",
        model: parsed.model ?? "gpt-4o-mini",
        apiKey: parsed.apiKey ?? "",
      };
    }
  } catch {
    // Ignore corrupted local settings and fall back to server defaults.
  }

  return {
    mode: "server",
    baseUrl: "",
    model: "gpt-4o-mini",
    apiKey: "",
  };
}

export function saveAiSettings(settings: AiSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "已配置";
  return `已配置 ...${key.slice(-4)}`;
}

export function isPublicHttp(url: string): boolean {
  return url.startsWith("http://") && !url.includes("localhost") && !url.includes("127.0.0.1");
}

function getAiOverrideHeaders(): Record<string, string> {
  const settings = loadAiSettings();
  if (settings.mode !== "custom") return {};

  const headers: Record<string, string> = {};
  if (settings.baseUrl.trim()) headers["X-Chronos-AI-Base-URL"] = settings.baseUrl.trim();
  if (settings.model.trim()) headers["X-Chronos-AI-Model"] = settings.model.trim();
  if (settings.apiKey.trim()) headers["X-Chronos-AI-API-Key"] = settings.apiKey.trim();
  return headers;
}

export const aiService = {
  async previewBreakdown(goal: string, weeks: number): Promise<BreakdownPreview> {
    return apiClient.postWithHeaders<BreakdownPreview>(
      "/ai/breakdown-preview",
      { goal, weeks },
      getAiOverrideHeaders()
    );
  },

  async commitBreakdown(preview: BreakdownPreview): Promise<void> {
    return apiClient.post<void>("/ai/breakdown-commit", preview);
  },

  async getAdvice(): Promise<LearningAdvice[]> {
    return apiClient.get<LearningAdvice[]>("/ai/advice");
  },
};

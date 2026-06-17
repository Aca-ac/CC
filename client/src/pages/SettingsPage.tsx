import { useState } from "react";
import { Activity, Save, Server } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../services/apiClient";
import {
  loadAiSettings,
  saveAiSettings,
  maskKey,
  isPublicHttp,
  type AiProvider,
  type AiSettings,
} from "../services/aiService";

const PROVIDER_OPTIONS: { value: AiProvider; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "local", label: "本地模型" },
];

const MODEL_PRESETS: Record<AiProvider, string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
  anthropic: ["claude-3-haiku-20240307", "claude-3-sonnet-20240229", "claude-3-opus-20240229"],
  deepseek: ["deepseek-chat", "deepseek-coder"],
  local: ["llama3", "qwen2", "custom"],
};

export function SettingsPage() {
  const { apiBaseUrl, setApiBaseUrl, offline } = useAuth();
  const [urlInput, setUrlInput] = useState(apiBaseUrl);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [aiSettings, setAiSettings] = useState<AiSettings>(loadAiSettings);
  const [showKey, setShowKey] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);

  const publicHttp = isPublicHttp();
  const provider = aiSettings.provider;

  const handleSaveUrl = () => {
    setApiBaseUrl(urlInput.trim() || "/api");
    setSaveMsg("API 地址已保存");
    setTimeout(() => setSaveMsg(null), 2000);
  };

  const handleHealthCheck = async () => {
    if (offline) {
      setHealthStatus("离线模式下无法检查");
      return;
    }
    setHealthLoading(true);
    setHealthStatus(null);
    try {
      const result = await apiClient.health();
      setHealthStatus(`服务正常: ${result.service}`);
    } catch (err) {
      setHealthStatus(err instanceof Error ? err.message : "健康检查失败");
    } finally {
      setHealthLoading(false);
    }
  };

  const updateAi = (partial: Partial<AiSettings>) => {
    const next = { ...aiSettings, ...partial };
    if (partial.provider && partial.provider !== provider) {
      next.model = MODEL_PRESETS[partial.provider][0];
    }
    setAiSettings(next);
    setAiSaved(false);
  };

  const handleSaveAi = () => {
    saveAiSettings(aiSettings);
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 2000);
  };

  return (
    <section className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>API 配置</h2>
          <p>设置后端服务地址，无需重新打包应用。</p>
        </div>
        <div className="settings-list">
          <label>
            <span><Server size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />API 基础地址</span>
            <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="例如: http://localhost:8080/api" />
          </label>
        </div>
        <div className="row-actions" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={handleSaveUrl}>
            <Save size={14} />保存地址
          </button>
          <button className="btn btn-secondary" onClick={handleHealthCheck} disabled={healthLoading || offline}>
            <Activity size={14} />{healthLoading ? "检查中..." : "健康检查"}
          </button>
        </div>
        {saveMsg && <div className="auth-error" style={{ marginTop: 12, background: "oklch(92% 0.055 145 / 0.3)", color: "oklch(45% 0.13 145)", borderColor: "oklch(65% 0.13 145 / 0.3)" }}>{saveMsg}</div>}
        {healthStatus && (
          <div className="auth-error" style={{ marginTop: 12, background: healthStatus.includes("正常") ? "oklch(92% 0.055 145 / 0.3)" : "oklch(95% 0.03 30 / 0.15)", color: healthStatus.includes("正常") ? "oklch(45% 0.13 145)" : "var(--danger)", borderColor: healthStatus.includes("正常") ? "oklch(65% 0.13 145 / 0.3)" : "var(--danger)" }}>
            {healthStatus}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>AI 配置</h2>
          <p>配置 AI Provider、模型和 API Key。</p>
        </div>

        <div className="settings-list">
          <label>
            <span>AI Provider</span>
            <select
              value={provider}
              onChange={(e) => updateAi({ provider: e.target.value as AiProvider })}
            >
              {PROVIDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>模型</span>
            <select
              value={aiSettings.model}
              onChange={(e) => updateAi({ model: e.target.value })}
            >
              {MODEL_PRESETS[provider].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>API Key</span>
            <div className="input-with-toggle">
              <input
                type={showKey ? "text" : "password"}
                value={aiSettings.apiKey}
                onChange={(e) => updateAi({ apiKey: e.target.value })}
                placeholder={publicHttp ? "公网 HTTP 禁止输入 Key" : "sk-..."}
                disabled={publicHttp}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowKey((v) => !v)}
              >
                {showKey ? "隐藏" : "显示"}
              </button>
            </div>
          </label>

          {publicHttp && (
            <div className="state-message state-failure">
              当前使用公网 HTTP，禁止输入 API Key。请切换 HTTPS 或本地环境。
            </div>
          )}

          {!publicHttp && aiSettings.apiKey && (
            <div className="key-mask">{maskKey(aiSettings.apiKey)}</div>
          )}

          <label className="checkbox-row">
            <span>未配置时允许 Fallback（Mock 响应）</span>
            <input
              type="checkbox"
              checked={aiSettings.fallbackEnabled}
              onChange={(e) => updateAi({ fallbackEnabled: e.target.checked })}
            />
          </label>
        </div>

        <div className="row-actions" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={handleSaveAi}>
            <Save size={14} />保存 AI 设置
          </button>
          {aiSaved && <span className="save-hint">已保存</span>}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>系统设置</h2>
          <p>同步开关、提醒策略等系统级配置。</p>
        </div>
        <div className="settings-list">
          <label><span>AI 功能</span><input type="checkbox" defaultChecked /></label>
          <label><span>本地优先同步</span><input type="checkbox" defaultChecked /></label>
          <label><span>番茄钟提醒</span><input type="checkbox" /></label>
        </div>
      </section>
    </section>
  );
}

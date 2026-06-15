import { useState } from "react";
import {
  type AiProvider,
  loadAiSettings,
  saveAiSettings,
  maskKey,
  isPublicHttp,
} from "../services/aiService";

const PROVIDER_MODELS: Record<AiProvider, string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
  anthropic: ["claude-3-haiku", "claude-3-sonnet", "claude-3-opus"],
  deepseek: ["deepseek-chat", "deepseek-coder"],
  local: ["local-model"],
};

const PROVIDER_LABELS: Record<AiProvider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  deepseek: "DeepSeek",
  local: "本地模型",
};

export function SettingsPage() {
  const [settings, setSettings] = useState(loadAiSettings);
  const [keyInput, setKeyInput] = useState("");
  const [saved, setSaved] = useState(false);
  const publicHttp = isPublicHttp();

  const handleSave = () => {
    const next = {
      ...settings,
      apiKey: keyInput.trim() || settings.apiKey,
    };
    saveAiSettings(next);
    setSettings(next);
    setKeyInput("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearKey = () => {
    const next = { ...settings, apiKey: "" };
    saveAiSettings(next);
    setSettings(next);
    setKeyInput("");
  };

  return (
    <section className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>系统设置</h2>
          <p>管理 AI 供应商、模型、密钥和隐私选项。</p>
        </div>
        <div className="settings-list">
          <label>
            <span>AI 功能</span>
            <input
              type="checkbox"
              checked={settings.provider !== "local"}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  provider: e.target.checked ? "openai" : "local",
                }))
              }
            />
          </label>
          <label>
            <span>本地优先同步</span>
            <input type="checkbox" defaultChecked />
          </label>
          <label>
            <span>番茄钟提醒</span>
            <input type="checkbox" />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>AI 设置</h2>
          <p>配置 AI 供应商、模型和 API Key。</p>
        </div>

        {publicHttp && (
          <div className="state-message state-failure" role="alert">
            当前使用公网 HTTP 连接，BYOK（自带密钥）已禁用，请使用 HTTPS 或本地部署。
          </div>
        )}

        <div className="form-stack">
          <label>
            AI 供应商
            <select
              value={settings.provider}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  provider: e.target.value as AiProvider,
                  model: PROVIDER_MODELS[e.target.value as AiProvider][0],
                }))
              }
            >
              {(Object.keys(PROVIDER_MODELS) as AiProvider[]).map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_LABELS[p]}
                </option>
              ))}
            </select>
          </label>

          <label>
            模型
            <select
              value={settings.model}
              onChange={(e) =>
                setSettings((s) => ({ ...s, model: e.target.value }))
              }
            >
              {PROVIDER_MODELS[settings.provider].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label>
            API Key
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="password"
                value={keyInput}
                placeholder={settings.apiKey ? maskKey(settings.apiKey) : "输入 API Key"}
                onChange={(e) => setKeyInput(e.target.value)}
                disabled={publicHttp}
                style={{ flex: 1 }}
              />
              {settings.apiKey && (
                <button className="btn-secondary" onClick={handleClearKey}>
                  清除
                </button>
              )}
            </div>
          </label>

          <label>
            <span>启用 Fallback（失败时自动切换供应商）</span>
            <input
              type="checkbox"
              checked={settings.fallbackEnabled}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  fallbackEnabled: e.target.checked,
                }))
              }
            />
          </label>

          <div className="form-actions">
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={publicHttp}
            >
              {saved ? "已保存" : "保存设置"}
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}

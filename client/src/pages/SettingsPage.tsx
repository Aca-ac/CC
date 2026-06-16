import { useState } from "react";
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
  const [settings, setSettings] = useState<AiSettings>(loadAiSettings);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const publicHttp = isPublicHttp();
  const provider = settings.provider;

  const update = (partial: Partial<AiSettings>) => {
    const next = { ...settings, ...partial };
    if (partial.provider && partial.provider !== provider) {
      next.model = MODEL_PRESETS[partial.provider][0];
    }
    setSettings(next);
    setSaved(false);
  };

  const handleSave = () => {
    saveAiSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <section className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>系统设置</h2>
        </div>

        <div className="settings-group">
          <h3>AI 配置</h3>

          <label className="settings-row">
            <span>AI Provider</span>
            <select
              value={provider}
              onChange={(e) => update({ provider: e.target.value as AiProvider })}
            >
              {PROVIDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="settings-row">
            <span>模型</span>
            <select
              value={settings.model}
              onChange={(e) => update({ model: e.target.value })}
            >
              {MODEL_PRESETS[provider].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label className="settings-row">
            <span>API Key</span>
            <div className="input-with-toggle">
              <input
                type={showKey ? "text" : "password"}
                value={settings.apiKey}
                onChange={(e) => update({ apiKey: e.target.value })}
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

          {!publicHttp && settings.apiKey && (
            <div className="key-mask">{maskKey(settings.apiKey)}</div>
          )}

          <label className="settings-row checkbox-row">
            <span>未配置时允许 Fallback（Mock 响应）</span>
            <input
              type="checkbox"
              checked={settings.fallbackEnabled}
              onChange={(e) => update({ fallbackEnabled: e.target.checked })}
            />
          </label>

          <div className="form-actions">
            <button className="btn-primary" onClick={handleSave}>
              保存设置
            </button>
            {saved && <span className="save-hint">已保存</span>}
          </div>
        </div>

        <hr />

        <div className="settings-group">
          <h3>同步与提醒</h3>
          <label className="settings-row checkbox-row">
            <span>本地优先同步</span>
            <input type="checkbox" defaultChecked disabled />
          </label>
          <label className="settings-row checkbox-row">
            <span>番茄钟提醒</span>
            <input type="checkbox" />
          </label>
        </div>
      </section>
    </section>
  );
}

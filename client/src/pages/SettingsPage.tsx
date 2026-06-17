import { useState } from "react";
import { Activity, Bot, ExternalLink, RefreshCw, Save, Server, Trash2, ShieldAlert } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../services/apiClient";
import {
  isPublicHttp,
  loadAiSettings,
  maskKey,
  saveAiSettings,
  type AiSettings,
} from "../services/aiService";
import {
  CURRENT_APP_VERSION,
  checkForUpdates,
  openReleasePage,
  type UpdateCheckResult,
} from "../services/updateService";

const PROVIDER_PRESETS = [
  { label: "Server default", value: "server", baseUrl: "", model: "gpt-4o-mini" },
  { label: "OpenAI", value: "openai", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  { label: "Azure OpenAI", value: "azure", baseUrl: "https://{your-resource}.openai.azure.com/openai/deployments/{deployment}", model: "gpt-4o" },
  { label: "DeepSeek", value: "deepseek", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  { label: "SiliconFlow", value: "siliconflow", baseUrl: "https://api.siliconflow.cn/v1", model: "deepseek-ai/DeepSeek-V3" },
  { label: "Custom", value: "custom", baseUrl: "", model: "" },
];

export function SettingsPage() {
  const { apiBaseUrl, setApiBaseUrl, offline } = useAuth();
  const [urlInput, setUrlInput] = useState(apiBaseUrl);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => loadAiSettings());
  const [keyInput, setKeyInput] = useState("");
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const flash = (message: string) => {
    setSaveMsg(message);
    window.setTimeout(() => setSaveMsg(null), 2000);
  };

  const handleSaveUrl = () => {
    setApiBaseUrl(urlInput.trim() || "/api");
    flash("API address saved.");
  };

  const handleHealthCheck = async () => {
    if (offline) {
      setHealthStatus("Offline mode cannot check the server.");
      return;
    }

    setHealthLoading(true);
    setHealthStatus(null);
    try {
      const result = await apiClient.health();
      setHealthStatus(`Server healthy: ${result.service}`);
    } catch (err) {
      setHealthStatus(err instanceof Error ? err.message : "Health check failed.");
    } finally {
      setHealthLoading(false);
    }
  };

  const handlePresetChange = (value: string) => {
    const preset = PROVIDER_PRESETS.find((p) => p.value === value);
    if (!preset) return;
    const next: AiSettings = {
      mode: value === "server" ? "server" : "custom",
      baseUrl: preset.baseUrl,
      model: preset.model,
      apiKey: aiSettings.apiKey,
    };
    setAiSettings(next);
  };

  const handleSaveAi = () => {
    if (publicHttpBlocked) {
      flash("Cannot save: public HTTP is not allowed for BYOK.");
      return;
    }
    const next: AiSettings = {
      ...aiSettings,
      baseUrl: aiSettings.baseUrl.trim(),
      model: aiSettings.model.trim() || "gpt-4o-mini",
      apiKey: keyInput.trim() || aiSettings.apiKey,
    };
    saveAiSettings(next);
    setAiSettings(next);
    setKeyInput("");
    flash("AI settings saved locally.");
  };

  const handleClearKey = () => {
    const next = { ...aiSettings, apiKey: "" };
    saveAiSettings(next);
    setAiSettings(next);
    setKeyInput("");
    flash("Local AI key cleared.");
  };

  const handleCheckUpdates = async () => {
    setUpdateLoading(true);
    setUpdateError(null);
    try {
      const result = await checkForUpdates();
      setUpdateResult(result);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Update check failed.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleOpenRelease = async () => {
    await openReleasePage(updateResult?.releaseUrl ?? "https://github.com/Vincent-Ctrl-18/Chronos/releases");
  };

  const aiUsesCustom = aiSettings.mode === "custom";
  const publicHttpWarning = aiUsesCustom && isPublicHttp(aiSettings.baseUrl);
  const publicHttpBlocked = publicHttpWarning && aiSettings.apiKey.length > 0;

  const currentPreset = PROVIDER_PRESETS.find(
    (p) => p.value === (aiSettings.mode === "server" ? "server" : "custom")
  ) ?? PROVIDER_PRESETS[0];

  return (
    <section className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>API Configuration</h2>
          <p>
            Configure the backend service address. The desktop app defaults to the production Chronos API, and
            local development can override it here.
          </p>
        </div>
        <div className="settings-list">
          <label>
            <span>
              <Server size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
              API base URL
            </span>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://vincentt.xyz/chronos/api"
            />
          </label>
        </div>
        <div className="row-actions" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={handleSaveUrl}>
            <Save size={14} />
            Save URL
          </button>
          <button className="btn btn-secondary" onClick={handleHealthCheck} disabled={healthLoading || offline}>
            <Activity size={14} />
            {healthLoading ? "Checking..." : "Health check"}
          </button>
        </div>
        {healthStatus && (
          <div className="auth-error" style={{ marginTop: 12 }}>
            {healthStatus}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>App Updates</h2>
          <p>
            Check the latest GitHub release from inside Chronos. This lightweight flow opens the release page when
            an installer is available.
          </p>
        </div>
        <div className="update-card">
          <div>
            <span>Current version</span>
            <strong>v{CURRENT_APP_VERSION}</strong>
          </div>
          <div className="update-actions">
            <button className="btn-secondary" onClick={handleCheckUpdates} disabled={updateLoading}>
              <RefreshCw size={14} />
              {updateLoading ? "Checking..." : "Check updates"}
            </button>
            {(updateResult?.status === "available" || updateResult?.status === "unavailable") && (
              <button className="btn-primary" onClick={handleOpenRelease}>
                <ExternalLink size={14} />
                Open releases
              </button>
            )}
          </div>
        </div>
        {updateResult && (
          <div className={`update-message ${updateResult.status === "available" ? "update-message-new" : ""}`}>
            {updateResult.message}
          </div>
        )}
        {updateError && (
          <div className="auth-error" style={{ marginTop: 12 }}>
            {updateError}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>AI Service</h2>
          <p>
            Choose a provider preset or configure your own OpenAI-compatible endpoint.
            Your API key is stored only on this device.
          </p>
        </div>
        <div className="settings-list">
          <label>
            <span>
              <Bot size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
              Provider preset
            </span>
            <select
              value={currentPreset.value}
              onChange={(e) => handlePresetChange(e.target.value)}
            >
              {PROVIDER_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Base URL</span>
            <input
              type="text"
              value={aiSettings.baseUrl}
              onChange={(e) => setAiSettings({ ...aiSettings, baseUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
              disabled={!aiUsesCustom}
            />
          </label>
          <label>
            <span>Model</span>
            <input
              type="text"
              value={aiSettings.model}
              onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
              placeholder="gpt-4o-mini"
              disabled={!aiUsesCustom}
            />
          </label>
          <label>
            <span>
              API Key
              {aiSettings.apiKey ? (
                <span className="key-mask"> ({maskKey(aiSettings.apiKey)})</span>
              ) : null}
            </span>
            <div className="input-with-toggle">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder={aiSettings.apiKey ? "Leave blank to keep current key" : "sk-..."}
                disabled={!aiUsesCustom}
              />
            </div>
          </label>

          <label className="checkbox-row">
            <span>
              <ShieldAlert size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
              Allow fallback to server proxy when custom provider fails
            </span>
            <input
              type="checkbox"
              checked={aiSettings.mode === "server" || aiSettings.mode === "custom"}
              onChange={(e) =>
                setAiSettings({ ...aiSettings, mode: e.target.checked ? "custom" : "server" })
              }
              disabled={!aiUsesCustom}
            />
          </label>
        </div>

        {publicHttpWarning && (
          <div className="auth-error" style={{ marginTop: 12 }} role="alert">
            <ShieldAlert size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
            This custom AI base URL uses public HTTP. BYOK is disabled for security.
            Please use HTTPS before entering an API key.
          </div>
        )}

        <div className="row-actions" style={{ marginTop: 12 }}>
          <button
            className="btn btn-primary"
            onClick={handleSaveAi}
            disabled={publicHttpBlocked}
          >
            <Save size={14} />
            Save AI settings
          </button>
          <button className="btn btn-secondary" onClick={handleClearKey} disabled={!aiSettings.apiKey}>
            <Trash2 size={14} />
            Clear local key
          </button>
        </div>
        {saveMsg && (
          <div className="auth-error" style={{ marginTop: 12 }}>
            {saveMsg}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Sync Policy</h2>
          <p>
            Data is written locally first. After login and network recovery, cloud sync uses last-write-wins for
            the first release.
          </p>
        </div>
        <div className="settings-list">
          <label>
            <span>Local-first sync</span>
            <input type="checkbox" checked readOnly />
          </label>
          <label>
            <span>AI drafts require confirmation before they affect tasks</span>
            <input type="checkbox" checked readOnly />
          </label>
        </div>
      </section>
    </section>
  );
}

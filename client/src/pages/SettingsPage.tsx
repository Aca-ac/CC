import { useState } from "react";
import { Activity, Bot, ExternalLink, RefreshCw, Save, Server, Trash2 } from "lucide-react";
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

  const handleSaveAi = () => {
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
            Use the server OpenAI-compatible proxy by default, or keep your own provider settings and API key only
            on this device.
          </p>
        </div>
        <div className="settings-list">
          <label>
            <span>
              <Bot size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
              AI mode
            </span>
            <select
              value={aiSettings.mode}
              onChange={(e) => setAiSettings({ ...aiSettings, mode: e.target.value as AiSettings["mode"] })}
            >
              <option value="server">Server default</option>
              <option value="custom">Custom OpenAI-compatible provider</option>
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
            <span>API Key {aiSettings.apiKey ? `(${maskKey(aiSettings.apiKey)})` : ""}</span>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={aiSettings.apiKey ? "Leave blank to keep current key" : "sk-..."}
              disabled={!aiUsesCustom}
            />
          </label>
        </div>
        {publicHttpWarning && (
          <div className="auth-error" style={{ marginTop: 12 }}>
            This custom AI base URL uses public HTTP. Use HTTPS before sending an API key.
          </div>
        )}
        <div className="row-actions" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={handleSaveAi}>
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

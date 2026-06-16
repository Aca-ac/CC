import { useState } from "react";
import { Activity, Save, Server } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../services/apiClient";

export function SettingsPage() {
  const { apiBaseUrl, setApiBaseUrl, offline } = useAuth();
  const [urlInput, setUrlInput] = useState(apiBaseUrl);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

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
          <h2>系统设置</h2>
          <p>FR-13 / UC-13：后续补主题、同步开关、AI Key、隐私授权和提醒策略。</p>
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

import { useState } from "react";
import {
  IconAi,
  IconAlert,
  IconCheck,
  IconRefresh,
  IconSettings,
  IconTrash,
  IconUpload,
} from "../components/icons";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Select,
  StateMessage,
  ThemeToggle,
} from "../components/ui";
import { useTheme } from "../contexts/ThemeContext";
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
  { label: "服务端默认", value: "server", baseUrl: "", model: "gpt-4o-mini" },
  { label: "OpenAI", value: "openai", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  {
    label: "Azure OpenAI",
    value: "azure",
    baseUrl: "https://{your-resource}.openai.azure.com/openai/deployments/{deployment}",
    model: "gpt-4o",
  },
  { label: "DeepSeek", value: "deepseek", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  {
    label: "SiliconFlow",
    value: "siliconflow",
    baseUrl: "https://api.siliconflow.cn/v1",
    model: "deepseek-ai/DeepSeek-V3",
  },
  { label: "自定义", value: "custom", baseUrl: "", model: "" },
];

function providerValue(settings: AiSettings): string {
  if (settings.mode === "server") return "server";

  const matchedPreset = PROVIDER_PRESETS.find(
    (preset) =>
      preset.value !== "server" &&
      preset.value !== "custom" &&
      preset.baseUrl === settings.baseUrl &&
      preset.model === settings.model
  );

  return matchedPreset?.value ?? "custom";
}

export function SettingsPage() {
  const { apiBaseUrl, setApiBaseUrl, offline } = useAuth();
  const { theme } = useTheme();
  const [urlInput, setUrlInput] = useState(apiBaseUrl);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [healthKind, setHealthKind] = useState<"info" | "error">("info");
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
    flash("API 地址已保存");
  };

  const handleHealthCheck = async () => {
    if (offline) {
      setHealthKind("error");
      setHealthStatus("离线模式下无法检查服务端。");
      return;
    }

    setHealthLoading(true);
    setHealthStatus(null);
    try {
      const result = await apiClient.health();
      setHealthKind("info");
      setHealthStatus(`服务端正常：${result.service}`);
    } catch (err) {
      setHealthKind("error");
      setHealthStatus(err instanceof Error ? err.message : "健康检查失败。");
    } finally {
      setHealthLoading(false);
    }
  };

  const handlePresetChange = (value: string) => {
    const preset = PROVIDER_PRESETS.find((item) => item.value === value);
    if (!preset) return;

    setAiSettings({
      mode: value === "server" ? "server" : "custom",
      baseUrl: preset.baseUrl,
      model: preset.model,
      apiKey: aiSettings.apiKey,
    });
  };

  const pendingKey = keyInput.trim() || aiSettings.apiKey;
  const aiUsesCustom = aiSettings.mode === "custom";
  const publicHttpWarning = aiUsesCustom && isPublicHttp(aiSettings.baseUrl);
  const publicHttpBlocked = publicHttpWarning && pendingKey.length > 0;

  const handleSaveAi = () => {
    if (publicHttpBlocked) {
      flash("公开 HTTP 地址不能保存自带 API Key。");
      return;
    }

    const next: AiSettings = {
      ...aiSettings,
      baseUrl: aiSettings.baseUrl.trim(),
      model: aiSettings.model.trim() || "gpt-4o-mini",
      apiKey: pendingKey,
    };

    saveAiSettings(next);
    setAiSettings(next);
    setKeyInput("");
    flash("AI 设置已保存");
  };

  const handleClearKey = () => {
    const next = { ...aiSettings, apiKey: "" };
    saveAiSettings(next);
    setAiSettings(next);
    setKeyInput("");
    flash("本地 API Key 已清除");
  };

  const handleCheckUpdates = async () => {
    setUpdateLoading(true);
    setUpdateError(null);
    try {
      const result = await checkForUpdates();
      setUpdateResult(result);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "更新检查失败。");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleOpenRelease = async () => {
    await openReleasePage(updateResult?.releaseUrl ?? "https://github.com/Vincent-Ctrl-18/Chronos/releases");
  };

  const selectedProvider = providerValue(aiSettings);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Settings"
        title="系统设置"
        description="配置外观、后端地址、AI 服务和桌面更新策略。"
        actions={
          <Badge tone={offline ? "warning" : "success"} dot>
            {offline ? "离线模式" : "在线模式"}
          </Badge>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Card>
          <CardHeader
            title="外观"
            subtitle="主题会保存在本机，下次启动自动恢复。"
            action={<Badge tone={theme === "dark" ? "neutral" : "brand"}>{theme === "dark" ? "深色" : "浅色"}</Badge>}
          />
          <div className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface p-3">
            <div className="min-w-0">
              <p className="text-[0.9rem] font-medium text-ink">界面主题</p>
              <p className="mt-1 text-[0.8rem] text-muted">使用紧凑圆角和中性深色面板。</p>
            </div>
            <ThemeToggle />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="API 地址"
            subtitle="桌面端和网页端都会从这里读取后端服务地址。"
            action={<Badge tone="info">{apiBaseUrl || "/api"}</Badge>}
          />
          <div className="grid gap-3">
            <Field label="API base URL" hint="留空会回到 /api。">
              <Input
                type="text"
                aria-label="API base URL"
                value={urlInput}
                onChange={(event) => setUrlInput(event.target.value)}
                placeholder="https://vincentt.xyz/chronos/api"
              />
            </Field>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleSaveUrl}>
                <IconCheck size={15} />
                保存 API 地址
              </Button>
              <Button variant="secondary" onClick={handleHealthCheck} disabled={healthLoading || offline}>
                <IconRefresh size={15} className={healthLoading ? "animate-spin" : undefined} />
                {healthLoading ? "检查中" : "健康检查"}
              </Button>
            </div>
            {healthStatus && <StateMessage kind={healthKind}>{healthStatus}</StateMessage>}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="AI 服务"
          subtitle="支持 OpenAI 兼容接口；自带 Key 只保存在本机，并会拒绝公开 HTTP 地址。"
          action={
            aiSettings.apiKey ? (
              <Badge tone="success">{maskKey(aiSettings.apiKey)}</Badge>
            ) : (
              <Badge tone="neutral">未配置 Key</Badge>
            )
          }
        />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <Field label="Provider preset">
              <Select value={selectedProvider} onChange={(event) => handlePresetChange(event.target.value)}>
                {PROVIDER_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Base URL" hint={aiUsesCustom ? "必须是 OpenAI 兼容的 /v1 入口。" : "服务端默认模式无需本机配置。"}>
              <Input
                type="text"
                value={aiSettings.baseUrl}
                onChange={(event) => setAiSettings({ ...aiSettings, baseUrl: event.target.value })}
                placeholder="https://api.openai.com/v1"
                disabled={!aiUsesCustom}
              />
            </Field>

            <Field label="Model">
              <Input
                type="text"
                value={aiSettings.model}
                onChange={(event) => setAiSettings({ ...aiSettings, model: event.target.value })}
                placeholder="gpt-4o-mini"
                disabled={!aiUsesCustom}
              />
            </Field>

            <Field label="API Key" hint={aiSettings.apiKey ? "留空保存会继续使用当前 Key。" : "仅自定义提供商需要填写。"}>
              <Input
                type="password"
                value={keyInput}
                onChange={(event) => setKeyInput(event.target.value)}
                placeholder={aiSettings.apiKey ? "保持当前 Key" : "sk-..."}
                disabled={!aiUsesCustom}
              />
            </Field>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-line bg-surface p-3">
              <div className="flex items-start gap-2">
                <IconAi size={18} className="mt-0.5 text-brand" />
                <div className="min-w-0">
                  <p className="text-[0.9rem] font-medium text-ink">调用策略</p>
                  <p className="mt-1 text-[0.82rem] leading-relaxed text-muted">
                    拆解与复盘会优先使用这里的 OpenAI 兼容配置；未配置时回到服务端默认提供商。
                  </p>
                </div>
              </div>
            </div>

            {publicHttpWarning && (
              <StateMessage kind="error">
                当前自定义地址使用公开 HTTP。请改用 HTTPS 后再保存 API Key。
              </StateMessage>
            )}

            {saveMsg && <StateMessage>{saveMsg}</StateMessage>}

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleSaveAi} disabled={publicHttpBlocked}>
                <IconCheck size={15} />
                保存 AI 设置
              </Button>
              <Button variant="secondary" onClick={handleClearKey} disabled={!aiSettings.apiKey}>
                <IconTrash size={15} />
                清除本地 Key
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="应用更新"
            subtitle="检查 GitHub Release；桌面端会打开系统浏览器下载。"
            action={<Badge tone="neutral">v{CURRENT_APP_VERSION}</Badge>}
          />
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={handleCheckUpdates} disabled={updateLoading}>
                <IconRefresh size={15} className={updateLoading ? "animate-spin" : undefined} />
                {updateLoading ? "检查中" : "检查更新"}
              </Button>
              {(updateResult?.status === "available" || updateResult?.status === "unavailable") && (
                <Button onClick={handleOpenRelease}>
                  <IconUpload size={15} />
                  打开发布页
                </Button>
              )}
            </div>
            {updateResult && (
              <StateMessage kind={updateResult.status === "available" ? "info" : "info"}>
                {updateResult.message}
              </StateMessage>
            )}
            {updateError && <StateMessage kind="error">{updateError}</StateMessage>}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="同步策略"
            subtitle="Chronos 继续保持本地优先，网络恢复后再同步。"
            action={<IconSettings size={18} className="text-brand" />}
          />
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2">
              <span className="text-[0.86rem] text-ink">本地优先写入</span>
              <Badge tone="success">启用</Badge>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2">
              <span className="text-[0.86rem] text-ink">AI 草稿确认后落库</span>
              <Badge tone="brand">启用</Badge>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2">
              <span className="text-[0.86rem] text-ink">冲突由用户选择保留版本</span>
              <Badge tone="warning">手动</Badge>
            </div>
          </div>
        </Card>
      </div>

      {publicHttpBlocked && (
        <StateMessage kind="error">
          <IconAlert size={16} />
          公开 HTTP 地址不能与本地 API Key 同时保存。
        </StateMessage>
      )}
    </div>
  );
}

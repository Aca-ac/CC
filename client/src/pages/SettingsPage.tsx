import { useCallback, useEffect, useState } from "react";
import {
  IconAi,
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
import { apiClient, type AiSettingsItem } from "../services/apiClient";
import {
  CURRENT_APP_VERSION,
  checkForUpdates,
  openReleasePage,
  type UpdateCheckResult,
} from "../services/updateService";

// 后端 AiProviderFactory 支持的 provider；Key 以大写 provider 名加密存储，
// 各 provider 的 endpoint/model 由服务端部署配置决定。
const AI_PROVIDERS = [
  { code: "OPENAI", label: "OpenAI 兼容" },
  { code: "DEEPSEEK", label: "DeepSeek" },
  { code: "MIMO", label: "MiMo" },
];

export function SettingsPage() {
  const { apiBaseUrl, setApiBaseUrl, offline, session } = useAuth();
  const { theme } = useTheme();
  const [urlInput, setUrlInput] = useState(apiBaseUrl);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [healthKind, setHealthKind] = useState<"info" | "error">("info");
  const [healthLoading, setHealthLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [aiProvider, setAiProvider] = useState("OPENAI");
  const [keyInput, setKeyInput] = useState("");
  const [aiSettings, setAiSettings] = useState<AiSettingsItem[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const aiManageable = Boolean(session) && !offline;

  const refreshAiSettings = useCallback(async () => {
    if (!aiManageable) return;
    try {
      const list = await apiClient.listAiSettings();
      setAiSettings(list ?? []);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : String(err));
    }
  }, [aiManageable]);

  useEffect(() => {
    refreshAiSettings();
  }, [refreshAiSettings]);

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

  const currentMaskedKey = aiSettings.find((item) => item.provider === aiProvider)?.maskedKey ?? null;

  const handleSaveAi = async () => {
    const key = keyInput.trim();
    if (key.length < 8) {
      setAiError("API Key 至少需要 8 个字符。");
      return;
    }
    setAiBusy(true);
    setAiError(null);
    try {
      await apiClient.updateAiSettings({ provider: aiProvider, apiKey: key, isCustom: true });
      setKeyInput("");
      await refreshAiSettings();
      flash("AI Key 已加密保存到服务端");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : String(err));
    } finally {
      setAiBusy(false);
    }
  };

  const handleClearKey = async () => {
    setAiBusy(true);
    setAiError(null);
    try {
      await apiClient.deleteAiSettings(aiProvider);
      await refreshAiSettings();
      flash("已删除该 provider 的 Key");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : String(err));
    } finally {
      setAiBusy(false);
    }
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
          title="AI 服务（BYOK）"
          subtitle="自带 Key 经服务端 AES-GCM 加密保存；未配置时后端使用内置 Mock。"
          action={
            currentMaskedKey ? (
              <Badge tone="success">{currentMaskedKey}</Badge>
            ) : (
              <Badge tone="neutral">未配置 Key</Badge>
            )
          }
        />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <Field label="Provider">
              <Select value={aiProvider} onChange={(event) => setAiProvider(event.target.value)}>
                {AI_PROVIDERS.map((provider) => (
                  <option key={provider.code} value={provider.code}>
                    {provider.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="API Key"
              hint={currentMaskedKey ? `当前已配置：${currentMaskedKey}` : "仅在线登录后可配置（HTTPS 环境）。"}
            >
              <Input
                type="password"
                value={keyInput}
                onChange={(event) => setKeyInput(event.target.value)}
                placeholder="sk-..."
                disabled={!aiManageable || aiBusy}
                aria-label="AI API Key"
              />
            </Field>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleSaveAi} disabled={!aiManageable || aiBusy}>
                <IconCheck size={15} />
                保存 Key
              </Button>
              <Button
                variant="secondary"
                onClick={handleClearKey}
                disabled={!aiManageable || aiBusy || !currentMaskedKey}
              >
                <IconTrash size={15} />
                删除 Key
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-line bg-surface p-3">
              <div className="flex items-start gap-2">
                <IconAi size={18} className="mt-0.5 text-brand" />
                <div className="min-w-0">
                  <p className="text-[0.9rem] font-medium text-ink">调用策略</p>
                  <p className="mt-1 text-[0.82rem] leading-relaxed text-muted">
                    拆解与复盘优先使用所选 provider 的加密 Key；服务端按部署配置选择启用的 provider，
                    无可用 Key 时回落内置 Mock，核心流程不受影响。
                  </p>
                </div>
              </div>
            </div>

            {!aiManageable && (
              <StateMessage>登录在线后可配置 AI Key（Key 加密存储于服务端，不写入本机）。</StateMessage>
            )}
            {aiError && <StateMessage kind="error">{aiError}</StateMessage>}
            {saveMsg && <StateMessage>{saveMsg}</StateMessage>}
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
            {updateResult && <StateMessage kind="info">{updateResult.message}</StateMessage>}
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
    </div>
  );
}

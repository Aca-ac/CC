import { useCallback, useEffect, useState } from "react";
import {
  IconCheck,
  IconLogout,
  IconRefresh,
  IconTrash,
  IconUpload,
  IconUser,
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
  checkDesktopUpdate,
  checkForUpdates,
  downloadDesktopUpdate,
  hasDesktopUpdater,
  installDesktopUpdate,
  type DesktopUpdateStatus,
  openReleasePage,
  type UpdateCheckResult,
} from "../services/updateService";

// 后端 AiProviderFactory 支持的 provider 及其常见模型名（仅作输入提示）。
const AI_PROVIDERS = [
  { code: "OPENAI", label: "OpenAI 兼容", modelHint: "如 gpt-4o-mini" },
  { code: "DEEPSEEK", label: "DeepSeek", modelHint: "如 deepseek-chat" },
  { code: "MIMO", label: "MiMo", modelHint: "如 mimo-v2.5-pro" },
];

export function SettingsPage() {
  const { offline, session, logout } = useAuth();
  const { theme } = useTheme();
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [aiProvider, setAiProvider] = useState("OPENAI");
  const [keyInput, setKeyInput] = useState("");
  const [modelInput, setModelInput] = useState("");
  const [aiSettings, setAiSettings] = useState<AiSettingsItem[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [desktopUpdateStatus, setDesktopUpdateStatus] = useState<DesktopUpdateStatus | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const aiManageable = Boolean(session) && !offline;
  const providerMeta = AI_PROVIDERS.find((item) => item.code === aiProvider);

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

  // 切换服务商或拉到新设置时，把已保存的模型名回填到输入框。
  useEffect(() => {
    const current = aiSettings.find((item) => item.provider === aiProvider);
    setModelInput(current?.model ?? "");
  }, [aiProvider, aiSettings]);

  useEffect(() => {
    if (!hasDesktopUpdater()) return;
    return window.chronosDesktop?.updates?.onStatus(setDesktopUpdateStatus);
  }, []);

  const flash = (message: string) => {
    setSaveMsg(message);
    window.setTimeout(() => setSaveMsg(null), 2000);
  };

  const currentSetting = aiSettings.find((item) => item.provider === aiProvider);
  const currentMaskedKey = currentSetting?.maskedKey ?? null;

  const handleSaveAi = async () => {
    const key = keyInput.trim();
    if (key.length < 8) {
      setAiError("API 密钥至少需要 8 个字符。");
      return;
    }
    setAiBusy(true);
    setAiError(null);
    try {
      await apiClient.updateAiSettings({
        provider: aiProvider,
        apiKey: key,
        isCustom: true,
        model: modelInput.trim() || undefined,
      });
      setKeyInput("");
      await refreshAiSettings();
      flash("已加密保存到服务端");
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
      flash("已删除该服务商的密钥");
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
      if (hasDesktopUpdater()) {
        setDesktopUpdateStatus(await checkDesktopUpdate());
        return;
      }
      const result = await checkForUpdates();
      setUpdateResult(result);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "更新检查失败。");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDownloadUpdate = async () => {
    setUpdateLoading(true);
    setUpdateError(null);
    try {
      setDesktopUpdateStatus(await downloadDesktopUpdate());
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "更新下载失败。");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleInstallUpdate = async () => {
    setUpdateLoading(true);
    setUpdateError(null);
    try {
      setDesktopUpdateStatus(await installDesktopUpdate());
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "更新安装失败。");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleOpenRelease = async () => {
    await openReleasePage(updateResult?.releaseUrl ?? "https://github.com/Vincent-Ctrl-18/Chronos/releases");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="偏好设置"
        title="系统设置"
        description="管理外观、账号、AI 服务与应用更新。"
        actions={
          <Badge tone={offline ? "warning" : "success"} dot>
            {offline ? "离线模式" : "在线模式"}
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 外观 */}
        <Card>
          <CardHeader
            title="外观主题"
            subtitle="设置保存在本机，下次启动自动恢复。"
            action={<Badge tone={theme === "dark" ? "neutral" : "brand"}>{theme === "dark" ? "深色" : "浅色"}</Badge>}
          />
          <div className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface p-3">
            <p className="text-[0.9rem] font-medium text-ink">浅色 / 深色</p>
            <ThemeToggle />
          </div>
        </Card>

        {/* 账号 */}
        <Card>
          <CardHeader title="账号" subtitle="管理当前登录账号。" />
          {session ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
                  <IconUser size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[0.92rem] font-medium text-ink">{session.name}</p>
                  <p className="truncate text-[0.8rem] text-muted">{session.email}</p>
                </div>
              </div>
              <Button variant="secondary" onClick={logout}>
                <IconLogout size={15} />
                退出登录
              </Button>
            </div>
          ) : (
            <StateMessage>当前为本地演示模式，登录后可同步数据并配置 AI 服务。</StateMessage>
          )}
        </Card>
      </div>

      {/* AI 服务 */}
      <Card>
        <CardHeader
          title="AI 服务"
          subtitle="填入自己的密钥后，拆解与复盘将使用你的账号调用；未配置时使用内置示例回复。"
          action={
            currentMaskedKey ? (
              <Badge tone="success">{currentMaskedKey}</Badge>
            ) : (
              <Badge tone="neutral">未配置</Badge>
            )
          }
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="服务商">
            <Select value={aiProvider} onChange={(event) => setAiProvider(event.target.value)}>
              {AI_PROVIDERS.map((provider) => (
                <option key={provider.code} value={provider.code}>
                  {provider.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="模型名称" hint={providerMeta?.modelHint}>
            <Input
              type="text"
              value={modelInput}
              onChange={(event) => setModelInput(event.target.value)}
              placeholder={providerMeta?.modelHint ?? "使用默认模型"}
              disabled={!aiManageable || aiBusy}
              aria-label="模型名称"
            />
          </Field>

          <Field
            label="API 密钥"
            hint={currentMaskedKey ? `当前：${currentMaskedKey}` : "需登录并在 HTTPS 环境下配置。"}
            className="sm:col-span-2"
          >
            <Input
              type="password"
              value={keyInput}
              onChange={(event) => setKeyInput(event.target.value)}
              placeholder="sk-..."
              disabled={!aiManageable || aiBusy}
              aria-label="API 密钥"
            />
          </Field>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={handleSaveAi} disabled={!aiManageable || aiBusy}>
            <IconCheck size={15} />
            保存
          </Button>
          <Button
            variant="secondary"
            onClick={handleClearKey}
            disabled={!aiManageable || aiBusy || !currentMaskedKey}
          >
            <IconTrash size={15} />
            删除密钥
          </Button>
          {!aiManageable && (
            <span className="text-[0.8rem] text-muted">登录后可配置（密钥加密存储于服务端）。</span>
          )}
          {saveMsg && (
            <span className="inline-flex items-center gap-1 text-[0.82rem] text-success">
              <IconCheck size={13} />
              {saveMsg}
            </span>
          )}
        </div>
        {aiError && <StateMessage kind="error" className="mt-3">{aiError}</StateMessage>}
      </Card>

      {/* 应用更新 */}
      <Card>
        <CardHeader
          title="应用更新"
          subtitle={hasDesktopUpdater()
            ? "发现新版本后，由你确认下载并重启安装。"
            : "网页与便携版从发布页获取安装包。"}
          action={<Badge tone="neutral">v{CURRENT_APP_VERSION}</Badge>}
        />
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={handleCheckUpdates} disabled={updateLoading}>
              <IconRefresh size={15} className={updateLoading ? "animate-spin" : undefined} />
              {updateLoading ? "检查中" : "检查更新"}
            </Button>
            {hasDesktopUpdater() && desktopUpdateStatus?.state === "available" && (
              <Button onClick={handleDownloadUpdate} disabled={updateLoading}>
                <IconUpload size={15} />
                下载更新
              </Button>
            )}
            {hasDesktopUpdater() && desktopUpdateStatus?.state === "downloaded" && (
              <Button onClick={handleInstallUpdate} disabled={updateLoading}>
                <IconCheck size={15} />
                重启并安装
              </Button>
            )}
            {!hasDesktopUpdater() && (updateResult?.status === "available" || updateResult?.status === "unavailable") && (
              <Button onClick={handleOpenRelease}>
                <IconUpload size={15} />
                打开发布页
              </Button>
            )}
          </div>
          {desktopUpdateStatus && (
            <StateMessage kind={desktopUpdateStatus.state === "error" ? "error" : "info"}>
              {desktopUpdateStatus.state === "checking" && "正在检查更新。"}
              {desktopUpdateStatus.state === "available" && `已发现 ${desktopUpdateStatus.version ?? ""}，请确认下载。`}
              {desktopUpdateStatus.state === "not-available" && "当前已是最新版本。"}
              {desktopUpdateStatus.state === "downloading" && `正在下载${desktopUpdateStatus.percent === undefined ? "" : ` ${desktopUpdateStatus.percent}%`}。`}
              {desktopUpdateStatus.state === "downloaded" && "下载完成，请确认重启并安装。"}
              {desktopUpdateStatus.state === "installing" && "正在重启并安装更新。"}
              {desktopUpdateStatus.state === "unsupported" && (desktopUpdateStatus.message ?? "请使用 Windows 安装版获得自动更新。")}
              {desktopUpdateStatus.state === "error" && (desktopUpdateStatus.message ?? "更新失败，请稍后再试。")}
            </StateMessage>
          )}
          {updateResult && <StateMessage kind="info">{updateResult.message}</StateMessage>}
          {updateError && <StateMessage kind="error">{updateError}</StateMessage>}
        </div>
      </Card>
    </div>
  );
}

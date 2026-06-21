import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconAlert,
  IconCheck,
  IconCheckCircle,
  IconLogout,
  IconRefresh,
  IconSparkles,
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
  Modal,
  PageHeader,
  Select,
  StateMessage,
  ThemeToggle,
} from "../components/ui";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { apiClient, type AiSettingsItem } from "../services/apiClient";
import { deleteDB } from "../storage/db";
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

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const handleDeleteAccount = async () => {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await apiClient.deleteAccount();
      // 清理本地缓存与离线数据，避免下个账号看到残留
      try {
        await deleteDB();
      } catch {
        /* 忽略本地清理失败 */
      }
      ["chronos:habitChecked", "chronos:aiBreakdownDraft", "chronos_stats_cache"].forEach((key) =>
        localStorage.removeItem(key),
      );
      setDeleteOpen(false);
      logout(); // 会话清空后自动跳回登录页
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="偏好设置"
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
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={logout}>
                  <IconLogout size={15} />
                  退出登录
                </Button>
                <Button
                  variant="ghost"
                  className="text-danger hover:bg-danger-soft"
                  onClick={() => {
                    setDeleteConfirm("");
                    setDeleteError(null);
                    setDeleteOpen(true);
                  }}
                  disabled={offline}
                  title={offline ? "离线模式下无法注销账号" : undefined}
                >
                  <IconTrash size={15} />
                  注销账号
                </Button>
              </div>
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
            <AnimatePresence mode="wait">
              <motion.div
                key={desktopUpdateStatus.state}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                {desktopUpdateStatus.state === "downloading" ? (
                  <div className="rounded-md border border-line bg-panel-muted/60 p-3">
                    <div className="mb-2 flex items-center justify-between text-[0.82rem]">
                      <span className="flex items-center gap-1.5 font-medium text-brand">
                        <IconUpload size={14} />
                        {desktopUpdateStatus.message ?? "正在下载更新…"}
                      </span>
                      <span className="font-serif tabular-nums text-ink">
                        {desktopUpdateStatus.percent ?? 0}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-line/70">
                      {(desktopUpdateStatus.percent ?? 0) > 0 ? (
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: "linear-gradient(90deg, var(--grad-from), var(--grad-to))" }}
                          initial={{ width: 0 }}
                          animate={{ width: `${desktopUpdateStatus.percent ?? 0}%` }}
                          transition={{ ease: "easeOut", duration: 0.4 }}
                        />
                      ) : (
                        // 0%/准备阶段：来回扫光的不确定进度条，避免看起来「卡住」
                        <motion.div
                          className="h-full w-1/3 rounded-full"
                          style={{ background: "linear-gradient(90deg, transparent, var(--accent), transparent)" }}
                          animate={{ x: ["-120%", "320%"] }}
                          transition={{ duration: 1.15, repeat: Infinity, ease: "easeInOut" }}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <StateMessage kind={desktopUpdateStatus.state === "error" ? "error" : "info"}>
                    {desktopUpdateStatus.state === "checking" && (
                      <>
                        <IconRefresh size={15} className="animate-spin" />
                        正在检查更新…
                      </>
                    )}
                    {desktopUpdateStatus.state === "available" && (
                      <>
                        <motion.span
                          className="inline-flex text-brand"
                          animate={{ scale: [1, 1.18, 1] }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <IconSparkles size={15} />
                        </motion.span>
                        已发现新版本 {desktopUpdateStatus.version ?? ""}，请确认下载。
                      </>
                    )}
                    {desktopUpdateStatus.state === "not-available" && (
                      <>
                        <IconCheckCircle size={15} className="text-success" />
                        当前已是最新版本。
                      </>
                    )}
                    {desktopUpdateStatus.state === "downloaded" && (
                      <>
                        <motion.span
                          className="inline-flex text-success"
                          initial={{ scale: 0.6 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 520, damping: 16 }}
                        >
                          <IconCheck size={15} />
                        </motion.span>
                        下载完成，请确认重启并安装。
                      </>
                    )}
                    {desktopUpdateStatus.state === "installing" && (
                      <>
                        <IconRefresh size={15} className="animate-spin" />
                        正在重启并安装更新…
                      </>
                    )}
                    {desktopUpdateStatus.state === "unsupported" &&
                      (desktopUpdateStatus.message ?? "请使用 Windows 安装版获得自动更新。")}
                    {desktopUpdateStatus.state === "error" && (
                      <>
                        <IconAlert size={15} />
                        {desktopUpdateStatus.message ?? "更新失败，请稍后再试。"}
                      </>
                    )}
                  </StateMessage>
                )}
              </motion.div>
            </AnimatePresence>
          )}
          {updateResult && <StateMessage kind="info">{updateResult.message}</StateMessage>}
          {updateError && <StateMessage kind="error">{updateError}</StateMessage>}
        </div>
      </Card>

      {/* 注销账号确认 */}
      <Modal
        open={deleteOpen}
        onClose={() => !deleteBusy && setDeleteOpen(false)}
        title="注销账号"
        subtitle="此操作将永久删除你的账号及全部数据，且不可恢复。"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={deleteBusy}>
              取消
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              disabled={deleteBusy || deleteConfirm.trim() !== "注销"}
            >
              <IconTrash size={15} />
              {deleteBusy ? "注销中…" : "永久注销"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <StateMessage kind="error">
            项目、任务、学习日志、专注记录、习惯打卡与 AI 设置都会被一并删除，无法找回。
          </StateMessage>
          <Field label="请输入「注销」以确认">
            <Input
              value={deleteConfirm}
              onChange={(event) => setDeleteConfirm(event.target.value)}
              placeholder="注销"
              aria-label="注销确认"
            />
          </Field>
          {deleteError && <StateMessage kind="error">{deleteError}</StateMessage>}
        </div>
      </Modal>
    </div>
  );
}

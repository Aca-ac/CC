import { useAuth } from "../hooks/useAuth";
import { useSync } from "../hooks/useSync";
import { cn } from "../lib/cn";
import { IconCheck, IconLoader, IconRefresh, IconUpload } from "./icons";

/**
 * 侧栏底部的同步状态芯片：在线登录时自动静默同步，仅作状态展示；点击可手动立即同步。
 */
export function SyncStatusChip({
  className,
  expanded = true,
}: {
  className?: string;
  expanded?: boolean;
}) {
  const { session, offline } = useAuth();
  const accountId = session?.userId ?? "local";
  // 已登录且非离线模式时启用自动同步
  const autoSync = Boolean(session) && !offline;
  const { status, pending, syncNow } = useSync(accountId, autoSync);

  const syncing = status === "syncing";
  const hasPending = pending > 0;

  const label = syncing
    ? "同步中…"
    : status === "error"
      ? "同步失败"
      : hasPending
        ? `${pending} 项待同步`
        : autoSync
          ? "已自动同步"
          : "已同步";

  const tone =
    status === "error"
      ? "text-danger"
      : hasPending
        ? "text-warning"
        : "text-success";

  return (
    <button
      type="button"
      onClick={() => void syncNow()}
      disabled={syncing}
      title={`点击立即同步：${label}`}
      aria-label={`同步状态：${label}`}
      className={cn(
        "flex w-full items-center rounded-md border border-line bg-panel-muted text-left text-[0.8rem]",
        "transition-colors duration-150 hover:border-brand disabled:opacity-70",
        expanded ? "gap-2 px-3 py-2" : "h-9 justify-center px-0 py-0",
        className
      )}
    >
      <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-md", tone)}>
        {syncing ? (
          <IconLoader size={15} className="animate-spin" />
        ) : status === "error" ? (
          <IconRefresh size={15} />
        ) : hasPending ? (
          <IconUpload size={15} />
        ) : (
          <IconCheck size={15} />
        )}
      </span>
      {expanded && <span className={cn("flex-1 truncate font-medium", tone)}>{label}</span>}
    </button>
  );
}

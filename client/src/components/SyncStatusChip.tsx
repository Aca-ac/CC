import { useAccountId } from "../hooks/useAccountId";
import { useSync } from "../hooks/useSync";
import { cn } from "../lib/cn";
import { IconCheck, IconLoader, IconRefresh, IconUpload } from "./icons";

/**
 * 侧栏底部的同步状态芯片：展示待同步数量与同步状态，点击触发一次完整同步。
 */
export function SyncStatusChip({ className }: { className?: string }) {
  const accountId = useAccountId();
  const { status, pending, syncNow } = useSync(accountId);

  const syncing = status === "syncing";
  const hasPending = pending > 0;

  const label = syncing
    ? "同步中…"
    : status === "error"
      ? "同步失败"
      : hasPending
        ? `${pending} 项待同步`
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
      title="点击立即同步"
      className={cn(
        "flex w-full items-center gap-2 rounded-md border border-line bg-panel-muted px-3 py-2 text-left text-[0.8rem]",
        "transition-colors duration-150 hover:border-brand disabled:opacity-70",
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
      <span className={cn("flex-1 truncate font-medium", tone)}>{label}</span>
    </button>
  );
}

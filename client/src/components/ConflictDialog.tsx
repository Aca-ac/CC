import type { ReactNode } from "react";
import { IconAlert, IconCheck, IconUpload, IconUser } from "./icons";
import { Badge, Button, Card, StateMessage, Modal } from "./ui";
import type { ConflictValue } from "../storage/db";

interface ConflictDialogProps {
  /** 当前冲突列表 */
  conflicts: ConflictValue[];
  /** 是否正在解决中 */
  resolving: boolean;
  /** 错误信息 */
  error: string | null;
  /** 是否显示弹窗 */
  open: boolean;
  /** 关闭弹窗 */
  onClose: () => void;
  /** 解决冲突回调 */
  onResolve: (conflictId: string, resolution: "local" | "remote") => Promise<boolean>;
}

const ENTITY_TYPE_LABEL: Record<string, string> = {
  PROJECT: "项目",
  TASK: "任务",
  LOG: "学习日志",
  FOCUS: "专注计时",
};

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function tryParseJson(str: string): Record<string, unknown> {
  try {
    return JSON.parse(str) as Record<string, unknown>;
  } catch {
    return { _raw: str };
  }
}

function extractTitle(data: Record<string, unknown>): string {
  return (data.title as string) ?? (data.name as string) ?? (data.content as string) ?? "(未知)";
}

function JsonPanel({
  title,
  icon,
  tone,
  data,
  createdAt,
}: {
  title: string;
  icon: ReactNode;
  tone: "brand" | "info";
  data: Record<string, unknown>;
  createdAt: number;
}) {
  return (
    <Card className="min-w-0 bg-surface">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-panel-muted text-brand">
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-[0.9rem] font-semibold text-ink">{title}</p>
            <p className="mt-0.5 text-[0.74rem] text-muted">{formatTimestamp(createdAt)}</p>
          </div>
        </div>
        <Badge tone={tone}>{title.includes("本机") ? "local" : "cloud"}</Badge>
      </div>
      <pre className="max-h-[320px] overflow-auto rounded-lg border border-line bg-panel p-3 text-[0.78rem] leading-relaxed text-ink">
        {JSON.stringify(data, null, 2)}
      </pre>
    </Card>
  );
}

export function ConflictDialog({
  conflicts,
  resolving,
  error,
  open,
  onClose,
  onResolve,
}: ConflictDialogProps) {
  if (!open || conflicts.length === 0) return null;

  const current = conflicts[0];
  const localParsed = tryParseJson(current.localData);
  const remoteParsed = tryParseJson(current.remoteData);
  const entityType = ENTITY_TYPE_LABEL[current.entityType] ?? current.entityType;

  const handleResolve = async (resolution: "local" | "remote") => {
    const success = await onResolve(current.id, resolution);
    if (success && conflicts.length <= 1) {
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="数据冲突"
      subtitle={`${entityType} · ${extractTitle(localParsed)}`}
      width={920}
      footer={
        <>
          <Button variant="secondary" onClick={() => handleResolve("remote")} disabled={resolving}>
            <IconUpload size={16} />
            保留云端副本
          </Button>
          <Button onClick={() => handleResolve("local")} disabled={resolving}>
            <IconCheck size={16} />
            保留本机副本
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <IconAlert size={18} className="mt-0.5 text-warning" />
            <p className="max-w-[620px] text-[0.86rem] leading-relaxed text-muted">
              同一条数据在本机和云端同时变化。Chronos 不做自动合并，请选择要保留的副本。
            </p>
          </div>
          {conflicts.length > 1 && <Badge tone="warning">第 1 / {conflicts.length} 个冲突</Badge>}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <JsonPanel
            title="本机副本"
            icon={<IconUser size={16} />}
            tone="brand"
            data={localParsed}
            createdAt={current.createdAt}
          />
          <div className="hidden items-center justify-center px-1 text-[0.74rem] font-semibold text-muted lg:flex">
            VS
          </div>
          <JsonPanel
            title="云端副本"
            icon={<IconUpload size={16} />}
            tone="info"
            data={remoteParsed}
            createdAt={current.createdAt}
          />
        </div>

        {error && (
          <div role="alert">
            <StateMessage kind="error">{error}</StateMessage>
          </div>
        )}
      </div>
    </Modal>
  );
}

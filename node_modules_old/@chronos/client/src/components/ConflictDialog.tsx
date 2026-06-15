import { AlertTriangle, Cloud, HardDrive, X } from "lucide-react";
import type { ConflictValue } from "../storage/db";

// ── 类型 ────────────────────────────────────────────────────────

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

// ── 辅助 ────────────────────────────────────────────────────────

const ENTITY_TYPE_LABEL: Record<ConflictValue["entityType"], string> = {
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

// ── 组件 ────────────────────────────────────────────────────────

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

  const handleResolve = async (resolution: "local" | "remote") => {
    const success = await onResolve(current.id, resolution);
    if (success && conflicts.length <= 1) {
      onClose();
    }
  };

  return (
    <div className="conflict-overlay" role="dialog" aria-modal="true" aria-label="冲突解决">
      <div className="conflict-dialog">
        {/* 头部 */}
        <div className="conflict-header">
          <div className="conflict-header-icon">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2>数据冲突</h2>
            <p className="conflict-subtitle">
              {ENTITY_TYPE_LABEL[current.entityType]} · {extractTitle(localParsed)}
            </p>
          </div>
          <button
            className="conflict-close"
            onClick={onClose}
            aria-label="关闭"
            disabled={resolving}
          >
            <X size={18} />
          </button>
        </div>

        {/* 冲突计数 */}
        {conflicts.length > 1 && (
          <div className="conflict-counter">
            第 1 / {conflicts.length} 个冲突
          </div>
        )}

        {/* 版本对比 */}
        <div className="conflict-compare">
          {/* 本地版本 */}
          <div className="conflict-side conflict-local">
            <div className="conflict-side-header">
              <HardDrive size={16} />
              <span>本地版本</span>
            </div>
            <pre className="conflict-json">{JSON.stringify(localParsed, null, 2)}</pre>
            <time className="conflict-time">{formatTimestamp(current.createdAt)}</time>
          </div>

          {/* VS 分隔 */}
          <div className="conflict-vs" aria-hidden="true">
            VS
          </div>

          {/* 云端版本 */}
          <div className="conflict-side conflict-remote">
            <div className="conflict-side-header">
              <Cloud size={16} />
              <span>云端版本</span>
            </div>
            <pre className="conflict-json">{JSON.stringify(remoteParsed, null, 2)}</pre>
            <time className="conflict-time">
              {formatTimestamp(current.createdAt)}
            </time>
          </div>
        </div>

        {/* 策略说明 */}
        <p className="conflict-policy">
          不做自动合并，请选择保留哪个版本。
        </p>

        {/* 错误提示 */}
        {error && (
          <div className="conflict-error" role="alert">
            {error}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="conflict-actions">
          <button
            className="btn btn-secondary"
            onClick={() => handleResolve("remote")}
            disabled={resolving}
          >
            <Cloud size={16} />
            保留云端版本
          </button>
          <button
            className="btn btn-primary"
            onClick={() => handleResolve("local")}
            disabled={resolving}
          >
            <HardDrive size={16} />
            保留本地版本
          </button>
        </div>
      </div>
    </div>
  );
}

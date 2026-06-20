import { useCallback, useEffect, useRef, useState } from "react";
import { OUTBOX_CHANGED_EVENT, outboxRepository } from "../storage/repositories/outboxRepository";
import { fullSync } from "../services/syncService";

/** 周期性静默同步的心跳间隔（毫秒）。 */
const SYNC_HEARTBEAT_MS = 20_000;
/** 本地写入后到触发推送的去抖延迟（毫秒）。 */
const SYNC_DEBOUNCE_MS = 1_200;

export interface UseSyncReturn {
  /** 当前同步状态 */
  status: "idle" | "syncing" | "synced" | "error";
  /** 待同步条目数量（pending / failed / conflict） */
  pending: number;
  /** 上次同步完成的时间戳（毫秒），null 表示尚未同步 */
  lastSyncedAt: number | null;
  /** 最后一次同步的错误信息 */
  error: string | null;
  /** 立即执行一次完整同步；已在同步中时忽略 */
  syncNow: () => Promise<void>;
  /** 刷新待同步计数 */
  refreshPending: () => Promise<void>;
}

/**
 * useSync — 同步状态管理 Hook
 *
 * 提供同步触发、状态跟踪和待同步条目计数。
 * accountId 需要由调用方传入（从 auth context 获取），为 null 时不执行任何操作。
 *
 * `auto` 为 true（已登录且在线）时进行静默自动同步：挂载即同步、本地写入后即时推送、
 * 网络恢复时补同步，并以心跳间隔周期回拉远端变更，无需用户手动点击。
 */
export function useSync(accountId: string | null, auto = false): UseSyncReturn {
  const [status, setStatus] = useState<UseSyncReturn["status"]>("idle");
  const [pending, setPending] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** 防止并发同步的 ref 标志 */
  const isSyncing = useRef(false);

  const refreshPending = useCallback(async () => {
    if (!accountId) return;
    try {
      const entries = await outboxRepository.findPending(accountId);
      setPending(entries.length);
    } catch {
      // 忽略刷新计数失败，不影响状态
    }
  }, [accountId]);

  const syncNow = useCallback(async () => {
    if (!accountId) return;
    if (isSyncing.current) return;

    isSyncing.current = true;
    setStatus("syncing");
    setError(null);

    try {
      const result = await fullSync(accountId);
      setLastSyncedAt(Date.now());
      await refreshPending();

      if (result.errors.length === 0) {
        setStatus("synced");
      } else {
        setError(result.errors.join("; "));
        setStatus("error");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setStatus("error");
    } finally {
      isSyncing.current = false;
    }
  }, [accountId, refreshPending]);

  // 挂载或 accountId 变化时刷新待同步计数
  useEffect(() => {
    if (!accountId) return;
    refreshPending();
  }, [accountId, refreshPending]);

  // 静默自动同步：仅在已登录且在线时启用。
  useEffect(() => {
    if (!accountId || !auto) return;

    let cancelled = false;
    let debounceTimer: number | undefined;

    const isOnline = () => typeof navigator === "undefined" || navigator.onLine;
    const maybeSync = () => {
      if (cancelled || !isOnline()) return;
      void syncNow();
    };
    const scheduleSync = () => {
      if (cancelled) return;
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(maybeSync, SYNC_DEBOUNCE_MS);
    };

    // 挂载即同步一次
    maybeSync();

    // 本地写入后即时推送（去抖）
    window.addEventListener(OUTBOX_CHANGED_EVENT, scheduleSync);
    // 网络恢复后补同步
    window.addEventListener("online", maybeSync);
    // 周期心跳：回拉远端变更
    const heartbeat = window.setInterval(maybeSync, SYNC_HEARTBEAT_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(debounceTimer);
      window.clearInterval(heartbeat);
      window.removeEventListener(OUTBOX_CHANGED_EVENT, scheduleSync);
      window.removeEventListener("online", maybeSync);
    };
  }, [accountId, auto, syncNow]);

  return {
    status,
    pending,
    lastSyncedAt,
    error,
    syncNow,
    refreshPending,
  };
}

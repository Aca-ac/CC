import { useCallback, useEffect, useState } from "react";
import { conflictRepository } from "../storage/repositories/conflictRepository";
import { resolveConflict as resolveConflictService } from "../services/syncService";
import type { ConflictValue } from "../storage/db";

export interface UseConflictReturn {
  /** 当前未解决的冲突列表 */
  conflicts: ConflictValue[];
  /** 是否正在加载 */
  loading: boolean;
  /** 是否正在解决某个冲突 */
  resolving: boolean;
  /** 最后一次操作的错误信息 */
  error: string | null;
  /** 刷新冲突列表 */
  refresh: () => Promise<void>;
  /** 解决冲突：resolution 为 "local"（保留本地）或 "remote"（保留云端） */
  resolve: (
    conflictId: string,
    resolution: "local" | "remote"
  ) => Promise<boolean>;
  /** 未解决冲突数量 */
  unresolvedCount: number;
}

/**
 * useConflict — 冲突管理 Hook
 *
 * 提供冲突列表查询、解决操作和状态管理。
 * accountId 需要由调用方传入（从 auth context 获取）。
 */
export function useConflict(accountId: string | null): UseConflictReturn {
  const [conflicts, setConflicts] = useState<ConflictValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    try {
      const unresolved = await conflictRepository.findUnresolved(accountId);
      setConflicts(unresolved);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const resolve = useCallback(
    async (conflictId: string, resolution: "local" | "remote") => {
      if (!accountId) return false;
      setResolving(true);
      setError(null);
      try {
        const result = await resolveConflictService(
          conflictId,
          accountId,
          resolution
        );
        if (!result.success) {
          setError(result.error ?? "解决冲突失败");
          return false;
        }
        // 解决成功，从列表中移除
        setConflicts((prev) => prev.filter((c) => c.id !== conflictId));
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return false;
      } finally {
        setResolving(false);
      }
    },
    [accountId]
  );

  // 初始加载 + 轮询（每 10 秒检查一次新冲突）
  useEffect(() => {
    refresh();
    if (!accountId) return;

    const interval = setInterval(refresh, 10_000);
    return () => clearInterval(interval);
  }, [accountId, refresh]);

  return {
    conflicts,
    loading,
    resolving,
    error,
    refresh,
    resolve,
    unresolvedCount: conflicts.length,
  };
}

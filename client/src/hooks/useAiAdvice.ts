import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../services/apiClient";
import { useAccountId } from "./useAccountId";

export interface AiAdviceItem {
  type: string;
  title: string;
  content: string;
}

export interface UseAiAdviceReturn {
  advice: AiAdviceItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * AI 每周建议（FR-AI 复盘）。POST /ai/advice 基于周统计生成。
 * 离线 / 本地演示账户不外呼，安静返回空，避免看板出现噪音错误。
 */
export function useAiAdvice(): UseAiAdviceReturn {
  const accountId = useAccountId();
  const [advice, setAdvice] = useState<AiAdviceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!navigator.onLine || accountId === "local") {
      setAdvice([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.aiAdvice();
      setAdvice(res?.content ? [{ type: res.type, title: res.title, content: res.content }] : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { advice, loading, error, refresh };
}

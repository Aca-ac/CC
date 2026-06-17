import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../services/apiClient";

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

export function useAiAdvice(): UseAiAdviceReturn {
  const [advice, setAdvice] = useState<AiAdviceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getAiAdvice();
      setAdvice(res.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { advice, loading, error, refresh };
}

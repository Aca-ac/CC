import { useCallback, useEffect, useState } from "react";
import { statsService, type WeeklyStatsDTO } from "../services/statsService";

const CACHE_KEY = "chronos_stats_cache";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CachedStats {
  data: WeeklyStatsDTO;
  timestamp: number;
}

function getCachedStats(): WeeklyStatsDTO | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedStats = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function setCachedStats(data: WeeklyStatsDTO) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // ignore
  }
}

export interface UseStatsReturn {
  stats: WeeklyStatsDTO | null;
  loading: boolean;
  error: string | null;
  cached: boolean;
  refresh: () => Promise<void>;
}

export function useStats(): UseStatsReturn {
  const [stats, setStats] = useState<WeeklyStatsDTO | null>(getCachedStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(() => getCachedStats() !== null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await statsService.getWeeklyStats();
      setStats(data);
      setCached(false);
      setCachedStats(data);
    } catch (err) {
      const cachedData = getCachedStats();
      if (cachedData) {
        setStats(cachedData);
        setCached(true);
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    stats,
    loading,
    error,
    cached,
    refresh,
  };
}

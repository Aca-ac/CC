import { useEffect, useState } from "react";
import { apiClient } from "../services/apiClient";
import type { DashboardSummary } from "../types/domain";

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .getTodayDashboard()
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="page-stack">
        <p>加载中...</p>
      </section>
    );
  }

  if (error || !summary) {
    return (
      <section className="page-stack">
        <p>加载失败：{error ?? "未知错误"}</p>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <div className="metric-grid" aria-label="今日概览">
        <article className="metric-card">
          <span>今日任务</span>
          <strong>{summary.todayTaskTotal}</strong>
        </article>
        <article className="metric-card">
          <span>已完成</span>
          <strong>{summary.completedTaskTotal}</strong>
        </article>
        <article className="metric-card">
          <span>专注分钟</span>
          <strong>{summary.focusMinutes}</strong>
        </article>
        <article className="metric-card">
          <span>连续打卡</span>
          <strong>{summary.habitStreak}</strong>
        </article>
      </div>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>今日下一步</h2>
            <p>FR-04 / UC-04：后续接入真实任务排序和状态流转。</p>
          </div>
          <p>请前往「任务管理」页面查看和操作任务。</p>
        </section>
      </div>
    </section>
  );
}

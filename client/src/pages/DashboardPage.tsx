import { Sparkles } from "lucide-react";
import { useDashboard } from "../hooks/useDashboard";
import { useAiAdvice } from "../hooks/useAiAdvice";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge";

export function DashboardPage() {
  const { summary, todayTasks, loading, error, online, refresh } = useDashboard();
  const { advice, loading: adviceLoading, error: adviceError } = useAiAdvice();

  return (
    <section className="page-stack">
      <div className="panel-heading">
        <h2>今日看板</h2>
        <div className="panel-actions">
          {!online && (
            <span className="badge status-paused" aria-label="离线">
              离线模式
            </span>
          )}
          <button className="btn-secondary" onClick={refresh} disabled={loading}>
            刷新
          </button>
        </div>
      </div>

      {loading && <div className="state-message">加载中…</div>}

      {error && (
        <div className="state-message state-failure" role="alert">
          加载失败：{error}
        </div>
      )}

      {!loading && (
        <>
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
              </div>
              {todayTasks.length === 0 ? (
                <div className="state-message state-empty">
                  今天没有安排任务，去「任务管理」添加吧。
                </div>
              ) : (
                <div className="task-list">
                  {todayTasks.map((task) => (
                    <article className="task-row" key={task.id}>
                      <div>
                        <h3>{task.title}</h3>
                        <p>{task.description ?? "后续补充任务详情和子任务入口。"}</p>
                      </div>
                      <div className="row-actions">
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h2>
                  <Sparkles size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
                  AI 每周建议
                </h2>
                <p>基于你的学习记录和任务完成情况生成的个性化建议。</p>
              </div>

              {adviceLoading && (
                <div className="state-message">AI 建议加载中…</div>
              )}

              {adviceError && (
                <div className="state-message state-failure" role="alert">
                  AI 建议加载失败：{adviceError}
                </div>
              )}

              {!adviceLoading && !adviceError && advice.length === 0 && (
                <div className="state-message state-empty">
                  暂无建议，开始学习后 AI 将为你生成个性化建议。
                </div>
              )}

              {!adviceLoading && advice.length > 0 && (
                <div className="compact-list">
                  {advice.map((item, i) => (
                    <div key={i} className="compact-item" style={{ alignItems: "flex-start", flexDirection: "column", gap: 4 }}>
                      <strong style={{ fontSize: "0.9rem" }}>{item.title}</strong>
                      <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{item.content}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  );
}

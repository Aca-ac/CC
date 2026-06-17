import { Sparkles, CheckCircle, Clock, Flame, ListTodo } from "lucide-react";
import { useDashboard } from "../hooks/useDashboard";
import { useAiAdvice } from "../hooks/useAiAdvice";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge";

export function DashboardPage() {
  const { summary, todayTasks, loading, error, online, refresh } = useDashboard();
  const { advice, loading: adviceLoading, error: adviceError } = useAiAdvice();

  return (
    <section className="page-stack">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>今日看板</h1>
        </div>
        <div className="panel-actions">
          {!online && (
            <span className="badge gray" aria-label="离线">
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
              <div className="metric-icon blue">
                <ListTodo size={22} />
              </div>
              <div className="metric-content">
                <strong>{summary.todayTaskTotal}</strong>
                <span>今日任务</span>
              </div>
            </article>
            <article className="metric-card">
              <div className="metric-icon green">
                <CheckCircle size={22} />
              </div>
              <div className="metric-content">
                <strong>{summary.completedTaskTotal}</strong>
                <span>已完成</span>
              </div>
            </article>
            <article className="metric-card">
              <div className="metric-icon cyan">
                <Clock size={22} />
              </div>
              <div className="metric-content">
                <strong>{summary.focusMinutes}</strong>
                <span>专注分钟</span>
              </div>
            </article>
            <article className="metric-card">
              <div className="metric-icon orange">
                <Flame size={22} />
              </div>
              <div className="metric-content">
                <strong>{summary.habitStreak}</strong>
                <span>连续打卡</span>
              </div>
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
                  <Sparkles size={16} style={{ verticalAlign: "middle", marginRight: 6, color: "var(--accent)" }} />
                  AI 每周建议
                </h2>
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
                      <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>{item.content}</span>
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

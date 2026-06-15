import { useDashboard } from "../hooks/useDashboard";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge";

export function DashboardPage() {
  const { summary, todayTasks, loading, error, online, refresh } = useDashboard();

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
          <button
            className="btn-secondary"
            onClick={refresh}
            disabled={loading}
          >
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
                        <p>
                          {task.description ?? "后续补充任务详情和子任务入口。"}
                        </p>
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
                <h2>同步与建议</h2>
                <p>本地数据可离线使用，AI 输出会先进入草稿预览。</p>
              </div>
              <div className="compact-list">
                <div className="compact-item">
                  <span>待同步变更</span>
                  <strong>{summary.syncPendingTotal}</strong>
                </div>
                <div className="compact-item">
                  <span>连续打卡</span>
                  <strong>{summary.habitStreak} 天</strong>
                </div>
                <div className="compact-item">
                  <span>AI 工作流</span>
                  <strong>草稿确认</strong>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </section>
  );
}

import { aiAdvices, currentSummary, habits, tasks } from "../data/mockData";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge";

export function DashboardPage() {
  const todayTasks = tasks.slice(0, 3);

  return (
    <section className="page-stack">
      <div className="metric-grid" aria-label="今日概览">
        <article className="metric-card">
          <span>今日任务</span>
          <strong>{currentSummary.todayTaskTotal}</strong>
        </article>
        <article className="metric-card">
          <span>已完成</span>
          <strong>{currentSummary.completedTaskTotal}</strong>
        </article>
        <article className="metric-card">
          <span>专注分钟</span>
          <strong>{currentSummary.focusMinutes}</strong>
        </article>
        <article className="metric-card">
          <span>连续打卡</span>
          <strong>{currentSummary.habitStreak}</strong>
        </article>
      </div>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>今日下一步</h2>
            <p>FR-04 / UC-04：后续接入真实任务排序和状态流转。</p>
          </div>
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
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>习惯与 AI 提示</h2>
            <p>AI 建议只作为草稿展示，用户确认前不修改正式数据。</p>
          </div>
          <div className="compact-list">
            {habits.map((habit) => (
              <div className="compact-item" key={habit.id}>
                <strong>{habit.name}</strong>
                <span>{habit.rule}</span>
              </div>
            ))}
            {aiAdvices.map((advice) => (
              <div className="compact-item" key={advice.id}>
                <strong>{advice.title}</strong>
                <span>{advice.content}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}


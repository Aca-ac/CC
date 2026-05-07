import { PriorityBadge, StatusBadge } from "../components/StatusBadge";
import { tasks } from "../data/mockData";

export function TasksPage() {
  return (
    <section className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>任务管理</h2>
          <p>FR-03 / UC-03：后续补任务 CRUD、子任务、批量操作和状态历史。</p>
        </div>
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>任务</th>
                <th>状态</th>
                <th>优先级</th>
                <th>预计时间</th>
                <th>标签</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>
                    <StatusBadge status={task.status} />
                  </td>
                  <td>
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td>{task.estimatedMinutes} 分钟</td>
                  <td>{task.tags.join(" / ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}


import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../services/apiClient";
import type { Task, TaskStatus } from "../types/domain";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge";

const statusCycle: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

function nextStatus(current: TaskStatus): TaskStatus {
  const idx = statusCycle.indexOf(current);
  if (idx === -1 || idx === statusCycle.length - 1) {
    return statusCycle[0];
  }
  return statusCycle[idx + 1];
}

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .listTasks()
      .then(setTasks)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = useCallback(
    async (taskId: string, current: TaskStatus) => {
      const newStatus = nextStatus(current);
      try {
        const updated = await apiClient.updateTaskStatus(taskId, newStatus);
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? updated : t))
        );
      } catch (err) {
        // revert on failure — task stays in current state
      }
    },
    []
  );

  if (loading) {
    return (
      <section className="page-stack">
        <p>加载中...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-stack">
        <p>加载失败：{error}</p>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>任务管理</h2>
          <p>FR-03 / UC-03：后续补子任务、批量操作和状态历史。</p>
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
                    <button
                      type="button"
                      className="status-toggle"
                      onClick={() => handleStatusChange(task.id, task.status)}
                      title="点击切换状态"
                    >
                      <StatusBadge status={task.status} />
                    </button>
                  </td>
                  <td>
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td>{task.estimatedMinutes} 分钟</td>
                  <td>{task.tags?.join(" / ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../services/apiClient";
import type { Task } from "../types/domain";

const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

function getWeekdayIndex(dateStr: string): number {
  const day = new Date(dateStr).getDay(); // 0=Sun, 1=Mon, ...
  return day === 0 ? 6 : day - 1; // convert to 0=Mon
}

export function CalendarPage() {
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

  const tasksByDay = useMemo(() => {
    const grouped: Task[][] = [[], [], [], [], [], [], []];
    for (const task of tasks) {
      if (task.dueTime) {
        const idx = getWeekdayIndex(task.dueTime);
        grouped[idx].push(task);
      }
    }
    return grouped;
  }, [tasks]);

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
          <h2>周视图与课程表</h2>
          <p>FR-04 / FR-11 / UC-05：后续接入 iCal/ics 导入预览。</p>
        </div>
        <div className="week-grid">
          {weekdays.map((day, i) => (
            <article className="day-cell" key={day}>
              <strong>{day}</strong>
              {tasksByDay[i].length === 0 ? (
                <span>暂无任务</span>
              ) : (
                <ul className="day-tasks">
                  {tasksByDay[i].map((task) => (
                    <li key={task.id}>{task.title}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

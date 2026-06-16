import { useEffect, useState } from "react";
import { useTasks } from "../hooks/useTasks";
import { StatusBadge } from "../components/StatusBadge";

interface DayCell {
  day: string;
  dateStr: string;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
  }>;
}

export function CalendarPage() {
  const { tasks, loading } = useTasks();
  const [weekCells, setWeekCells] = useState<DayCell[]>([]);

  useEffect(() => {
    const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=周日, 1=周一...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const cells: DayCell[] = weekdays.map((day, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().slice(0, 10);
      const dayTasks = tasks
        .filter((t) => t.dueTime && t.dueTime.startsWith(dateStr))
        .map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
        }));
      return { day, dateStr, tasks: dayTasks };
    });

    setWeekCells(cells);
  }, [tasks]);

  return (
    <section className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>周视图与任务分布</h2>
        </div>

        {loading && <div className="state-message">加载中…</div>}

        {!loading && (
          <div className="week-grid">
            {weekCells.map((cell) => (
              <article className="day-cell" key={cell.day}>
                <div className="day-header">
                  <strong>{cell.day}</strong>
                  <span className="day-date">{cell.dateStr.slice(5)}</span>
                </div>
                <div className="day-tasks">
                  {cell.tasks.length === 0 ? (
                    <span className="day-empty">无任务</span>
                  ) : (
                    cell.tasks.map((t) => (
                      <div className="day-task-item" key={t.id}>
                        <span className="day-task-title">{t.title}</span>
                        <StatusBadge status={t.status as never} />
                      </div>
                    ))
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

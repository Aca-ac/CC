import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { IconCalendar, IconCheckCircle, IconClock, IconTasks } from "../components/icons";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge";
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader, SkeletonList, StateMessage } from "../components/ui";
import { useTasks } from "../hooks/useTasks";
import { fadeUp, staggerContainer } from "../lib/motion";
import type { Task } from "../types/domain";

interface DayCell {
  day: string;
  dateLabel: string;
  dateStr: string;
  isToday: boolean;
  tasks: Task[];
}

const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

function dateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getMonday(base: Date): Date {
  const date = new Date(base);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
  return date;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  });
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CalendarPage() {
  const { tasks, loading, error } = useTasks();

  const todayKey = dateKey(new Date());
  const weekCells = useMemo<DayCell[]>(() => {
    const monday = getMonday(new Date());

    return weekdays.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const currentKey = dateKey(date);
      const dayTasks = tasks
        .filter((task) => task.dueTime?.slice(0, 10) === currentKey)
        .sort((a, b) => (a.dueTime ?? "").localeCompare(b.dueTime ?? ""));

      return {
        day,
        dateLabel: formatDateLabel(date),
        dateStr: currentKey,
        isToday: currentKey === todayKey,
        tasks: dayTasks,
      };
    });
  }, [tasks, todayKey]);

  const weekTaskCount = weekCells.reduce((sum, cell) => sum + cell.tasks.length, 0);
  const completedThisWeek = weekCells.reduce(
    (sum, cell) => sum + cell.tasks.filter((task) => task.status === "DONE").length,
    0
  );
  const busyDay = weekCells.reduce((max, cell) => (cell.tasks.length > max.tasks.length ? cell : max), weekCells[0]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Calendar"
        title="日历计划"
        description="按截止日期查看本周任务密度，快速发现任务堆积的日期。"
        actions={
          <div className="inline-flex rounded-md border border-line bg-panel-muted p-1">
            <Button size="sm" variant="primary" aria-pressed="true">
              <IconCalendar size={15} />
              周视图
            </Button>
            <Button size="sm" variant="ghost" disabled aria-pressed="false" title="月视图">
              月视图
            </Button>
          </div>
        }
      />

      <div className="grid gap-3.5 md:grid-cols-3">
        <Card className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-soft text-brand">
            <IconTasks size={19} />
          </span>
          <div>
            <p className="text-xl font-bold text-ink">{weekTaskCount}</p>
            <p className="text-[0.78rem] text-muted">本周到期</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-success-soft text-success">
            <IconCheckCircle size={19} />
          </span>
          <div>
            <p className="text-xl font-bold text-ink">{completedThisWeek}</p>
            <p className="text-[0.78rem] text-muted">已完成</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-warning-soft text-warning">
            <IconClock size={19} />
          </span>
          <div>
            <p className="text-xl font-bold text-ink">{busyDay.tasks.length}</p>
            <p className="text-[0.78rem] text-muted">{busyDay.day} 最密集</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="本周安排"
          subtitle={`${weekCells[0].dateStr} - ${weekCells[6].dateStr}`}
          action={<Badge tone="brand">{weekTaskCount} 项任务</Badge>}
        />

        {loading && <SkeletonList rows={4} />}
        {error && <StateMessage kind="error">加载失败：{error}</StateMessage>}

        {!loading && !error && weekTaskCount === 0 && (
          <EmptyState
            icon={IconCalendar}
            title="本周没有到期任务"
            description="设置任务截止时间后，这里会按日期自动归集。"
            compact
          />
        )}

        {!loading && !error && weekTaskCount > 0 && (
          <motion.div
            variants={staggerContainer(0.035)}
            initial="hidden"
            animate="show"
            className="grid gap-3 lg:grid-cols-7"
          >
            {weekCells.map((cell) => (
              <motion.div key={cell.dateStr} variants={fadeUp} className="min-w-0">
                <div
                  className={[
                    "flex h-full min-h-[188px] flex-col rounded-lg border bg-surface p-3",
                    cell.isToday ? "border-brand shadow-soft" : "border-line",
                  ].join(" ")}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[0.86rem] font-semibold text-ink">{cell.day}</p>
                      <p className="text-[0.75rem] text-muted">{cell.dateLabel}</p>
                    </div>
                    {cell.isToday && <Badge tone="brand">今日</Badge>}
                  </div>

                  {cell.tasks.length === 0 ? (
                    <div className="grid flex-1 place-items-center rounded-md border border-dashed border-line text-[0.78rem] text-muted">
                      无任务
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cell.tasks.map((task) => (
                        <Link
                          key={task.id}
                          to="/tasks"
                          className="block rounded-md border border-line bg-panel p-2 transition-[border-color,transform] hover:-translate-y-px hover:border-brand"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-[0.82rem] font-medium text-ink">{task.title}</p>
                            {task.dueTime && (
                              <span className="shrink-0 text-[0.72rem] text-muted">{formatTime(task.dueTime)}</span>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <StatusBadge status={task.status} />
                            <PriorityBadge priority={task.priority} />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </Card>
    </div>
  );
}

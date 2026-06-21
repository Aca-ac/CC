import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { IconCalendar, IconCheckCircle, IconChevronRight, IconClock, IconTasks, IconUpload } from "../components/icons";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Select,
  SkeletonList,
  StateMessage,
} from "../components/ui";
import { useProjects } from "../hooks/useProjects";
import { useTasks } from "../hooks/useTasks";
import { cn } from "../lib/cn";
import { fadeUp, staggerContainer } from "../lib/motion";
import { parseIcsTasks } from "../services/icalImport";
import type { Task } from "../types/domain";

type CalendarView = "week" | "month";

interface DayCell {
  day: string;
  dateLabel: string;
  dateStr: string;
  isToday: boolean;
  isCurrentMonth: boolean;
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

function addDays(base: Date, days: number): Date {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  });
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
  });
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

function taskHour(task: Task): number | null {
  if (!task.dueTime) return null;
  const hour = new Date(task.dueTime).getHours();
  return Number.isNaN(hour) ? null : hour;
}

// 任务左侧色条按优先级着色（直接用主题变量，避免动态拼接类名被裁剪）。
const PRIORITY_BAR_VAR: Record<Task["priority"], string> = {
  LOW: "var(--success)",
  MEDIUM: "var(--warning)",
  HIGH: "var(--accent)",
  URGENT: "var(--danger)",
};

function tasksForDate(tasks: Task[], currentKey: string): Task[] {
  return tasks
    .filter((task) => task.dueTime?.slice(0, 10) === currentKey)
    .sort((a, b) => (a.dueTime ?? "").localeCompare(b.dueTime ?? ""));
}

export function CalendarPage() {
  const { tasks, loading, error, createTask } = useTasks();
  const { projects } = useProjects();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<CalendarView>("week");
  const [importProjectId, setImportProjectId] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  // 锚点日期：可在周 / 月之间前后切换；今天高亮始终以真实当天为准。
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());
  const todayKey = useMemo(() => dateKey(new Date()), []);

  useEffect(() => {
    if (!importProjectId && projects.length > 0) {
      setImportProjectId(projects[0].id);
    }
  }, [importProjectId, projects]);

  const goToday = () => setAnchorDate(new Date());
  const goPrev = () =>
    setAnchorDate((d) =>
      view === "week" ? addDays(d, -7) : new Date(d.getFullYear(), d.getMonth() - 1, 1)
    );
  const goNext = () =>
    setAnchorDate((d) =>
      view === "week" ? addDays(d, 7) : new Date(d.getFullYear(), d.getMonth() + 1, 1)
    );

  const weekCells = useMemo<DayCell[]>(() => {
    const monday = getMonday(anchorDate);

    return weekdays.map((day, index) => {
      const date = addDays(monday, index);
      const currentKey = dateKey(date);

      return {
        day,
        dateLabel: formatDateLabel(date),
        dateStr: currentKey,
        isToday: currentKey === todayKey,
        isCurrentMonth: date.getMonth() === anchorDate.getMonth(),
        tasks: tasksForDate(tasks, currentKey),
      };
    });
  }, [anchorDate, tasks, todayKey]);

  const monthCells = useMemo<DayCell[]>(() => {
    const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const gridStart = getMonday(monthStart);

    return Array.from({ length: 42 }, (_, index) => {
      const date = addDays(gridStart, index);
      const currentKey = dateKey(date);

      return {
        day: weekdays[index % 7],
        dateLabel: formatDateLabel(date),
        dateStr: currentKey,
        isToday: currentKey === todayKey,
        isCurrentMonth: date.getMonth() === anchorDate.getMonth(),
        tasks: tasksForDate(tasks, currentKey),
      };
    });
  }, [anchorDate, tasks, todayKey]);

  // 周视图小时轴范围：默认 8:00–21:00，并自动扩展以容纳所有有时间的任务。
  const hourRange = useMemo(() => {
    const hours = weekCells
      .flatMap((cell) => cell.tasks)
      .map(taskHour)
      .filter((h): h is number => h !== null);
    const start = Math.max(0, Math.min(8, ...(hours.length ? hours : [8])));
    const end = Math.min(24, Math.max(21, ...(hours.length ? hours.map((h) => h + 1) : [21])));
    return Array.from({ length: end - start }, (_, i) => start + i);
  }, [weekCells]);

  const metricCells = view === "week" ? weekCells : monthCells.filter((cell) => cell.isCurrentMonth);
  const visibleTaskCount = metricCells.reduce((sum, cell) => sum + cell.tasks.length, 0);
  const completedVisible = metricCells.reduce(
    (sum, cell) => sum + cell.tasks.filter((task) => task.status === "DONE").length,
    0
  );
  const busyDay = metricCells.reduce(
    (max, cell) => (cell.tasks.length > max.tasks.length ? cell : max),
    metricCells[0]
  );
  const currentRangeLabel =
    view === "week" ? `${weekCells[0].dateStr} ~ ${weekCells[6].dateStr}` : formatMonthLabel(anchorDate);

  const handleIcsImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportError(null);
      setImportNotice(null);
      if (!importProjectId) {
        setImportError("请选择导入项目");
        return;
      }

      const importedTasks = parseIcsTasks(await file.text());
      if (importedTasks.length === 0) {
        setImportError("未找到可导入的 VEVENT 日程");
        return;
      }

      for (const importedTask of importedTasks) {
        await createTask(importProjectId, {
          title: importedTask.title,
          description: importedTask.description ?? "",
          status: "TODO",
          priority: "MEDIUM",
          dueTime: importedTask.dueTime,
          estimatedMinutes: 0,
          tags: importedTask.tags,
        });
      }

      setImportNotice(`已导入 ${importedTasks.length} 个 iCal 日程`);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : String(err));
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="时间安排"
        description="按截止日期查看任务密度，快速发现任务堆积的日期。"
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {/* 周 / 月切换 */}
            <div className="inline-flex rounded-md border border-line bg-panel-muted p-1">
              <Button
                size="sm"
                variant={view === "week" ? "primary" : "ghost"}
                aria-pressed={view === "week"}
                onClick={() => setView("week")}
              >
                <IconCalendar size={15} />
                周视图
              </Button>
              <Button
                size="sm"
                variant={view === "month" ? "primary" : "ghost"}
                aria-pressed={view === "month"}
                onClick={() => setView("month")}
              >
                月视图
              </Button>
            </div>

            {/* 前后切换 */}
            <div className="inline-flex items-center rounded-md border border-line bg-panel p-0.5">
              <button
                type="button"
                onClick={goPrev}
                aria-label={view === "week" ? "上一周" : "上个月"}
                className="grid h-7 w-7 place-items-center rounded text-muted transition-colors hover:bg-panel-muted hover:text-ink"
              >
                <IconChevronRight size={16} className="rotate-180" />
              </button>
              <button
                type="button"
                onClick={goToday}
                className="px-2 text-[0.8rem] font-medium text-ink transition-colors hover:text-brand"
              >
                今天
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label={view === "week" ? "下一周" : "下个月"}
                className="grid h-7 w-7 place-items-center rounded text-muted transition-colors hover:bg-panel-muted hover:text-ink"
              >
                <IconChevronRight size={16} />
              </button>
            </div>

            {/* 导入 iCal 到指定项目 */}
            <div className="w-40">
              <Select
                aria-label="导入到项目"
                value={importProjectId}
                onChange={(event) => setImportProjectId(event.target.value)}
                className="h-9 py-0 text-[0.82rem]"
              >
                <option value="">选择项目…</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ics,text/calendar"
              className="hidden"
              onChange={handleIcsImport}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={!importProjectId}
              title={!importProjectId ? "先选择导入到的项目" : "导入 iCal 日程"}
            >
              <IconUpload size={15} />
              导入 iCal
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
            <p className="text-xl font-bold text-ink">{visibleTaskCount}</p>
            <p className="text-[0.78rem] text-muted">{view === "week" ? "本周到期" : "本月到期"}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-success-soft text-success">
            <IconCheckCircle size={19} />
          </span>
          <div>
            <p className="text-xl font-bold text-ink">{completedVisible}</p>
            <p className="text-[0.78rem] text-muted">已完成</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-warning-soft text-warning">
            <IconClock size={19} />
          </span>
          <div>
            <p className="text-xl font-bold text-ink">{busyDay.tasks.length}</p>
            <p className="text-[0.78rem] text-muted">{busyDay.dateLabel} 最密集</p>
          </div>
        </Card>
      </div>

      {importError && <StateMessage kind="error">导入失败：{importError}</StateMessage>}
      {importNotice && <StateMessage kind="info">{importNotice}</StateMessage>}

      <Card>
        <CardHeader
          title={view === "week" ? "本周安排" : "月度安排"}
          subtitle={currentRangeLabel}
          action={<Badge tone="brand">{visibleTaskCount} 项任务</Badge>}
        />

        {loading && <SkeletonList rows={4} />}
        {error && <StateMessage kind="error">加载失败：{error}</StateMessage>}

        {!loading && !error && visibleTaskCount === 0 && (
          <EmptyState
            icon={IconCalendar}
            title={view === "week" ? "本周没有到期任务" : "本月没有到期任务"}
            description="设置任务截止时间或导入 iCal 后，这里会按日期自动归集。"
            compact
          />
        )}

        {/* 周视图：小时级时间轴 */}
        {!loading && !error && visibleTaskCount > 0 && view === "week" && (
          <div className="max-h-[640px] overflow-auto rounded-xl border border-line bg-panel">
            <div className="min-w-[740px]">
              {/* 表头：星期 + 日期（吸顶） */}
              <div
                className="sticky top-0 z-10 grid border-b border-line bg-panel/95 backdrop-blur"
                style={{ gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))" }}
              >
                <div />
                {weekCells.map((cell) => (
                  <div
                    key={cell.dateStr}
                    className={cn(
                      "border-l border-line/70 px-1 py-2.5 text-center",
                      cell.isToday && "bg-brand-soft"
                    )}
                  >
                    <p className={cn("text-[0.8rem] font-semibold", cell.isToday ? "text-brand" : "text-ink")}>
                      {cell.day}
                    </p>
                    <p className={cn("mt-0.5 text-[0.72rem] tabular-nums", cell.isToday ? "text-brand" : "text-muted")}>
                      {cell.dateLabel}
                    </p>
                  </div>
                ))}
              </div>

              {/* 小时行 */}
              {hourRange.map((hour) => (
                <div
                  key={hour}
                  className="grid"
                  style={{ gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))" }}
                >
                  <div className="border-b border-line/60 pr-2 pt-1.5 text-right text-[0.7rem] tabular-nums text-muted/80">
                    {formatHour(hour)}
                  </div>
                  {weekCells.map((cell) => {
                    const items = cell.tasks.filter((task) => taskHour(task) === hour);
                    return (
                      <div
                        key={cell.dateStr}
                        className={cn(
                          "min-h-[52px] space-y-1 border-b border-l border-line/60 p-1.5 transition-colors",
                          cell.isToday ? "bg-brand-soft/30" : "hover:bg-panel-muted/40"
                        )}
                      >
                        {items.map((task) => (
                          <Link
                            key={task.id}
                            to="/tasks"
                            title={`${formatTime(task.dueTime!)} · ${task.title}`}
                            className="block rounded-md border border-line/70 border-l-[3px] bg-panel px-2 py-1 shadow-soft transition-[transform,border-color] hover:-translate-y-px hover:border-brand/40"
                            style={{ borderLeftColor: PRIORITY_BAR_VAR[task.priority] }}
                          >
                            <p className="truncate text-[0.74rem] font-medium text-ink">{task.title}</p>
                            <p className="text-[0.66rem] tabular-nums text-muted">{formatTime(task.dueTime!)}</p>
                          </Link>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 月视图：日期网格 */}
        {!loading && !error && visibleTaskCount > 0 && view === "month" && (
          <motion.div
            variants={staggerContainer(0.035)}
            initial="hidden"
            animate="show"
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7"
          >
            {monthCells.map((cell) => (
              <motion.div key={cell.dateStr} variants={fadeUp} className="min-w-0">
                <div
                  className={cn(
                    "flex h-full flex-col rounded-lg border bg-surface p-3 min-h-[132px]",
                    cell.isToday ? "border-brand shadow-soft" : "border-line",
                    !cell.isCurrentMonth && "opacity-50"
                  )}
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

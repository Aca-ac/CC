import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { IconCalendar, IconCheckCircle, IconClock, IconTasks, IconUpload } from "../components/icons";
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
  const baseDate = useMemo(() => new Date(), []);

  useEffect(() => {
    if (!importProjectId && projects.length > 0) {
      setImportProjectId(projects[0].id);
    }
  }, [importProjectId, projects]);

  const todayKey = dateKey(baseDate);
  const weekCells = useMemo<DayCell[]>(() => {
    const monday = getMonday(baseDate);

    return weekdays.map((day, index) => {
      const date = addDays(monday, index);
      const currentKey = dateKey(date);

      return {
        day,
        dateLabel: formatDateLabel(date),
        dateStr: currentKey,
        isToday: currentKey === todayKey,
        isCurrentMonth: date.getMonth() === baseDate.getMonth(),
        tasks: tasksForDate(tasks, currentKey),
      };
    });
  }, [baseDate, tasks, todayKey]);

  const monthCells = useMemo<DayCell[]>(() => {
    const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const gridStart = getMonday(monthStart);

    return Array.from({ length: 42 }, (_, index) => {
      const date = addDays(gridStart, index);
      const currentKey = dateKey(date);

      return {
        day: weekdays[index % 7],
        dateLabel: formatDateLabel(date),
        dateStr: currentKey,
        isToday: currentKey === todayKey,
        isCurrentMonth: date.getMonth() === baseDate.getMonth(),
        tasks: tasksForDate(tasks, currentKey),
      };
    });
  }, [baseDate, tasks, todayKey]);

  const metricCells = view === "week" ? weekCells : monthCells.filter((cell) => cell.isCurrentMonth);
  const renderedCells = view === "week" ? weekCells : monthCells;
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
    view === "week" ? `${weekCells[0].dateStr} - ${weekCells[6].dateStr}` : formatMonthLabel(baseDate);

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
        eyebrow="Calendar"
        title="日历计划"
        description="按截止日期查看任务密度，快速发现任务堆积的日期。"
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
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

            <Select
              aria-label="导入项目"
              value={importProjectId}
              onChange={(event) => setImportProjectId(event.target.value)}
              className="h-8 min-w-36 py-1 text-[0.8rem]"
            >
              <option value="">导入项目</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
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
              title={!importProjectId ? "先选择导入项目" : "导入 iCal"}
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

        {!loading && !error && visibleTaskCount > 0 && (
          <motion.div
            variants={staggerContainer(0.035)}
            initial="hidden"
            animate="show"
            className={cn("grid gap-3", view === "week" ? "lg:grid-cols-7" : "sm:grid-cols-2 xl:grid-cols-7")}
          >
            {renderedCells.map((cell) => (
              <motion.div key={cell.dateStr} variants={fadeUp} className="min-w-0">
                <div
                  className={cn(
                    "flex h-full flex-col rounded-lg border bg-surface p-3",
                    view === "week" ? "min-h-[188px]" : "min-h-[132px]",
                    cell.isToday ? "border-brand shadow-soft" : "border-line",
                    view === "month" && !cell.isCurrentMonth && "opacity-50"
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

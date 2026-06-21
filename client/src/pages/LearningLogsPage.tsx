import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  IconCheckCircle,
  IconClock,
  IconEdit,
  IconLogs,
  IconPause,
  IconPlay,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTimer,
  IconTrash,
} from "../components/icons";
import { MarkdownView } from "../components/MarkdownView";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  SkeletonList,
  StateMessage,
  Textarea,
} from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { useLearningLogs, type UnifiedLog } from "../hooks/useLearningLogs";
import { useProjects } from "../hooks/useProjects";
import { useTasks } from "../hooks/useTasks";
import { useTimer } from "../hooks/useTimer";
import { fadeUp, staggerContainer } from "../lib/motion";
import type { LearningLogValue } from "../storage/db";

type LogForm = Omit<LearningLogValue, "id" | "accountId" | "createdAt" | "updatedAt" | "deleted">;

const emptyForm: LogForm = {
  projectId: "",
  taskId: undefined,
  content: "",
  actualMinutes: 0,
  difficulty: 3,
  links: [],
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function difficultyText(value?: 1 | 2 | 3 | 4 | 5): string {
  if (!value) return "-";
  return `${value}/5`;
}

export function LearningLogsPage() {
  const { logs, loading, error, createManualLog, updateManualLog, deleteManualLog, refresh } = useLearningLogs();
  const { timer, startTimer, pauseTimer, resumeTimer, stopTimer, discardTimer, clearError } = useTimer();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { offline } = useAuth();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UnifiedLog | null>(null);
  const [form, setForm] = useState<LogForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [timerProjectId, setTimerProjectId] = useState("");
  const [timerTaskId, setTimerTaskId] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "manual" | "timer">("all");

  const projectName = useMemo(() => new Map(projects.map((project) => [project.id, project.name])), [projects]);
  const taskTitle = useMemo(() => new Map(tasks.map((task) => [task.id, task.title])), [tasks]);
  const timerTasks = useMemo(() => tasks.filter((task) => task.projectId === timerProjectId), [tasks, timerProjectId]);
  const formTasks = useMemo(() => tasks.filter((task) => task.projectId === form.projectId), [form.projectId, tasks]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (typeFilter !== "all" && log.type !== typeFilter) return false;
      if (!q) return true;
      const proj = (projectName.get(log.projectId) ?? "").toLowerCase();
      return log.content.toLowerCase().includes(q) || proj.includes(q);
    });
  }, [logs, typeFilter, search, projectName]);

  const manualCount = logs.filter((log) => log.type === "manual").length;
  const timerCount = logs.filter((log) => log.type === "timer").length;
  const totalMinutes = logs.reduce((sum, log) => sum + log.actualMinutes, 0);

  const resetForm = () => {
    setForm(emptyForm);
    setFormError(null);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (log: UnifiedLog) => {
    if (log.type !== "manual") return;
    setForm({
      projectId: log.projectId,
      taskId: log.taskId,
      content: log.content,
      actualMinutes: log.actualMinutes,
      difficulty: log.difficulty ?? 3,
      links: log.links ?? [],
    });
    setEditingId(log.id);
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectId) {
      setFormError("请选择项目");
      return;
    }
    if (!form.content.trim()) {
      setFormError("内容不能为空");
      return;
    }
    if (form.actualMinutes <= 0) {
      setFormError("学习时长必须大于 0");
      return;
    }

    try {
      const payload = {
        ...form,
        taskId: form.taskId || undefined,
        content: form.content.trim(),
        links: form.links.filter(Boolean),
      };
      if (editingId) {
        await updateManualLog(editingId, payload);
      } else {
        await createManualLog(payload);
      }
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleStartTimer = async () => {
    if (!timerProjectId) return;
    await startTimer(timerProjectId, timerTaskId || undefined);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteManualLog(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="记录与计时"
        description="把手动复盘和专注计时放在同一条时间线里，方便回看投入与难度。"
        actions={
          <>
            {offline && (
              <Badge tone="warning" dot>
                离线模式
              </Badge>
            )}
            <Button variant="secondary" size="sm" onClick={refresh} disabled={loading}>
              <IconRefresh size={15} className={loading ? "animate-spin" : undefined} />
              刷新
            </Button>
            <Button size="sm" onClick={openCreate}>
              <IconPlus size={15} />
              手动录入
            </Button>
          </>
        }
      />

      <div className="grid gap-3.5 md:grid-cols-3">
        <Card className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-soft text-brand">
            <IconLogs size={19} />
          </span>
          <div>
            <p className="font-serif text-2xl font-bold tabular-nums text-ink">{manualCount}</p>
            <p className="text-[0.78rem] text-muted">手动日志</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-focus-soft text-focus">
            <IconTimer size={19} />
          </span>
          <div>
            <p className="font-serif text-2xl font-bold tabular-nums text-ink">{timerCount}</p>
            <p className="text-[0.78rem] text-muted">计时记录</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-success-soft text-success">
            <IconCheckCircle size={19} />
          </span>
          <div>
            <p className="font-serif text-2xl font-bold tabular-nums text-ink">{totalMinutes}</p>
            <p className="text-[0.78rem] text-muted">累计分钟</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="专注计时器"
          subtitle="计时结束后会自动生成一条学习记录。"
          action={timer.active ? <Badge tone="success">运行中</Badge> : <Badge tone="neutral">未启动</Badge>}
        />

        {timer.restoring && <StateMessage kind="loading">正在恢复计时器…</StateMessage>}
        {timer.error && (
          <StateMessage kind="error" className="justify-between">
            <span>{timer.error}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              关闭
            </Button>
          </StateMessage>
        )}

        {!timer.restoring && timer.active ? (
          <div className="flex flex-col items-center gap-5 py-4">
            {/* 专注光环：运行时缓慢旋转的渐变弧 + 呼吸脉冲；暂停时静止收敛 */}
            <div className="relative grid h-48 w-48 place-items-center">
              {timer.paused ? null : (
                [0, 1].map((i) => (
                  <motion.span
                    key={i}
                    aria-hidden
                    className="absolute inset-3 rounded-full border border-focus/25"
                    initial={{ scale: 0.9, opacity: 0.5 }}
                    animate={{ scale: 1.26, opacity: 0 }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut", delay: i * 1.4 }}
                  />
                ))
              )}
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full border-[3px] border-transparent"
                style={{
                  borderTopColor: "var(--focus)",
                  borderRightColor: "color-mix(in srgb, var(--accent) 55%, transparent)",
                }}
                animate={timer.paused ? { rotate: 0 } : { rotate: 360 }}
                transition={
                  timer.paused
                    ? { duration: 0.4, ease: "easeOut" }
                    : { duration: 7, repeat: Infinity, ease: "linear" }
                }
              />
              <div
                className="relative grid h-40 w-40 place-items-center rounded-full border border-line/60 bg-panel-muted/40 backdrop-blur-sm transition-opacity"
                style={{
                  boxShadow: "inset 0 0 30px color-mix(in srgb, var(--focus) 14%, transparent)",
                  opacity: timer.paused ? 0.78 : 1,
                }}
              >
                <div className="text-center">
                  <div
                    className="font-mono text-[2.05rem] font-bold tabular-nums tracking-tight"
                    style={{
                      background: "linear-gradient(135deg, var(--focus), var(--accent))",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {formatDuration(timer.elapsedSeconds)}
                  </div>
                  <div
                    className="mt-1 flex items-center justify-center gap-1.5 text-[0.74rem] font-medium"
                    style={{ color: timer.paused ? "var(--muted)" : "var(--focus)" }}
                  >
                    {timer.paused ? (
                      <>
                        <IconPause size={13} />
                        已暂停
                      </>
                    ) : (
                      <>
                        <motion.span
                          className="inline-block h-1.5 w-1.5 rounded-full bg-focus"
                          animate={{ opacity: [1, 0.25, 1] }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                        />
                        专注中
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge tone="brand">{projectName.get(timer.projectId ?? "") ?? timer.projectId}</Badge>
              {timer.taskId && <Badge tone="neutral">{taskTitle.get(timer.taskId) ?? timer.taskId}</Badge>}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {timer.paused ? (
                <Button variant="secondary" onClick={resumeTimer}>
                  <IconPlay size={15} />
                  继续
                </Button>
              ) : (
                <Button variant="secondary" onClick={pauseTimer}>
                  <IconPause size={15} />
                  暂停
                </Button>
              )}
              <Button onClick={stopTimer}>
                <IconCheckCircle size={15} />
                停止并保存
              </Button>
              <Button variant="ghost" onClick={discardTimer}>
                丢弃
              </Button>
            </div>
          </div>
        ) : !timer.restoring ? (
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <Field label="选择项目">
              <Select
                value={timerProjectId}
                onChange={(e) => {
                  setTimerProjectId(e.target.value);
                  setTimerTaskId("");
                }}
              >
                <option value="">选择一个项目</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="选择任务（可选）">
              <Select value={timerTaskId} onChange={(e) => setTimerTaskId(e.target.value)} disabled={!timerProjectId}>
                <option value="">不关联任务</option>
                {timerTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Button onClick={handleStartTimer} disabled={!timerProjectId}>
              <IconClock size={15} />
              开始计时
            </Button>
          </div>
        ) : null}
      </Card>

      <Card>
        <CardHeader title="日志时间线" subtitle="按创建时间倒序排列，支持 Markdown 渲染" action={<Badge tone="brand">{filteredLogs.length} 条</Badge>} />

        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted">
              <IconSearch size={15} />
            </span>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索日志内容或项目…"
              className="pl-8"
              aria-label="搜索日志"
            />
          </div>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "all" | "manual" | "timer")}
            aria-label="按类型筛选"
            className="w-auto"
          >
            <option value="all">全部类型</option>
            <option value="manual">手动日志</option>
            <option value="timer">计时记录</option>
          </Select>
        </div>

        {loading && <SkeletonList rows={4} />}
        {error && <StateMessage kind="error">加载失败：{error}</StateMessage>}
        {!loading && !error && logs.length === 0 && (
          <EmptyState
            icon={IconLogs}
            title="暂无学习日志"
            description="手动录入或完成一次计时后，这里会出现记录。"
            action={
              <Button size="sm" onClick={openCreate}>
                <IconPlus size={15} />
                手动录入
              </Button>
            }
            compact
          />
        )}
        {!loading && !error && logs.length > 0 && filteredLogs.length === 0 && (
          <EmptyState icon={IconSearch} title="没有匹配的日志" description="试着调整搜索关键词或类型筛选。" compact />
        )}

        {!loading && filteredLogs.length > 0 && (
          <motion.ul variants={staggerContainer(0.035)} initial="hidden" animate="show" className="space-y-2.5">
            {filteredLogs.map((log) => (
              <motion.li key={log.id} variants={fadeUp}>
                <div className="grid gap-3 rounded-lg border border-line bg-surface p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge tone={log.type === "timer" ? "focus" : "success"}>
                        {log.type === "timer" ? "计时" : "手动"}
                      </Badge>
                      <span className="text-[0.78rem] text-muted">{formatDate(log.createdAt)}</span>
                      <Badge tone="neutral">{projectName.get(log.projectId) ?? log.projectId}</Badge>
                      {log.taskId && <Badge tone="neutral">{taskTitle.get(log.taskId) ?? log.taskId}</Badge>}
                    </div>
                    {log.type === "manual" ? (
                      <MarkdownView source={log.content} className="max-h-44 overflow-y-auto" />
                    ) : (
                      <p className="text-[0.9rem] font-medium text-ink">{log.content}</p>
                    )}
                    {log.links && log.links.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {log.links.map((link) => (
                          <Badge key={link} tone="info">
                            {link}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Badge tone="brand">{log.actualMinutes} 分钟</Badge>
                    <Badge tone="warning">难度 {difficultyText(log.difficulty)}</Badge>
                    {log.type === "manual" && (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => openEdit(log)}>
                          <IconEdit size={14} />
                          编辑
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(log)}>
                          <IconTrash size={14} />
                          删除
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </Card>

      <Modal
        open={isFormOpen}
        onClose={closeForm}
        title={editingId ? "编辑学习日志" : "手动录入学习日志"}
        subtitle="支持 Markdown：左侧编辑，右侧实时预览。"
        width={760}
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>
              取消
            </Button>
            <Button type="submit" form="learning-log-form">
              保存
            </Button>
          </>
        }
      >
        <form id="learning-log-form" onSubmit={handleSubmit} className="grid gap-3.5">
          <Field label="项目">
            <Select
              value={form.projectId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  projectId: e.target.value,
                  taskId: undefined,
                }))
              }
            >
              <option value="">选择一个项目</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="任务（可选）">
            <Select
              value={form.taskId ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, taskId: e.target.value || undefined }))}
              disabled={!form.projectId}
            >
              <option value="">不关联任务</option>
              {formTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-1.5">
            <span className="text-[0.82rem] font-medium text-muted">学习内容（支持 Markdown）</span>
            <div className="grid gap-2 md:grid-cols-2">
              <Textarea
                rows={9}
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="支持 # 标题、**加粗**、- 列表、`代码`、> 引用 等语法"
                autoFocus
              />
              <div className="min-h-[200px] max-h-[340px] overflow-y-auto rounded-md border border-line bg-surface px-3 py-2">
                {form.content.trim() ? (
                  <MarkdownView source={form.content} />
                ) : (
                  <p className="text-[0.82rem] text-muted">实时预览将显示在这里。</p>
                )}
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="学习时长（分钟）">
              <Input
                type="number"
                min={1}
                value={form.actualMinutes}
                onChange={(e) => setForm((prev) => ({ ...prev, actualMinutes: Number(e.target.value) }))}
              />
            </Field>
            <Field label="难度">
              <Select
                value={form.difficulty}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    difficulty: Number(e.target.value) as 1 | 2 | 3 | 4 | 5,
                  }))
                }
              >
                <option value={1}>1 - 非常简单</option>
                <option value={2}>2 - 简单</option>
                <option value={3}>3 - 适中</option>
                <option value={4}>4 - 困难</option>
                <option value={5}>5 - 非常困难</option>
              </Select>
            </Field>
          </div>
          <Field label="相关链接（用逗号分隔）">
            <Input
              value={form.links.join(", ")}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  links: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
            />
          </Field>
          {formError && <StateMessage kind="error">{formError}</StateMessage>}
        </form>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="删除学习日志？"
        subtitle={deleteTarget ? `日志「${deleteTarget.content.slice(0, 24)}」会进入本地删除队列。` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              确认删除
            </Button>
          </>
        }
      >
        <StateMessage kind="error">删除只影响手动日志；计时记录需要从计时会话链路处理。</StateMessage>
      </Modal>
    </div>
  );
}

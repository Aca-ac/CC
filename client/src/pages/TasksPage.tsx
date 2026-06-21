import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconCheck,
  IconCheckCircle,
  IconChevronRight,
  IconEdit,
  IconGrip,
  IconPlus,
  IconRefresh,
  IconTasks,
  IconTrash,
} from "../components/icons";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge";
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
import { useProjects } from "../hooks/useProjects";
import { useTasks } from "../hooks/useTasks";
import { cn } from "../lib/cn";
import { fadeUp, staggerContainer } from "../lib/motion";
import type { TaskValue } from "../storage/db";
import type { Task, TaskPriority, TaskStatus } from "../types/domain";

type TaskForm = Omit<
  TaskValue,
  "id" | "accountId" | "projectId" | "createdAt" | "updatedAt" | "deleted" | "actualMinutes"
>;

const emptyTaskForm: TaskForm = {
  title: "",
  description: "",
  status: "TODO",
  priority: "MEDIUM",
  dueTime: "",
  estimatedMinutes: 0,
  tags: [],
};

const statusFlow: TaskStatus[] = ["TODO", "IN_PROGRESS", "PAUSED", "DONE"];
const statusOptions: Array<{ value: TaskStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "全部状态" },
  { value: "TODO", label: "未开始" },
  { value: "IN_PROGRESS", label: "进行中" },
  { value: "PAUSED", label: "暂停" },
  { value: "DONE", label: "已完成" },
  { value: "ARCHIVED", label: "已归档" },
];
const priorityOptions: Array<{ value: TaskPriority | "ALL"; label: string }> = [
  { value: "ALL", label: "全部优先级" },
  { value: "LOW", label: "低" },
  { value: "MEDIUM", label: "中" },
  { value: "HIGH", label: "高" },
  { value: "URGENT", label: "紧急" },
];

function nextStatus(current: TaskStatus): TaskStatus {
  const idx = statusFlow.indexOf(current);
  return statusFlow[(idx + 1) % statusFlow.length];
}

function formatDueTime(value?: string): string {
  if (!value) return "未设置";
  return new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function moveIdBefore(ids: string[], sourceId: string, targetId: string): string[] {
  if (sourceId === targetId) return ids;
  const withoutSource = ids.filter((id) => id !== sourceId);
  const targetIndex = withoutSource.indexOf(targetId);
  withoutSource.splice(targetIndex >= 0 ? targetIndex : withoutSource.length, 0, sourceId);
  return withoutSource;
}

/**
 * 醒目的完成勾选控件：未完成为空心圆，完成为实心对号；
 * 用户点击完成时播放一次弹性对号 + 扩散光环动画。
 */
function TaskCheck({ done, onToggle }: { done: boolean; onToggle: () => void }) {
  const [burst, setBurst] = useState(false);
  const mounted = useRef(false);
  const prevDone = useRef(done);

  useEffect(() => {
    if (mounted.current && !prevDone.current && done) {
      setBurst(true);
      const timer = window.setTimeout(() => setBurst(false), 650);
      prevDone.current = done;
      return () => window.clearTimeout(timer);
    }
    prevDone.current = done;
    mounted.current = true;
  }, [done]);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={done ? "标记为未完成" : "标记为已完成"}
      aria-pressed={done}
      className={cn(
        "relative mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition-colors duration-200",
        done
          ? "border-success bg-success text-[var(--on-accent)] shadow-[0_2px_10px_color-mix(in_srgb,var(--success)_40%,transparent)]"
          : "border-line bg-transparent text-transparent hover:border-success hover:text-success/40"
      )}
    >
      <AnimatePresence>
        {burst && (
          <motion.span
            key="burst"
            aria-hidden
            initial={{ scale: 0.7, opacity: 0.7 }}
            animate={{ scale: 1.9, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-success"
          />
        )}
      </AnimatePresence>
      <motion.span
        key={done ? "done" : "todo"}
        initial={{ scale: done ? 0 : 1, rotate: done ? -30 : 0 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 520, damping: 17 }}
        className="grid place-items-center"
      >
        <IconCheck size={16} strokeWidth={3} />
      </motion.span>
    </button>
  );
}

export function TasksPage() {
  const {
    tasks,
    loading,
    error,
    online,
    createTask,
    updateTask,
    deleteTask,
    changeStatus,
    reorderTasks,
    refresh,
  } = useTasks();
  const { projects } = useProjects();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<(typeof tasks)[number] | null>(null);
  const [form, setForm] = useState<TaskForm>(emptyTaskForm);
  const [formProjectId, setFormProjectId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "ALL">("ALL");
  const [tagFilter, setTagFilter] = useState("ALL");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [collapsedParentIds, setCollapsedParentIds] = useState<Set<string>>(() => new Set());
  const [actionError, setActionError] = useState<string | null>(null);

  const projectName = useMemo(() => {
    return new Map(projects.map((project) => [project.id, project.name]));
  }, [projects]);

  const allTags = useMemo(() => {
    return Array.from(new Set(tasks.flatMap((task) => task.tags))).sort((a, b) =>
      a.localeCompare(b, "zh-CN")
    );
  }, [tasks]);

  const descendantIds = useMemo(() => {
    const ids = new Set<string>();
    if (!editingId) return ids;

    const byParent = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.parentTaskId) continue;
      byParent.set(task.parentTaskId, [...(byParent.get(task.parentTaskId) ?? []), task]);
    }

    const visit = (parentId: string) => {
      for (const child of byParent.get(parentId) ?? []) {
        ids.add(child.id);
        visit(child.id);
      }
    };
    visit(editingId);
    return ids;
  }, [editingId, tasks]);

  const parentTaskOptions = useMemo(() => {
    return tasks.filter((task) => {
      if (task.id === editingId) return false;
      if (descendantIds.has(task.id)) return false;
      if (formProjectId && task.projectId !== formProjectId) return false;
      return true;
    });
  }, [descendantIds, editingId, formProjectId, tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (projectFilter !== "ALL" && task.projectId !== projectFilter) return false;
      if (statusFilter !== "ALL" && task.status !== statusFilter) return false;
      if (priorityFilter !== "ALL" && task.priority !== priorityFilter) return false;
      if (tagFilter !== "ALL" && !task.tags.includes(tagFilter)) return false;
      return true;
    });
  }, [priorityFilter, projectFilter, statusFilter, tagFilter, tasks]);

  const visibleTaskIds = useMemo(() => {
    return new Set(filteredTasks.map((task) => task.id));
  }, [filteredTasks]);

  const childTasksByParent = useMemo(() => {
    const grouped = new Map<string, Task[]>();
    for (const task of filteredTasks) {
      if (!task.parentTaskId || !visibleTaskIds.has(task.parentTaskId)) continue;
      grouped.set(task.parentTaskId, [...(grouped.get(task.parentTaskId) ?? []), task]);
    }
    return grouped;
  }, [filteredTasks, visibleTaskIds]);

  const topLevelTasks = useMemo(() => {
    return filteredTasks.filter((task) => !task.parentTaskId || !visibleTaskIds.has(task.parentTaskId));
  }, [filteredTasks, visibleTaskIds]);

  const resetForm = () => {
    setForm({ ...emptyTaskForm, tags: [] });
    setFormProjectId("");
    setFormError(null);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (task: (typeof tasks)[number]) => {
    setForm({
      parentTaskId: task.parentTaskId,
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      dueTime: task.dueTime ?? "",
      estimatedMinutes: task.estimatedMinutes,
      tags: task.tags,
    });
    setFormProjectId(task.projectId);
    setEditingId(task.id);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    resetForm();
  };

  const handleProjectChange = (projectId: string) => {
    setFormProjectId(projectId);
    setForm((prev) => {
      const parent = tasks.find((task) => task.id === prev.parentTaskId);
      if (!parent || !projectId || parent.projectId === projectId) return prev;
      return { ...prev, parentTaskId: undefined };
    });
  };

  const handleParentChange = (parentTaskId: string) => {
    const parent = tasks.find((task) => task.id === parentTaskId);
    setForm((prev) => ({ ...prev, parentTaskId: parentTaskId || undefined }));
    if (!editingId && parent) setFormProjectId(parent.projectId);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError("任务标题不能为空");
      return;
    }
    try {
      setActionError(null);
      const payload = {
        ...form,
        parentTaskId: form.parentTaskId || undefined,
        estimatedMinutes: Math.max(0, form.estimatedMinutes),
        dueTime: form.dueTime || undefined,
        tags: form.tags.map((tag) => tag.trim()).filter(Boolean),
      };
      if (editingId) {
        await updateTask(editingId, payload);
      } else {
        if (!formProjectId) {
          setFormError("请选择所属项目");
          return;
        }
        await createTask(formProjectId, payload);
      }
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteTask(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleDragStart = (event: DragEvent<HTMLElement>, taskId: string) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
    setDraggingId(taskId);
  };

  const handleDrop = async (event: DragEvent<HTMLElement>, targetId: string) => {
    event.preventDefault();
    const sourceId = draggingId ?? event.dataTransfer.getData("text/plain");
    setDraggingId(null);
    if (!sourceId || sourceId === targetId) return;

    try {
      setActionError(null);
      await reorderTasks(moveIdBefore(tasks.map((task) => task.id), sourceId, targetId));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  };

  const toggleChildren = (taskId: string) => {
    setCollapsedParentIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const doneCount = tasks.filter((task) => task.status === "DONE").length;
  const activeCount = tasks.filter((task) => task.status !== "DONE" && task.status !== "ARCHIVED").length;

  const renderTaskItem = (task: Task, depth = 0): ReactNode => {
    const childTasks = childTasksByParent.get(task.id) ?? [];
    const isCollapsed = collapsedParentIds.has(task.id);

    return (
      <Fragment key={task.id}>
        <motion.li
          variants={fadeUp}
          draggable
          onDragStartCapture={(event) => handleDragStart(event, task.id)}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }}
          onDrop={(event) => handleDrop(event, task.id)}
          onDragEnd={() => setDraggingId(null)}
          className={cn("group", depth > 0 && "pl-5 sm:pl-8")}
        >
          <Card
            className={cn(
              "grid gap-3 transition-[border-color,box-shadow,opacity,transform] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center",
              depth > 0 && "border-l-2 border-l-brand bg-panel-muted/60",
              draggingId === task.id && "opacity-60 shadow-float"
            )}
          >
            <div className="flex min-w-0 items-start gap-3">
              <span
                className="mt-1 grid h-7 w-5 shrink-0 cursor-grab place-items-center text-muted transition-colors group-hover:text-brand"
                title="拖动排序"
                aria-hidden="true"
              >
                <IconGrip size={15} />
              </span>
              <TaskCheck
                done={task.status === "DONE"}
                onToggle={() => changeStatus(task.id, task.status === "DONE" ? "TODO" : "DONE")}
              />
              <div className="min-w-0">
                <h3
                  className={cn(
                    "truncate text-[0.95rem] font-semibold transition-colors",
                    task.status === "DONE" ? "text-muted line-through" : "text-ink"
                  )}
                >
                  {task.title}
                </h3>
                {task.description && (
                  <p className="mt-0.5 line-clamp-2 text-[0.82rem] text-muted">{task.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone="neutral">{projectName.get(task.projectId) ?? task.projectId}</Badge>
                  <Badge tone="info">截止 {formatDueTime(task.dueTime)}</Badge>
                  {task.parentTaskId && <Badge tone="neutral">子任务</Badge>}
                  {childTasks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleChildren(task.id)}
                      aria-expanded={!isCollapsed}
                      className="inline-flex h-6 items-center gap-1 rounded-md border border-line bg-panel px-2 text-[0.72rem] font-medium text-muted transition-colors hover:border-brand hover:text-brand"
                    >
                      <IconChevronRight
                        size={13}
                        className={cn("transition-transform", !isCollapsed && "rotate-90")}
                      />
                      {childTasks.length} 个子任务
                    </button>
                  )}
                  {task.tags.map((tag) => (
                    <Badge key={tag} tone="neutral">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => changeStatus(task.id, nextStatus(task.status))}
                title="点击切换状态"
                className="rounded-md transition-transform hover:-translate-y-px"
              >
                <StatusBadge status={task.status} />
              </button>
              <PriorityBadge priority={task.priority} />
              <Button variant="secondary" size="sm" onClick={() => openEdit(task)}>
                <IconEdit size={14} />
                编辑
              </Button>
              <Button variant="danger" size="sm" onClick={() => setDeleteTarget(task)}>
                <IconTrash size={14} />
                删除
              </Button>
            </div>
          </Card>
        </motion.li>
        {!isCollapsed && childTasks.map((childTask) => renderTaskItem(childTask, depth + 1))}
      </Fragment>
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="任务管理"
        description="按项目、状态、标签和优先级整理学习任务。"
        actions={
          <>
            {!online && (
              <Badge tone="warning" dot aria-label="离线">
                离线模式
              </Badge>
            )}
            <Button variant="secondary" size="sm" onClick={refresh} disabled={loading}>
              <IconRefresh size={15} className={loading ? "animate-spin" : undefined} />
              刷新
            </Button>
            <Button size="sm" onClick={openCreate}>
              <IconPlus size={15} />
              新建任务
            </Button>
          </>
        }
      />

      <div className="grid gap-3.5 lg:grid-cols-[1fr_1.4fr]">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Card className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-soft text-brand">
              <IconTasks size={19} />
            </span>
            <div>
              <p className="text-xl font-bold text-ink">{activeCount}</p>
              <p className="text-[0.78rem] text-muted">活跃任务</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-success-soft text-success">
              <IconCheckCircle size={19} />
            </span>
            <div>
              <p className="text-xl font-bold text-ink">{doneCount}</p>
              <p className="text-[0.78rem] text-muted">已完成</p>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader title="筛选" subtitle="筛选只影响当前视图，不改动本地数据。" className="mb-3" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="项目筛选">
              <Select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
                <option value="ALL">全部项目</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="标签筛选">
              <Select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
                <option value="ALL">全部标签</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="状态筛选">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "ALL")}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="优先级筛选">
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "ALL")}
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>
      </div>

      {loading && <SkeletonList rows={5} />}
      {error && <StateMessage kind="error">加载失败：{error}</StateMessage>}
      {actionError && <StateMessage kind="error">操作失败：{actionError}</StateMessage>}

      {!loading && !error && tasks.length === 0 && (
        <EmptyState
          icon={IconTasks}
          title="暂无任务"
          description="点击「新建任务」创建第一条任务。"
        />
      )}

      {!loading && tasks.length > 0 && filteredTasks.length === 0 && (
        <EmptyState
          icon={IconTasks}
          title="当前筛选没有任务"
          description="切换项目、标签、状态或优先级筛选后再试。"
          compact
        />
      )}

      {!loading && filteredTasks.length > 0 && (
        <motion.ul
          variants={staggerContainer(0.04)}
          initial="hidden"
          animate="show"
          className="space-y-2.5"
        >
          {topLevelTasks.map((task) => renderTaskItem(task))}
        </motion.ul>
      )}

      <Modal
        open={isFormOpen}
        onClose={closeForm}
        title={editingId ? "编辑任务" : "新建任务"}
        subtitle="填写任务信息，保存后会出现在任务列表中。"
        width={620}
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>
              取消
            </Button>
            <Button type="submit" form="task-form">
              保存
            </Button>
          </>
        }
      >
        <form id="task-form" onSubmit={handleSubmit} className="grid gap-3.5">
          {!editingId && (
            <Field label="所属项目">
              <Select value={formProjectId} onChange={(e) => handleProjectChange(e.target.value)}>
                <option value="">选择一个项目</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="父任务">
            <Select value={form.parentTaskId ?? ""} onChange={(e) => handleParentChange(e.target.value)}>
              <option value="">无父任务</option>
              {parentTaskOptions.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="标题">
            <Input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              autoFocus
            />
          </Field>
          <Field label="描述">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="状态">
              <Select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as TaskStatus }))}
              >
                {statusOptions
                  .filter((option) => option.value !== "ALL")
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="优先级">
              <Select
                value={form.priority}
                onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value as TaskPriority }))}
              >
                {priorityOptions
                  .filter((option) => option.value !== "ALL")
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="预计时间（分钟）">
              <Input
                type="number"
                min={0}
                value={form.estimatedMinutes}
                onChange={(e) => setForm((prev) => ({ ...prev, estimatedMinutes: Number(e.target.value) }))}
              />
            </Field>
          </div>
          <Field label="截止时间">
            <Input
              type="datetime-local"
              value={form.dueTime ? form.dueTime.slice(0, 16) : ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  dueTime: e.target.value ? new Date(e.target.value).toISOString() : "",
                }))
              }
            />
          </Field>
          <Field label="标签（用逗号分隔）">
            <Input
              value={form.tags.join(", ")}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  tags: e.target.value
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
        title="删除任务？"
        subtitle={deleteTarget ? `任务「${deleteTarget.title}」会被移入待同步删除队列。` : undefined}
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
        <StateMessage kind="error">删除后该任务将从列表移除，此操作不可撤销。</StateMessage>
      </Modal>
    </div>
  );
}

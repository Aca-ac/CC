import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { IconCheckCircle, IconEdit, IconPlus, IconProjects, IconRefresh, IconTrash } from "../components/icons";
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
  ProgressRing,
  Select,
  SkeletonList,
  StateMessage,
} from "../components/ui";
import { useProjects } from "../hooks/useProjects";
import { useTasks } from "../hooks/useTasks";
import { fadeUp, staggerContainer } from "../lib/motion";
import type { ProjectValue } from "../storage/db";

type ProjectForm = Omit<ProjectValue, "id" | "accountId" | "createdAt" | "updatedAt" | "deleted">;

const emptyProjectForm: ProjectForm = {
  name: "",
  goal: "",
  startDate: "",
  endDate: "",
  status: "ACTIVE",
  progress: 0,
};

export function ProjectsPage() {
  const {
    projects,
    loading,
    error,
    online,
    createProject,
    updateProject,
    deleteProject,
    refresh,
  } = useProjects();

  const { tasks } = useTasks();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<(typeof projects)[number] | null>(null);
  const [form, setForm] = useState<ProjectForm>(emptyProjectForm);
  const [formError, setFormError] = useState<string | null>(null);

  // 项目完成度按真实任务计算（已完成 / 全部未归档任务）；无任务时回落到手填进度。
  const completionByProject = useMemo(() => {
    const acc = new Map<string, { done: number; total: number }>();
    for (const task of tasks) {
      if (task.status === "ARCHIVED") continue;
      const entry = acc.get(task.projectId) ?? { done: 0, total: 0 };
      entry.total += 1;
      if (task.status === "DONE") entry.done += 1;
      acc.set(task.projectId, entry);
    }
    return acc;
  }, [tasks]);

  const completionFor = (project: (typeof projects)[number]): number => {
    const entry = completionByProject.get(project.id);
    if (entry && entry.total > 0) {
      return Math.round((entry.done / entry.total) * 100);
    }
    return project.progress;
  };

  const resetForm = () => {
    setForm(emptyProjectForm);
    setFormError(null);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (project: (typeof projects)[number]) => {
    setForm({
      name: project.name,
      goal: project.goal,
      startDate: project.startDate,
      endDate: project.endDate,
      status: project.status,
      progress: project.progress,
    });
    setEditingId(project.id);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("项目名称不能为空");
      return;
    }
    try {
      const payload = { ...form, progress: Math.max(0, Math.min(100, form.progress)) };
      if (editingId) {
        await updateProject(editingId, payload);
      } else {
        await createProject(payload);
      }
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteProject(deleteTarget.id);
    setDeleteTarget(null);
  };

  const activeCount = projects.filter((project) => project.status === "ACTIVE").length;
  const averageProgress =
    projects.length > 0
      ? Math.round(projects.reduce((sum, project) => sum + completionFor(project), 0) / projects.length)
      : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="项目管理"
        description="按项目拆分目标、进度和学习周期。"
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
            {projects.length > 0 && (
              <Button size="sm" onClick={openCreate}>
                <IconPlus size={15} />
                新建项目
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-3.5 sm:grid-cols-3">
        <Card className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-brand-soft text-brand">
            <IconProjects size={19} />
          </span>
          <div>
            <p className="text-xl font-bold text-ink">{projects.length}</p>
            <p className="text-[0.78rem] text-muted">全部项目</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-success-soft text-success">
            <IconCheckCircle size={19} />
          </span>
          <div>
            <p className="text-xl font-bold text-ink">{activeCount}</p>
            <p className="text-[0.78rem] text-muted">进行中</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <ProgressRing value={averageProgress} size={48} stroke={5}>
            <span className="text-[0.72rem] font-bold text-ink">{averageProgress}%</span>
          </ProgressRing>
          <div>
            <p className="text-xl font-bold text-ink">{averageProgress}%</p>
            <p className="text-[0.78rem] text-muted">平均进度</p>
          </div>
        </Card>
      </div>

      {loading && <SkeletonList rows={3} />}
      {error && <StateMessage kind="error">加载失败：{error}</StateMessage>}

      {!loading && !error && projects.length === 0 && (
        <EmptyState
          icon={IconProjects}
          title="暂无项目"
          description="点击「新建项目」创建第一个学习目标。"
          action={
            <Button size="sm" onClick={openCreate}>
              <IconPlus size={15} />
              新建项目
            </Button>
          }
        />
      )}

      {!loading && projects.length > 0 && (
        <motion.div
          variants={staggerContainer(0.05)}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {projects.map((project) => {
            const completion = completionFor(project);
            return (
            <motion.article key={project.id} variants={fadeUp}>
              <Card className="flex h-full flex-col gap-4">
                <CardHeader
                  title={project.name}
                  subtitle={project.goal || "未填写目标说明"}
                  action={
                    <Badge tone={project.status === "ACTIVE" ? "brand" : "neutral"}>
                      {project.status === "ACTIVE" ? "进行中" : "已归档"}
                    </Badge>
                  }
                  className="mb-0"
                />
                <div className="flex items-center gap-4">
                  <ProgressRing value={completion} size={72} stroke={7}>
                    <span className="text-sm font-bold text-ink">{completion}%</span>
                  </ProgressRing>
                  <div className="min-w-0 text-[0.82rem] text-muted">
                    <p>开始：{project.startDate || "未设置"}</p>
                    <p>结束：{project.endDate || "未设置"}</p>
                  </div>
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => openEdit(project)}>
                    <IconEdit size={14} />
                    编辑
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteTarget(project)}>
                    <IconTrash size={14} />
                    删除
                  </Button>
                </div>
              </Card>
            </motion.article>
            );
          })}
        </motion.div>
      )}

      <Modal
        open={isFormOpen}
        onClose={closeForm}
        title={editingId ? "编辑项目" : "新建项目"}
        subtitle="填写项目信息，保存后即可在列表中使用。"
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>
              取消
            </Button>
            <Button type="submit" form="project-form">
              保存
            </Button>
          </>
        }
      >
        <form id="project-form" onSubmit={handleSubmit} className="grid gap-3.5">
          <Field label="名称">
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              autoFocus
            />
          </Field>
          <Field label="目标">
            <Input
              value={form.goal}
              onChange={(e) => setForm((prev) => ({ ...prev, goal: e.target.value }))}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="开始日期">
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </Field>
            <Field label="结束日期">
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="状态">
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value as "ACTIVE" | "ARCHIVED" }))
                }
              >
                <option value="ACTIVE">进行中</option>
                <option value="ARCHIVED">已归档</option>
              </Select>
            </Field>
            <Field label="进度">
              <Input
                type="number"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) => setForm((prev) => ({ ...prev, progress: Number(e.target.value) }))}
              />
            </Field>
          </div>
          {formError && <StateMessage kind="error">{formError}</StateMessage>}
        </form>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="删除项目？"
        subtitle={deleteTarget ? `项目「${deleteTarget.name}」会从当前列表移除，并进入待同步删除队列。` : undefined}
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
        <StateMessage kind="error">删除后将从列表移除，此操作不可撤销。</StateMessage>
      </Modal>
    </div>
  );
}

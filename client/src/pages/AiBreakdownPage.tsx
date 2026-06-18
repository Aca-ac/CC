import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { IconAi, IconCheckCircle, IconRefresh, IconSparkles, IconTasks } from "../components/icons";
import { PriorityBadge } from "../components/StatusBadge";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  SkeletonList,
  StateMessage,
  Textarea,
} from "../components/ui";
import { aiService, type BreakdownTree, type CommitTaskNode } from "../services/aiService";
import { useProjects } from "../hooks/useProjects";
import { fadeUp, staggerContainer } from "../lib/motion";
import type { TaskPriority } from "../types/domain";

interface DraftTask {
  id: string;
  stageIndex: number;
  stageTitle: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  priority: TaskPriority;
}

const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function normalizePriority(value: string): TaskPriority {
  const upper = (value ?? "").toUpperCase() as TaskPriority;
  return PRIORITIES.includes(upper) ? upper : "MEDIUM";
}

function toDrafts(tree: BreakdownTree): DraftTask[] {
  return tree.stages.flatMap((stage, stageIndex) =>
    stage.tasks.map((task, taskIndex) => ({
      id: `${stageIndex}-${taskIndex}`,
      stageIndex,
      stageTitle: stage.title,
      title: task.title,
      description: task.description,
      estimatedMinutes: Math.max(1, task.estimatedMinutes || 30),
      priority: normalizePriority(task.priority),
    })),
  );
}

function toCommitNode(draft: DraftTask): CommitTaskNode {
  return {
    parentTaskId: null,
    title: draft.title.trim() || "未命名任务",
    description: draft.description.trim(),
    estimatedMinutes: Math.max(1, draft.estimatedMinutes),
    priority: draft.priority,
    subtasks: [],
  };
}

export function AiBreakdownPage() {
  const { projects } = useProjects();
  const [goal, setGoal] = useState("");
  const [weeks, setWeeks] = useState(4);
  const [projectId, setProjectId] = useState("");
  const [tree, setTree] = useState<BreakdownTree | null>(null);
  const [drafts, setDrafts] = useState<DraftTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();

  const grouped = useMemo(() => {
    const map = new Map<number, DraftTask[]>();
    for (const draft of drafts) {
      const list = map.get(draft.stageIndex) ?? [];
      list.push(draft);
      map.set(draft.stageIndex, list);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [drafts]);

  const handlePreview = async () => {
    const trimmedGoal = goal.trim();
    if (!trimmedGoal) return;

    setLoading(true);
    setError(null);
    setConfirmed(false);
    try {
      const normalizedWeeks = Math.min(52, Math.max(1, Number.isFinite(weeks) ? weeks : 4));
      const response = await aiService.previewBreakdown(trimmedGoal, normalizedWeeks, projectId || undefined);
      setTree(response);
      setDrafts(toDrafts(response));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setTree(null);
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!tree || drafts.length === 0) return;
    if (!projectId) {
      setError("请先选择要落库的目标项目。");
      return;
    }
    setCommitting(true);
    setError(null);
    try {
      await aiService.commitBreakdown(tree.draftId, projectId, drafts.map(toCommitNode));
      setConfirmed(true);
      window.setTimeout(() => navigate("/tasks"), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCommitting(false);
    }
  };

  const handleReject = () => {
    setTree(null);
    setDrafts([]);
    setError(null);
    setConfirmed(false);
  };

  const handleEdit = <K extends keyof DraftTask>(id: string, field: K, value: DraftTask[K]) => {
    setDrafts((prev) => prev.map((draft) => (draft.id === id ? { ...draft, [field]: value } : draft)));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="AI Breakdown"
        title="AI 拆解工作台"
        description="把一个学习目标转换为可检查、可编辑的阶段任务草稿，确认后落库到项目。"
        actions={
          drafts.length > 0 ? (
            <Button variant="secondary" size="sm" onClick={handleReject}>
              <IconRefresh size={15} />
              清空草稿
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <Card>
          <CardHeader
            title="目标输入"
            subtitle="未配置 Key 时后端使用内置 Mock，演示流程不受影响。"
            action={<Badge tone="brand">OpenAI 兼容</Badge>}
          />
          <div className="grid gap-3.5">
            <Field label="目标描述">
              <Textarea
                rows={5}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="例如：3 个月内掌握 React 和 TypeScript"
                autoFocus
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="计划周期（周）">
                <Input
                  type="number"
                  min={1}
                  max={52}
                  value={weeks}
                  onChange={(e) => setWeeks(Number(e.target.value))}
                />
              </Field>
              <Field label="目标项目" hint="确认落库时把任务写入该项目。">
                <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">未选择</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            {projects.length === 0 && (
              <StateMessage>
                还没有项目。可以先生成草稿预览，落库前请到「学习项目」创建一个项目。
              </StateMessage>
            )}
            <Button onClick={handlePreview} disabled={loading || !goal.trim()}>
              <IconSparkles size={16} className={loading ? "animate-pulse" : undefined} />
              {loading ? "生成中" : "生成草稿"}
            </Button>
          </div>

          {error && (
            <div className="mt-4 space-y-3">
              <StateMessage kind="error">AI 拆解失败：{error}</StateMessage>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={handlePreview} disabled={loading || !goal.trim()}>
                  <IconRefresh size={14} />
                  重试
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/tasks")}>
                  手动输入任务
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title={tree ? `拆解预览 · ${tree.goal}` : "拆解预览"}
            subtitle={tree ? `${drafts.length} 项任务草稿 · 共 ${tree.weeks} 周` : "生成后可逐项调整标题、描述和预计时长"}
            action={drafts.length > 0 ? <Badge tone="success">{drafts.length} 项</Badge> : undefined}
          />

          {loading && <SkeletonList rows={5} />}

          {!loading && drafts.length === 0 && (
            <EmptyState
              icon={IconAi}
              title="等待生成草稿"
              description="输入目标和周期后生成阶段任务。"
              compact
            />
          )}

          {!loading && drafts.length > 0 && !confirmed && (
            <div className="space-y-4">
              {grouped.map(([stageIndex, stageDrafts]) => (
                <div key={stageIndex}>
                  <div className="mb-2 flex items-center gap-2">
                    <Badge tone="brand">阶段 {stageIndex + 1}</Badge>
                    <span className="text-[0.86rem] font-medium text-ink">{stageDrafts[0]?.stageTitle}</span>
                  </div>
                  <motion.ul
                    variants={staggerContainer(0.04)}
                    initial="hidden"
                    animate="show"
                    className="space-y-3"
                  >
                    {stageDrafts.map((draft) => (
                      <motion.li key={draft.id} variants={fadeUp}>
                        <div className="rounded-lg border border-line bg-surface p-3">
                          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                            <p className="min-w-0 text-[0.95rem] font-semibold text-ink">{draft.title}</p>
                            <PriorityBadge priority={draft.priority} />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-[1.3fr_0.7fr_0.7fr]">
                            <Field label="任务标题">
                              <Input value={draft.title} onChange={(e) => handleEdit(draft.id, "title", e.target.value)} />
                            </Field>
                            <Field label="预计分钟">
                              <Input
                                type="number"
                                min={1}
                                value={draft.estimatedMinutes}
                                onChange={(e) => handleEdit(draft.id, "estimatedMinutes", Number(e.target.value))}
                              />
                            </Field>
                            <Field label="优先级">
                              <Select
                                value={draft.priority}
                                onChange={(e) => handleEdit(draft.id, "priority", e.target.value as TaskPriority)}
                              >
                                <option value="LOW">低</option>
                                <option value="MEDIUM">中</option>
                                <option value="HIGH">高</option>
                                <option value="URGENT">紧急</option>
                              </Select>
                            </Field>
                          </div>
                          <Field label="描述" className="mt-3">
                            <Textarea
                              rows={2}
                              value={draft.description}
                              onChange={(e) => handleEdit(draft.id, "description", e.target.value)}
                            />
                          </Field>
                        </div>
                      </motion.li>
                    ))}
                  </motion.ul>
                </div>
              ))}
            </div>
          )}

          {confirmed && (
            <StateMessage>
              <span className="inline-flex items-center gap-2 text-success">
                <IconCheckCircle size={16} />
                任务已创建，正在跳转到任务列表...
              </span>
            </StateMessage>
          )}

          {drafts.length > 0 && !confirmed && (
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-3">
              {!projectId && <span className="mr-auto text-[0.8rem] text-muted">请选择目标项目后落库</span>}
              <Button variant="secondary" onClick={handleReject}>
                放弃
              </Button>
              <Button onClick={handleConfirm} disabled={committing || !projectId}>
                <IconTasks size={15} />
                {committing ? "创建中" : "确认落库"}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

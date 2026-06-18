import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { IconAi, IconCheckCircle, IconEdit, IconRefresh, IconSparkles, IconTasks } from "../components/icons";
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
  SkeletonList,
  StateMessage,
  Textarea,
} from "../components/ui";
import { aiService, type BreakdownPreview, type BreakdownTask } from "../services/aiService";
import { fadeUp, staggerContainer } from "../lib/motion";
import type { TaskPriority } from "../types/domain";

interface DraftTask {
  id: string;
  phaseIndex: number;
  taskIndex: number;
  phaseName: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  priority: TaskPriority;
  weekIndex: number;
}

function toDrafts(preview: BreakdownPreview): DraftTask[] {
  let weekStart = 1;
  const drafts = preview.phases.flatMap((phase, phaseIndex) => {
    const currentWeek = weekStart;
    weekStart += Math.max(1, phase.weeks);

    return phase.tasks.map((task, taskIndex) => ({
      id: `${phaseIndex}-${taskIndex}`,
      phaseIndex,
      taskIndex,
      phaseName: phase.name,
      title: task.title,
      description: task.description,
      estimatedMinutes: task.estimatedMinutes,
      priority: task.priority,
      weekIndex: currentWeek,
    }));
  });

  if (drafts.length > 0) return drafts;

  return [
    {
      id: "first-action",
      phaseIndex: 0,
      taskIndex: 0,
      phaseName: "第一步",
      title: preview.firstAction.title,
      description: preview.firstAction.description,
      estimatedMinutes: preview.firstAction.estimatedMinutes,
      priority: preview.firstAction.priority,
      weekIndex: 1,
    },
  ];
}

function toBreakdownTask(draft: DraftTask): BreakdownTask {
  return {
    title: draft.title.trim() || "未命名任务",
    description: draft.description.trim(),
    estimatedMinutes: Math.max(1, draft.estimatedMinutes),
    priority: draft.priority,
  };
}

function buildCommitPreview(preview: BreakdownPreview, drafts: DraftTask[]): BreakdownPreview {
  const phases = preview.phases.map((phase, phaseIndex) => ({
    ...phase,
    tasks: drafts.filter((draft) => draft.phaseIndex === phaseIndex).map(toBreakdownTask),
  }));
  const firstDraft = drafts[0];

  return {
    ...preview,
    phases,
    firstAction: firstDraft ? toBreakdownTask(firstDraft) : preview.firstAction,
  };
}

export function AiBreakdownPage() {
  const [goal, setGoal] = useState("");
  const [weeks, setWeeks] = useState(4);
  const [preview, setPreview] = useState<BreakdownPreview | null>(null);
  const [drafts, setDrafts] = useState<DraftTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();

  const handlePreview = async () => {
    const trimmedGoal = goal.trim();
    if (!trimmedGoal) return;

    setLoading(true);
    setError(null);
    setConfirmed(false);
    try {
      const normalizedWeeks = Math.min(52, Math.max(1, Number.isFinite(weeks) ? weeks : 4));
      const response = await aiService.previewBreakdown(trimmedGoal, normalizedWeeks);
      setPreview(response);
      setDrafts(toDrafts(response));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPreview(null);
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview || drafts.length === 0) return;
    setCommitting(true);
    setError(null);
    try {
      await aiService.commitBreakdown(buildCommitPreview(preview, drafts));
      setConfirmed(true);
      window.setTimeout(() => navigate("/tasks"), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCommitting(false);
    }
  };

  const handleReject = () => {
    setPreview(null);
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
        description="把一个学习目标转换为可检查、可编辑的阶段任务草稿。"
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
            subtitle="使用当前 AI 设置生成草稿；失败时不会影响已有任务。"
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
            <Field label="计划周期（周）">
              <Input
                type="number"
                min={1}
                max={52}
                value={weeks}
                onChange={(e) => setWeeks(Number(e.target.value))}
              />
            </Field>
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
            title={preview?.projectName ?? "拆解预览"}
            subtitle={preview ? `${preview.goal} · ${drafts.length} 项任务草稿` : "生成后可逐项调整标题、描述、周次和预计时长"}
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
            <motion.ul variants={staggerContainer(0.04)} initial="hidden" animate="show" className="space-y-3">
              {drafts.map((draft) => (
                <motion.li key={draft.id} variants={fadeUp}>
                  <div className="rounded-lg border border-line bg-surface p-3">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          <Badge tone="brand">第 {draft.weekIndex} 周</Badge>
                          <Badge tone="neutral">{draft.phaseName}</Badge>
                          <PriorityBadge priority={draft.priority} />
                        </div>
                        <p className="text-[0.95rem] font-semibold text-ink">{draft.title}</p>
                        {draft.description && (
                          <p className="mt-1 line-clamp-2 text-[0.82rem] text-muted">{draft.description}</p>
                        )}
                      </div>
                      <Badge tone="focus">{draft.estimatedMinutes} 分钟</Badge>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[1.2fr_0.9fr_0.65fr]">
                      <Field label="任务标题">
                        <Input value={draft.title} onChange={(e) => handleEdit(draft.id, "title", e.target.value)} />
                      </Field>
                      <Field label="周次">
                        <Input
                          type="number"
                          min={1}
                          max={52}
                          value={draft.weekIndex}
                          onChange={(e) => handleEdit(draft.id, "weekIndex", Number(e.target.value))}
                        />
                      </Field>
                      <Field label="预计分钟">
                        <Input
                          type="number"
                          min={1}
                          value={draft.estimatedMinutes}
                          onChange={(e) => handleEdit(draft.id, "estimatedMinutes", Number(e.target.value))}
                        />
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
            <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-line pt-3">
              <Button variant="secondary" onClick={handleReject}>
                放弃
              </Button>
              <Button onClick={handleConfirm} disabled={committing}>
                <IconTasks size={15} />
                {committing ? "创建中" : "确认落库"}
              </Button>
            </div>
          )}
        </Card>
      </div>

      {preview?.firstAction && drafts.length > 0 && (
        <Card>
          <CardHeader
            title="第一步"
            subtitle="可作为今天的启动任务"
            action={
              <Badge tone="brand">
                <IconEdit size={13} />
                可编辑
              </Badge>
            }
          />
          <div className="rounded-lg border border-line bg-surface p-3">
            <p className="font-semibold text-ink">{drafts[0].title}</p>
            <p className="mt-1 text-[0.84rem] text-muted">{drafts[0].description}</p>
          </div>
        </Card>
      )}
    </div>
  );
}

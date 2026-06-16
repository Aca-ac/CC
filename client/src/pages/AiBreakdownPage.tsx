import { useState } from "react";
import { aiService, type BreakdownPreview, type BreakdownPhase, type BreakdownTask } from "../services/aiService";
import { useProjects } from "../hooks/useProjects";
import { useTasks } from "../hooks/useTasks";

function TaskItem({
  task,
  onChange,
}: {
  task: BreakdownTask;
  onChange: (next: BreakdownTask) => void;
}) {
  return (
    <div className="task-item">
      <input
        value={task.title}
        onChange={(e) => onChange({ ...task, title: e.target.value })}
        className="task-title-input"
      />
      <textarea
        value={task.description}
        onChange={(e) => onChange({ ...task, description: e.target.value })}
        rows={2}
        className="task-desc-input"
        placeholder="任务描述"
      />
      <div className="task-meta">
        <input
          type="number"
          min={0}
          value={task.estimatedMinutes}
          onChange={(e) =>
            onChange({ ...task, estimatedMinutes: Number(e.target.value) })
          }
          className="task-minutes-input"
        />
        <span>分钟</span>
        <select
          value={task.priority}
          onChange={(e) =>
            onChange({
              ...task,
              priority: e.target.value as BreakdownTask["priority"],
            })
          }
          className="task-priority-select"
        >
          <option value="LOW">低</option>
          <option value="MEDIUM">中</option>
          <option value="HIGH">高</option>
          <option value="URGENT">紧急</option>
        </select>
      </div>
    </div>
  );
}

export function AiBreakdownPage() {
  const [goal, setGoal] = useState("");
  const [weeks, setWeeks] = useState(4);
  const [preview, setPreview] = useState<BreakdownPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [committed, setCommitted] = useState(false);

  const { createProject } = useProjects();
  const { createTask } = useTasks();

  const handleGenerate = async () => {
    if (!goal.trim()) {
      setError("请输入学习目标");
      return;
    }
    setLoading(true);
    setError(null);
    setPreview(null);
    setCommitted(false);
    try {
      const result = await aiService.previewBreakdown(goal.trim(), weeks);
      setPreview(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const updatePhase = (pi: number, next: BreakdownPhase) => {
    if (!preview) return;
    const phases = [...preview.phases];
    phases[pi] = next;
    setPreview({ ...preview, phases });
  };

  const updateTask = (pi: number, ti: number, next: BreakdownTask) => {
    if (!preview) return;
    const phases = preview.phases.map((ph, idx) =>
      idx === pi
        ? { ...ph, tasks: ph.tasks.map((t, tidx) => (tidx === ti ? next : t)) }
        : ph
    );
    setPreview({ ...preview, phases });
  };

  const handleCommit = async () => {
    if (!preview) return;
    setLoading(true);
    setError(null);
    try {
      // 1. 创建项目
      const project = await createProject({
        name: preview.projectName || goal,
        goal,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        status: "ACTIVE",
        progress: 0,
      });

      // 2. 为每个阶段创建任务
      for (const phase of preview.phases) {
        for (const task of phase.tasks) {
          await createTask(project.id, {
            title: task.title,
            description: task.description,
            status: "TODO",
            priority: task.priority,
            dueTime: "",
            estimatedMinutes: task.estimatedMinutes,
            tags: [phase.name],
          });
        }
      }

      setCommitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-stack">
      <section className="panel ai-panel">
        <div className="panel-heading">
          <h2>AI 智能拆解草稿</h2>
          <p>输入学习目标，AI 将生成可执行的阶段和任务树，确认后一键创建。</p>
        </div>

        <div className="ai-form">
          <label>
            学习目标
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="例如：4 周内完成软件工程课程项目核心功能"
              rows={5}
              disabled={loading}
            />
          </label>
          <label>
            计划周期（周）
            <input
              type="number"
              min={1}
              max={52}
              value={weeks}
              onChange={(e) => setWeeks(Number(e.target.value))}
              disabled={loading}
            />
          </label>
          <button
            type="button"
            className="btn-primary"
            onClick={handleGenerate}
            disabled={loading || !goal.trim()}
          >
            {loading && !preview ? "生成中…" : "生成草稿"}
          </button>
        </div>

        {error && (
          <div className="state-message state-failure" role="alert">
            {error}
          </div>
        )}

        {committed && (
          <div className="state-message state-success" role="status">
            项目与任务已创建成功！请前往「学习项目」和「任务管理」查看。
          </div>
        )}

        {preview && !committed && (
          <div className="draft-box">
            <div className="draft-header">
              <h3>草稿预览：{preview.projectName || goal}</h3>
              <div className="draft-actions">
                <button
                  className="btn-primary"
                  onClick={handleCommit}
                  disabled={loading}
                >
                  {loading ? "创建中…" : "确认创建"}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setPreview(null)}
                  disabled={loading}
                >
                  取消
                </button>
              </div>
            </div>

            {preview.firstAction && (
              <div className="first-action">
                <strong>首个行动：</strong>
                <span>{preview.firstAction.title}</span>
                <p>{preview.firstAction.description}</p>
              </div>
            )}

            {preview.phases.map((phase, pi) => (
              <div className="phase-card" key={pi}>
                <div className="phase-header">
                  <input
                    value={phase.name}
                    onChange={(e) =>
                      updatePhase(pi, { ...phase, name: e.target.value })
                    }
                    className="phase-name-input"
                  />
                  <span className="phase-weeks">{phase.weeks} 周</span>
                </div>
                <div className="task-list">
                  {phase.tasks.map((task, ti) => (
                    <TaskItem
                      key={ti}
                      task={task}
                      onChange={(next) => updateTask(pi, ti, next)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

import { useState } from "react";
import {
  aiService,
  type BreakdownPreview,
  type BreakdownTask,
} from "../services/aiService";

type DraftStatus = "idle" | "loading" | "preview" | "editing" | "committing" | "done" | "error";

function TaskItem({
  task,
  depth = 0,
  onChange,
}: {
  task: BreakdownTask;
  depth?: number;
  onChange: (t: BreakdownTask) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task);

  const save = () => {
    onChange(draft);
    setEditing(false);
  };

  return (
    <div className="draft-task" style={{ marginLeft: depth * 16 }}>
      {editing ? (
        <div className="form-stack" style={{ gap: 4 }}>
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <input
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
          <div className="row-actions">
            <button className="btn-primary" onClick={save}>
              保存
            </button>
            <button className="btn-secondary" onClick={() => setEditing(false)}>
              取消
            </button>
          </div>
        </div>
      ) : (
        <div className="draft-task-row">
          <div>
            <strong>{task.title}</strong>
            <span className="badge status-in_progress">{task.priority}</span>
            <span className="badge">{task.estimatedMinutes} 分钟</span>
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
              {task.description}
            </p>
          </div>
          <button className="btn-secondary" onClick={() => setEditing(true)}>
            编辑
          </button>
        </div>
      )}
      {task.subTasks?.map((sub, i) => (
        <TaskItem
          key={i}
          task={sub}
          depth={depth + 1}
          onChange={(next) => {
            const subs = [...(task.subTasks ?? [])];
            subs[i] = next;
            onChange({ ...task, subTasks: subs });
          }}
        />
      ))}
    </div>
  );
}

function DraftPreview({
  preview,
  onChange,
  onConfirm,
  onCancel,
  status,
}: {
  preview: BreakdownPreview;
  onChange: (p: BreakdownPreview) => void;
  onConfirm: () => void;
  onCancel: () => void;
  status: DraftStatus;
}) {
  return (
    <div className="draft-box">
      <h3>草稿预览：{preview.projectName}</h3>
      <p style={{ color: "var(--muted)" }}>{preview.goal}</p>

      {preview.phases.map((phase, pi) => (
        <div key={pi} className="draft-phase">
          <h4>
            {phase.name} <span className="badge">{phase.weeks} 周</span>
          </h4>
          {phase.tasks.map((task, ti) => (
            <TaskItem
              key={ti}
              task={task}
              onChange={(next) => {
                const phases = [...preview.phases];
                phases[pi].tasks[ti] = next;
                onChange({ ...preview, phases });
              }}
            />
          ))}
        </div>
      ))}

      <div className="draft-first-action">
        <h4>首个可执行动作</h4>
        <div className="draft-task-row">
          <div>
            <strong>{preview.firstAction.title}</strong>
            <span className="badge status-in_progress">
              {preview.firstAction.priority}
            </span>
            <span className="badge">{preview.firstAction.estimatedMinutes} 分钟</span>
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>
              {preview.firstAction.description}
            </p>
          </div>
        </div>
      </div>

      <div className="form-actions" style={{ marginTop: 16 }}>
        <button
          className="btn-primary"
          onClick={onConfirm}
          disabled={status === "committing"}
        >
          {status === "committing" ? "确认中…" : "确认创建"}
        </button>
        <button className="btn-secondary" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  );
}

export function AiBreakdownPage() {
  const [goal, setGoal] = useState("");
  const [weeks, setWeeks] = useState(4);
  const [status, setStatus] = useState<DraftStatus>("idle");
  const [preview, setPreview] = useState<BreakdownPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!goal.trim()) return;
    setStatus("loading");
    setError(null);
    try {
      const data = await aiService.previewBreakdown(goal.trim(), weeks);
      setPreview(data);
      setStatus("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setStatus("committing");
    try {
      await aiService.commitBreakdown(preview);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setStatus("idle");
    setError(null);
  };

  return (
    <section className="page-stack">
      <section className="panel ai-panel">
        <div className="panel-heading">
          <h2>AI 智能拆解草稿</h2>
          <p>AI 只生成预览，你接受方案后才创建项目和任务。</p>
        </div>

        <div className="ai-form">
          <label>
            学习目标
            <textarea
              placeholder="例如：4 周内完成软件工程课程项目核心功能"
              rows={5}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
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
            />
          </label>
          <button
            type="button"
            className="btn-primary"
            onClick={handleGenerate}
            disabled={status === "loading" || !goal.trim()}
          >
            {status === "loading" ? "生成中…" : "生成草稿"}
          </button>
        </div>

        {status === "error" && (
          <div className="state-message state-failure" role="alert">
            {error}
            <div style={{ marginTop: 8 }}>
              <button className="btn-secondary" onClick={() => setStatus("idle")}>
                重试
              </button>
            </div>
          </div>
        )}

        {status === "done" && (
          <div className="state-message" style={{ background: "var(--accent-soft)" }}>
            项目与任务已创建成功！去「任务管理」查看吧。
          </div>
        )}

        {preview && status !== "done" && (
          <DraftPreview
            preview={preview}
            onChange={setPreview}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            status={status}
          />
        )}
      </section>
    </section>
  );
}

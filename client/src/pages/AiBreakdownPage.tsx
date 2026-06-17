import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wand2, AlertTriangle, PenLine, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { apiClient } from "../services/apiClient";
import { useProjects } from "../hooks/useProjects";

interface DraftTask {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  weekIndex: number;
  editable: boolean;
}

export function AiBreakdownPage() {
  const [goal, setGoal] = useState("");
  const [weeks, setWeeks] = useState(4);
  const [drafts, setDrafts] = useState<DraftTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();
  const { projects } = useProjects();

  const handlePreview = async () => {
    if (!goal.trim()) return;
    setLoading(true);
    setError(null);
    setConfirmed(false);
    try {
      const response = await apiClient.previewAiBreakdown({ goal, weeks });
      const raw = response as unknown as { tasks?: Array<Partial<DraftTask>> };
      const list = (raw.tasks ?? []).map((t, i) => ({
        id: crypto.randomUUID(),
        title: t.title ?? "未命名任务",
        description: t.description ?? "",
        estimatedMinutes: t.estimatedMinutes ?? 60,
        weekIndex: t.weekIndex ?? Math.floor(i / (raw.tasks!.length / weeks)) + 1,
        editable: true,
      }));
      setDrafts(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (drafts.length === 0) return;
    setLoading(true);
    try {
      setConfirmed(true);
      setTimeout(() => navigate("/tasks"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    setDrafts([]);
    setError(null);
    setConfirmed(false);
  };

  const handleEdit = (id: string, field: keyof DraftTask, value: string | number) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const handleManualFallback = () => {
    navigate("/tasks");
  };

  return (
    <section className="page-stack">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">AI Breakdown</p>
          <h1>AI 拆解</h1>
        </div>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <h2>输入目标</h2>
          <p>描述你想完成的学习目标，AI 会帮你拆分成周任务。</p>
        </div>
        <div className="form-stack">
          <label>
            目标描述
            <textarea
              rows={3}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="例如：3 个月内掌握 React 和 TypeScript"
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
          <div className="form-actions">
            <button
              className="btn-primary"
              onClick={handlePreview}
              disabled={loading || !goal.trim()}
            >
              <Wand2 size={16} />
              {loading ? "拆解中..." : "AI 拆解"}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <section className="panel">
          <div className="state-message state-failure" role="alert">
            <AlertTriangle size={16} />
            <strong>AI 拆解失败：</strong>{error}
          </div>
          <div className="row-actions" style={{ marginTop: 12 }}>
            <button className="btn-primary" onClick={handlePreview} disabled={loading}>
              <RotateCcw size={14} />
              重试
            </button>
            <button className="btn-secondary" onClick={handleManualFallback}>
              <PenLine size={14} />
              手动输入任务
            </button>
          </div>
        </section>
      )}

      {drafts.length > 0 && !confirmed && (
        <section className="panel">
          <div className="panel-heading">
            <h2>拆解预览（可编辑）</h2>
            <p>检查并调整 AI 生成的任务，确认后创建到任务列表。</p>
          </div>
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>周次</th>
                  <th>任务标题</th>
                  <th>描述</th>
                  <th>预计时长（分钟）</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <input
                        type="number"
                        min={1}
                        max={weeks}
                        value={d.weekIndex}
                        onChange={(e) => handleEdit(d.id, "weekIndex", Number(e.target.value))}
                        style={{ width: 60 }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={d.title}
                        onChange={(e) => handleEdit(d.id, "title", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={d.description}
                        onChange={(e) => handleEdit(d.id, "description", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        value={d.estimatedMinutes}
                        onChange={(e) => handleEdit(d.id, "estimatedMinutes", Number(e.target.value))}
                        style={{ width: 80 }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row-actions" style={{ marginTop: 16 }}>
            <button className="btn-primary" onClick={handleConfirm} disabled={loading}>
              <CheckCircle size={14} />
              确认创建
            </button>
            <button className="btn-secondary" onClick={handleReject}>
              <XCircle size={14} />
              放弃
            </button>
          </div>
        </section>
      )}

      {confirmed && (
        <section className="panel">
          <div className="state-message" style={{ borderColor: "var(--success)", color: "var(--success)", background: "var(--success-soft)" }}>
            <CheckCircle size={16} />
            任务已创建，正在跳转到任务列表...
          </div>
        </section>
      )}
    </section>
  );
}

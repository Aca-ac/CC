import { useState } from "react";
import { apiClient } from "../services/apiClient";
import type { AiBreakdownPreviewResponse } from "../types/domain";

export function AiBreakdownPage() {
  const [goal, setGoal] = useState("");
  const [weeks, setWeeks] = useState(4);
  const [draft, setDraft] = useState<AiBreakdownPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!goal.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.previewAiBreakdown({ goal, weeks });
      setDraft(result);
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
          <p>FR-08 / UC-06：AI 只生成预览，用户接受方案后才创建项目和任务。</p>
        </div>
        <form className="ai-form" onSubmit={(e) => e.preventDefault()}>
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
            计划周期
            <input
              type="number"
              min="1"
              value={weeks}
              onChange={(e) => setWeeks(Number(e.target.value))}
            />
          </label>
          <button type="button" onClick={handleGenerate} disabled={loading}>
            {loading ? "生成中..." : "生成草稿"}
          </button>
        </form>

        {error && <p className="error-text">生成失败：{error}</p>}

        {draft && (
          <div className="draft-box">
            <h3>草稿预览</h3>
            <p><strong>目标：</strong>{draft.goal}</p>
            <h4>阶段划分</h4>
            <ul>
              {draft.stages.map((stage, i) => (
                <li key={i}>{stage}</li>
              ))}
            </ul>
            <p><strong>第一个可执行动作：</strong>{draft.firstAction}</p>
          </div>
        )}
      </section>
    </section>
  );
}

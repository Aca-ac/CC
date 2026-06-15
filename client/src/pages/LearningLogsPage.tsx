import { useState } from "react";
import { useLearningLogs } from "../hooks/useLearningLogs";
import { useTimer } from "../hooks/useTimer";
import { useProjects } from "../hooks/useProjects";
import { useTasks } from "../hooks/useTasks";
import type { LearningLogValue } from "../storage/db";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("zh-CN");
}

export function LearningLogsPage() {
  const { logs, loading, error, createManualLog, refresh } = useLearningLogs();
  const { timer, startTimer, stopTimer, discardTimer } = useTimer();
  const { projects } = useProjects();
  const { tasks } = useTasks();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<
    Omit<LearningLogValue, "id" | "accountId" | "createdAt" | "updatedAt" | "deleted">
  >({
    projectId: "",
    taskId: undefined,
    content: "",
    actualMinutes: 0,
    difficulty: 3,
    links: [],
  });
  const [formError, setFormError] = useState<string | null>(null);

  const [timerProjectId, setTimerProjectId] = useState("");
  const [timerTaskId, setTimerTaskId] = useState("");

  const resetForm = () => {
    setForm({
      projectId: "",
      taskId: undefined,
      content: "",
      actualMinutes: 0,
      difficulty: 3,
      links: [],
    });
    setFormError(null);
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
      await createManualLog(form);
      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleStartTimer = async () => {
    if (!timerProjectId) return;
    try {
      await startTimer(timerProjectId, timerTaskId || undefined);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <section className="page-stack">
      {/* 计时器面板 */}
      <section className="panel">
        <div className="panel-heading">
          <h2>专注计时器</h2>
          <p>每个账户同时只能运行一个计时器。</p>
        </div>

        {timer.active ? (
          <div className="timer-active">
            <div className="timer-display">{formatDuration(timer.elapsedSeconds)}</div>
            <div className="timer-info">
              项目：{projects.find((p) => p.id === timer.projectId)?.name ?? timer.projectId}
              {timer.taskId && (
                <span>
                  {" "}
                  / 任务：
                  {tasks.find((t) => t.id === timer.taskId)?.title ?? timer.taskId}
                </span>
              )}
            </div>
            <div className="timer-actions">
              <button className="btn-primary" onClick={stopTimer}>
                停止并保存
              </button>
              <button className="btn-danger" onClick={discardTimer}>
                丢弃
              </button>
            </div>
          </div>
        ) : (
          <div className="timer-setup">
            <label>
              选择项目
              <select
                value={timerProjectId}
                onChange={(e) => setTimerProjectId(e.target.value)}
              >
                <option value="">-- 请选择 --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              选择任务（可选）
              <select
                value={timerTaskId}
                onChange={(e) => setTimerTaskId(e.target.value)}
              >
                <option value="">-- 无 --</option>
                {tasks
                  .filter((t) => t.projectId === timerProjectId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>
            </label>
            <button
              className="btn-primary"
              onClick={handleStartTimer}
              disabled={!timerProjectId}
            >
              开始计时
            </button>
          </div>
        )}
      </section>

      {/* 手动日志表单 */}
      <section className="panel">
        <div className="panel-heading">
          <h2>学习日志</h2>
          <div className="panel-actions">
            <button className="btn-primary" onClick={() => setIsFormOpen(true)}>
              手动录入
            </button>
            <button className="btn-secondary" onClick={refresh} disabled={loading}>
              刷新
            </button>
          </div>
        </div>

        {loading && <div className="state-message">加载中…</div>}
        {error && (
          <div className="state-message state-failure" role="alert">
            加载失败：{error}
          </div>
        )}

        {!loading && !error && logs.length === 0 && (
          <div className="state-message state-empty">
            暂无学习日志，点击「手动录入」或启动计时器开始记录。
          </div>
        )}

        {!loading && logs.length > 0 && (
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>类型</th>
                  <th>时间</th>
                  <th>项目</th>
                  <th>内容</th>
                  <th>时长</th>
                  <th>难度</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className={`badge ${log.type === "timer" ? "status-in_progress" : "status-done"}`}>
                        {log.type === "timer" ? "计时" : "手动"}
                      </span>
                    </td>
                    <td>{formatDate(log.createdAt)}</td>
                    <td>
                      {projects.find((p) => p.id === log.projectId)?.name ?? log.projectId}
                    </td>
                    <td>{log.content}</td>
                    <td>{log.actualMinutes} 分钟</td>
                    <td>{log.difficulty ? "★".repeat(log.difficulty) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 手动录入弹窗 */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>手动录入学习日志</h3>
            <form onSubmit={handleSubmit} className="form-stack">
              <label>
                项目
                <select
                  value={form.projectId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, projectId: e.target.value }))
                  }
                >
                  <option value="">-- 请选择 --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                任务（可选）
                <select
                  value={form.taskId ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      taskId: e.target.value || undefined,
                    }))
                  }
                >
                  <option value="">-- 无 --</option>
                  {tasks
                    .filter((t) => t.projectId === form.projectId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                学习内容
                <textarea
                  rows={3}
                  value={form.content}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, content: e.target.value }))
                  }
                />
              </label>
              <label>
                学习时长（分钟）
                <input
                  type="number"
                  min={1}
                  value={form.actualMinutes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      actualMinutes: Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label>
                难度
                <select
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
                </select>
              </label>
              <label>
                相关链接（用逗号分隔）
                <input
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
              </label>
              {formError && (
                <div className="form-error" role="alert">
                  {formError}
                </div>
              )}
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  保存
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsFormOpen(false)}
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

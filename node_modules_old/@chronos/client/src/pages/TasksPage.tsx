import { useState } from "react";
import { useTasks } from "../hooks/useTasks";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge";
import type { TaskValue } from "../storage/db";
import type { TaskPriority, TaskStatus } from "../types/domain";

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
    refresh,
  } = useTasks();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<
    Omit<TaskValue, "id" | "accountId" | "projectId" | "createdAt" | "updatedAt" | "deleted" | "actualMinutes">
  >({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    dueTime: "",
    estimatedMinutes: 0,
    tags: [],
  });
  const [formProjectId, setFormProjectId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      dueTime: "",
      estimatedMinutes: 0,
      tags: [],
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError("任务标题不能为空");
      return;
    }
    try {
      if (editingId) {
        await updateTask(editingId, form);
      } else {
        if (!formProjectId) {
          setFormError("请选择所属项目");
          return;
        }
        await createTask(formProjectId, form);
      }
      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除该任务吗？")) return;
    await deleteTask(id);
  };

  const statusFlow: TaskStatus[] = ["TODO", "IN_PROGRESS", "PAUSED", "DONE"];

  const nextStatus = (current: TaskStatus): TaskStatus => {
    const idx = statusFlow.indexOf(current);
    return statusFlow[(idx + 1) % statusFlow.length];
  };

  return (
    <section className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>任务管理</h2>
          <div className="panel-actions">
            {!online && (
              <span className="badge status-paused" aria-label="离线">
                离线模式
              </span>
            )}
            <button className="btn-primary" onClick={openCreate}>
              新建任务
            </button>
            <button
              className="btn-secondary"
              onClick={refresh}
              disabled={loading}
            >
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

        {!loading && !error && tasks.length === 0 && (
          <div className="state-message state-empty">
            暂无任务，点击「新建任务」开始创建。
          </div>
        )}

        {!loading && tasks.length > 0 && (
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>任务</th>
                  <th>状态</th>
                  <th>优先级</th>
                  <th>预计时间</th>
                  <th>标签</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>
                      <button
                        className="btn-link"
                        onClick={() => changeStatus(task.id, nextStatus(task.status))}
                        title="点击切换状态"
                      >
                        <StatusBadge status={task.status} />
                      </button>
                    </td>
                    <td>
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td>{task.estimatedMinutes} 分钟</td>
                    <td>{task.tags.join(" / ")}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn-secondary"
                          onClick={() => openEdit(task)}
                        >
                          编辑
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleDelete(task.id)}
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? "编辑任务" : "新建任务"}</h3>
            <form onSubmit={handleSubmit} className="form-stack">
              {!editingId && (
                <label>
                  所属项目 ID
                  <input
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    placeholder="输入项目 ID"
                  />
                </label>
              )}
              <label>
                标题
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </label>
              <label>
                描述
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </label>
              <label>
                状态
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: e.target.value as TaskStatus,
                    }))
                  }
                >
                  <option value="TODO">未开始</option>
                  <option value="IN_PROGRESS">进行中</option>
                  <option value="PAUSED">暂停</option>
                  <option value="DONE">已完成</option>
                </select>
              </label>
              <label>
                优先级
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      priority: e.target.value as TaskPriority,
                    }))
                  }
                >
                  <option value="LOW">低</option>
                  <option value="MEDIUM">中</option>
                  <option value="HIGH">高</option>
                  <option value="URGENT">紧急</option>
                </select>
              </label>
              <label>
                截止时间
                <input
                  type="datetime-local"
                  value={form.dueTime ? form.dueTime.slice(0, 16) : ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      dueTime: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : "",
                    }))
                  }
                />
              </label>
              <label>
                预计时间（分钟）
                <input
                  type="number"
                  min={0}
                  value={form.estimatedMinutes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      estimatedMinutes: Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label>
                标签（用逗号分隔）
                <input
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

import { useState } from "react";
import { useProjects } from "../hooks/useProjects";
import type { ProjectValue } from "../storage/db";

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

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<
    Omit<ProjectValue, "id" | "accountId" | "createdAt" | "updatedAt" | "deleted">
  >({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
    status: "ACTIVE",
    progress: 0,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setForm({
      name: "",
      goal: "",
      startDate: "",
      endDate: "",
      status: "ACTIVE",
      progress: 0,
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("项目名称不能为空");
      return;
    }
    try {
      if (editingId) {
        await updateProject(editingId, form);
      } else {
        await createProject(form);
      }
      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除该项目吗？")) return;
    await deleteProject(id);
  };

  return (
    <section className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>学习项目</h2>
          <div className="panel-actions">
            {!online && (
              <span className="badge status-paused" aria-label="离线">
                离线模式
              </span>
            )}
            <button className="btn-primary" onClick={openCreate}>
              新建项目
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

        {!loading && !error && projects.length === 0 && (
          <div className="state-message state-empty">
            暂无项目，点击「新建项目」开始创建。
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div className="project-grid">
            {projects.map((project) => (
              <article className="project-card" key={project.id}>
                <div>
                  <h3>{project.name}</h3>
                  <p>{project.goal}</p>
                </div>
                <div
                  className="progress-wrap"
                  aria-label={`${project.name} 进度`}
                >
                  <span>{project.progress}%</span>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <div className="card-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => openEdit(project)}
                  >
                    编辑
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(project.id)}
                  >
                    删除
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? "编辑项目" : "新建项目"}</h3>
            <form onSubmit={handleSubmit} className="form-stack">
              <label>
                名称
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </label>
              <label>
                目标
                <input
                  value={form.goal}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, goal: e.target.value }))
                  }
                />
              </label>
              <label>
                开始日期
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </label>
              <label>
                结束日期
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, endDate: e.target.value }))
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
                      status: e.target.value as "ACTIVE" | "ARCHIVED",
                    }))
                  }
                >
                  <option value="ACTIVE">进行中</option>
                  <option value="ARCHIVED">已归档</option>
                </select>
              </label>
              <label>
                进度
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.progress}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      progress: Number(e.target.value),
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

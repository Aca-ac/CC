import { projects } from "../data/mockData";

export function ProjectsPage() {
  return (
    <section className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>学习项目</h2>
          <p>FR-02 / UC-02：这里后续实现项目创建、归档、删除和项目详情入口。</p>
        </div>
        <div className="project-grid">
          {projects.map((project) => (
            <article className="project-card" key={project.id}>
              <div>
                <h3>{project.name}</h3>
                <p>{project.goal}</p>
              </div>
              <div className="progress-wrap" aria-label={`${project.name} 进度`}>
                <span>{project.progress}%</span>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}


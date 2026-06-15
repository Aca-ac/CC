export function AiBreakdownPage() {
  return (
    <section className="page-stack">
      <section className="panel ai-panel">
        <div className="panel-heading">
          <h2>AI 智能拆解草稿</h2>
          <p>FR-08 / UC-06：AI 只生成预览，用户接受方案后才创建项目和任务。</p>
        </div>
        <form className="ai-form">
          <label>
            学习目标
            <textarea
              placeholder="例如：4 周内完成软件工程课程项目核心功能"
              rows={5}
            />
          </label>
          <label>
            计划周期
            <input type="number" min="1" defaultValue="4" />
          </label>
          <button type="button">生成草稿</button>
        </form>
        <div className="draft-box">
          <h3>草稿预览区</h3>
          <p>
            后续由后端 `/api/ai/breakdown-preview` 返回阶段、任务树、原子任务和首个可执行动作。
          </p>
        </div>
      </section>
    </section>
  );
}


export function SettingsPage() {
  return (
    <section className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>系统设置</h2>
          <p>FR-13 / UC-13：后续补主题、同步开关、AI Key、隐私授权和提醒策略。</p>
        </div>
        <div className="settings-list">
          <label>
            <span>AI 功能</span>
            <input type="checkbox" defaultChecked />
          </label>
          <label>
            <span>本地优先同步</span>
            <input type="checkbox" defaultChecked />
          </label>
          <label>
            <span>番茄钟提醒</span>
            <input type="checkbox" />
          </label>
        </div>
      </section>
    </section>
  );
}


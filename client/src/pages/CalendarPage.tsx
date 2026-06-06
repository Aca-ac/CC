export function CalendarPage() {
  const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

  return (
    <section className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>周视图与课程表</h2>
          <p>FR-04 / FR-11 / UC-05：后续接入任务日期分布和 iCal/ics 导入预览。</p>
        </div>
        <div className="week-grid">
          {weekdays.map((day) => (
            <article className="day-cell" key={day}>
              <strong>{day}</strong>
              <span>待接入日历事件</span>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}


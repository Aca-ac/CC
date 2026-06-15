export function CalendarPage() {
  const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const timeBlocks = ["上午", "下午", "晚上"];

  return (
    <section className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>周视图与课程表</h2>
          <p>用一周视角检查课程、任务截止时间和学习节奏。</p>
        </div>
        <div className="week-grid">
          {weekdays.map((day) => (
            <article className="day-cell" key={day}>
              <strong>{day}</strong>
              <div className="day-slots">
                {timeBlocks.map((slot) => (
                  <span key={slot}>{slot} · 暂无安排</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

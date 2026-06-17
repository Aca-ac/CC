import { CheckCircle, TrendingUp, Clock, BarChart3 } from "lucide-react";
import { useStats } from "../hooks/useStats";

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function BarChart({ data }: { data: Array<{ date: string; minutes: number }> }) {
  const max = Math.max(...data.map((d) => d.minutes), 1);

  return (
    <div className="chart-bar" role="img" aria-label="7天学习时长趋势">
      <div className="chart-bar-bars">
        {data.map((item) => {
          const heightPct = (item.minutes / max) * 100;
          return (
            <div key={item.date} className="chart-bar-item">
              <div
                className="chart-bar-fill"
                style={{ height: `${heightPct}%` }}
                title={`${formatDateLabel(item.date)}: ${item.minutes} 分钟`}
              />
              <span className="chart-bar-label">{formatDateLabel(item.date)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PieChart({
  data,
}: {
  data: Array<{ projectName: string; minutes: number }>;
}) {
  const total = data.reduce((sum, d) => sum + d.minutes, 0);
  if (total === 0) return null;

  const colors = [
    "#4A7DFF",
    "#52C41A",
    "#FAAD14",
    "#FF4D4F",
    "#1890FF",
    "#722ED1",
  ];

  let cumulative = 0;
  const slices = data.map((item, i) => {
    const pct = item.minutes / total;
    const start = cumulative;
    cumulative += pct;
    return {
      ...item,
      start,
      end: cumulative,
      color: colors[i % colors.length],
    };
  });

  return (
    <div className="chart-pie-wrap" role="img" aria-label="项目时间分布">
      <svg viewBox="0 0 100 100" className="chart-pie">
        {slices.map((slice, i) => {
          const startAngle = slice.start * 360 - 90;
          const endAngle = slice.end * 360 - 90;
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;
          const x1 = 50 + 40 * Math.cos(startRad);
          const y1 = 50 + 40 * Math.sin(startRad);
          const x2 = 50 + 40 * Math.cos(endRad);
          const y2 = 50 + 40 * Math.sin(endRad);
          const largeArc = slice.end - slice.start > 0.5 ? 1 : 0;
          return (
            <path
              key={i}
              d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={slice.color}
              stroke="var(--panel)"
              strokeWidth="1"
            />
          );
        })}
      </svg>
      <div className="chart-pie-legend">
        {slices.map((slice, i) => (
          <div key={i} className="chart-legend-item">
            <span className="chart-legend-dot" style={{ background: slice.color }} />
            <span className="chart-legend-name">{slice.projectName}</span>
            <span className="chart-legend-value">
              {Math.round((slice.minutes / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsPage() {
  const { stats, loading, error, cached, refresh } = useStats();

  const hasData = stats && (stats.totalCompleted > 0 || stats.dailyMinutes.some((d) => d.minutes > 0));

  return (
    <section className="page-stack">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Statistics</p>
          <h1>学习数据看板</h1>
        </div>
        <div className="panel-actions">
          {cached && (
            <span className="badge orange" aria-label="离线缓存">
              离线缓存
            </span>
          )}
          <button className="btn-secondary" onClick={refresh} disabled={loading}>
            刷新
          </button>
        </div>
      </div>

      {loading && !stats && <div className="state-message">加载中…</div>}

      {error && !stats && (
        <div className="state-message state-failure" role="alert">
          加载失败：{error}
        </div>
      )}

      {!loading && !error && !hasData && (
        <div className="state-message state-empty">
          暂无学习记录/任务完成记录，去「学习日志」或「任务管理」开始记录吧。
        </div>
      )}

      {hasData && stats && (
        <>
          {/* 核心指标 */}
          <div className="metric-grid" aria-label="核心指标">
            <article className="metric-card">
              <div className="metric-icon green">
                <CheckCircle size={22} />
              </div>
              <div className="metric-content">
                <strong>{stats.totalCompleted}</strong>
                <span>本周完成数</span>
              </div>
            </article>
            <article className="metric-card">
              <div className="metric-icon blue">
                <TrendingUp size={22} />
              </div>
              <div className="metric-content">
                <strong>{stats.completionRate}%</strong>
                <span>完成率</span>
              </div>
            </article>
            <article className="metric-card">
              <div className="metric-icon cyan">
                <Clock size={22} />
              </div>
              <div className="metric-content">
                <strong>
                  {Math.round(
                    stats.dailyMinutes.reduce((s, d) => s + d.minutes, 0) / 60
                  )}
                  h
                </strong>
                <span>总学习时长</span>
              </div>
            </article>
            <article className="metric-card">
              <div className="metric-icon orange">
                <BarChart3 size={22} />
              </div>
              <div className="metric-content">
                <strong>{stats.projectDistribution.length}</strong>
                <span>活跃项目</span>
              </div>
            </article>
          </div>

          {/* 图表区域 */}
          <div className="content-grid">
            <section className="panel">
              <div className="panel-heading">
                <h2>7 天学习时长趋势</h2>
              </div>
              {stats.dailyMinutes.length > 0 ? (
                <BarChart data={stats.dailyMinutes} />
              ) : (
                <div className="state-message state-empty">暂无趋势数据</div>
              )}
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h2>项目时间分布</h2>
              </div>
              {stats.projectDistribution.length > 0 ? (
                <PieChart data={stats.projectDistribution} />
              ) : (
                <div className="state-message state-empty">暂无分布数据</div>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  );
}

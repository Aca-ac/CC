import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { IconCheckCircle, IconClock, IconRefresh, IconStats, IconTasks } from "../components/icons";
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader, SkeletonList, StateMessage, StatCard } from "../components/ui";
import { useStats } from "../hooks/useStats";

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const chartColors = [
  "var(--accent)",
  "var(--success)",
  "var(--warning)",
  "var(--danger)",
  "var(--info)",
  "var(--habit)",
];

const tooltipStyle = {
  border: "1px solid var(--line)",
  borderRadius: 8,
  background: "var(--panel)",
  color: "var(--text)",
  boxShadow: "var(--shadow-soft)",
};

export function StatsPage() {
  const { stats, loading, error, cached, refresh } = useStats();

  const totalMinutes = stats?.dailyMinutes.reduce((sum, day) => sum + day.minutes, 0) ?? 0;
  const hasData =
    stats !== null &&
    (stats.totalCompleted > 0 ||
      stats.dailyMinutes.some((day) => day.minutes > 0) ||
      stats.projectDistribution.some((project) => project.minutes > 0));
  const trendData = stats?.dailyMinutes.map((day) => ({
    ...day,
    label: formatDateLabel(day.date),
  })) ?? [];
  const projectData = stats?.projectDistribution ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Statistics"
        title="学习统计"
        description="追踪本周完成数、学习时长和项目投入分布。"
        actions={
          <>
            {cached && (
              <Badge tone="warning" dot aria-label="离线缓存">
                离线缓存
              </Badge>
            )}
            <Button variant="secondary" size="sm" onClick={refresh} disabled={loading}>
              <IconRefresh size={15} className={loading ? "animate-spin" : undefined} />
              刷新
            </Button>
          </>
        }
      />

      {loading && !stats && <SkeletonList rows={4} />}

      {error && !stats && <StateMessage kind="error">加载失败：{error}</StateMessage>}

      {!loading && !error && !hasData && (
        <EmptyState
          icon={IconStats}
          title="暂无统计数据"
          description="完成任务或记录学习时间后，这里会出现趋势和分布。"
        />
      )}

      {hasData && stats && (
        <>
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={IconCheckCircle}
              label="本周完成数"
              value={stats.totalCompleted}
              tone="success"
            />
            <StatCard
              icon={IconStats}
              label="完成率"
              value={stats.completionRate}
              suffix="%"
              tone="brand"
            />
            <StatCard
              icon={IconClock}
              label="总学习时长"
              value={Math.round(totalMinutes / 60)}
              suffix="h"
              tone="focus"
              hint={`${totalMinutes} 分钟`}
            />
            <StatCard
              icon={IconTasks}
              label="活跃项目"
              value={projectData.length}
              tone="warning"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <Card>
              <CardHeader
                title="7 天学习时长趋势"
                subtitle="按天汇总的专注与日志分钟数"
                action={<Badge tone="brand">{totalMinutes} 分钟</Badge>}
              />
              {trendData.length > 0 ? (
                <div className="h-[280px] w-full" role="img" aria-label="7 天学习时长趋势">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="minutesFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.04} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelStyle={{ color: "var(--muted)" }}
                        formatter={(value) => [`${value} 分钟`, "学习时长"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="minutes"
                        stroke="var(--accent)"
                        strokeWidth={2.4}
                        fill="url(#minutesFill)"
                        activeDot={{ r: 4, fill: "var(--accent)" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState icon={IconClock} title="暂无趋势数据" compact />
              )}
            </Card>

            <Card>
              <CardHeader
                title="项目时间分布"
                subtitle="按项目汇总本周投入"
                action={<Badge tone="neutral">{projectData.length} 项</Badge>}
              />
              {projectData.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-1 2xl:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="h-[220px] min-w-0" role="img" aria-label="项目时间分布">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={projectData}
                          dataKey="minutes"
                          nameKey="projectName"
                          innerRadius={52}
                          outerRadius={82}
                          paddingAngle={2}
                        >
                          {projectData.map((entry, index) => (
                            <Cell key={entry.projectId} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value, name) => [`${value} 分钟`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2">
                    {projectData.map((project, index) => (
                      <div
                        key={project.projectId}
                        className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-sm"
                            style={{ background: chartColors[index % chartColors.length] }}
                          />
                          <span className="truncate text-[0.84rem] font-medium text-ink">{project.projectName}</span>
                        </div>
                        <span className="shrink-0 text-[0.82rem] text-muted">{project.minutes} 分钟</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState icon={IconTasks} title="暂无分布数据" compact />
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

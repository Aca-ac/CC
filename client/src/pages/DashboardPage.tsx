import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  IconCheckCircle,
  IconClock,
  IconFlame,
  IconRefresh,
  IconSparkles,
  IconTasks,
  IconTimer,
} from "../components/icons";
import { useDashboard } from "../hooks/useDashboard";
import { useAiAdvice } from "../hooks/useAiAdvice";
import { PriorityBadge, StatusBadge } from "../components/StatusBadge";
import { MarkdownView } from "../components/MarkdownView";
import {
  AnimatedNumber,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  ProgressRing,
  SkeletonList,
  StatCard,
  StateMessage,
} from "../components/ui";
import { fadeUp, staggerContainer } from "../lib/motion";

function greeting(hour: number): string {
  if (hour < 5) return "夜深了";
  if (hour < 11) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

export function DashboardPage() {
  const { summary, todayTasks, loading, error, online, refresh } = useDashboard();
  const { advice, loading: adviceLoading, error: adviceError } = useAiAdvice();

  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(now);

  const todayDone = todayTasks.filter((t) => t.status === "DONE").length;
  const todayTotal = todayTasks.length;
  const completion = todayTotal ? Math.round((todayDone / todayTotal) * 100) : 0;
  const upcoming = todayTasks.filter((t) => t.status !== "DONE").slice(0, 6);

  // 专注时长：不足 1 小时按「分钟」，达到 1 小时按「小时」（保留 1 位小数）。
  const focusIsHours = summary.focusMinutes >= 60;
  const focusValue = focusIsHours ? Math.round((summary.focusMinutes / 60) * 10) / 10 : summary.focusMinutes;
  const focusSuffix = focusIsHours ? "小时" : "分钟";
  const focusLabel = `${focusValue} ${focusSuffix}`;

  const stats = [
    { icon: IconTasks, label: "今日任务", value: summary.todayTaskTotal, tone: "brand" as const, suffix: "个", decimals: 0 },
    { icon: IconCheckCircle, label: "累计完成", value: summary.completedTaskTotal, tone: "success" as const, suffix: "个", decimals: 0 },
    { icon: IconClock, label: "专注时长", value: focusValue, tone: "focus" as const, suffix: focusSuffix, decimals: focusIsHours ? 1 : 0 },
    { icon: IconFlame, label: "连续打卡", value: summary.habitStreak, tone: "habit" as const, suffix: "天", decimals: 0 },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="今日看板"
        description={dateLabel}
        actions={
          <>
            {!online && <Badge tone="warning" dot>离线模式</Badge>}
            <Button variant="secondary" size="sm" onClick={refresh} disabled={loading}>
              <IconRefresh size={15} className={loading ? "animate-spin" : undefined} />
              刷新
            </Button>
          </>
        }
      />

      {error && <StateMessage kind="error">加载失败：{error}</StateMessage>}

      {/* Hero */}
      <Card flush className="relative overflow-hidden p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full opacity-25 blur-2xl"
          style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }}
        />
        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="text-[0.82rem] font-medium text-brand">{greeting(now.getHours())}，欢迎回来</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
              今天还有 {todayTotal - todayDone} 个任务待完成
            </h2>
            <p className="mt-1.5 text-[0.9rem] text-muted">
              已完成 {todayDone} / {todayTotal} · 专注 {focusLabel}。保持节奏，稳步推进。
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/logs">
                <Button size="sm">
                  <IconTimer size={15} /> 开始专注
                </Button>
              </Link>
              <Link to="/tasks">
                <Button variant="secondary" size="sm">查看全部任务</Button>
              </Link>
            </div>
          </div>
          <ProgressRing value={completion} size={116} stroke={10}>
            <div className="text-center">
              <div className="text-xl font-bold text-ink">
                <AnimatedNumber value={completion} suffix="%" />
              </div>
              <div className="text-[0.7rem] text-muted">今日完成率</div>
            </div>
          </ProgressRing>
        </div>
      </Card>

      {/* Stat cards */}
      <motion.div
        variants={staggerContainer(0.07)}
        initial="hidden"
        animate="show"
        className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((s) => (
          <motion.div key={s.label} variants={fadeUp}>
            <StatCard
              icon={s.icon}
              label={s.label}
              value={s.value}
              tone={s.tone}
              suffix={s.suffix}
              decimals={s.decimals}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Two columns */}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader
            title="今日下一步"
            subtitle="按优先级处理今天到期且未完成的任务"
            action={
              upcoming.length > 0 ? <Badge tone="brand">{upcoming.length}</Badge> : undefined
            }
          />
          {loading ? (
            <SkeletonList rows={4} />
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={IconCheckCircle}
              title="今天没有待办任务"
              description="去「任务管理」添加新任务，或享受当下的空闲。"
              action={
                <Link to="/tasks">
                  <Button size="sm" variant="soft">前往任务管理</Button>
                </Link>
              }
              compact
            />
          ) : (
            <motion.ul
              variants={staggerContainer(0.05)}
              initial="hidden"
              animate="show"
              className="space-y-2"
            >
              {upcoming.map((task) => (
                <motion.li key={task.id} variants={fadeUp}>
                  <div className="group flex items-center justify-between gap-3 rounded-md border border-line px-3.5 py-2.5 transition-[border-color,box-shadow] duration-200 hover:border-brand/40 hover:shadow-soft">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
                      <div className="min-w-0">
                        <p className="truncate text-[0.92rem] font-medium text-ink">{task.title}</p>
                        {task.description && (
                          <p className="truncate text-[0.8rem] text-muted">{task.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <IconSparkles size={16} className="text-focus" /> AI 每周建议
              </span>
            }
            subtitle="基于你的学习数据生成"
          />
          {adviceLoading ? (
            <StateMessage kind="loading">AI 建议生成中…</StateMessage>
          ) : adviceError ? (
            <StateMessage kind="error">AI 建议加载失败：{adviceError}</StateMessage>
          ) : advice.length === 0 ? (
            <EmptyState
              icon={IconSparkles}
              title="暂无建议"
              description="开始记录学习与专注后，AI 会给出个性化复盘建议。"
              compact
            />
          ) : (
            <motion.ul
              variants={staggerContainer(0.06)}
              initial="hidden"
              animate="show"
              className="space-y-2.5"
            >
              {advice.map((item, i) => (
                <motion.li
                  key={i}
                  variants={fadeUp}
                  className="rounded-md border border-line bg-panel-muted/60 p-3"
                >
                  <p className="text-[0.88rem] font-semibold text-ink">{item.title}</p>
                  <MarkdownView source={item.content} className="markdown-compact mt-1" />
                </motion.li>
              ))}
            </motion.ul>
          )}
        </Card>
      </div>
    </div>
  );
}

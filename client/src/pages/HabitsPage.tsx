import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  IconCheck,
  IconFlame,
  IconHabit,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconTrophy,
  type IconComponent,
} from "../components/icons";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  SkeletonList,
  StateMessage,
  Textarea,
  type Tone,
} from "../components/ui";
import { useHabits } from "../hooks/useHabits";
import { fadeUp, staggerContainer } from "../lib/motion";

interface Milestone {
  days: number;
  label: string;
  icon: IconComponent;
  tone: Tone;
}

const MILESTONES: Milestone[] = [
  { days: 3, label: "起步 3 天", icon: IconFlame, tone: "warning" },
  { days: 7, label: "坚持一周", icon: IconFlame, tone: "habit" },
  { days: 30, label: "习惯成型", icon: IconTrophy, tone: "brand" },
  { days: 100, label: "百日达成", icon: IconTrophy, tone: "success" },
];

// 静态映射：Tailwind 扫描器无法识别运行期拼接的类名，必须写全。
const TONE_SOFT: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  focus: "bg-focus-soft text-focus",
  habit: "bg-habit-soft text-habit",
  neutral: "bg-panel-muted text-muted",
};

const RECENT_DAYS = 21;

// 后端暂不返回逐日打卡历史，这里依据 streakCount 还原最近的连续打卡格子：
// 最近的 streak 天视为已打卡，锚点为今天（今日已打卡）或昨天（今日未打卡）。
function buildStreakCells(streak: number, doneToday: boolean): boolean[] {
  const cells = new Array<boolean>(RECENT_DAYS).fill(false);
  const end = doneToday ? RECENT_DAYS - 1 : RECENT_DAYS - 2;
  for (let i = 0; i < streak && end - i >= 0; i += 1) {
    cells[end - i] = true;
  }
  return cells;
}

export function HabitsPage() {
  const {
    habits,
    loading,
    error,
    checkedToday,
    refresh,
    createHabit,
    deleteHabit,
    checkin,
  } = useHabits();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({ name: "", ruleText: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<(typeof habits)[number] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const maxStreak = useMemo(
    () => habits.reduce((max, habit) => Math.max(max, habit.streakCount), 0),
    [habits],
  );
  const checkedTodayCount = useMemo(
    () => habits.filter((habit) => checkedToday.has(habit.id)).length,
    [habits, checkedToday],
  );

  const openCreate = () => {
    setForm({ name: "", ruleText: "" });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("习惯名称不能为空");
      return;
    }
    try {
      await createHabit({ name: form.name.trim(), ruleText: form.ruleText.trim() });
      setIsFormOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleCheckin = async (id: string) => {
    setBusyId(id);
    try {
      await checkin(id);
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteHabit(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="每日坚持"
        title="习惯打卡"
        description="把重复行为变成连续记录，用连签天数和成就维持动力。"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={refresh} disabled={loading}>
              <IconRefresh size={15} className={loading ? "animate-spin" : undefined} />
              刷新
            </Button>
            <Button size="sm" onClick={openCreate}>
              <IconPlus size={15} />
              新建习惯
            </Button>
          </>
        }
      />

      <div className="grid gap-3.5 sm:grid-cols-3">
        <Card className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-habit-soft text-habit">
            <IconHabit size={19} />
          </span>
          <div>
            <p className="text-xl font-bold text-ink">{habits.length}</p>
            <p className="text-[0.78rem] text-muted">习惯总数</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-warning-soft text-warning">
            <IconFlame size={19} />
          </span>
          <div>
            <p className="text-xl font-bold text-ink">{maxStreak}</p>
            <p className="text-[0.78rem] text-muted">最长连续（天）</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-success-soft text-success">
            <IconCheck size={19} />
          </span>
          <div>
            <p className="text-xl font-bold text-ink">{checkedTodayCount}</p>
            <p className="text-[0.78rem] text-muted">今日已打卡</p>
          </div>
        </Card>
      </div>

      {/* 成就 */}
      <Card>
        <CardHeader
          title="成就徽章"
          subtitle="根据当前最长连续天数解锁，断签后会重新计算。"
          className="mb-3"
        />
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {MILESTONES.map((milestone) => {
            const earned = maxStreak >= milestone.days;
            const Icon = milestone.icon;
            return (
              <div
                key={milestone.days}
                className={
                  "flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors " +
                  (earned
                    ? "border-line bg-panel-muted"
                    : "border-dashed border-line opacity-55")
                }
              >
                <span
                  className={
                    "grid h-9 w-9 shrink-0 place-items-center rounded-md " +
                    (earned ? TONE_SOFT[milestone.tone] : "bg-panel-muted text-muted")
                  }
                >
                  <Icon size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[0.86rem] font-medium text-ink">{milestone.label}</p>
                  <p className="text-[0.74rem] text-muted">
                    {earned ? "已解锁" : `连续 ${milestone.days} 天解锁`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {loading && <SkeletonList rows={3} />}
      {error && (
        <StateMessage kind="error">
          无法加载习惯：{error}（习惯功能需要后端在线，本地演示模式下不可用）
        </StateMessage>
      )}

      {!loading && !error && habits.length === 0 && (
        <EmptyState
          icon={IconHabit}
          title="还没有习惯"
          description="点击「新建习惯」开始你的第一条连续记录。"
          action={
            <Button size="sm" onClick={openCreate}>
              <IconPlus size={15} />
              新建习惯
            </Button>
          }
        />
      )}

      {!loading && habits.length > 0 && (
        <motion.div
          variants={staggerContainer(0.05)}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {habits.map((habit) => {
            const done = checkedToday.has(habit.id);
            return (
              <motion.article key={habit.id} variants={fadeUp}>
                <Card className="flex h-full flex-col gap-4">
                  <CardHeader
                    title={habit.name}
                    subtitle={habit.ruleText || "未设置打卡规则"}
                    action={
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(habit)}
                        aria-label={`删除习惯 ${habit.name}`}
                        className="grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:bg-panel-muted hover:text-danger"
                      >
                        <IconTrash size={15} />
                      </button>
                    }
                    className="mb-0"
                  />
                  <div className="flex items-center gap-2">
                    <motion.span
                      key={habit.streakCount}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 420, damping: 22 }}
                    >
                      <Badge tone="warning">
                        <IconFlame size={13} />
                        {habit.streakCount} 天连续
                      </Badge>
                    </motion.span>
                  </div>

                  {/* 打卡热力格：依据连续天数还原最近 21 天 */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-[0.72rem] text-muted">
                      <span>近 {RECENT_DAYS} 天</span>
                      <span>{done ? "今日已打卡" : "今日待打卡"}</span>
                    </div>
                    <div
                      className="flex flex-wrap gap-1"
                      role="img"
                      aria-label={`最近 ${RECENT_DAYS} 天打卡情况，连续 ${habit.streakCount} 天`}
                    >
                      {buildStreakCells(habit.streakCount, done).map((filled, index) => (
                        <span
                          key={index}
                          title={index === RECENT_DAYS - 1 ? "今天" : undefined}
                          className={
                            "h-3.5 w-3.5 rounded-[3px] transition-colors " +
                            (filled ? "bg-habit" : "bg-panel-muted") +
                            (index === RECENT_DAYS - 1 ? " ring-1 ring-habit/50" : "")
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto">
                    <Button
                      variant={done ? "soft" : "primary"}
                      size="sm"
                      className="w-full"
                      disabled={done || busyId === habit.id}
                      onClick={() => handleCheckin(habit.id)}
                    >
                      <IconCheck size={15} />
                      {done ? "今日已打卡" : busyId === habit.id ? "打卡中…" : "今日打卡"}
                    </Button>
                  </div>
                </Card>
              </motion.article>
            );
          })}
        </motion.div>
      )}

      <Modal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="新建习惯"
        subtitle="设定一个想长期坚持的行为，例如「每天背 20 个单词」。"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
              取消
            </Button>
            <Button type="submit" form="habit-form">
              保存
            </Button>
          </>
        }
      >
        <form id="habit-form" onSubmit={handleSubmit} className="grid gap-3.5">
          <Field label="名称">
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="例如：每天阅读 30 分钟"
              autoFocus
            />
          </Field>
          <Field label="打卡规则（可选）">
            <Textarea
              value={form.ruleText}
              onChange={(e) => setForm((prev) => ({ ...prev, ruleText: e.target.value }))}
              placeholder="描述坚持的频率或标准，便于自我提醒。"
            />
          </Field>
          {formError && <StateMessage kind="error">{formError}</StateMessage>}
        </form>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="删除习惯？"
        subtitle={deleteTarget ? `习惯「${deleteTarget.name}」及其打卡记录会被移除。` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              确认删除
            </Button>
          </>
        }
      >
        <StateMessage kind="error">删除后连续天数和成就进度将无法恢复。</StateMessage>
      </Modal>
    </div>
  );
}

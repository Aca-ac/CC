import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconAi, IconClock, IconPlus, IconStats } from "../components/icons";
import { Button, Field, Input, StateMessage, ThemeToggle } from "../components/ui";
import { apiClient } from "../services/apiClient";

const HIGHLIGHTS = [
  { icon: IconClock, text: "本地优先，离线也能记录与计时" },
  { icon: IconAi, text: "AI 把学习目标拆成可执行的任务" },
  { icon: IconStats, text: "进度、专注时长与复盘一目了然" },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    try {
      await apiClient.register({ name, email, password });
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-surface px-4 py-10 text-ink">
      <div aria-hidden className="app-aurora" />

      <div className="relative z-10 w-full max-w-[940px] overflow-hidden rounded-2xl border border-line bg-panel/90 shadow-float backdrop-blur-md md:grid md:grid-cols-2">
        {/* 品牌侧 */}
        <div
          className="relative hidden flex-col justify-between gap-10 p-9 text-[var(--on-accent)] md:flex"
          style={{ background: "linear-gradient(150deg, var(--grad-from), var(--grad-to))" }}
        >
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-lg font-bold backdrop-blur">
              C
            </span>
            <div>
              <p className="text-lg font-bold leading-none">Chronos</p>
              <p className="mt-1 text-[0.8rem] opacity-80">学习任务管理</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold leading-snug">开启你的学习管理之旅。</h2>
            <ul className="mt-6 space-y-3">
              {HIGHLIGHTS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.text} className="flex items-center gap-3 text-[0.9rem] opacity-95">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/15 backdrop-blur">
                      <Icon size={15} />
                    </span>
                    {item.text}
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="text-[0.76rem] opacity-75">注册后即可在多设备间同步你的学习数据。</p>
        </div>

        {/* 表单侧 */}
        <div className="relative p-7 sm:p-9">
          <div className="absolute right-5 top-5">
            <ThemeToggle />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-ink">创建 Chronos 账户</h1>
          <p className="mt-1.5 text-[0.9rem] text-muted">同步你的学习项目、任务和计时记录。</p>

          <form className="mt-6 grid gap-3.5" onSubmit={handleSubmit}>
            <Field label="昵称">
              <Input
                type="text"
                aria-label="昵称"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="你的昵称"
                required
                autoFocus
              />
            </Field>
            <Field label="邮箱">
              <Input
                type="email"
                aria-label="邮箱"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="your@email.com"
                required
              />
            </Field>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="密码">
                <Input
                  type="password"
                  aria-label="密码"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="设置密码"
                  required
                  minLength={6}
                />
              </Field>
              <Field label="确认密码">
                <Input
                  type="password"
                  aria-label="确认密码"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="再次输入"
                  required
                />
              </Field>
            </div>

            {error && (
              <div role="alert">
                <StateMessage kind="error">{error}</StateMessage>
              </div>
            )}

            <Button type="submit" size="lg" className="mt-1 w-full" disabled={loading}>
              <IconPlus size={16} />
              {loading ? "注册中..." : "注册"}
            </Button>
          </form>

          <p className="mt-6 text-center text-[0.86rem] text-muted">
            已有账号？{" "}
            <Link className="font-medium text-brand hover:text-brand-strong" to="/login">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

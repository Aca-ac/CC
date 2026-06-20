import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconAi, IconAlert, IconCheck, IconClock, IconStats } from "../components/icons";
import { Button, Field, Input, StateMessage, ThemeToggle } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../services/apiClient";

const HIGHLIGHTS = [
  { icon: IconClock, text: "本地优先，离线也能记录与计时" },
  { icon: IconAi, text: "AI 把学习目标拆成可执行的任务" },
  { icon: IconStats, text: "进度、专注时长与复盘一目了然" },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { login, enterOffline } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await apiClient.login({ email, password });
      login(session);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  const handleOffline = () => {
    if (enterOffline()) navigate("/dashboard");
    else setError("没有历史登录记录，无法进入离线模式");
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
            <h2 className="text-2xl font-bold leading-snug">规划学习，记录专注，看见成长。</h2>
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

          <p className="text-[0.76rem] opacity-75">数据保存在本机，登录后自动同步到云端。</p>
        </div>

        {/* 表单侧 */}
        <div className="relative p-7 sm:p-9">
          <div className="absolute right-5 top-5">
            <ThemeToggle />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-ink">欢迎回来</h1>
          <p className="mt-1.5 text-[0.9rem] text-muted">登录以继续管理你的学习项目与复盘。</p>

          <form className="mt-6 grid gap-3.5" onSubmit={handleSubmit}>
            <Field label="邮箱">
              <Input
                type="email"
                aria-label="邮箱"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
              />
            </Field>
            <Field label="密码">
              <Input
                type="password"
                aria-label="密码"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="输入密码"
                required
              />
            </Field>

            {error && (
              <div role="alert">
                <StateMessage kind="error">{error}</StateMessage>
              </div>
            )}

            <Button type="submit" size="lg" className="mt-1 w-full" disabled={loading}>
              <IconCheck size={16} />
              {loading ? "登录中..." : "登录"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[0.78rem] text-muted">
            <span className="h-px flex-1 bg-line" />
            <span>或</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <Button variant="secondary" size="lg" className="w-full" onClick={handleOffline}>
            <IconAlert size={16} />
            离线模式（需历史登录）
          </Button>

          <p className="mt-6 text-center text-[0.86rem] text-muted">
            还没有账号？{" "}
            <Link className="font-medium text-brand hover:text-brand-strong" to="/register">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconAlert, IconCheck, IconClock, IconUser } from "../components/icons";
import { Badge, Button, Card, Field, Input, StateMessage, ThemeToggle } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../services/apiClient";

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
    <main className="grid min-h-screen place-items-center bg-surface px-4 py-8 text-ink">
      <div className="w-full max-w-[400px]">
        <Card className="p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white shadow-[0_4px_16px_rgba(79,70,229,0.24)]">
                <IconClock size={22} />
              </div>
              <Badge tone="brand">Chronos</Badge>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">欢迎回来</h1>
              <p className="mt-1 text-[0.9rem] text-muted">登录后继续管理学习项目、任务和复盘。</p>
            </div>
            <ThemeToggle />
          </div>

          <form className="grid gap-3" onSubmit={handleSubmit}>
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

            <Button type="submit" className="mt-1 w-full" disabled={loading}>
              <IconCheck size={16} />
              {loading ? "登录中..." : "登录"}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3 text-[0.78rem] text-muted">
            <span className="h-px flex-1 bg-line" />
            <span>或</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <Button variant="secondary" className="w-full" onClick={handleOffline}>
            <IconAlert size={16} />
            离线模式（需历史登录）
          </Button>

          <p className="mt-4 text-center text-[0.86rem] text-muted">
            还没有账号？
            <Link className="font-medium text-brand hover:text-brand-strong" to="/register">
              立即注册
            </Link>
          </p>

          <div className="mt-4 flex items-center justify-center gap-2 text-[0.76rem] text-muted">
            <IconUser size={14} />
            <span>本地优先，登录后自动同步</span>
          </div>
        </Card>
      </div>
    </main>
  );
}

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconCheck, IconClock, IconPlus, IconUser } from "../components/icons";
import { Badge, Button, Card, Field, Input, StateMessage, ThemeToggle } from "../components/ui";
import { apiClient } from "../services/apiClient";

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
    <main className="grid min-h-screen place-items-center bg-surface px-4 py-8 text-ink">
      <div className="w-full max-w-[400px]">
        <Card className="p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white shadow-[0_4px_16px_rgba(79,70,229,0.24)]">
                <IconClock size={22} />
              </div>
              <Badge tone="brand">Chronos</Badge>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">创建 Chronos 账户</h1>
              <p className="mt-1 text-[0.9rem] text-muted">同步你的学习项目、任务和计时记录。</p>
            </div>
            <ThemeToggle />
          </div>

          <form className="grid gap-3" onSubmit={handleSubmit}>
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
                placeholder="再次输入密码"
                required
              />
            </Field>

            {error && (
              <div role="alert">
                <StateMessage kind="error">{error}</StateMessage>
              </div>
            )}

            <Button type="submit" className="mt-1 w-full" disabled={loading}>
              <IconPlus size={16} />
              {loading ? "注册中..." : "注册"}
            </Button>
          </form>

          <p className="mt-4 text-center text-[0.86rem] text-muted">
            已有账号？
            <Link className="font-medium text-brand hover:text-brand-strong" to="/login">
              立即登录
            </Link>
          </p>

          <div className="mt-4 flex items-center justify-center gap-2 text-[0.76rem] text-muted">
            <IconUser size={14} />
            <span>注册完成后即可回到登录页</span>
          </div>
        </Card>
      </div>
    </main>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { apiClient } from "../services/apiClient";

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>注册账号</h1>
          <p>创建你的 Chronos 账户</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>昵称</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="你的昵称" required autoFocus />
          </label>
          <label>
            <span>邮箱</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required />
          </label>
          <label>
            <span>密码</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="设置密码" required minLength={6} />
          </label>
          <label>
            <span>确认密码</span>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="再次输入密码" required />
          </label>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button type="submit" className="auth-submit" disabled={loading}>
            <UserPlus size={18} />
            {loading ? "注册中..." : "注册"}
          </button>
        </form>
        <p className="auth-switch">已有账号？<Link to="/login">立即登录</Link></p>
      </div>
    </div>
  );
}

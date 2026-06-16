import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, WifiOff } from "lucide-react";
import { apiClient } from "../services/apiClient";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, enterOffline } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Chronos</h1>
          <p>学习任务管理系统</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>邮箱</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required autoFocus />
          </label>
          <label>
            <span>密码</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="输入密码" required />
          </label>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button type="submit" className="auth-submit" disabled={loading}>
            <LogIn size={18} />
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
        <div className="auth-divider"><span>或</span></div>
        <button type="button" className="auth-offline" onClick={handleOffline}>
          <WifiOff size={16} />
          离线模式（需历史登录）
        </button>
        <p className="auth-switch">还没有账号？<Link to="/register">立即注册</Link></p>
      </div>
    </div>
  );
}

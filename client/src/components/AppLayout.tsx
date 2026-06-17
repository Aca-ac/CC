import type { LucideIcon } from "lucide-react";
import { LogOut, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export interface NavigationItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

interface AppLayoutProps {
  navigation: NavigationItem[];
  children: React.ReactNode;
}

export function AppLayout({ navigation, children }: AppLayoutProps) {
  const { session, offline, logout } = useAuth();
  const today = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="主导航">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <strong>Chronos</strong>
            <span>学习任务管理</span>
          </div>
        </div>

        <nav className="nav-list">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.path} to={item.path} className="nav-link">
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-status" aria-label="今日状态">
          <span>{today}</span>
          <strong>{offline ? "离线模式" : "本地优先 · AI 可选"}</strong>
        </div>

        {session && (
          <div className="user-bar">
            <div className="user-info">
              <User size={16} />
              <span>{session.name}</span>
            </div>
            {offline && <span className="offline-badge">离线</span>}
            <button className="logout-btn" onClick={logout} title="登出" aria-label="登出">
              <LogOut size={16} />
            </button>
          </div>
        )}
      </aside>

      <main className="main-panel">
        {children}
      </main>
    </div>
  );
}

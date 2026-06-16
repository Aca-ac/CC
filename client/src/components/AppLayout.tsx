import type { LucideIcon } from "lucide-react";
import { Clock3, LogOut, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const { session, offline, logout } = useAuth();
  const current = navigation.find((item) => item.path === location.pathname);

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="主导航">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <Clock3 size={22} />
          </div>
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
        <header className="topbar">
          <div>
            <p className="eyebrow">Chronos Scaffold</p>
            <h1>{current?.label ?? "今日看板"}</h1>
          </div>
          <span className="sync-pill">
            {offline ? "离线模式" : "本地优先 · AI 可选"}
          </span>
        </header>
        {children}
      </main>
    </div>
  );
}

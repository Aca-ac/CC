import type { LucideIcon } from "lucide-react";
import { Clock3 } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

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
  const current = navigation.find((item) => item.path === location.pathname);
  const today = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());

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
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Chronos Workspace</p>
            <h1>{current?.label ?? "今日看板"}</h1>
            <p className="topbar-subtitle">
              {today} · 本地优先记录，联网后同步云端。
            </p>
          </div>
          <div className="topbar-actions" aria-label="运行状态">
            <span className="sync-pill">本地优先</span>
            <span className="sync-pill sync-pill-accent">AI 草稿确认后生效</span>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

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
            <p className="eyebrow">Chronos Scaffold</p>
            <h1>{current?.label ?? "今日看板"}</h1>
          </div>
          <span className="sync-pill">本地优先 · AI 可选</span>
        </header>
        {children}
      </main>
    </div>
  );
}


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

function ChronosMark() {
  return (
    <svg
      className="chronos-mark"
      viewBox="0 0 128 128"
      role="img"
      aria-label="Chronos 应用图标"
    >
      <defs>
        <linearGradient id="chronos-bg" x1="20" y1="16" x2="108" y2="116">
          <stop stopColor="#0f3f38" />
          <stop offset="1" stopColor="#071f2b" />
        </linearGradient>
        <linearGradient id="chronos-ring" x1="36" y1="30" x2="94" y2="96">
          <stop stopColor="#a9f3d2" />
          <stop offset="1" stopColor="#36c7c9" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="112" height="112" rx="28" fill="url(#chronos-bg)" />
      <path
        d="M32 90c10 14 27 21 44 17 21-5 36-24 33-46"
        fill="none"
        stroke="#234d43"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <circle cx="64" cy="63" r="33" fill="#102f2c" stroke="url(#chronos-ring)" strokeWidth="7" />
      <path
        d="M64 42v22l16 10"
        fill="none"
        stroke="#effcf5"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M42 88l8 8 17-22"
        fill="none"
        stroke="#f0bb67"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="92" cy="34" r="7" fill="#f0bb67" />
    </svg>
  );
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
          <div className="brand-mark">
            <ChronosMark />
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

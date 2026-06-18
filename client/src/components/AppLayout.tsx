import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { cn } from "../lib/cn";
import { pageTransition } from "../lib/motion";
import { ThemeToggle } from "./ui/ThemeToggle";
import { SyncStatusChip } from "./SyncStatusChip";
import { IconClose, IconLogout, IconMenu, IconUser, type IconComponent } from "./icons";

export interface NavigationItem {
  path: string;
  label: string;
  icon: IconComponent;
}

interface AppLayoutProps {
  navigation: NavigationItem[];
  children: React.ReactNode;
}

function SidebarContent({ navigation, onNavigate }: { navigation: NavigationItem[]; onNavigate?: () => void }) {
  const { session, offline, logout } = useAuth();
  const today = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  return (
    <div className="flex h-full flex-col gap-5 p-3.5">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 pt-1">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-base font-bold text-white shadow-[0_3px_10px_rgba(79,70,229,0.35)]"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--focus))" }}
          aria-label="Chronos 应用图标"
        >
          C
        </span>
        <div className="min-w-0 leading-tight">
          <strong className="block text-[1.02rem] font-semibold text-ink">Chronos</strong>
          <span className="block text-[0.74rem] text-muted">学习任务管理</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1" aria-label="主导航">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className="relative flex h-10 items-center rounded-md px-3"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-md shadow-[0_3px_10px_rgba(79,70,229,0.28)]"
                      style={{ background: "linear-gradient(135deg, var(--accent), var(--focus))" }}
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 flex items-center gap-3 text-[0.9rem] font-medium transition-colors duration-150",
                      isActive ? "text-white" : "text-muted hover:text-ink"
                    )}
                  >
                    <Icon size={18} strokeWidth={2.1} />
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom cluster */}
      <div className="mt-auto flex flex-col gap-3">
        <div className="rounded-md border border-line bg-panel-muted px-3 py-2">
          <p className="text-[0.72rem] text-muted">{today}</p>
          <p className="mt-0.5 text-[0.8rem] font-medium text-brand">
            {offline ? "离线模式 · 本地优先" : "本地优先 · AI 可选"}
          </p>
        </div>

        <SyncStatusChip />

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-panel px-2.5 py-1.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                <IconUser size={15} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[0.82rem] text-ink">{session.name}</span>
              <button
                type="button"
                onClick={logout}
                title="登出"
                aria-label="登出"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-panel-muted hover:text-danger"
              >
                <IconLogout size={15} />
              </button>
            </div>
          ) : (
            <span className="flex-1 truncate rounded-md border border-dashed border-line px-3 py-2 text-[0.78rem] text-muted">
              未登录 · 本地演示
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function AppLayout({ navigation, children }: AppLayoutProps) {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 路由切换时关闭移动端抽屉
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-surface">
      {/* 顶部极淡光晕——克制即可，避免「AI 渐变大背景」观感 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-40 opacity-50"
        style={{
          background:
            "radial-gradient(50% 100% at 16% 0%, color-mix(in srgb, var(--accent) 9%, transparent), transparent 72%)",
        }}
      />

      <div className="relative z-10 grid h-full lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Desktop sidebar */}
        <aside className="hidden border-r border-line bg-panel/80 backdrop-blur-sm lg:block">
          <SidebarContent navigation={navigation} />
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-col overflow-hidden">
          {/* Mobile top strip (nav trigger only — no desktop topbar) */}
          <div className="flex items-center gap-3 border-b border-line bg-panel/80 px-4 py-3 backdrop-blur-sm lg:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="打开导航"
              className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted"
            >
              <IconMenu size={18} />
            </button>
            <span className="font-semibold text-ink">Chronos</span>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>

          <main className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={pageTransition}
              className="mx-auto w-full max-w-[1180px]"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              className="absolute left-0 top-0 h-full w-[276px] border-r border-line bg-panel shadow-float"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
            >
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="关闭导航"
                className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-panel-muted"
              >
                <IconClose size={18} />
              </button>
              <SidebarContent navigation={navigation} onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

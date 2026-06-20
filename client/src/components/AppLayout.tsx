import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Transition } from "framer-motion";
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

function SidebarContent({
  navigation,
  onNavigate,
  expanded = true,
}: {
  navigation: NavigationItem[];
  onNavigate?: () => void;
  expanded?: boolean;
}) {
  const { session, offline, logout } = useAuth();
  const today = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());
  const labelMotion = {
    opacity: expanded ? 1 : 0,
    x: expanded ? 0 : -6,
  };
  const labelTransition: Transition = { duration: 0.16, ease: [0.22, 1, 0.36, 1] };

  return (
    <div className={cn("flex h-full flex-col p-3.5", expanded ? "gap-5" : "gap-4")}>
      {/* Brand */}
      <div className={cn("flex items-center pt-1", expanded ? "gap-2.5 px-2" : "justify-center px-0")}>
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-base font-bold text-[var(--on-accent)] shadow-[0_3px_12px_var(--accent-shadow-strong)]"
          style={{ background: "linear-gradient(135deg, var(--grad-from), var(--grad-to))" }}
          aria-label="Chronos 应用图标"
        >
          C
        </span>
        <motion.div
          initial={false}
          animate={{ opacity: expanded ? 1 : 0, width: expanded ? 156 : 0 }}
          transition={labelTransition}
          className="min-w-0 overflow-hidden leading-tight"
          aria-hidden={!expanded}
        >
          <strong className="block text-[1.02rem] font-semibold text-ink">Chronos</strong>
          <span className="block text-[0.74rem] text-muted">学习任务管理</span>
        </motion.div>
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
              aria-label={item.label}
              className={({ isActive }) =>
                cn(
                  "group relative flex h-10 items-center rounded-md transition-colors duration-150",
                  expanded ? "justify-start px-3" : "justify-center px-0",
                  !isActive && "hover:bg-panel-muted"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className={cn(
                        "absolute rounded-md shadow-[0_3px_10px_var(--accent-shadow)]",
                        expanded ? "inset-0" : "left-1 top-1/2 h-9 w-9 -translate-y-1/2"
                      )}
                      style={{ background: "linear-gradient(135deg, var(--grad-from), var(--grad-to))" }}
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 flex min-w-0 items-center text-[0.9rem] font-medium transition-colors duration-150",
                      expanded ? "gap-3" : "justify-center",
                      isActive ? "text-[var(--on-accent)]" : "text-muted hover:text-ink"
                    )}
                  >
                    <Icon size={18} strokeWidth={2.1} />
                    {expanded && (
                      <motion.span
                        initial={false}
                        animate={{ ...labelMotion, width: 142 }}
                        transition={labelTransition}
                        className="overflow-hidden whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </span>

                  {/* 收起的窄栏：悬停图标时浮出文字提示，整体不再展开 */}
                  {!expanded && (
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1 text-[0.78rem] font-medium text-surface opacity-0 shadow-float transition-opacity duration-150 group-hover:opacity-100"
                    >
                      {item.label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom cluster */}
      <div className="mt-auto flex flex-col gap-3">
        <motion.div
          initial={false}
          animate={{ opacity: expanded ? 1 : 0, height: expanded ? "auto" : 0 }}
          transition={labelTransition}
          className={cn(
            "overflow-hidden rounded-md border border-line bg-panel-muted px-3 py-2",
            !expanded && "pointer-events-none border-transparent px-0 py-0"
          )}
          aria-hidden={!expanded}
        >
          <p className="text-[0.72rem] text-muted">{today}</p>
          <p className="mt-0.5 text-[0.8rem] font-medium text-brand">
            {offline ? "离线模式 · 本地优先" : "本地优先 · AI 可选"}
          </p>
        </motion.div>

        <SyncStatusChip expanded={expanded} />

        <div className={cn("flex items-center", expanded ? "gap-2" : "flex-col gap-2")}>
          <ThemeToggle />
          {session ? (
            <div
              className={cn(
                "flex min-w-0 items-center rounded-md border border-line bg-panel",
                expanded ? "flex-1 gap-2 px-2.5 py-1.5" : "h-9 w-9 justify-center px-0 py-0"
              )}
              title={session.name}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
                <IconUser size={15} />
              </span>
              <motion.span
                initial={false}
                animate={{ ...labelMotion, width: expanded ? 86 : 0 }}
                transition={labelTransition}
                className="min-w-0 flex-1 truncate text-[0.82rem] text-ink"
              >
                {session.name}
              </motion.span>
              {expanded && (
                <button
                  type="button"
                  onClick={logout}
                  title="登出"
                  aria-label="登出"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-panel-muted hover:text-danger"
                >
                  <IconLogout size={15} />
                </button>
              )}
            </div>
          ) : (
            <span
              className={cn(
                "rounded-md border border-dashed border-line text-[0.78rem] text-muted",
                expanded
                  ? "flex-1 truncate px-3 py-2"
                  : "grid h-9 w-9 place-items-center px-0 py-0"
              )}
              title="未登录 · 本地演示"
            >
              {expanded ? "未登录 · 本地演示" : <IconUser size={16} />}
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
      {/* 青蓝氛围光晕——缓慢漂浮，克制不抢内容 */}
      <div aria-hidden className="app-aurora" />

      <div className="relative z-10 grid h-full lg:grid-cols-[72px_minmax(0,1fr)]">
        {/* Desktop sidebar — 固定窄栏；悬停图标浮出文字提示，整体不再展开 */}
        <aside
          data-testid="desktop-sidebar-rail"
          data-expanded="false"
          className="relative z-30 hidden h-full w-[72px] border-r border-line bg-panel/90 backdrop-blur-sm lg:block"
        >
          <SidebarContent navigation={navigation} expanded={false} />
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

          <main className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-8 sm:py-6">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={pageTransition}
              className="mx-auto w-full max-w-[1320px]"
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
              <SidebarContent navigation={navigation} onNavigate={() => setDrawerOpen(false)} expanded />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

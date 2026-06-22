import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Transition } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { AuthSession } from "../contexts/AuthContext";
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

/**
 * 侧栏底部账号控件：头像贴合窄栏，悬停（或聚焦）弹出账号信息卡片，
 * 提供「切换账号」「退出登录」操作。
 */
function SidebarUser({
  expanded,
  session,
  logout,
}: {
  expanded: boolean;
  session: AuthSession;
  logout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const initial = (session.name || session.email || "U").trim().charAt(0).toUpperCase();

  const avatar = (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[0.82rem] font-semibold text-[var(--on-accent)] shadow-[0_2px_8px_var(--accent-shadow)]"
      style={{ background: "linear-gradient(135deg, var(--grad-from), var(--grad-to))" }}
      aria-hidden
    >
      {initial}
    </span>
  );

  const popover = (
    <div
      role="menu"
      className={cn(
        "absolute z-50 w-56 rounded-lg border border-line bg-panel p-2 shadow-float transition-[opacity,transform] duration-150",
        expanded ? "bottom-full left-0 mb-2 origin-bottom" : "bottom-0 left-full origin-bottom-left pl-2",
        open ? "visible opacity-100" : "pointer-events-none invisible opacity-0"
      )}
    >
      <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
        {avatar}
        <div className="min-w-0">
          <p className="truncate text-[0.86rem] font-semibold text-ink">{session.name}</p>
          <p className="truncate text-[0.74rem] text-muted">{session.email || "本地账号"}</p>
        </div>
      </div>
      <div className="my-1.5 h-px bg-line" />
      <button
        type="button"
        role="menuitem"
        onClick={logout}
        className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[0.84rem] text-ink transition-colors hover:bg-panel-muted"
      >
        <IconUser size={15} />
        切换账号
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={logout}
        className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[0.84rem] text-danger transition-colors hover:bg-danger-soft"
      >
        <IconLogout size={15} />
        退出登录
      </button>
    </div>
  );

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`账号：${session.name}`}
        className={cn(
          "flex items-center rounded-md border border-line bg-panel transition-colors hover:border-brand/50",
          expanded ? "w-full gap-2.5 px-2.5 py-1.5" : "h-10 w-10 justify-center px-0 py-0"
        )}
      >
        {avatar}
        {expanded && (
          <span className="min-w-0 flex-1 truncate text-left text-[0.84rem] text-ink">{session.name}</span>
        )}
      </button>
      {popover}
    </div>
  );
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
      {/* Brand — 仅展开/抽屉态展示文字标识，窄栏顶部留白（已去掉「C」图标） */}
      {expanded && (
        <div className="flex items-center px-2 pt-1">
          <div className="min-w-0 leading-tight">
            <strong className="block text-[1.02rem] font-semibold text-ink">Chronos</strong>
            <span className="block text-[0.74rem] text-muted">学习任务管理</span>
          </div>
        </div>
      )}

      {/* Nav — 窄栏（收起态）下整体垂直居中排列 */}
      <nav
        className={cn("flex flex-col gap-1", !expanded && "flex-1 justify-center")}
        aria-label="主导航"
      >
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
                        expanded
                          ? "inset-0"
                          : "left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2"
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
                    <motion.span
                      className="grid shrink-0 place-items-center"
                      animate={isActive ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                      transition={
                        isActive
                          ? { duration: 0.42, ease: [0.22, 1, 0.36, 1] }
                          : { type: "spring", stiffness: 420, damping: 24 }
                      }
                      whileHover={{ scale: 1.18, rotate: -6 }}
                      whileTap={{ scale: 0.88 }}
                    >
                      <Icon size={18} strokeWidth={2.1} />
                    </motion.span>
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
            <div className={cn(expanded && "min-w-0 flex-1")}>
              <SidebarUser expanded={expanded} session={session} logout={logout} />
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

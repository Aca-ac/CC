import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppLayout, type NavigationItem } from "./components/AppLayout";
import {
  IconAi,
  IconCalendar,
  IconDashboard,
  IconHabit,
  IconLogs,
  IconProjects,
  IconSettings,
  IconStats,
  IconTasks,
} from "./components/icons";
import { useAuth } from "./hooks/useAuth";
import { AiBreakdownPage } from "./pages/AiBreakdownPage";
import { CalendarPage } from "./pages/CalendarPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HabitsPage } from "./pages/HabitsPage";
import { LearningLogsPage } from "./pages/LearningLogsPage";
import { LoginPage } from "./pages/LoginPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { RegisterPage } from "./pages/RegisterPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StatsPage } from "./pages/StatsPage";
import { TasksPage } from "./pages/TasksPage";

const navigation: NavigationItem[] = [
  { path: "/dashboard", label: "今日看板", icon: IconDashboard },
  { path: "/projects", label: "学习项目", icon: IconProjects },
  { path: "/tasks", label: "任务管理", icon: IconTasks },
  { path: "/logs", label: "日志与计时", icon: IconLogs },
  { path: "/calendar", label: "日历", icon: IconCalendar },
  { path: "/ai", label: "AI 拆解", icon: IconAi },
  { path: "/stats", label: "统计复盘", icon: IconStats },
  { path: "/habits", label: "习惯打卡", icon: IconHabit },
  { path: "/settings", label: "系统设置", icon: IconSettings },
];

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
        <span>加载中...</span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function App() {
  const { session } = useAuth();

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/register" element={session ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <AppLayout navigation={navigation}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/logs" element={<LearningLogsPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/ai" element={<AiBreakdownPage />} />
                  <Route path="/stats" element={<StatsPage />} />
                  <Route path="/habits" element={<HabitsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </AppLayout>
            </RequireAuth>
          }
        />
      </Routes>
    </HashRouter>
  );
}

import {
  BarChart3,
  Bot,
  BookOpen,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  Settings,
} from "lucide-react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppLayout, type NavigationItem } from "./components/AppLayout";
import { useAuth } from "./hooks/useAuth";
import { AiBreakdownPage } from "./pages/AiBreakdownPage";
import { CalendarPage } from "./pages/CalendarPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LearningLogsPage } from "./pages/LearningLogsPage";
import { LoginPage } from "./pages/LoginPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { RegisterPage } from "./pages/RegisterPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StatsPage } from "./pages/StatsPage";
import { TasksPage } from "./pages/TasksPage";

const navigation: NavigationItem[] = [
  { path: "/dashboard", label: "今日看板", icon: LayoutDashboard },
  { path: "/projects", label: "学习项目", icon: ClipboardList },
  { path: "/tasks", label: "任务管理", icon: ListChecks },
  { path: "/logs", label: "日志与计时", icon: BookOpen },
  { path: "/calendar", label: "周视图", icon: CalendarDays },
  { path: "/ai", label: "AI 拆解", icon: Bot },
  { path: "/stats", label: "统计复盘", icon: BarChart3 },
  { path: "/settings", label: "系统设置", icon: Settings },
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

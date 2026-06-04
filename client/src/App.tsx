import {
  BarChart3,
  Bot,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  Settings,
} from "lucide-react";
import { Navigate, Route, HashRouter, Routes } from "react-router-dom";
import { AppLayout, type NavigationItem } from "./components/AppLayout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AiBreakdownPage } from "./pages/AiBreakdownPage";
import { CalendarPage } from "./pages/CalendarPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StatsPage } from "./pages/StatsPage";
import { TasksPage } from "./pages/TasksPage";

const navigation: NavigationItem[] = [
  { path: "/dashboard", label: "今日看板", icon: LayoutDashboard },
  { path: "/projects", label: "学习项目", icon: ClipboardList },
  { path: "/tasks", label: "任务管理", icon: ListChecks },
  { path: "/calendar", label: "周视图", icon: CalendarDays },
  { path: "/ai", label: "AI 拆解", icon: Bot },
  { path: "/stats", label: "统计复盘", icon: BarChart3 },
  { path: "/settings", label: "系统设置", icon: Settings },
];

export function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          {/* 所有需要登录的页面走 AppLayout */}
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
      </AuthProvider>
    </HashRouter>
  );
}

/** 路由守卫：未登录时重定向到 /login */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}


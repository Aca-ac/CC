import {
  BarChart3,
  Bot,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  Settings,
} from "lucide-react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout, type NavigationItem } from "./components/AppLayout";
import { AiBreakdownPage } from "./pages/AiBreakdownPage";
import { CalendarPage } from "./pages/CalendarPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LearningLogsPage } from "./pages/LearningLogsPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StatsPage } from "./pages/StatsPage";
import { TasksPage } from "./pages/TasksPage";

const navigation: NavigationItem[] = [
  { path: "/dashboard", label: "今日看板", icon: LayoutDashboard },
  { path: "/projects", label: "学习项目", icon: ClipboardList },
  { path: "/tasks", label: "任务管理", icon: ListChecks },
  { path: "/logs", label: "学习日志", icon: NotebookPen },
  { path: "/calendar", label: "周视图", icon: CalendarDays },
  { path: "/ai", label: "AI 拆解", icon: Bot },
  { path: "/stats", label: "统计复盘", icon: BarChart3 },
  { path: "/settings", label: "系统设置", icon: Settings },
];

export function App() {
  return (
    <HashRouter>
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
    </HashRouter>
  );
}

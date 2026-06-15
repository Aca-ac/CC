import type {
  AiAdvice,
  DashboardSummary,
  Habit,
  Project,
  Task,
} from "../types/domain";

// Mock 数据只用于脚手架阶段展示页面结构。接入后端后，应由 apiClient 统一请求真实接口。
export const currentSummary: DashboardSummary = {
  todayTaskTotal: 6,
  completedTaskTotal: 2,
  focusMinutes: 85,
  habitStreak: 5,
  syncPendingTotal: 1,
};

export const projects: Project[] = [
  {
    id: "project-se",
    name: "软件工程课程项目",
    goal: "在 6 月前完成 Chronos 需求、设计、开发、测试和验收材料。",
    startDate: "2026-04-08",
    endDate: "2026-06-04",
    status: "ACTIVE",
    progress: 42,
  },
  {
    id: "project-ai",
    name: "AI 功能预研",
    goal: "验证目标拆解、阶段复盘和结果质量反馈的可演示闭环。",
    startDate: "2026-05-01",
    endDate: "2026-05-18",
    status: "ACTIVE",
    progress: 28,
  },
];

export const tasks: Task[] = [
  {
    id: "task-api",
    projectId: "project-se",
    title: "整理第一版 REST API 草案",
    description: "先覆盖认证、项目、任务、今日看板和 AI 草稿接口。",
    status: "IN_PROGRESS",
    priority: "HIGH",
    dueTime: "2026-05-09T18:00:00+08:00",
    estimatedMinutes: 90,
    tags: ["后端", "接口"],
  },
  {
    id: "task-dashboard",
    projectId: "project-se",
    title: "实现今日看板页面骨架",
    status: "TODO",
    priority: "MEDIUM",
    dueTime: "2026-05-10T21:00:00+08:00",
    estimatedMinutes: 120,
    tags: ["前端", "P0"],
  },
  {
    id: "task-ai-preview",
    projectId: "project-ai",
    title: "设计 AI 拆解结果预览结构",
    status: "PAUSED",
    priority: "MEDIUM",
    dueTime: "2026-05-12T20:00:00+08:00",
    estimatedMinutes: 60,
    tags: ["AI", "P1"],
  },
];

export const habits: Habit[] = [
  {
    id: "habit-review",
    name: "每日复盘",
    rule: "每天 21:30 前记录学习日志",
    streakCount: 5,
    checkedToday: true,
  },
  {
    id: "habit-focus",
    name: "番茄专注",
    rule: "每天至少完成 2 个番茄钟",
    streakCount: 3,
    checkedToday: false,
  },
];

export const aiAdvices: AiAdvice[] = [
  {
    id: "advice-risk",
    type: "RISK",
    title: "注意同步模块范围",
    content:
      "课程项目阶段建议先做触发式 REST 同步和冲突提示，不要过早引入实时推送或消息队列。",
    generatedAt: "2026-05-07T19:30:00+08:00",
    accepted: false,
  },
];


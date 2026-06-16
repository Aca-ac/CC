export type EntityId = string;

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "PAUSED"
  | "DONE"
  | "ARCHIVED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface User {
  id: EntityId;
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
}

export interface AuthSession {
  userId: string;
  name: string;
  email: string;
  token: string;
}

export interface Project {
  id: EntityId;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "ARCHIVED";
  progress: number;
}

export interface Task {
  id: EntityId;
  projectId: EntityId;
  parentTaskId?: EntityId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueTime?: string;
  estimatedMinutes: number;
  tags: string[];
}

export interface LearningLog {
  id: EntityId;
  taskId: EntityId;
  content: string;
  actualMinutes: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  links: string[];
  createdAt: string;
}

export interface Habit {
  id: EntityId;
  name: string;
  rule: string;
  streakCount: number;
  checkedToday: boolean;
}

export interface FocusSession {
  id: EntityId;
  taskId: EntityId;
  startTime: string;
  durationMinutes: number;
  completed: boolean;
}

export interface AiAdvice {
  id: EntityId;
  type: "BREAKDOWN" | "REVIEW" | "RISK";
  title: string;
  content: string;
  generatedAt: string;
  accepted: boolean;
}

export interface SyncRecord {
  id: EntityId;
  entityType: "PROJECT" | "TASK" | "LOG" | "HABIT" | "FOCUS";
  entityId: EntityId;
  changeType: "CREATE" | "UPDATE" | "DELETE";
  version: number;
  syncStatus: "PENDING" | "SYNCED" | "CONFLICT" | "FAILED";
  lastModifiedAt: string;
}

export interface DashboardSummary {
  todayTaskTotal: number;
  completedTaskTotal: number;
  focusMinutes: number;
  habitStreak: number;
  syncPendingTotal: number;
}


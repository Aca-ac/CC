import type { TaskPriority, TaskStatus } from "../types/domain";

const statusText: Record<TaskStatus, string> = {
  TODO: "未开始",
  IN_PROGRESS: "进行中",
  PAUSED: "暂停",
  DONE: "已完成",
  ARCHIVED: "已归档",
};

const priorityText: Record<TaskPriority, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  URGENT: "紧急",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`badge status-${status.toLowerCase()}`}>{statusText[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`badge priority-${priority.toLowerCase()}`}>
      {priorityText[priority]}优先级
    </span>
  );
}


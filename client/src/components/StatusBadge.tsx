import type { TaskPriority, TaskStatus } from "../types/domain";
import { Badge, type Tone } from "./ui/Badge";

const statusText: Record<TaskStatus, string> = {
  TODO: "未开始",
  IN_PROGRESS: "进行中",
  PAUSED: "暂停",
  DONE: "已完成",
  ARCHIVED: "已归档",
};

const statusToneMap: Record<TaskStatus, Tone> = {
  TODO: "neutral",
  IN_PROGRESS: "brand",
  PAUSED: "warning",
  DONE: "success",
  ARCHIVED: "neutral",
};

const priorityText: Record<TaskPriority, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  URGENT: "紧急",
};

const priorityToneMap: Record<TaskPriority, Tone> = {
  LOW: "neutral",
  MEDIUM: "warning",
  HIGH: "brand",
  URGENT: "danger",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge tone={statusToneMap[status]} dot>
      {statusText[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge tone={priorityToneMap[priority]}>{priorityText[priority]} · 优先级</Badge>;
}

import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type Tone =
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "focus"
  | "habit"
  | "neutral";

const tones: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  focus: "bg-focus-soft text-focus",
  habit: "bg-habit-soft text-habit",
  neutral: "bg-panel-muted text-muted",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  /** 前置小圆点 */
  dot?: boolean;
}

export function Badge({ tone = "neutral", dot, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[0.72rem] font-medium leading-5 whitespace-nowrap",
        tones[tone],
        className
      )}
      {...rest}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** 任务状态 → 语气映射。 */
export function statusTone(status: string): Tone {
  switch (status) {
    case "done":
    case "completed":
      return "success";
    case "in_progress":
      return "brand";
    case "paused":
      return "warning";
    case "archived":
      return "neutral";
    default:
      return "neutral";
  }
}

/** 优先级 → 语气映射。 */
export function priorityTone(priority: string): Tone {
  switch (priority) {
    case "urgent":
      return "danger";
    case "high":
      return "brand";
    case "medium":
      return "warning";
    default:
      return "neutral";
  }
}

import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import type { IconComponent } from "../icons";

export interface EmptyStateProps {
  icon?: IconComponent;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** 紧凑模式：用于卡片内嵌的小空态 */
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-line text-center",
        compact ? "gap-2 p-5" : "gap-3 p-8",
        className
      )}
    >
      {Icon && (
        <span className="grid h-11 w-11 place-items-center rounded-md border border-line bg-panel-muted text-muted">
          <Icon size={20} />
        </span>
      )}
      <div>
        <p className="text-[0.95rem] font-medium text-ink">{title}</p>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-[0.84rem] text-muted">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** 悬浮微抬升 + 阴影增强，用于可点击卡片。 */
  interactive?: boolean;
  /** 取消内边距，方便放置列表/表格等贴边内容。 */
  flush?: boolean;
}

export function Card({ interactive, flush, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-panel shadow-soft",
        !flush && "p-4",
        interactive &&
          "transition-[transform,box-shadow,border-color] duration-200 ease-out hover:border-brand/40 hover:shadow-float cursor-pointer",
        className
      )}
      {...rest}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h3 className="text-[0.98rem] font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[0.82rem] text-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

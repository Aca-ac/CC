import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 flex items-center gap-2 text-[0.76rem] font-semibold tracking-[0.02em] text-brand">
            <span className="inline-block h-3.5 w-[3px] shrink-0 rounded-full bg-brand" aria-hidden />
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1.5 text-[0.9rem] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

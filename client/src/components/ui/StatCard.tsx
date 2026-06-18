import { cn } from "../../lib/cn";
import { AnimatedNumber } from "./AnimatedNumber";
import type { Tone } from "./Badge";
import type { IconComponent } from "../icons";

const iconTones: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  focus: "bg-focus-soft text-focus",
  habit: "bg-habit-soft text-habit",
  neutral: "bg-panel-muted text-muted",
};

export interface StatCardProps {
  icon: IconComponent;
  label: string;
  value: number;
  tone?: Tone;
  decimals?: number;
  suffix?: string;
  hint?: string;
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "brand",
  decimals = 0,
  suffix = "",
  hint,
  className,
}: StatCardProps) {
  return (
    <article
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-line bg-panel px-3.5 py-3 shadow-soft",
        "transition-[box-shadow,border-color] duration-200 ease-out hover:border-brand/40 hover:shadow-float",
        className
      )}
    >
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-md border border-line/60",
          iconTones[tone]
        )}
      >
        <Icon size={19} strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <div className="text-[1.5rem] font-bold leading-none text-ink">
          <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
        </div>
        <div className="mt-1 truncate text-[0.8rem] text-muted">{label}</div>
        {hint && <div className="mt-0.5 truncate text-[0.72rem] text-muted/80">{hint}</div>}
      </div>
    </article>
  );
}

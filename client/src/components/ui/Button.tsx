import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap " +
  "transition-[transform,background-color,box-shadow,color,border-color] duration-200 ease-out " +
  "select-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-[0_2px_10px_rgba(79,70,229,0.28)] " +
    "hover:bg-brand-strong hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(79,70,229,0.36)] active:translate-y-0",
  secondary:
    "bg-panel text-ink border border-line hover:border-brand hover:text-brand hover:-translate-y-px",
  soft: "bg-brand-soft text-brand hover:brightness-[0.97] hover:-translate-y-px",
  ghost: "text-muted hover:bg-panel-muted hover:text-ink",
  danger:
    "bg-danger text-white hover:brightness-95 hover:-translate-y-px shadow-[0_2px_10px_rgba(220,38,38,0.22)]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[0.8rem]",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-5 text-[0.95rem]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type = "button", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    />
  );
});

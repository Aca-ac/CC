import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "../../lib/cn";

const control =
  "w-full rounded-md border border-line bg-panel text-ink placeholder:text-muted/70 " +
  "px-3 py-2 text-sm transition-[border-color,box-shadow] duration-150 " +
  "focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_var(--accent-soft)] " +
  "disabled:opacity-60";

/** 带标签的表单字段包裹。 */
export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-1.5", className)}>
      {label && <span className="text-[0.82rem] font-medium text-muted">{label}</span>}
      {children}
      {error ? (
        <span className="text-[0.78rem] text-danger">{error}</span>
      ) : (
        hint && <span className="text-[0.78rem] text-muted">{hint}</span>
      )}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(control, className)} {...rest} />;
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={cn(control, "min-h-24 resize-y leading-relaxed", className)} {...rest} />;
  }
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={cn(control, "cursor-pointer", className)} {...rest}>
        {children}
      </select>
    );
  }
);

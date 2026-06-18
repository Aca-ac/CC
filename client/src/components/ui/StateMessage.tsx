import { cn } from "../../lib/cn";
import { IconAlert, IconLoader } from "../icons";

export function StateMessage({
  kind = "info",
  children,
  className,
}: {
  kind?: "info" | "loading" | "error";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border px-4 py-3 text-[0.86rem]",
        kind === "error"
          ? "border-danger/40 bg-danger-soft text-danger"
          : "border-line bg-panel-muted text-muted",
        className
      )}
    >
      {kind === "loading" && <IconLoader size={16} className="animate-spin" />}
      {kind === "error" && <IconAlert size={16} />}
      <span>{children}</span>
    </div>
  );
}

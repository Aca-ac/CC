import { useEffect, useRef } from "react";
import { animate } from "framer-motion";
import { easeOutSoft } from "../../lib/motion";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

export interface AnimatedNumberProps {
  value: number;
  /** 小数位数 */
  decimals?: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

/**
 * 数字滚动：挂载（及 value 变化）时从当前值平滑过渡到目标值。
 * 尊重 prefers-reduced-motion——直接显示终值。
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  duration = 0.9,
  className,
  suffix = "",
  prefix = "",
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const format = (n: number) => `${prefix}${n.toFixed(decimals)}${suffix}`;

    if (prefersReducedMotion()) {
      node.textContent = format(value);
      fromRef.current = value;
      return;
    }

    const controls = animate(fromRef.current, value, {
      duration,
      ease: easeOutSoft,
      onUpdate: (latest) => {
        node.textContent = format(latest);
      },
    });
    fromRef.current = value;
    return () => controls.stop();
  }, [value, decimals, duration, prefix, suffix]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {`${prefix}${value.toFixed(decimals)}${suffix}`}
    </span>
  );
}

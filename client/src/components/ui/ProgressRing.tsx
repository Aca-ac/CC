import { motion } from "framer-motion";
import { easeOutSoft } from "../../lib/motion";

export interface ProgressRingProps {
  /** 0–100 */
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  /** 环颜色，默认品牌色 */
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  className,
  color = "var(--accent)",
  trackColor = "var(--panel-muted)",
  children,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className={className}
      style={{ position: "relative", width: size, height: size }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: easeOutSoft }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 grid place-items-center">{children}</div>
      )}
    </div>
  );
}

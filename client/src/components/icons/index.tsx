import type { ReactElement, ReactNode } from "react";

/**
 * 手绘风格图标集 —— 单一线宽、圆头笔触、略带不规则的有机线条，
 * 刻意避开几何图标库那种「模板/AI」观感。全部 currentColor 描边，离线可用。
 */

export interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export type IconComponent = (props: IconProps) => ReactElement;

function Svg({
  size = 24,
  className,
  strokeWidth = 1.7,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/* ── 导航 ─────────────────────────────────────────────── */

export const IconDashboard: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M4 4.4h5.4c.3 0 .5.3.5.6v4.6c0 .3-.2.6-.5.6H4c-.3 0-.6-.3-.6-.6V5c0-.3.3-.6.6-.6Z" />
    <path d="M14.4 4.4H20c.3 0 .5.3.5.6v2.5c0 .3-.2.6-.5.6h-5.6c-.3 0-.5-.3-.5-.6V5c0-.3.2-.6.5-.6Z" />
    <path d="M4 13.6h5.4c.3 0 .5.2.5.5V19c0 .3-.2.6-.5.6H4c-.3 0-.6-.3-.6-.6v-4.9c0-.3.3-.5.6-.5Z" />
    <path d="M14.4 11.5H20c.3 0 .5.3.5.6V19c0 .3-.2.6-.5.6h-5.6c-.3 0-.5-.3-.5-.6v-6.9c0-.3.2-.6.5-.6Z" />
  </Svg>
);

export const IconProjects: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M3.4 7c0-.9.6-1.5 1.4-1.5h3.7c.5 0 .9.2 1.2.6l1.1 1.5h8c.8 0 1.5.6 1.5 1.5v8.5c0 .9-.7 1.5-1.5 1.5H4.8c-.8 0-1.4-.7-1.4-1.6Z" />
    <path d="M3.6 10.5h16.6" />
  </Svg>
);

export const IconTasks: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M4 7.2c.6.7 1.1 1.3 1.7 1.9C6.6 8 7.4 6.9 8.6 5.8" />
    <path d="M11.5 7.4c2.7-.1 5.4-.1 8.1 0" />
    <path d="M4 14.4c.6.7 1.1 1.3 1.7 1.9.9-1.1 1.7-2.2 2.9-3.3" />
    <path d="M11.5 15.6c2.7-.1 5.4-.1 8.1 0" />
  </Svg>
);

export const IconLogs: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M12 6.6C10.3 5.4 8 5 5.8 5.3 4.9 5.4 4.1 6.1 4.1 7v9.4c0 .7.6 1.1 1.3 1 2-.2 4.4 0 6.6 1.4" />
    <path d="M12 6.6c1.7-1.2 4-1.6 6.2-1.3.9.1 1.7.8 1.7 1.7v9.4c0 .7-.6 1.1-1.3 1-2-.2-4.4 0-6.6 1.4Z" />
    <path d="M12 6.7v11.8" />
  </Svg>
);

export const IconCalendar: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M4.4 6.2c5.1-.3 10.2-.3 15.3 0 .5 0 .8.4.8.9 0 3.5 0 7 0 10.5 0 .5-.4.9-.9.9-5.1.2-10.1.2-15.2 0a.9.9 0 0 1-.9-.9c0-3.5 0-7 .1-10.5 0-.5.4-.9.8-.9Z" />
    <path d="M3.7 10.4c5.6.2 11.1.2 16.7 0" />
    <path d="M8.2 4v4" />
    <path d="M15.8 4v4" />
  </Svg>
);

export const IconAi: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M12 3.6c.5 3 1.9 4.5 4.9 5-3 .5-4.4 2-4.9 5-.5-3-1.9-4.5-4.9-5 3-.5 4.4-2 4.9-5Z" />
    <path d="M18.2 13.6c.2 1.4.9 2 2.3 2.3-1.4.3-2.1 1-2.3 2.4-.3-1.4-1-2.1-2.4-2.4 1.4-.3 2.1-1 2.4-2.3Z" />
  </Svg>
);

export const IconStats: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M3.7 19.4c5.5.2 11 .2 16.5 0" />
    <path d="M6.4 19V11.4" />
    <path d="M11 19V5.8" />
    <path d="M15.6 19v-5.2" />
    <path d="M20 19V9.2" />
  </Svg>
);

export const IconSettings: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M3.7 7.6c3.2-.1 6.4-.1 9.6 0" />
    <path d="M18.4 7.6c.6 0 1.2 0 1.8.1" />
    <path d="M16.1 7.6a1.9 1.9 0 1 1-3.8 0 1.9 1.9 0 0 1 3.8 0Z" />
    <path d="M3.7 16.4c1.4-.1 2.8-.1 4.2 0" />
    <path d="M13 16.4c2.4-.1 4.8-.1 7.2 0" />
    <path d="M11 16.4a1.9 1.9 0 1 1-3.8 0 1.9 1.9 0 0 1 3.8 0Z" />
  </Svg>
);

export const IconHabit: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M12 20.4c0-3 0-6 .1-9" />
    <path d="M12 11.9c-2.6.2-4.8-1.1-5.5-3.7 2.7-.5 4.9.8 5.5 3.7Z" />
    <path d="M12 10.1c.5-2.7 2.6-4.1 5.4-3.7C16.8 9 14.6 10.4 12 10.1Z" />
    <path d="M5.6 20.5c4.3-.2 8.6-.2 12.9 0" />
  </Svg>
);

export const IconTrophy: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M7.9 4.6c2.7-.2 5.4-.2 8.1 0 .2 2.6-.1 5.1-1.5 6.7-.9 1-2.3 1.5-2.5 1.5s-1.6-.5-2.5-1.5C8.1 9.7 7.8 7.2 7.9 4.6Z" />
    <path d="M7.9 5.7c-1.4.1-2.9.4-2.8 1.9.1 1.4 1.3 2.2 2.8 2.4" />
    <path d="M16.1 5.7c1.4.1 2.9.4 2.8 1.9-.1 1.4-1.3 2.2-2.8 2.4" />
    <path d="M12 12.8c0 1.1 0 2.2.1 3.2" />
    <path d="M8.8 19.4c2.2-.2 4.3-.2 6.5 0-.1-1.6-.4-3-1.5-4-1.1-.2-2.3-.2-3.4 0-1.1 1-1.4 2.4-1.6 4Z" />
  </Svg>
);

/* ── 动作 / 状态 ──────────────────────────────────────── */

export const IconCheck: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M4.5 12.6c1.6 1.4 2.9 2.8 4.2 4.4C11 13.7 13.7 9.9 19.6 6" />
  </Svg>
);

export const IconCheckCircle: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M20.4 11.3c.4 4.2-2.5 8.2-6.7 9-4.4.9-8.8-1.9-9.7-6.2C3.1 9.6 6 5.4 10.4 4.6c2-.4 3.9 0 5.5 1" />
    <path d="M8.8 11.7c1.1 1 2 2 2.9 3.1 1.6-2.3 3.4-4.1 6.6-6.3" />
  </Svg>
);

export const IconClock: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M20.3 12c0 4.6-3.8 8.3-8.4 8.2C7.4 20.1 3.8 16.4 3.8 11.9 3.9 7.4 7.6 3.8 12.1 3.9c4.5.1 8.1 3.7 8.2 8.1Z" />
    <path d="M12 7.6c0 1.6 0 3.1.1 4.7 1 .7 2 1.3 3 1.9" />
  </Svg>
);

export const IconFlame: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M12.2 3.2c.9 2.9 3.8 4.6 3.9 8a4.1 4.1 0 0 1-8.2.3c0-1.6.8-2.8 1.8-3.8-.1 1.4.5 2.3 1.7 2.7.8-2.6-.2-5 .8-7.2Z" />
  </Svg>
);

export const IconSparkles: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M10.8 3.8c.4 2.7 1.7 4 4.4 4.4-2.7.4-4 1.7-4.4 4.4-.5-2.7-1.7-4-4.4-4.4 2.7-.4 4-1.7 4.4-4.4Z" />
    <path d="M17.6 13.2c.2 1.3.8 1.9 2.1 2.1-1.3.3-1.9.9-2.1 2.2-.3-1.3-.9-1.9-2.2-2.2 1.3-.2 1.9-.8 2.2-2.1Z" />
  </Svg>
);

export const IconRefresh: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M19.6 11.4A7.7 7.7 0 0 0 6.6 6.9c-1 1-1.7 2.2-2 3.6" />
    <path d="M4.4 12.6a7.7 7.7 0 0 0 13 4.5c1-1 1.7-2.2 2-3.6" />
    <path d="M4.2 6.3c.1 1.5.3 2.9.5 4.3 1.4-.2 2.8-.4 4.2-.7" />
    <path d="M19.8 17.7c-.1-1.5-.3-2.9-.5-4.3-1.4.2-2.8.4-4.2.7" />
  </Svg>
);

export const IconTimer: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M20 13.6c0 4.3-3.6 7.8-8 7.7-4.3 0-7.9-3.6-7.8-7.9.1-4.2 3.6-7.6 7.9-7.6 4.3 0 7.8 3.5 7.9 7.8Z" />
    <path d="M12 13.6c0-1.5 0-3 .1-4.5" />
    <path d="M9.6 3.5c1.6-.1 3.2-.1 4.8 0" />
    <path d="M18 6.7c.5-.6 1.1-1.1 1.7-1.6" />
  </Svg>
);

export const IconPause: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M9 5.2c.1 4.5.1 9.1 0 13.6" />
    <path d="M15 5.2c.1 4.5.1 9.1 0 13.6" />
  </Svg>
);

export const IconPlay: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M7.4 5.3c0-.7.7-1.1 1.3-.8 3.2 1.8 6.2 3.8 9.1 6.1.5.4.5 1.2 0 1.6-2.9 2.3-5.9 4.3-9.1 6.1-.6.3-1.3-.1-1.3-.8-.1-4.1-.1-8.2 0-12.2Z" />
  </Svg>
);

export const IconLogout: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M13.6 4.4c-2.6-.2-5.2-.2-7.8 0-.7 0-1.3.6-1.3 1.3-.2 4.2-.2 8.4 0 12.6 0 .7.6 1.3 1.3 1.3 2.6.2 5.2.2 7.8 0" />
    <path d="M16.4 8.2c1.4 1.2 2.7 2.5 3.9 3.9-1.3 1.4-2.6 2.6-4 3.8" />
    <path d="M9.4 12c3.5-.1 7-.1 10.5 0" />
  </Svg>
);

export const IconMenu: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M4 7c5.3-.2 10.7-.2 16 0" />
    <path d="M4 12c5.3-.2 10.7-.2 16 0" />
    <path d="M4 17c5.3-.2 10.7-.2 16 0" />
  </Svg>
);

export const IconGrip: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M8.3 5.6h.02" />
    <path d="M15.8 5.7h.02" />
    <path d="M8.1 12h.02" />
    <path d="M15.9 12.1h.02" />
    <path d="M8.4 18.3h.02" />
    <path d="M15.7 18.2h.02" />
  </Svg>
);

export const IconChevronRight: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M9 5.6c2.1 2 4 4.1 5.8 6.4-1.8 2.3-3.7 4.4-5.8 6.4" />
  </Svg>
);

export const IconUser: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M15.7 8.6a3.7 3.7 0 1 1-7.4 0 3.7 3.7 0 0 1 7.4 0Z" />
    <path d="M5.4 19.4c.7-3.2 3.4-5.2 6.6-5.2s5.9 2 6.6 5.2c-4.4.5-8.8.5-13.2 0Z" />
  </Svg>
);

export const IconClose: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M6.2 6c2 1.9 3.9 3.9 5.8 6 1.9-2.1 3.8-4.1 5.8-6" />
    <path d="M6.2 18c2-1.9 3.9-3.9 5.8-6 1.9 2.1 3.8 4.1 5.8 6" />
  </Svg>
);

export const IconMoon: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M19.2 13.6A7.6 7.6 0 0 1 9.6 4.9 7.6 7.6 0 1 0 19.2 13.6Z" />
  </Svg>
);

export const IconSun: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
    <path d="M12 2.8v2.4" />
    <path d="M12 18.8v2.4" />
    <path d="M2.8 12h2.4" />
    <path d="M18.8 12h2.4" />
    <path d="M5.6 5.6 7.3 7.3" />
    <path d="M16.7 16.7 18.4 18.4" />
    <path d="M5.6 18.4 7.3 16.7" />
    <path d="M16.7 7.3 18.4 5.6" />
  </Svg>
);

export const IconUpload: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M7.2 18a4 4 0 0 1-.6-8 5.5 5.5 0 0 1 10.6-1.5 3.9 3.9 0 0 1 .8 7.6" />
    <path d="M12 11.2v7" />
    <path d="M9.4 13.6c.9-.9 1.7-1.7 2.6-2.5.9.8 1.7 1.6 2.6 2.5" />
  </Svg>
);

export const IconLoader: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M12 3.6a8.4 8.4 0 1 1-6 2.5" />
  </Svg>
);

export const IconAlert: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M20.3 12c0 4.6-3.8 8.3-8.4 8.2C7.4 20.1 3.8 16.4 3.8 11.9 3.9 7.4 7.6 3.8 12.1 3.9c4.5.1 8.1 3.7 8.2 8.1Z" />
    <path d="M12 7.8c0 1.6 0 3.1-.1 4.7" />
    <path d="M12 15.9h.02" />
  </Svg>
);

export const IconPlus: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M12 4.6c-.1 4.9-.1 9.9 0 14.8" />
    <path d="M4.6 12c4.9-.1 9.9-.1 14.8 0" />
  </Svg>
);

export const IconSearch: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M17.2 11a6.2 6.2 0 1 1-12.4 0 6.2 6.2 0 0 1 12.4 0Z" />
    <path d="M15.6 15.6c1.4 1.3 2.7 2.6 3.9 4" />
  </Svg>
);

export const IconEdit: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M4.5 18.8c1.6-.2 3.2-.4 4.8-.8 3.2-3.1 6.3-6.2 9.3-9.5.5-.6.4-1.4-.1-1.9l-1.2-1.2c-.5-.5-1.3-.5-1.9 0-3.3 3-6.4 6.2-9.4 9.4-.6 1.3-1 2.6-1.5 4Z" />
    <path d="M14.3 6.6c1.1 1 2.1 2 3.1 3.1" />
    <path d="M4.2 19.3c4.8.2 9.6.2 14.4 0" />
  </Svg>
);

export const IconTrash: IconComponent = (p) => (
  <Svg {...p}>
    <path d="M5.2 7.2c4.5-.3 9-.3 13.5 0" />
    <path d="M9.2 7c.2-1 .4-1.8.8-2.6 1.3-.2 2.7-.2 4 0 .4.8.6 1.6.8 2.6" />
    <path d="M7.3 9.7c.2 3.2.5 6.3.9 9.4.1.6.6 1 1.2 1 1.8.2 3.7.2 5.5 0 .6 0 1.1-.4 1.2-1 .4-3.1.7-6.2.9-9.4" />
    <path d="M10.5 11.4c0 2 .1 4 .2 6" />
    <path d="M13.7 11.4c-.1 2-.1 4-.2 6" />
  </Svg>
);

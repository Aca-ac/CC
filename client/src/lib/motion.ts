import type { Transition, Variants } from "framer-motion";

/** 统一的缓动曲线（与 global.css 的 --ease-out-soft 对应）。 */
export const easeOutSoft: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** 单元素淡入上移——列表项 / 卡片入场的基本动作。 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeOutSoft },
  },
};

/** 轻微缩放淡入——用于强调性卡片 / 弹层内容。 */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.32, ease: easeOutSoft },
  },
};

/** 容器：让子元素依次错峰入场（stagger）。 */
export function staggerContainer(stagger = 0.06, delay = 0): Variants {
  return {
    hidden: {},
    show: {
      transition: { staggerChildren: stagger, delayChildren: delay },
    },
  };
}

/** 路由切换时主内容区的进出动画。 */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const pageTransition: Transition = { duration: 0.28, ease: easeOutSoft };

/** 悬浮微反馈——用于按钮 / 可点击卡片。 */
export const hoverLift = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.18, ease: easeOutSoft },
};

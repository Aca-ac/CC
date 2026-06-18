import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "../../contexts/ThemeContext";
import { IconMoon, IconSun } from "../icons";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "切换到浅色主题" : "切换到深色主题"}
      title={isDark ? "浅色主题" : "深色主题"}
      className={
        "relative grid h-9 w-9 place-items-center rounded-md border border-line bg-panel text-muted " +
        "transition-colors duration-200 hover:text-brand hover:border-brand " +
        (className ?? "")
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: 0.2 }}
          className="grid place-items-center"
        >
          {isDark ? <IconMoon size={18} /> : <IconSun size={18} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

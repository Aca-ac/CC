export type ClassValue = string | number | false | null | undefined;

/**
 * 极简 className 拼接：过滤掉 falsy 值后用空格连接。
 * 足够覆盖条件类名场景，无需引入额外依赖。
 */
export function cn(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(" ");
}

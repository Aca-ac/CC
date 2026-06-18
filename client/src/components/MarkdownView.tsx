import { useMemo } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { cn } from "../lib/cn";

// GitHub 风味 + 软换行；渲染同步返回字符串。
marked.setOptions({ gfm: true, breaks: true });

// 外链统一新窗口打开并加固 rel，避免 target=_blank 的反向 tabnabbing。
let hookRegistered = false;
function ensureLinkHook() {
  if (hookRegistered || typeof window === "undefined") return;
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node instanceof HTMLElement && node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
  });
  hookRegistered = true;
}

/**
 * 渲染 Markdown 为「净化后」的 HTML（FR-学习日志 Markdown）。
 * 安全：marked 转 HTML 后必经 DOMPurify 净化，杜绝脚本/事件注入（XSS）。
 */
export function MarkdownView({ source, className }: { source: string; className?: string }) {
  const html = useMemo(() => {
    ensureLinkHook();
    const raw = marked.parse(source ?? "", { async: false }) as string;
    return DOMPurify.sanitize(raw);
  }, [source]);

  if (!source || !source.trim()) return null;
  return (
    <div
      className={cn("markdown-body", className)}
      // 已经过 DOMPurify 净化，可安全注入。
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownView } from "../MarkdownView";

describe("MarkdownView", () => {
  it("renders common Markdown to HTML", () => {
    const { container } = render(
      <MarkdownView source={"# 标题\n\n**加粗** 与 `代码`\n\n- 一\n- 二"} />,
    );
    expect(container.querySelector("h1")?.textContent).toContain("标题");
    expect(container.querySelector("strong")?.textContent).toBe("加粗");
    expect(container.querySelector("code")?.textContent).toBe("代码");
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });

  it("strips <script> tags (XSS)", () => {
    const { container } = render(
      <MarkdownView source={"hello <script>window.__pwned = true</script> world"} />,
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.innerHTML.toLowerCase()).not.toContain("<script");
  });

  it("removes inline event handlers and javascript: links", () => {
    const { container } = render(
      <MarkdownView source={'<img src=x onerror="alert(1)"> [bad](javascript:alert(1))'} />,
    );
    const img = container.querySelector("img");
    if (img) expect(img.getAttribute("onerror")).toBeNull();
    const link = container.querySelector("a");
    if (link) expect(link.getAttribute("href") ?? "").not.toContain("javascript:");
    expect(container.innerHTML.toLowerCase()).not.toContain("onerror");
  });

  it("renders nothing for empty input", () => {
    const { container } = render(<MarkdownView source="   " />);
    expect(container.firstChild).toBeNull();
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AiBreakdownPage } from "../AiBreakdownPage";

const aiMocks = vi.hoisted(() => ({
  previewBreakdown: vi.fn(),
  commitBreakdown: vi.fn(),
}));

vi.mock("../../services/aiService", () => ({
  aiService: {
    previewBreakdown: aiMocks.previewBreakdown,
    commitBreakdown: aiMocks.commitBreakdown,
  },
}));

function renderAiBreakdown() {
  return render(
    <MemoryRouter>
      <AiBreakdownPage />
    </MemoryRouter>
  );
}

describe("AiBreakdownPage", () => {
  beforeEach(() => {
    aiMocks.previewBreakdown.mockReset();
    aiMocks.commitBreakdown.mockReset();
  });

  it("renders redesigned AI breakdown preview from mocked service response", async () => {
    aiMocks.previewBreakdown.mockResolvedValue({
      projectName: "React 学习计划",
      goal: "掌握 React",
      phases: [
        {
          name: "基础",
          weeks: 2,
          tasks: [
            {
              title: "阅读 React 文档",
              description: "完成核心概念复盘",
              estimatedMinutes: 120,
              priority: "HIGH",
            },
          ],
        },
      ],
      firstAction: {
        title: "阅读 React 文档",
        description: "完成核心概念复盘",
        estimatedMinutes: 120,
        priority: "HIGH",
      },
    });

    renderAiBreakdown();

    await waitFor(() => {
      expect(screen.getByText("AI 拆解工作台")).toBeDefined();
    });

    fireEvent.change(screen.getByLabelText("目标描述"), {
      target: { value: "掌握 React" },
    });
    fireEvent.click(screen.getByText("生成草稿"));

    await waitFor(() => {
      expect(screen.getAllByText("阅读 React 文档").length).toBeGreaterThan(0);
    });
    expect(aiMocks.previewBreakdown).toHaveBeenCalledWith("掌握 React", 4);
  });
});

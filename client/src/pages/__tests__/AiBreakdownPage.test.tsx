import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AiBreakdownPage } from "../AiBreakdownPage";

const aiMocks = vi.hoisted(() => ({
  previewBreakdown: vi.fn(),
  commitBreakdown: vi.fn(),
  generateAdvice: vi.fn(),
}));

vi.mock("../../services/aiService", () => ({
  aiService: {
    previewBreakdown: aiMocks.previewBreakdown,
    commitBreakdown: aiMocks.commitBreakdown,
    generateAdvice: aiMocks.generateAdvice,
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

  it("renders the stage-tree breakdown preview from the structured endpoint", async () => {
    aiMocks.previewBreakdown.mockResolvedValue({
      draftId: "draft-1",
      goal: "掌握 React",
      weeks: 4,
      stages: [
        {
          title: "基础阶段",
          tasks: [
            { title: "阅读 React 文档", description: "完成核心概念复盘", estimatedMinutes: 120, priority: "HIGH" },
          ],
        },
      ],
    });

    renderAiBreakdown();

    await waitFor(() => {
      expect(screen.getByText("智能规划")).toBeDefined();
    });

    fireEvent.change(screen.getByLabelText("目标描述"), { target: { value: "掌握 React" } });
    fireEvent.click(screen.getByText("生成草稿"));

    await waitFor(() => {
      expect(screen.getByText("基础阶段")).toBeDefined();
    });
    expect(screen.getAllByDisplayValue("阅读 React 文档").length).toBeGreaterThan(0);
    // 目标 + 周期 + 目标项目（无项目时传 undefined）
    expect(aiMocks.previewBreakdown).toHaveBeenCalledWith("掌握 React", 4, undefined);
  });
});

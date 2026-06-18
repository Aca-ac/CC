import { apiClient, type CommitTaskNode } from "./apiClient";

export type {
  BreakdownTaskDraft,
  BreakdownStage,
  BreakdownTree,
  CommitTaskNode,
  WeeklyAdvice,
} from "./apiClient";

/**
 * AI 拆解 / 复盘服务（FR-AI 拆解）。直连后端结构化端点：
 *  - 拆解预览 POST /ai/breakdown/preview → 按周阶段任务树
 *  - 确认落库 POST /ai/breakdown/commit → 在所选项目下批量创建任务
 *  - 周建议 POST /ai/advice → 基于周统计的学习建议
 *
 * BYOK（自带 Key）由设置页通过服务端加密端点 PUT /ai/settings 管理；
 * 服务端无可用 Key 时自动回落 MockProvider，前端据返回内容优雅降级。
 */
export const aiService = {
  previewBreakdown: (goal: string, weeks: number, projectId?: string) =>
    apiClient.aiBreakdownPreview({ goal, weeks, projectId }),

  commitBreakdown: (draftId: string, projectId: string, tasks: CommitTaskNode[]) =>
    apiClient.aiBreakdownCommit({ draftId, projectId, tasks }),

  generateAdvice: (projectId?: string) => apiClient.aiAdvice(projectId),
};

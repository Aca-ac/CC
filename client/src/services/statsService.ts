import { apiClient } from "./apiClient";

export interface WeeklyStatsDTO {
  totalCompleted: number;
  completionRate: number; // 0-100
  dailyMinutes: Array<{
    date: string; // YYYY-MM-DD
    minutes: number;
  }>;
  projectDistribution: Array<{
    projectId: string;
    projectName: string;
    minutes: number;
  }>;
}

export const statsService = {
  async getWeeklyStats(): Promise<WeeklyStatsDTO> {
    return apiClient.getWeeklyStats();
  },
};

import { apiClient } from "./apiClient";

export interface WeeklyStatsDTO {
  totalCompleted: number;
  completionRate: number; // 0-100
  dailyMinutes: Array<{
    date: string; // YYYY-MM-DD
    minutes: number;
    focusMinutes: number; // 其中的专注时长
  }>;
  projectDistribution: Array<{
    projectId: string;
    projectName: string;
    minutes: number;
    totalTasks: number;
    completedTasks: number;
  }>;
}

interface ServerWeeklyStats {
  completedTasks: number;
  completionRate: number;
  dailyStats: Array<{ date: string; minutes: number; focusMinutes: number }>;
  projectDistribution: Array<{
    projectId: string;
    projectName: string;
    minutes: number;
    totalTasks?: number;
    completedTasks?: number;
  }>;
}

export const statsService = {
  async getWeeklyStats(): Promise<WeeklyStatsDTO> {
    const response = await apiClient.get<ServerWeeklyStats>("/stats/weekly");
    return {
      totalCompleted: response.completedTasks,
      completionRate: Math.round(response.completionRate * 100),
      dailyMinutes: response.dailyStats.map((day) => ({
        date: day.date,
        minutes: day.minutes ?? day.focusMinutes,
        focusMinutes: day.focusMinutes ?? 0,
      })),
      projectDistribution: response.projectDistribution.map((project) => ({
        projectId: project.projectId,
        projectName: project.projectName,
        minutes: project.minutes,
        totalTasks: project.totalTasks ?? 0,
        completedTasks: project.completedTasks ?? 0,
      })),
    };
  },
};

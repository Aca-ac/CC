import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SettingsPage } from "../SettingsPage";
import { AuthProvider } from "../../contexts/AuthContext";
import { ThemeProvider } from "../../contexts/ThemeContext";

function renderSettings() {
  return render(
    <AuthProvider>
      <ThemeProvider>
        <SettingsPage />
      </ThemeProvider>
    </AuthProvider>
  );
}

describe("SettingsPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the slimmed settings sections without exposing the API address", async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.getByText("偏好设置")).toBeDefined();
    });

    // 精简后的分区
    expect(screen.getByText("外观主题")).toBeDefined();
    expect(screen.getByText("账号")).toBeDefined();
    expect(screen.getByText("AI 服务")).toBeDefined();
    expect(screen.getByText("应用更新")).toBeDefined();

    // 用户自定义模型名输入
    expect(screen.getByLabelText("模型名称")).toBeDefined();

    // 不再显示后端服务地址
    expect(screen.queryByLabelText("服务地址")).toBeNull();
  });
});

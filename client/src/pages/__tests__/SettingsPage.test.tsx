import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("renders redesigned settings and saves API base URL", async () => {
    renderSettings();

    await waitFor(() => {
      expect(screen.getByText("系统设置")).toBeDefined();
    });

    fireEvent.change(screen.getByLabelText("服务地址"), {
      target: { value: "http://localhost:8080/api" },
    });
    fireEvent.click(screen.getByText("保存 API 地址"));

    await waitFor(() => {
      expect(screen.getByText("API 地址已保存")).toBeDefined();
    });
  });
});

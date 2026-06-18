import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../../contexts/AuthContext";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { LoginPage } from "../LoginPage";
import { RegisterPage } from "../RegisterPage";

function renderAuthPage(page: React.ReactElement) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ThemeProvider>{page}</ThemeProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("auth pages", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders redesigned login page and keeps offline guard", () => {
    renderAuthPage(<LoginPage />);

    expect(screen.getByText("欢迎回来")).toBeDefined();

    fireEvent.click(screen.getByText("离线模式（需历史登录）"));

    expect(screen.getByRole("alert").textContent).toContain("没有历史登录记录");
  });

  it("renders redesigned register page and validates password confirmation", () => {
    renderAuthPage(<RegisterPage />);

    expect(screen.getByText("创建 Chronos 账户")).toBeDefined();

    fireEvent.change(screen.getByLabelText("昵称"), { target: { value: "Demo" } });
    fireEvent.change(screen.getByLabelText("邮箱"), { target: { value: "demo@example.com" } });
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "123456" } });
    fireEvent.change(screen.getByLabelText("确认密码"), { target: { value: "abcdef" } });
    fireEvent.click(screen.getByText("注册"));

    expect(screen.getByRole("alert").textContent).toContain("两次输入的密码不一致");
  });
});

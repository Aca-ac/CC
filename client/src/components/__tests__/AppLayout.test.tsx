import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthContext, type AuthContextValue } from "../../contexts/AuthContext";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { AppLayout, type NavigationItem } from "../AppLayout";
import { IconDashboard } from "../icons";

const navigation: NavigationItem[] = [
  { path: "/dashboard", label: "今日看板", icon: IconDashboard },
];

const authValue: AuthContextValue = {
  session: null,
  offline: true,
  loading: false,
  apiBaseUrl: "/api",
  login: () => undefined,
  logout: () => undefined,
  enterOffline: () => false,
  setApiBaseUrl: () => undefined,
};

describe("AppLayout", () => {
  it("keeps the workspace chrome compact without a redundant topbar", () => {
    render(
      <ThemeProvider>
        <AuthContext.Provider value={authValue}>
          <MemoryRouter initialEntries={["/dashboard"]}>
            <AppLayout navigation={navigation}>
              <section>
                <h2>今日看板</h2>
              </section>
            </AppLayout>
          </MemoryRouter>
        </AuthContext.Provider>
      </ThemeProvider>,
    );

    expect(screen.getByLabelText("主导航")).toBeTruthy();
    expect(screen.getByLabelText("Chronos 应用图标")).toBeTruthy();
    expect(screen.getAllByText("Chronos").length).toBeGreaterThan(0);
    expect(document.querySelector(".topbar")).toBeNull();
    expect(screen.queryByText("Chronos Scaffold")).toBeNull();
  });

  it("renders a desktop icon rail with accessible navigation labels", () => {
    render(
      <ThemeProvider>
        <AuthContext.Provider value={authValue}>
          <MemoryRouter initialEntries={["/dashboard"]}>
            <AppLayout navigation={navigation}>
              <section>
                <h2>今日看板</h2>
              </section>
            </AppLayout>
          </MemoryRouter>
        </AuthContext.Provider>
      </ThemeProvider>,
    );

    expect(screen.getByTestId("desktop-sidebar-rail").getAttribute("data-expanded")).toBe("false");
    expect(screen.getByTitle("今日看板").getAttribute("aria-label")).toBe("今日看板");
  });
});

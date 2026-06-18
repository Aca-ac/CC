import { render, screen } from "@testing-library/react";
import { LayoutDashboard } from "lucide-react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthContext, type AuthContextValue } from "../../contexts/AuthContext";
import { AppLayout, type NavigationItem } from "../AppLayout";

const navigation: NavigationItem[] = [
  { path: "/dashboard", label: "今日看板", icon: LayoutDashboard },
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
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <AppLayout navigation={navigation}>
            <section>
              <h2>今日看板</h2>
            </section>
          </AppLayout>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.getByLabelText("主导航")).toBeTruthy();
    expect(screen.getByText("Chronos")).toBeTruthy();
    expect(document.querySelector(".topbar")).toBeNull();
    expect(screen.queryByText("Chronos Scaffold")).toBeNull();
  });
});

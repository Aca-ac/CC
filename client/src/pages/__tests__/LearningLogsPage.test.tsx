import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LearningLogsPage } from "../LearningLogsPage";
import { AuthProvider } from "../../contexts/AuthContext";
import { deleteDB } from "../../storage/db";

function renderLearningLogs() {
  return render(
    <AuthProvider>
      <LearningLogsPage />
    </AuthProvider>
  );
}

describe("LearningLogsPage", () => {
  beforeEach(async () => {
    localStorage.clear();
    await deleteDB();
  }, 30000);

  it("renders redesigned learning logs and validates manual entry", async () => {
    renderLearningLogs();

    await waitFor(() => {
      expect(screen.getByText("学习记录")).toBeDefined();
    });

    fireEvent.click(screen.getAllByText("手动录入")[0]);
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeDefined();
    });
    fireEvent.submit(document.querySelector("#learning-log-form") as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByText("请选择项目")).toBeDefined();
    });
  });
});

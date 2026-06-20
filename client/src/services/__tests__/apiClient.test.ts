import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../apiClient";

describe("apiClient authorization", () => {
  beforeEach(() => {
    localStorage.setItem("chronos:session", JSON.stringify({ userId: "u-1", token: "expired-token" }));
    window.location.hash = "#/dashboard";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("clears a stale session when the API returns an UNAUTHORIZED envelope", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: false,
      code: "UNAUTHORIZED",
      message: "请先登录",
      data: null,
    }), { status: 200, headers: { "Content-Type": "application/json" } })));

    await expect(apiClient.get("/projects")).rejects.toThrow("UNAUTHORIZED");

    expect(localStorage.getItem("chronos:session")).toBeNull();
    expect(window.location.hash).toBe("#/login");
  });
});

import { describe, expect, it, vi } from "vitest";
import { checkForUpdates, compareVersions } from "../updateService";

describe("updateService", () => {
  it("compares semantic versions with optional v prefix", () => {
    expect(compareVersions("v0.2.0", "0.1.9")).toBe(1);
    expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
    expect(compareVersions("0.9.9", "1.0.0")).toBe(-1);
  });

  it("reports available updates from the latest GitHub release", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        tag_name: "v0.2.0",
        name: "Chronos 0.2.0",
        html_url: "https://github.com/Vincent-Ctrl-18/Chronos/releases/tag/v0.2.0",
        published_at: "2026-06-17T00:00:00Z",
        body: "UI improvements",
      }),
    } as Response);

    const result = await checkForUpdates({
      currentVersion: "0.1.0",
      fetcher,
    });

    expect(result.status).toBe("available");
    expect(result.latestVersion).toBe("0.2.0");
    expect(result.releaseUrl).toContain("/releases/tag/v0.2.0");
  });

  it("reports current when the app is already up to date", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        tag_name: "v0.1.0",
        html_url: "https://github.com/Vincent-Ctrl-18/Chronos/releases/tag/v0.1.0",
      }),
    } as Response);

    const result = await checkForUpdates({
      currentVersion: "0.1.0",
      fetcher,
    });

    expect(result.status).toBe("current");
    expect(result.latestVersion).toBe("0.1.0");
  });

  it("handles repositories without a published release", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response);

    const result = await checkForUpdates({
      currentVersion: "0.1.0",
      fetcher,
    });

    expect(result.status).toBe("unavailable");
    expect(result.releaseUrl).toContain("/releases");
  });
});

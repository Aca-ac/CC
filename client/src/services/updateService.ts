const RELEASES_URL = "https://github.com/Vincent-Ctrl-18/Chronos/releases";
const LATEST_RELEASE_API =
  "https://api.github.com/repos/Vincent-Ctrl-18/Chronos/releases/latest";

export const CURRENT_APP_VERSION =
  typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "0.1.0";

export type UpdateStatus = "available" | "current" | "unavailable";

export type DesktopUpdateState =
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "installing"
  | "unsupported"
  | "error";

export interface DesktopUpdateStatus {
  state: DesktopUpdateState;
  version?: string;
  percent?: number;
  message?: string;
  releaseNotes?: string;
}

export interface UpdateCheckResult {
  status: UpdateStatus;
  currentVersion: string;
  latestVersion?: string;
  releaseName?: string;
  releaseUrl: string;
  publishedAt?: string;
  notes?: string;
  message: string;
}

interface GitHubRelease {
  tag_name?: string;
  name?: string;
  html_url?: string;
  published_at?: string;
  body?: string;
}

interface CheckForUpdatesOptions {
  currentVersion?: string;
  fetcher?: typeof fetch;
}

const normalizeVersion = (version: string) =>
  version.trim().replace(/^v/i, "").split(/[+-]/)[0] || "0.0.0";

const parseVersion = (version: string) =>
  normalizeVersion(version)
    .split(".")
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0));

export const compareVersions = (latest: string, current: string) => {
  const latestParts = parseVersion(latest);
  const currentParts = parseVersion(current);
  const length = Math.max(latestParts.length, currentParts.length);

  for (let index = 0; index < length; index += 1) {
    const left = latestParts[index] ?? 0;
    const right = currentParts[index] ?? 0;

    if (left > right) return 1;
    if (left < right) return -1;
  }

  return 0;
};

export async function checkForUpdates({
  currentVersion = CURRENT_APP_VERSION,
  fetcher = fetch,
}: CheckForUpdatesOptions = {}): Promise<UpdateCheckResult> {
  const response = await fetcher(LATEST_RELEASE_API, {
    headers: {
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    return {
      status: "unavailable",
      currentVersion,
      releaseUrl: RELEASES_URL,
      message: "No published release was found yet. Open the releases page to check installers later.",
    };
  }

  if (!response.ok) {
    throw new Error(`Update check failed: HTTP ${response.status} ${response.statusText}`);
  }

  const release = (await response.json()) as GitHubRelease;
  const latestVersion = normalizeVersion(release.tag_name ?? "");

  if (!latestVersion) {
    return {
      status: "unavailable",
      currentVersion,
      releaseUrl: release.html_url ?? RELEASES_URL,
      message: "The latest release does not include a version tag. Open the releases page to verify manually.",
    };
  }

  const releaseUrl = release.html_url ?? `${RELEASES_URL}/latest`;
  const isNewer = compareVersions(latestVersion, currentVersion) > 0;

  return {
    status: isNewer ? "available" : "current",
    currentVersion,
    latestVersion,
    releaseName: release.name,
    releaseUrl,
    publishedAt: release.published_at,
    notes: release.body,
    message: isNewer
      ? `Version ${latestVersion} is available. Open the release page to download it.`
      : "You are already using the latest version.",
  };
}

export function hasDesktopUpdater() {
  return Boolean(window.chronosDesktop?.updates);
}

export async function checkDesktopUpdate(): Promise<DesktopUpdateStatus> {
  const updater = window.chronosDesktop?.updates;
  if (!updater) {
    throw new Error("Desktop updater is unavailable in this environment.");
  }

  return updater.check();
}

export async function downloadDesktopUpdate(): Promise<DesktopUpdateStatus> {
  const updater = window.chronosDesktop?.updates;
  if (!updater) {
    throw new Error("Desktop updater is unavailable in this environment.");
  }

  return updater.download();
}

export async function installDesktopUpdate(): Promise<DesktopUpdateStatus> {
  const updater = window.chronosDesktop?.updates;
  if (!updater) {
    throw new Error("Desktop updater is unavailable in this environment.");
  }

  return updater.install();
}

export async function openReleasePage(url: string) {
  if (window.chronosDesktop?.openExternal) {
    await window.chronosDesktop.openExternal(url);
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

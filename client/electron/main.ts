import { app, BrowserWindow, ipcMain, Menu, shell, type WebContents } from "electron";
import { autoUpdater, type UpdateCheckResult, type UpdateInfo } from "electron-updater";
import fs from "node:fs";
import path from "node:path";

const isDevelopment = !app.isPackaged;
const MIN_ZOOM_FACTOR = 0.75;
const MAX_ZOOM_FACTOR = 1.7;
const ZOOM_STEP = 0.1;

type DesktopUpdateStatus = {
  state:
    | "checking"
    | "available"
    | "not-available"
    | "downloading"
    | "downloaded"
    | "installing"
    | "unsupported"
    | "error";
  version?: string;
  percent?: number;
  message?: string;
  releaseNotes?: string;
};

let updaterConfigured = false;
// 最近一次检查结果（持有 cancellationToken，供下载阶段取消差量下载用）。
let pendingCheck: UpdateCheckResult | null = null;
// 差量下载在该时长内毫无进度则判定为卡住，回退整包下载。
const DIFFERENTIAL_STALL_MS = 25_000;

function isNativeUpdaterSupported() {
  return app.isPackaged && process.platform === "win32";
}

function emitUpdateStatus(status: DesktopUpdateStatus) {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send("chronos:update-status", status);
  }
}

function normalizeReleaseNotes(releaseNotes: UpdateInfo["releaseNotes"]) {
  if (Array.isArray(releaseNotes)) {
    return releaseNotes.map((note) => note.note).filter(Boolean).join("\n\n");
  }

  return releaseNotes ?? undefined;
}

// 把 electron-updater 的原始网络错误转成面向用户的友好文案，避免把 HttpError 堆栈抛到界面。
function friendlyUpdateError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/404|not found/i.test(message)) {
    return "暂时无法获取更新信息（未找到更新源）。可稍后再试，或前往发布页手动下载。";
  }
  if (/ENOTFOUND|EAI_AGAIN|getaddrinfo|ECONNREFUSED|ETIMEDOUT|ECONNRESET|net::|network/i.test(message)) {
    return "网络不可用，暂时无法检查更新，请稍后再试。";
  }
  return "检查更新失败，请稍后再试，或前往发布页手动下载。";
}

function configureAutoUpdater() {
  if (!isNativeUpdaterSupported()) {
    return false;
  }

  if (updaterConfigured) {
    return true;
  }

  updaterConfigured = true;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  // 默认保留差量下载（blockmap 增量，省服务器带宽）；仅在卡住时由看门狗回退整包。
  autoUpdater.disableDifferentialDownload = false;

  autoUpdater.on("checking-for-update", () => {
    emitUpdateStatus({ state: "checking" });
  });
  autoUpdater.on("update-available", (info) => {
    emitUpdateStatus({
      state: "available",
      version: info.version,
      releaseNotes: normalizeReleaseNotes(info.releaseNotes),
    });
  });
  autoUpdater.on("update-not-available", () => {
    emitUpdateStatus({ state: "not-available" });
  });
  autoUpdater.on("download-progress", (progress) => {
    emitUpdateStatus({
      state: "downloading",
      percent: Math.round(progress.percent),
    });
  });
  autoUpdater.on("update-downloaded", (info) => {
    emitUpdateStatus({
      state: "downloaded",
      version: info.version,
      releaseNotes: normalizeReleaseNotes(info.releaseNotes),
    });
  });
  autoUpdater.on("error", (error) => {
    emitUpdateStatus({ state: "error", message: friendlyUpdateError(error) });
  });

  return true;
}

async function checkNativeUpdate(): Promise<DesktopUpdateStatus> {
  if (!configureAutoUpdater()) {
    return { state: "unsupported", message: "自动更新需要使用 Windows 安装版。" };
  }

  emitUpdateStatus({ state: "checking" });
  try {
    // 每次检查都先恢复差量优先；记录结果以便下载阶段取出 cancellationToken。
    autoUpdater.disableDifferentialDownload = false;
    pendingCheck = await autoUpdater.checkForUpdates();
    return { state: "checking" };
  } catch (error) {
    const status: DesktopUpdateStatus = { state: "error", message: friendlyUpdateError(error) };
    emitUpdateStatus(status);
    return status;
  }
}

async function downloadNativeUpdate(): Promise<DesktopUpdateStatus> {
  if (!configureAutoUpdater()) {
    return { state: "unsupported", message: "自动更新需要使用 Windows 安装版。" };
  }

  emitUpdateStatus({ state: "downloading", percent: 0 });

  let sawProgress = false;
  let fellBackToFull = false;
  const markProgress = (progress: { percent?: number }) => {
    if ((progress?.percent ?? 0) > 0) sawProgress = true;
  };
  autoUpdater.on("download-progress", markProgress);

  // 看门狗：差量下载默认优先（省带宽）；若长时间 0 进度（多为代理无法处理
  // multipart/byteranges 导致卡住），取消差量、改整包下载兜底。
  const watchdog = setTimeout(() => {
    if (sawProgress || fellBackToFull) return;
    fellBackToFull = true;
    try {
      pendingCheck?.cancellationToken?.cancel();
    } catch {
      // 取消失败可忽略：整包下载会重新发起。
    }
    autoUpdater.disableDifferentialDownload = true;
    emitUpdateStatus({ state: "downloading", percent: 0, message: "差量下载无响应，已切换为完整下载…" });
    autoUpdater
      .checkForUpdates()
      .then((result) => {
        pendingCheck = result ?? pendingCheck;
        return autoUpdater.downloadUpdate(pendingCheck?.cancellationToken);
      })
      .catch((error) => {
        emitUpdateStatus({ state: "error", message: friendlyUpdateError(error) });
      });
  }, DIFFERENTIAL_STALL_MS);

  try {
    await autoUpdater.downloadUpdate(pendingCheck?.cancellationToken);
    return { state: "downloading", percent: 0 };
  } catch (error) {
    // 被看门狗主动取消（切换整包）时的 reject 不算失败，整包下载已在进行。
    if (fellBackToFull) {
      return { state: "downloading", percent: 0 };
    }
    const status: DesktopUpdateStatus = { state: "error", message: friendlyUpdateError(error) };
    emitUpdateStatus(status);
    return status;
  } finally {
    clearTimeout(watchdog);
    autoUpdater.removeListener("download-progress", markProgress);
  }
}

function installNativeUpdate(): DesktopUpdateStatus {
  if (!configureAutoUpdater()) {
    return { state: "unsupported", message: "自动更新需要使用 Windows 安装版。" };
  }

  emitUpdateStatus({ state: "installing" });
  setImmediate(() => autoUpdater.quitAndInstall());
  return { state: "installing" };
}

function resolveAssetPath(fileName: string) {
  const candidates = [
    path.join(__dirname, "../dist", fileName),
    path.join(__dirname, "../public", fileName),
    path.join(process.cwd(), "dist", fileName),
    path.join(process.cwd(), "public", fileName),
    path.join(process.resourcesPath ?? "", fileName),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function clampZoom(zoomFactor: number) {
  return Math.min(MAX_ZOOM_FACTOR, Math.max(MIN_ZOOM_FACTOR, Number(zoomFactor.toFixed(2))));
}

function changeZoom(webContents: WebContents, delta: number) {
  webContents.setZoomFactor(clampZoom(webContents.getZoomFactor() + delta));
}

function registerZoomShortcuts(mainWindow: BrowserWindow) {
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown" || (!input.control && !input.meta)) {
      return;
    }

    const key = input.key.toLowerCase();

    if (key === "+" || key === "=") {
      event.preventDefault();
      changeZoom(mainWindow.webContents, ZOOM_STEP);
      return;
    }

    if (key === "-") {
      event.preventDefault();
      changeZoom(mainWindow.webContents, -ZOOM_STEP);
      return;
    }

    if (key === "0") {
      event.preventDefault();
      mainWindow.webContents.setZoomFactor(1);
    }
  });
}

function registerDesktopIpc() {
  ipcMain.handle("chronos:open-external", async (_event, url: string) => {
    const target = new URL(url);

    if (!["http:", "https:"].includes(target.protocol)) {
      throw new Error("Only HTTP(S) URLs can be opened externally.");
    }

    await shell.openExternal(target.toString());
  });

  ipcMain.handle("chronos:update:check", () => checkNativeUpdate());
  ipcMain.handle("chronos:update:download", () => downloadNativeUpdate());
  ipcMain.handle("chronos:update:install", () => installNativeUpdate());
}

function createMainWindow() {
  const icon = resolveAssetPath("app-icon.png");
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 680,
    title: "Chronos",
    autoHideMenuBar: true,
    backgroundColor: "#f7f8f4",
    show: false,
    icon,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  registerZoomShortcuts(mainWindow);
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // 开发环境加载 Vite dev server；生产环境加载打包后的静态文件。
  if (isDevelopment) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // 安全边界：外部链接交给系统浏览器打开，避免在 Electron 壳里展示不受控页面。
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  registerDesktopIpc();
  Menu.setApplicationMenu(null);
  createMainWindow();
  setTimeout(() => {
    void checkNativeUpdate();
  }, 15_000);
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

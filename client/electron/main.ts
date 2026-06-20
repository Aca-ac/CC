import { app, BrowserWindow, ipcMain, Menu, shell, type WebContents } from "electron";
import { autoUpdater, type UpdateInfo } from "electron-updater";
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
    emitUpdateStatus({ state: "error", message: error.message });
  });

  return true;
}

async function checkNativeUpdate(): Promise<DesktopUpdateStatus> {
  if (!configureAutoUpdater()) {
    return { state: "unsupported", message: "Automatic updates require the Windows installer." };
  }

  emitUpdateStatus({ state: "checking" });
  await autoUpdater.checkForUpdates();
  return { state: "checking" };
}

async function downloadNativeUpdate(): Promise<DesktopUpdateStatus> {
  if (!configureAutoUpdater()) {
    return { state: "unsupported", message: "Automatic updates require the Windows installer." };
  }

  emitUpdateStatus({ state: "downloading", percent: 0 });
  await autoUpdater.downloadUpdate();
  return { state: "downloading", percent: 0 };
}

function installNativeUpdate(): DesktopUpdateStatus {
  if (!configureAutoUpdater()) {
    return { state: "unsupported", message: "Automatic updates require the Windows installer." };
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

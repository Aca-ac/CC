import { app, BrowserWindow, ipcMain, Menu, shell, type WebContents } from "electron";
import fs from "node:fs";
import path from "node:path";

const isDevelopment = !app.isPackaged;
const MIN_ZOOM_FACTOR = 0.75;
const MAX_ZOOM_FACTOR = 1.7;
const ZOOM_STEP = 0.1;

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

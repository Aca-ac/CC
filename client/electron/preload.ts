import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("chronosDesktop", {
  platform: process.platform,
  openExternal: (url: string) => ipcRenderer.invoke("chronos:open-external", url),
  updates: {
    check: () => ipcRenderer.invoke("chronos:update:check"),
    download: () => ipcRenderer.invoke("chronos:update:download"),
    install: () => ipcRenderer.invoke("chronos:update:install"),
    onStatus: (listener: (status: unknown) => void) => {
      const subscription = (_event: Electron.IpcRendererEvent, status: unknown) => listener(status);
      ipcRenderer.on("chronos:update-status", subscription);
      return () => ipcRenderer.removeListener("chronos:update-status", subscription);
    },
  },
  // 后续如需访问文件、系统通知或本地 SQLite，应在这里通过白名单 API 暴露，
  // 不要直接开启 nodeIntegration，避免前端页面获得过大的系统权限。
});

import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("chronosDesktop", {
  platform: process.platform,
  // 后续如需访问文件、系统通知或本地 SQLite，应在这里通过白名单 API 暴露，
  // 不要直接开启 nodeIntegration，避免前端页面获得过大的系统权限。
});


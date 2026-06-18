import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import fs from "node:fs";

const appBase = process.env.VITE_APP_BASE ?? "./";
const packageJson = JSON.parse(
  fs.readFileSync(new URL("./package.json", import.meta.url), "utf-8")
) as { version: string };

export default defineConfig({
  base: appBase,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifestFilename: "manifest.webmanifest",
      includeAssets: ["favicon.svg", "app-icon.ico", "app-icon.png"],
      manifest: {
        name: "Chronos 学习任务管理系统",
        short_name: "Chronos",
        description: "本地优先的学习项目、任务、日志和复盘管理工具。",
        theme_color: "#4F46E5",
        background_color: "#F7F7F5",
        display: "standalone",
        lang: "zh-CN",
        start_url: ".",
        scope: ".",
        icons: [
          {
            src: "icons/chronos-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "icons/chronos-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  server: {
    port: 5173,
    proxy: {
      // 前端开发时把 /api 转发到 Spring Boot，避免在页面代码里写死后端地址。
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});

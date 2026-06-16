import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const appBase = process.env.VITE_APP_BASE ?? "./";

export default defineConfig({
  base: appBase,
  plugins: [react()],
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

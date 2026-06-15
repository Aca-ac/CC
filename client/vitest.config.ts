import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/storage/__tests__/setup.ts"],
    pool: "threads",
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});

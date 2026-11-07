import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const proxyTarget = process.env.API_PROXY_TARGET;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: proxyTarget
      ? {
          "/api": { target: proxyTarget, changeOrigin: true },
          "/healthz": { target: proxyTarget, changeOrigin: true },
        }
      : undefined,
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test-setup.ts",
    globals: true,
  },
});

import { defineConfig, devices } from "@playwright/test";

const apiPort = process.env.E2E_API_PORT ?? "8080";
const webPort = process.env.E2E_WEB_PORT ?? "5173";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  workers: 1,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://127.0.0.1:${webPort}`,
    trace: "on-first-retry",
  },
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : [
        {
          command: "go run ./apps/api/cmd/server",
          url: `http://127.0.0.1:${apiPort}/healthz`,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: {
            ...process.env,
            APP_ENV: "development",
            API_PORT: apiPort,
            DATABASE_URL: process.env.E2E_DATABASE_URL ?? "",
            MIGRATIONS_PATH: "database/migrations",
            CORS_ORIGINS: `http://127.0.0.1:${webPort},http://localhost:${webPort}`,
            SESSION_SECRET: process.env.SESSION_SECRET ?? "local-e2e-session-secret-32chars-min",
            ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? "admin@triunder.local",
            ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "Triunder-admin-1",
            DEV_MAIL_LOG: "true",
            OPENAI_API_KEY: "",
          },
        },
        {
          command: `pnpm --filter @triunder/web exec vite --host 127.0.0.1 --port ${webPort}`,
          url: `http://127.0.0.1:${webPort}`,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: {
            ...process.env,
            API_PROXY_TARGET: `http://127.0.0.1:${apiPort}`,
            VITE_API_URL: "",
          },
        },
      ],
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});

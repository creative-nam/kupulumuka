import { defineConfig, devices } from "@playwright/test";

const e2ePort = process.env.PORT ?? "3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${e2ePort}`,
    trace: "on-first-retry",
  },
  webServer: {
    command: "npx tsx scripts/run-e2e-webserver.ts",
    url: `http://127.0.0.1:${e2ePort}`,
    env: { PORT: e2ePort },
    reuseExistingServer: false,
    timeout: 180000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

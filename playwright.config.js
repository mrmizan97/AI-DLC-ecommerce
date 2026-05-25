// Playwright config for multi-role e2e against the dev stack.
// Tests assume the frontend runs at FRONTEND_URL (default http://localhost:4001)
// and the API at API_URL (default http://localhost:4000).
//
// Run:
//   npx playwright install chromium   # once
//   npx playwright test               # run all
//   npx playwright test --ui          # watch mode
//   npx playwright show-report        # last run report

const { defineConfig, devices } = require("@playwright/test");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:4001";

module.exports = defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false, // we share state across specs (admin creates, customer consumes)
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: FRONTEND_URL,
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

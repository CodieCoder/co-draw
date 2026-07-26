import { resolve } from "node:path";

import {
  defineConfig,
  devices,
} from "@playwright/test";

const requiredEnvironment = (field: string): string => {
  const value = process.env[field];
  if (value === undefined || value === "") {
    throw new Error(`Required Playwright field ${field} is missing.`);
  }
  return value;
};

const runId = requiredEnvironment("VEGA_TEST_RUN_ID");
if (!/^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/u.test(runId)) {
  throw new Error("Playwright run ID is invalid.");
}

const outputRoot = resolve("reports/playwright", runId);

export default defineConfig({
  testDir: "tests/browser",
  outputDir: resolve(outputRoot, "results"),
  fullyParallel: false,
  forbidOnly: true,
  failOnFlakyTests: true,
  retries: 0,
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: [
    ["line"],
    [
      "html",
      {
        open: "never",
        outputFolder: resolve(outputRoot, "html"),
      },
    ],
  ],
  use: {
    baseURL: requiredEnvironment("VEGA_TEST_WEB_BASE_URL"),
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});

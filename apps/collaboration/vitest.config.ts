import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "@vega/collaboration",
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      include: ["src/health.ts"],
    },
  },
});

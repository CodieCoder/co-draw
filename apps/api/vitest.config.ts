import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "@vega/api",
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      include: [
        "src/dependency-lifecycle.ts",
        "src/health.controller.ts",
        "src/storage-readiness.ts",
      ],
    },
  },
});

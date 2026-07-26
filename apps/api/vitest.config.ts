import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "@vega/api",
    globals: false,
    environment: "node",
    include: ["src/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      include: [
        "src/dependency-lifecycle.ts",
        "src/health.controller.ts",
        "src/storage-readiness.ts",
      ],
    },
  },
});

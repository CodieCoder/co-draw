import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "@vega/database",
    globals: false,
    environment: "node",
    include: ["src/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/migrate.ts", "src/migrate-status.ts"],
    },
  },
});

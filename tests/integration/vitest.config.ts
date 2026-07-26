import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "service-integration",
    globals: false,
    environment: "node",
    include: ["tests/integration/**/*.integration.test.ts"],
    fileParallelism: false,
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
  },
});

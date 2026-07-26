import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    name: "@vega/web",
    globals: false,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx", "src/main.tsx", "src/canvas-test-api/hook.ts"],
    },
  },
});

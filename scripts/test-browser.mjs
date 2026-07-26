import {
  withIsolatedTestStack,
} from "./testing/isolated-stack.mjs";

const runPlaywright = (stack, extraEnv = {}) =>
  stack.runPublic(
    "corepack",
    [
      "pnpm",
      "exec",
      "playwright",
      "test",
      "--config",
      "playwright.config.ts",
    ],
    "Chromium browser smoke",
    [0],
    "inherit",
    extraEnv,
  );

await withIsolatedTestStack(
  { suite: "browser" },
  async (stack) => {
    await stack.build();

    // Phase 1 — production build with test-API enablement requested
    {
      process.stdout.write("--- Phase 1: Production build, API absent ---\n");
      await stack.startInfrastructure();
      await stack.initializeInfrastructure();
      await stack.migrate();
      await stack.migrateStatus();

      // Build web in normal production mode with the env var set.
      // The config validation will allow it (non-production profile),
      // but the Vite production gate will omit the test API.
      await stack.run(
        "corepack",
        [
          "pnpm",
          "--filter",
          "@vega/web",
          "exec",
          "vite",
          "build",
        ],
        "production web build with test API env",
        [0],
        "inherit",
        { VITE_CANVAS_TEST_API_ENABLED: "true" },
      );

      await stack.startApplications({ web: true });

      await runPlaywright(stack, {
        VEGA_TEST_PHASE: "production",
        VEGA_TEST_EXPECT_API_PRESENT: "false",
      });

      // Stop application processes for the next phase.
      await stack.stopApplications();
    }

    // Phase 2 — test-mode build with explicit enablement
    {
      process.stdout.write("--- Phase 2: Test mode build, API present ---\n");
      await stack.run(
        "corepack",
        [
          "pnpm",
          "--filter",
          "@vega/web",
          "exec",
          "vite",
          "build",
          "--mode",
          "test",
        ],
        "test-mode web build with test API enabled",
        [0],
        "inherit",
        { VITE_CANVAS_TEST_API_ENABLED: "true" },
      );

      // Start only the web application preview. Infrastructure is still running.
      await stack.startApplications({ web: true });

      await runPlaywright(stack, {
        VEGA_TEST_PHASE: "test-mode",
        VEGA_TEST_EXPECT_API_PRESENT: "true",
      });
    }

    // Static production bundle verification
    {
      process.stdout.write("--- Phase 3: Static bundle verification ---\n");
      // Rebuild in production mode (no env var) for bundle scanning.
      await stack.run(
        "corepack",
        [
          "pnpm",
          "--filter",
          "@vega/web",
          "exec",
          "vite",
          "build",
        ],
        "production web build for bundle scan",
      );
      await stack.run(
        "corepack",
        ["pnpm", "exec", "tsx", "scripts/verify-bundle.mjs"],
        "static bundle verification",
      );
    }
  },
);

process.stdout.write(
  "Two-phase Chromium browser smoke with test API verification passed.\n",
);

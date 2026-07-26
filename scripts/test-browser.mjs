import {
  withIsolatedTestStack,
} from "./testing/isolated-stack.mjs";

await withIsolatedTestStack(
  { suite: "browser" },
  async (stack) => {
    await stack.build();
    await stack.startInfrastructure();
    await stack.initializeInfrastructure();
    await stack.migrate();
    await stack.migrateStatus();
    await stack.startApplications({ web: true });
    await stack.runPublic(
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
    );
  },
);

process.stdout.write(
  "Three-context Chromium browser smoke passed.\n",
);

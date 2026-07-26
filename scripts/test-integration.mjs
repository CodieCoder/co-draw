import { join } from "node:path";

import {
  withIsolatedTestStack,
} from "./testing/isolated-stack.mjs";
import { repositoryRoot } from "./local-environment.mjs";

await withIsolatedTestStack(
  { suite: "service" },
  async (stack) => {
    await stack.run(
      process.execPath,
      [join(repositoryRoot, "scripts/test-harness-cleanup.mjs")],
      "isolated cleanup probes",
    );
    await stack.build();
    await stack.startInfrastructure();
    await stack.initializeInfrastructure();
    await stack.migrate();
    await stack.migrateStatus();
    await stack.startApplications();
    await stack.runPublic(
      "corepack",
      [
        "pnpm",
        "exec",
        "vitest",
        "run",
        "--config",
        "tests/integration/vitest.config.ts",
      ],
      "isolated service integration suite",
    );
  },
);

process.stdout.write(
  "General isolated service integration checks passed.\n",
);

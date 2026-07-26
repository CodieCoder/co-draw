import { withIsolatedTestStack } from "./isolated-stack.mjs";

const mode = process.argv[2];
if (!["signal", "throw"].includes(mode)) {
  throw new Error("Cleanup probe mode must be signal or throw.");
}

await withIsolatedTestStack(
  { suite: `cleanup-${mode}` },
  async (stack) => {
    await stack.startInfrastructure();
    process.stdout.write(
      `VEGA_TEST_STACK_READY ${stack.projectName}\n`,
    );

    if (mode === "throw") {
      throw new Error("Expected cleanup probe failure.");
    }

    await new Promise(() => {
      // Keep one handle alive until the parent sends SIGTERM.
      setInterval(() => undefined, 1_000);
    });
  },
);

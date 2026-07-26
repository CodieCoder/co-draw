import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

const run = (executable, args, label) =>
  new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} exited with code ${code}`));
    });
    child.once("error", reject);
  });

try {
  process.stdout.write(
    "verify:foundation — Fast build, lint, typecheck, and unit gate...\n",
  );
  await run("corepack", ["pnpm", "check"], "check");

  process.stdout.write("verify:foundation — Unit coverage...\n");
  await run("corepack", ["pnpm", "test:coverage"], "test:coverage");

  process.stdout.write(
    "verify:foundation — Isolated foundation regression suite...\n",
  );
  await run(
    "corepack",
    ["pnpm", "test:integration:foundation"],
    "test:integration:foundation",
  );

  process.stdout.write(
    "verify:foundation — Isolated general service integration suite...\n",
  );
  await run(
    "corepack",
    ["pnpm", "test:integration"],
    "test:integration",
  );

  process.stdout.write(
    "verify:foundation — Chromium browser smoke and test-API boundary...\n",
  );
  await run("corepack", ["pnpm", "test:browser"], "test:browser");

  process.stdout.write(
    "verify:foundation — Production-shaped bundle verification...\n",
  );
  await run(
    process.execPath,
    ["scripts/verify-production.mjs"],
    "verify:production",
  );

  process.stdout.write("verify:foundation — Bundle reporting...\n");
  await run("corepack", ["pnpm", "bundle:report"], "bundle:report");

  process.stdout.write(
    "verify:foundation — Lighthouse performance and accessibility gates...\n",
  );
  await run(
    "corepack",
    ["pnpm", "performance:web"],
    "performance:web",
  );

  process.stdout.write(
    "verify:foundation — Documentation consistency...\n",
  );
  await run("corepack", ["pnpm", "docs:check"], "docs:check");

  process.stdout.write(
    "verify:foundation passed — every mandatory Stage 0 gate passed.\n",
  );
} catch (error) {
  process.stderr.write(
    `verify:foundation failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
}

import { spawn } from "node:child_process";
import {
  commandEnvironment,
  loadLocalEnvironment,
  repositoryRoot,
} from "./local-environment.mjs";

const localEnvironment = loadLocalEnvironment();
const environment = {
  ...commandEnvironment(localEnvironment),
  NODE_ENV: process.env["NODE_ENV"] ?? "development",
};

const run = (executable, args, label) =>
  new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: repositoryRoot,
      stdio: "inherit",
      env: environment,
    });
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} exited with code ${code}`));
    });
    child.once("error", reject);
  });

try {
  process.stdout.write("verify:local — Checking migration status...\n");
  await run(
    "corepack",
    ["pnpm", "exec", "tsx", "packages/database/src/migrate-status.ts"],
    "db:migrate:status",
  );

  process.stdout.write("verify:local — Checking infrastructure readiness...\n");
  await run(
    "corepack",
    ["pnpm", "exec", "tsx", "apps/api/src/infra-check.ts"],
    "infra:check",
  );

  process.stdout.write(
    "verify:local — Running application shell smoke checks...\n",
  );
  await run(
    process.execPath,
    ["scripts/smoke-apps.mjs"],
    "smoke:apps",
  );

  process.stdout.write(
    "verify:local passed — migrations, infrastructure, and application shells verified.\n",
  );
} catch (error) {
  process.stderr.write(
    `verify:local failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
}

/**
 * dev — Start the three application processes through Turbo after verifying
 * local infrastructure and migrations are ready.
 *
 * 1. Loads .env.local.
 * 2. Checks that MIGRATION_DATABASE_URL is not a CHANGE_ME placeholder.
 * 3. Runs migration status (db:migrate:status).
 * 4. Runs infrastructure readiness check (infra:check).
 * 5. Invokes Turbo dev through corepack pnpm exec.
 */
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
  // 1. Migration status check
  process.stdout.write("dev: Checking migration status...\n");
  await run(
    "corepack",
    ["pnpm", "exec", "tsx", "packages/database/src/migrate-status.ts"],
    "db:migrate:status",
  );

  // 2. Infrastructure readiness check
  process.stdout.write("dev: Running infrastructure readiness check...\n");
  await run(
    "corepack",
    ["pnpm", "exec", "tsx", "apps/api/src/infra-check.ts"],
    "infra:check",
  );

  // 3. Start the three application processes through Turbo
  process.stdout.write("dev: Starting application processes via Turbo...\n");
  const turboProcess = spawn(
    "corepack",
    ["pnpm", "exec", "turbo", "run", "dev"],
    {
      cwd: repositoryRoot,
      stdio: "inherit",
      env: environment,
    },
  );

  turboProcess.once("exit", (code) => process.exit(code ?? 0));
  turboProcess.once("error", (error) => {
    process.stderr.write(`dev: turbo failed: ${error.message}\n`);
    process.exit(1);
  });
} catch (error) {
  process.stderr.write(
    `dev failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
}

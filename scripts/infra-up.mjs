/**
 * infra:up — Start local PostgreSQL and private object-storage infrastructure.
 *
 * 1. Loads .env.local as the canonical configuration.
 * 2. Rejects placeholder values (CHANGE_ME, angle-bracket, your-* patterns).
 * 3. Starts postgres and minio services via Compose.
 * 4. Waits for container health checks to pass.
 * 5. Runs one-shot init containers with docker compose run --rm --no-deps.
 * 6. Requires zero exit status on every run.
 */
import { spawn } from "node:child_process";
import {
  commandEnvironment,
  composeArguments,
  loadLocalEnvironment,
  repositoryRoot,
} from "./local-environment.mjs";

const localEnvironment = loadLocalEnvironment();
const environment = commandEnvironment(localEnvironment);

/**
 * Run a docker compose subcommand, inheriting stdio, and return a promise.
 */
const runCompose = (args, label) =>
  new Promise((resolve, reject) => {
    const child = spawn("docker", composeArguments(...args), {
      cwd: repositoryRoot,
      env: environment,
      stdio: "inherit",
    });
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} exited with code ${code}`));
    });
    child.once("error", reject);
  });

/**
 * Wait for a service to report "healthy" in `docker compose ps`.
 */
const waitForHealthy = async (service, timeoutMs) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await new Promise((resolve, reject) => {
      const child = spawn(
        "docker",
        composeArguments("ps", "--format", "json", service),
        { cwd: repositoryRoot, env: environment },
      );
      let output = "";
      child.stdout?.on("data", (d) => {
        output += d.toString();
      });
      child.once("exit", (code) => {
        if (code === 0) resolve(output.trim());
        else reject(new Error(`ps exited with code ${code}`));
      });
      child.once("error", reject);
    });

    if (result) {
      try {
        const parsed = JSON.parse(result);
        const entries = Array.isArray(parsed) ? parsed : [parsed];
        const info = entries[0];
        if (info?.Health === "healthy") {
          process.stdout.write(`  ${service} is healthy.\n`);
          return;
        }
        process.stdout.write(
          `  ${service} status: ${info.Health ?? "starting"}...\n`,
        );
      } catch {
        process.stdout.write(`  ${service} is starting...\n`);
      }
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }
  throw new Error(`${service} did not become healthy within ${timeoutMs}ms.`);
};

try {
  process.stdout.write("Starting local infrastructure...\n");

  // Start PostgreSQL and MinIO service containers.
  await runCompose(["up", "--detach", "postgres", "minio"], "infra:up (services)");

  process.stdout.write("Infrastructure started. Verifying health...\n");
  await waitForHealthy("postgres", 30_000);
  await waitForHealthy("minio", 30_000);

  // Run one-shot initialisation containers.
  process.stdout.write("Initialising PostgreSQL runtime roles...\n");
  await runCompose(["run", "--rm", "--no-deps", "postgres-init"], "postgres-init");

  process.stdout.write("Initialising MinIO bucket and policy...\n");
  await runCompose(["run", "--rm", "--no-deps", "minio-init"], "minio-init");

  process.stdout.write(
    "Local infrastructure is ready. Run `corepack pnpm db:migrate` to apply migrations.\n",
  );
} catch (error) {
  process.stderr.write(
    `infra:up failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
}

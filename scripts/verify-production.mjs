import { spawn } from "node:child_process";
import { join } from "node:path";
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
    "verify:production — Building web for production...\n",
  );
  await run(
    "corepack",
    [
      "pnpm",
      "--filter",
      "@vega/web",
      "exec",
      "vite",
      "build",
    ],
    "production web build",
  );

  process.stdout.write(
    "verify:production — Scanning production bundle for test API leakage...\n",
  );
  await run(
    process.execPath,
    [join(root, "scripts/verify-bundle.mjs")],
    "static bundle verification",
  );

  process.stdout.write(
    "verify:production passed — production bundle is free of test API and server secrets.\n",
  );
} catch (error) {
  process.stderr.write(
    `verify:production failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
}

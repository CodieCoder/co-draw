import { spawn } from "node:child_process";
import { copyFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = fileURLToPath(new URL("../", import.meta.url));
const tempDir = resolve(
  tmpdir(),
  `vega-clean-verify-${String(process.pid)}`,
);

let removed = false;
let childResult = 0;

const removeTempDir = async () => {
  if (removed) return;
  removed = true;
  try {
    await rm(tempDir, { recursive: true, force: true, maxRetries: 2 });
  } catch {
    process.stderr.write(
      `verify:clean — could not remove temporary source at ${tempDir}\n`,
    );
  }
};

process.once("SIGINT", async () => {
  process.stderr.write("verify:clean — received SIGINT, cleaning up...\n");
  await removeTempDir();
  process.exit(1);
});

process.once("SIGTERM", async () => {
  process.stderr.write("verify:clean — received SIGTERM, cleaning up...\n");
  await removeTempDir();
  process.exit(1);
});

const run = (executable, args, label, workdir = root) =>
  new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: workdir,
      stdio: "inherit",
      env: process.env,
    });
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} exited with code ${code}`));
    });
    child.once("error", reject);
  });

const collectTrackedFiles = async () => {
  const files = [];
  const child = spawn("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    output += chunk;
  });
  await new Promise((resolve, reject) => {
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`git ls-files exited with code ${code}`));
    });
    child.once("error", reject);
  });
  for (const entry of output.split("\0")) {
    const trimmed = entry.trim();
    if (trimmed.length > 0) files.push(trimmed);
  }
  return files;
};

try {
  await run("corepack", ["pnpm", "install", "--frozen-lockfile"], "frozen install");

  process.stdout.write(
    `verify:clean — Collecting Git-tracked source files...\n`,
  );
  const files = await collectTrackedFiles();
  process.stdout.write(
    `verify:clean — Found ${files.length} tracked files.\n`,
  );

  process.stdout.write(
    `verify:clean — Copying source to ${tempDir}...\n`,
  );
  await mkdir(tempDir, { recursive: true });
  for (const file of files) {
    const dest = resolve(tempDir, file);
    const destDir = resolve(dest, "..");
    await mkdir(destDir, { recursive: true });
    await copyFile(resolve(root, file), dest);
  }

  process.stdout.write(
    "verify:clean — Running frozen install in temporary source...\n",
  );
  await run(
    "corepack",
    ["pnpm", "install", "--frozen-lockfile"],
    "frozen install (temp)",
    tempDir,
  );

  process.stdout.write(
    "verify:clean — Running verify:foundation in temporary source...\n",
  );
  await run(
    "corepack",
    ["pnpm", "verify:foundation"],
    "verify:foundation (temp)",
    tempDir,
  );

  process.stdout.write(
    "verify:clean passed — clean source installs and verifies successfully.\n",
  );
} catch (error) {
  childResult = 1;
  process.stderr.write(
    `verify:clean failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
} finally {
  await removeTempDir();
  process.exit(childResult);
}

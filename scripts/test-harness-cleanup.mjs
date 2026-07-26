import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { join } from "node:path";

import {
  assertNoDockerResources,
  cleanupDockerResourcesByLabel,
  createIsolatedTestStack,
} from "./testing/isolated-stack.mjs";
import { repositoryRoot } from "./local-environment.mjs";

const READY_PATTERN =
  /^VEGA_TEST_STACK_READY (vega-canvas-it-\d+-[a-f0-9]{8})$/mu;

const runProbe = (mode, expectedExitCode) =>
  new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        join(
          repositoryRoot,
          "scripts/testing/cleanup-probe.mjs",
        ),
        mode,
      ],
      {
        cwd: repositoryRoot,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let stdout = "";
    let stderr = "";
    let projectName;
    let signalSent = false;
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Cleanup ${mode} probe timed out.`));
    }, 90_000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      const match = READY_PATTERN.exec(stdout);
      if (match?.[1] !== undefined && projectName === undefined) {
        projectName = match[1];
        if (mode === "signal" && !signalSent) {
          signalSent = true;
          child.kill("SIGTERM");
        }
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("exit", async (code) => {
      clearTimeout(timeout);
      if (projectName === undefined) {
        reject(
          new Error(
            `Cleanup ${mode} probe did not report its scoped project.`,
          ),
        );
        return;
      }
      if (code !== expectedExitCode) {
        reject(
          new Error(
            `Cleanup ${mode} probe exited with ${code ?? 1}: ${stderr.trim()}`,
          ),
        );
        return;
      }

      try {
        await assertNoDockerResources(projectName);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });

await assert.rejects(
  cleanupDockerResourcesByLabel("vegait-hackerton"),
  /unsafe test project name/u,
);

const manualRecoveryStack = await createIsolatedTestStack({
  suite: "cleanup-manual",
});
try {
  await cleanupDockerResourcesByLabel(manualRecoveryStack.projectName);
  await assert.rejects(
    access(manualRecoveryStack.temporaryDirectory),
    (error) =>
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT",
  );
} finally {
  await manualRecoveryStack.cleanup();
}

await runProbe("throw", 1);
await runProbe("signal", 143);
process.stdout.write(
  "Isolated cleanup probes passed for manual, exception, and SIGTERM paths.\n",
);

/**
 * infra:down — Stop local infrastructure, preserving named data volumes.
 */
import { spawn } from "node:child_process";
import {
  commandEnvironment,
  composeArguments,
  loadLocalEnvironment,
  repositoryRoot,
} from "./local-environment.mjs";

const localEnvironment = loadLocalEnvironment();
const child = spawn("docker", composeArguments("down"), {
  cwd: repositoryRoot,
  env: commandEnvironment(localEnvironment),
  stdio: "inherit",
});

child.once("exit", (code) => {
  if (code === 0) {
    process.stdout.write("Local infrastructure stopped. Data volumes preserved.\n");
    process.exit(0);
  }
  process.exit(code ?? 1);
});

child.once("error", (error) => {
  process.stderr.write(`infra:down failed: ${error.message}\n`);
  process.exit(1);
});

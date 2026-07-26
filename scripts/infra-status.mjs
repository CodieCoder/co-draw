/**
 * infra:status — Report bounded service health state without credentials.
 */
import { spawn } from "node:child_process";
import {
  commandEnvironment,
  composeArguments,
  loadLocalEnvironment,
  repositoryRoot,
} from "./local-environment.mjs";

const localEnvironment = loadLocalEnvironment();
const child = spawn("docker", composeArguments("ps", "--format", "table"), {
  cwd: repositoryRoot,
  env: commandEnvironment(localEnvironment),
  stdio: "inherit",
});

child.once("exit", (code) => process.exit(code ?? 0));
child.once("error", (error) => {
  process.stderr.write(`infra:status failed: ${error.message}\n`);
  process.exit(1);
});

import {
  cleanupDockerResourcesByLabel,
} from "./testing/isolated-stack.mjs";

const projectName = process.argv[2];
if (projectName === undefined || process.argv.length !== 3) {
  throw new Error(
    "Provide exactly one printed vega-canvas-it-<pid>-<suffix> project name.",
  );
}

await cleanupDockerResourcesByLabel(projectName);
process.stdout.write(
  `Removed exact orphaned test project ${projectName}.\n`,
);

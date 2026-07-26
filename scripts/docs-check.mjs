import { existsSync, readFileSync, statSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const markdownFiles = [];

const collectMarkdown = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (
        entry.isDirectory() &&
        ![".git", "node_modules", "resources"].includes(entry.name)
      ) {
        await collectMarkdown(path);
      } else if (entry.isFile() && extname(entry.name) === ".md") {
        markdownFiles.push(path);
      }
    }),
  );
};

await collectMarkdown(root);

const errors = [];

// 1. Relative link resolution
const linkPattern = /!?\[[^\]]*\]\(([^)]+)\)/gu;

for (const file of markdownFiles) {
  const content = await readFile(file, "utf8");
  for (const match of content.matchAll(linkPattern)) {
    const rawTarget = match[1]?.trim().replace(/^<|>$/gu, "");
    if (
      rawTarget === undefined ||
      rawTarget === "" ||
      rawTarget.startsWith("#") ||
      /^(?:https?:|mailto:)/u.test(rawTarget)
    ) {
      continue;
    }

    const decodedTarget = decodeURIComponent(
      rawTarget.split("#", 1)[0].split("?", 1)[0],
    );
    const target = decodedTarget.startsWith("/")
      ? resolve(root, `.${decodedTarget}`)
      : resolve(dirname(file), decodedTarget);
    const resolvedTarget =
      existsSync(target) && statSync(target).isDirectory()
        ? join(target, "README.md")
        : target;

    if (!existsSync(resolvedTarget)) {
      errors.push(
        `${file.slice(root.length)} -> ${rawTarget}`,
      );
    }
  }
}

// 2. Version-pin consistency
const nvmrc = readFileSync(join(root, ".nvmrc"), "utf8").trim();
const nodeVersion = readFileSync(join(root, ".node-version"), "utf8").trim();
const packageJson = JSON.parse(
  readFileSync(join(root, "package.json"), "utf8"),
);
const pinnedNode = packageJson.engines?.node;
const pinnedPnpm = packageJson.engines?.pnpm;
const packageManager = packageJson.packageManager;

if (nvmrc !== nodeVersion) {
  errors.push(
    `.nvmrc (${nvmrc}) does not match .node-version (${nodeVersion})`,
  );
}
if (nvmrc !== pinnedNode) {
  errors.push(
    `.nvmrc (${nvmrc}) does not match package.json engines.node (${pinnedNode})`,
  );
}
if (!packageManager || !packageManager.startsWith("pnpm@")) {
  errors.push("packageManager in package.json must be pnpm");
}
const pnpmVersion = packageManager?.replace(/^pnpm@/u, "");
if (pnpmVersion !== pinnedPnpm) {
  errors.push(
    `packageManager (${packageManager}) does not match engines.pnpm (${pinnedPnpm})`,
  );
}

// 3. Root command catalog consistency
const canonicalCommands = [
  "dev",
  "infra:up",
  "infra:down",
  "infra:status",
  "db:migrate",
  "db:migrate:status",
  "infra:check",
  "test:integration",
  "test:integration:foundation",
  "test:browser",
  "test:cleanup",
  "build",
  "typecheck",
  "lint",
  "test",
  "test:unit",
  "test:coverage",
  "check",
  "smoke:apps",
  "bundle:report",
  "performance:web",
  "docs:check",
  "verify:local",
  "verify:production",
  "verify:foundation",
  "verify:clean",
];

for (const command of canonicalCommands) {
  if (!packageJson.scripts[command]) {
    errors.push(
      `Canonical root command "${command}" is missing from package.json scripts`,
    );
  }
}

// 4. README must reference every canonical command
const readme = await readFile(join(root, "README.md"), "utf8");
for (const command of canonicalCommands) {
  if (!readme.includes(command)) {
    errors.push(`README.md does not reference command "${command}"`);
  }
}

// 5. Task-plan index and numbering
const planIndexContent = await readFile(
  join(root, "docs/planning/plans/README.md"),
  "utf8",
);

const expectedPlans = [
  "0001-stage-0a-monorepo-scaffold-and-executable-contracts.md",
  "0002-stage-0b-local-persistence-infrastructure-and-readiness.md",
  "0003-stage-0b-review-remediation.md",
  "0004-stage-0c-general-testing-foundation.md",
  "0005-stage-0d-non-production-canvas-test-api.md",
  "0006-stage-0e-clean-environment-onboarding-and-ci.md",
];

for (const plan of expectedPlans) {
  if (!planIndexContent.includes(`./${plan}`)) {
    errors.push(`Task-plan index is missing ${plan}`);
  }
}

const planIndexLines = planIndexContent.split("\n");
const planRows = planIndexLines.filter(
  (line) => line.match(/^\|\s+[0-9]{4}\s+\|/) !== null,
);
const indexedNumbers = [];
for (const row of planRows) {
  const match = row.match(/^\|\s+([0-9]{4})\s+/u);
  if (match) indexedNumbers.push(Number.parseInt(match[1], 10));
}
for (let i = 0; i < indexedNumbers.length; i++) {
  if (indexedNumbers[i] !== i + 1) {
    errors.push(
      `Task-plan index row ${i + 1} has number ${String(indexedNumbers[i]).padStart(4, "0")}, expected ${String(i + 1).padStart(4, "0")}`,
    );
  }
}

// 6. Planning index must delegate to task-plan index
const planningIndex = await readFile(
  join(root, "docs/planning/README.md"),
  "utf8",
);
if (!planningIndex.includes("./plans/README.md")) {
  errors.push(
    "docs/planning/README.md must delegate task-plan mapping to ./plans/README.md",
  );
}

// 8. Corepack pnpm must appear in onboarding documentation
for (const [label, path] of [
  ["README.md", join(root, "README.md")],
  ["CONTRIBUTING.md", join(root, "CONTRIBUTING.md")],
]) {
  if (!existsSync(path)) continue;
  const content = await readFile(path, "utf8");
  if (!content.includes("corepack pnpm")) {
    errors.push(`${label} does not reference corepack pnpm`);
  }
}

// 9. CI workflow must use frozen-install and verify:foundation
const workflowPath = join(root, ".github/workflows/foundation.yml");
if (existsSync(workflowPath)) {
  const workflowContent = await readFile(workflowPath, "utf8");
  if (!workflowContent.includes("verify:foundation")) {
    errors.push(
      "GitHub Actions workflow does not invoke verify:foundation",
    );
  }
  if (!workflowContent.includes("--frozen-lockfile")) {
    errors.push(
      "GitHub Actions workflow does not use --frozen-lockfile",
    );
  }
  if (
    /(?<!\w)npm\s+install\b/u.test(workflowContent) ||
    /(?<!\w)yarn\s/u.test(workflowContent) ||
    /(?<!\w)bun\s/u.test(workflowContent)
  ) {
    errors.push(
      "GitHub Actions workflow contains a forbidden package-manager instruction",
    );
  }
}

if (errors.length > 0) {
  throw new Error(
    `Documentation verification failed:\n- ${errors.join("\n- ")}`,
  );
}

process.stdout.write(
  `Documentation verification passed for ${markdownFiles.length} Markdown files.\n`,
);

import { existsSync, statSync } from "node:fs";
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

const missingLinks = [];
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
      missingLinks.push(
        `${fileURLToPath(new URL(`file://${file}`)).slice(root.length)} -> ${rawTarget}`,
      );
    }
  }
}

const planningIndex = await readFile(
  join(root, "docs/planning/README.md"),
  "utf8",
);
if (!planningIndex.includes("./plans/README.md")) {
  missingLinks.push(
    "docs/planning/README.md must delegate task-plan mapping to ./plans/README.md",
  );
}

const taskPlanIndex = await readFile(
  join(root, "docs/planning/plans/README.md"),
  "utf8",
);
if (
  !taskPlanIndex.includes(
    "./0001-stage-0a-monorepo-scaffold-and-executable-contracts.md",
  )
) {
  missingLinks.push("The Stage 0A plan is absent from the task-plan index.");
}

if (missingLinks.length > 0) {
  throw new Error(
    `Documentation verification failed:\n- ${missingLinks.join("\n- ")}`,
  );
}

process.stdout.write(
  `Documentation verification passed for ${markdownFiles.length} Markdown files.\n`,
);

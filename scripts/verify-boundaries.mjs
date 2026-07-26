import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const expectedApplications = new Set([
  "@vega/api",
  "@vega/collaboration",
  "@vega/web",
]);
const expectedPackages = new Set([
  "@vega/auth",
  "@vega/canvas-extensions",
  "@vega/collaboration-schema",
  "@vega/config",
  "@vega/contracts",
  "@vega/database",
  "@vega/eslint-config",
  "@vega/excalidraw-adapter",
  "@vega/test-utils",
  "@vega/typescript-config",
]);

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

const workspaceNames = async (directory) => {
  const entries = await readdir(join(root, directory), {
    withFileTypes: true,
  });
  return Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const manifest = await readJson(
          join(root, directory, entry.name, "package.json"),
        );
        if (manifest.private !== true) {
          throw new Error(`${manifest.name} must remain private.`);
        }
        if (
          typeof manifest.name !== "string" ||
          !manifest.name.startsWith("@vega/")
        ) {
          throw new Error(
            `${directory}/${entry.name}/package.json must use the @vega namespace.`,
          );
        }
        for (const section of [
          "dependencies",
          "devDependencies",
          "optionalDependencies",
        ]) {
          for (const [dependency, specifier] of Object.entries(
            manifest[section] ?? {},
          )) {
            const validSpecifier = dependency.startsWith("@vega/")
              ? specifier === "workspace:*"
              : specifier === "catalog:";
            if (!validSpecifier) {
              throw new Error(
                `${manifest.name} ${section}.${dependency} bypasses the workspace catalog.`,
              );
            }
          }
        }
        return manifest.name;
      }),
  );
};

const compareSets = (actual, expected, label) => {
  const missing = [...expected].filter((name) => !actual.has(name));
  const unexpected = [...actual].filter((name) => !expected.has(name));
  if (missing.length > 0 || unexpected.length > 0) {
    throw new Error(
      `${label} boundary mismatch: missing=${missing.join(",") || "none"}; unexpected=${unexpected.join(",") || "none"}`,
    );
  }
};

const sourceFiles = async (directory) => {
  const found = [];
  const visit = async (current) => {
    const entries = await readdir(current, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const path = join(current, entry.name);
        if (
          entry.isDirectory() &&
          !["dist", "coverage", "node_modules"].includes(entry.name)
        ) {
          await visit(path);
        } else if (
          entry.isFile() &&
          /\.(?:[cm]?[jt]sx?)$/u.test(entry.name)
        ) {
          found.push(path);
        }
      }),
    );
  };
  await visit(join(root, directory));
  return found;
};

const applicationNames = new Set(await workspaceNames("apps"));
const packageNames = new Set(await workspaceNames("packages"));
compareSets(applicationNames, expectedApplications, "Application");
compareSets(packageNames, expectedPackages, "Package");

const rootManifest = await readJson(join(root, "package.json"));
if (rootManifest.private !== true) {
  throw new Error("The root workspace must remain private.");
}
for (const [dependency, specifier] of Object.entries(
  rootManifest.devDependencies ?? {},
)) {
  const validSpecifier = dependency.startsWith("@vega/")
    ? specifier === "workspace:*"
    : specifier === "catalog:";
  if (!validSpecifier) {
    throw new Error(
      `Root devDependencies.${dependency} bypasses the workspace catalog.`,
    );
  }
}

const files = [
  ...(await sourceFiles("apps")),
  ...(await sourceFiles("packages")),
];
const violations = [];

for (const path of files) {
  const source = await readFile(path, "utf8");
  const workspacePath = relative(root, path);
  const isTest = /\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(path);
  const isAdapter = workspacePath.startsWith("packages/excalidraw-adapter/");
  const isTestUtilities = workspacePath.startsWith("packages/test-utils/");

  if (
    !isAdapter &&
    /(?:from\s+|import\s*\()"@excalidraw\/|(?:from\s+|import\s*\()'@excalidraw\//u.test(
      source,
    )
  ) {
    violations.push(`${workspacePath}: Excalidraw import outside adapter`);
  }

  if (
    !isTest &&
    !isTestUtilities &&
    /(?:from\s+|import\s*\()"@vega\/test-utils|(?:from\s+|import\s*\()'@vega\/test-utils/u.test(
      source,
    )
  ) {
    violations.push(`${workspacePath}: test utilities imported by production`);
  }

  if (
    workspacePath.startsWith("apps/web/") &&
    /@vega\/config\/(?:api|collaboration)/u.test(source)
  ) {
    violations.push(`${workspacePath}: server configuration entered web`);
  }

  if (
    !isAdapter &&
    /\b(?:CanvasScene|CompleteScene|SceneElementStore)\b/u.test(source)
  ) {
    violations.push(`${workspacePath}: possible second canvas scene model`);
  }

  if (
    !isTest &&
    workspacePath.startsWith("apps/") &&
    /\bguestEmail\b/u.test(source)
  ) {
    violations.push(`${workspacePath}: private guest email in application shell`);
  }
}

const configManifest = await readJson(
  join(root, "packages/config/package.json"),
);
if (Object.hasOwn(configManifest.exports, ".")) {
  violations.push(
    "packages/config/package.json: root export would let server config enter web",
  );
}

const adapterManifest = await readJson(
  join(root, "packages/excalidraw-adapter/package.json"),
);
if (
  adapterManifest.dependencies?.["@excalidraw/excalidraw"] !== "catalog:"
) {
  violations.push(
    "packages/excalidraw-adapter/package.json: Excalidraw is not catalog-pinned",
  );
}

if (violations.length > 0) {
  throw new Error(`Boundary verification failed:\n- ${violations.join("\n- ")}`);
}

process.stdout.write(
  `Boundary verification passed: ${applicationNames.size} applications, ${packageNames.size} packages.\n`,
);

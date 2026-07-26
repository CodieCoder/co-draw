import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const distDir = join(root, "apps/web/dist");
const assetDir = join(distDir, "assets");

const assets = readdirSync(assetDir).filter(
  (name) => name.endsWith(".js") || name.endsWith(".js.map") || name.endsWith(".html"),
);

const forbiddenPatterns = [
  "__CANVAS_TEST_API__",
];

const violations = [];

for (const asset of assets) {
  const content = readFileSync(join(assetDir, asset), "utf8");

  if (asset.endsWith(".js.map")) {
    const parsed = JSON.parse(content);
    const sources = parsed.sources ?? [];

    for (const [index, source] of sources.entries()) {
      if (source.includes("canvas-test-api")) {
        if (
          source.includes("hook") ||
          source.includes("initializer") ||
          source.includes("types")
        ) {
          violations.push(
            `${asset}: source map includes canvas-test-api module source at index ${index}: ${source}`,
          );
        }
      }
    }
    continue;
  }

  for (const pattern of forbiddenPatterns) {
    if (content.includes(pattern)) {
      violations.push(`${asset}: contains forbidden pattern "${pattern}"`);
    }
  }
}

const htmlPath = join(distDir, "index.html");
if (readFileSync(htmlPath, "utf8").includes("__CANVAS_TEST_API__")) {
  violations.push("index.html: contains forbidden pattern __CANVAS_TEST_API__");
}

if (violations.length > 0) {
  throw new Error(
    `Static bundle verification failed:\n- ${violations.join("\n- ")}`,
  );
}

process.stdout.write("Static bundle verification passed: no test API identifiers found.\n");

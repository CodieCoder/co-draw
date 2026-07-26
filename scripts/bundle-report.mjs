import { brotliCompressSync, gzipSync } from "node:zlib";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const outputDirectory = join(root, "apps/web/dist");
const reportDirectory = join(root, "reports/bundle");
const assetFiles = [];

const collectFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        await collectFiles(path);
      } else if (entry.isFile()) {
        assetFiles.push(path);
      }
    }),
  );
};

await collectFiles(outputDirectory);

const assets = await Promise.all(
  assetFiles.toSorted().map(async (path) => {
    const content = await readFile(path);
    return {
      path: relative(outputDirectory, path),
      kind: extname(path).slice(1) || "other",
      rawBytes: content.byteLength,
      gzipBytes: gzipSync(content).byteLength,
      brotliBytes: brotliCompressSync(content).byteLength,
    };
  }),
);

const totals = assets.reduce(
  (summary, asset) => ({
    rawBytes: summary.rawBytes + asset.rawBytes,
    gzipBytes: summary.gzipBytes + asset.gzipBytes,
    brotliBytes: summary.brotliBytes + asset.brotliBytes,
  }),
  { rawBytes: 0, gzipBytes: 0, brotliBytes: 0 },
);

const report = {
  generatedAt: new Date().toISOString(),
  policy: "measurement-only",
  assets,
  totals,
};

await mkdir(reportDirectory, { recursive: true });
await writeFile(
  join(reportDirectory, "web-bundle.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

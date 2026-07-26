import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

import { SUPPORTED_EXCALIDRAW_VERSION } from "./index.js";

const require = createRequire(import.meta.url);

const findExcalidrawManifest = (): string => {
  let directory = dirname(require.resolve("@excalidraw/excalidraw"));

  for (let depth = 0; depth < 12; depth += 1) {
    const candidate = join(directory, "package.json");
    if (
      existsSync(candidate) &&
      readFileSync(candidate, "utf8").includes(
        '"name": "@excalidraw/excalidraw"',
      )
    ) {
      return candidate;
    }
    directory = dirname(directory);
  }

  throw new Error("The installed Excalidraw package manifest was not found.");
};

describe("Excalidraw compatibility boundary", () => {
  it("resolves exactly the supported package version without mounting a canvas", () => {
    const manifest = readFileSync(findExcalidrawManifest(), "utf8");

    expect(SUPPORTED_EXCALIDRAW_VERSION).toBe("0.18.1");
    expect(manifest).toMatch(/"version"\s*:\s*"0\.18\.1"/u);
  });
});

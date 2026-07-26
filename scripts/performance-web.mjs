import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const root = fileURLToPath(new URL("../", import.meta.url));
const host = "127.0.0.1";
const port = 5_274;
const url = `http://${host}:${port}`;
const vite = join(root, "apps/web/node_modules/.bin/vite");
const lighthouse = join(root, "node_modules/.bin/lighthouse");
const reportDirectory = join(root, "reports/lighthouse");
const reportPath = join(reportDirectory, "web-foundation.report.json");

const findChrome = () => {
  if (process.env.CHROME_PATH) {
    return process.env.CHROME_PATH;
  }

  const platformCandidates = [];

  if (process.platform === "darwin") {
    platformCandidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
    );
  } else if (process.platform === "linux") {
    platformCandidates.push(
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
      "/snap/bin/chromium",
    );
  }

  const msPlaywrightDir = join(
    homedir(),
    ".cache",
    "ms-playwright",
  );
  if (existsSync(msPlaywrightDir)) {
    try {
      for (const entry of readdirSync(msPlaywrightDir)) {
        if (!entry.startsWith("chromium-")) continue;
        const installDir = join(msPlaywrightDir, entry);
        for (const platformDir of readdirSync(installDir)) {
          if (platformDir.startsWith(".")) continue;
          const candidates = [];
          if (process.platform === "darwin") {
            for (const appName of [
              "Google Chrome for Testing.app",
              "Chromium.app",
            ]) {
              candidates.push(
                join(
                  installDir,
                  platformDir,
                  appName,
                  "Contents",
                  "MacOS",
                  appName.replace(".app", ""),
                ),
              );
            }
          } else if (process.platform === "linux") {
            candidates.push(
              join(installDir, platformDir, "chrome-linux64", "chrome"),
              join(installDir, platformDir, "chrome-linux", "chrome"),
              join(installDir, platformDir, "chrome"),
            );
          }
          for (const candidate of candidates) {
            if (existsSync(candidate)) {
              platformCandidates.push(candidate);
              break;
            }
          }
        }
      }
    } catch {
      // Playwright directory enumeration failed; fall through to candidates.
    }
  }

  for (const candidate of platformCandidates) {
    if (existsSync(candidate)) return candidate;
  }

  throw new Error(
    [
      "No supported Chrome or Chromium executable found.",
      "",
      "Install Chrome or Chromium, set CHROME_PATH to the executable path,",
      "or install the pinned Playwright Chromium:",
      "  corepack pnpm exec playwright install chromium",
      "",
      "On Linux CI, install system dependencies as well:",
      "  corepack pnpm exec playwright install --with-deps chromium",
    ].join("\n"),
  );
};

const chromePath = findChrome();

const preview = spawn(
  vite,
  ["preview", "--host", host, "--port", String(port), "--strictPort"],
  {
    cwd: join(root, "apps/web"),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  },
);

const waitForWeb = async () => {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // The preview server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("The web preview did not become available.");
};

const run = (
  executable,
  arguments_,
  options,
) =>
  new Promise((resolve, reject) => {
    const child = spawn(executable, arguments_, options);
    let stderr = "";
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `Performance command exited with ${String(code)}: ${stderr.trim()}`,
          ),
        );
      }
    });
  });

try {
  await waitForWeb();
  await mkdir(reportDirectory, { recursive: true });
  await run(
    lighthouse,
    [
      url,
      "--quiet",
      "--output=json",
      `--output-path=${reportPath}`,
      "--only-categories=performance,accessibility",
      `--chrome-path=${chromePath}`,
      "--chrome-flags=--headless=new --no-sandbox --disable-gpu",
    ],
    {
      cwd: root,
      env: process.env,
      stdio: ["ignore", "ignore", "pipe"],
    },
  );

  const report = JSON.parse(await readFile(reportPath, "utf8"));
  const performance = report.categories.performance.score;
  const accessibility = report.categories.accessibility.score;
  const lcpMs = report.audits["largest-contentful-paint"].numericValue;

  if (performance < 0.9) {
    throw new Error(`Lighthouse performance ${performance} is below 0.90.`);
  }
  if (accessibility < 0.95) {
    throw new Error(`Lighthouse accessibility ${accessibility} is below 0.95.`);
  }
  if (lcpMs > 2_500) {
    throw new Error(`Largest Contentful Paint ${lcpMs}ms exceeds 2500ms.`);
  }

  process.stdout.write(
    `${JSON.stringify({ performance, accessibility, lcpMs, reportPath }, null, 2)}\n`,
  );
} finally {
  preview.kill("SIGTERM");
}

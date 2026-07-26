import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { connect } from "node:net";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const apiPort = 4_101;
const collaborationPort = 12_341;
const webPort = 5_273;
const processes = [];

const start = (executable, arguments_, options) => {
  const child = spawn(executable, arguments_, {
    ...options,
    stdio: ["ignore", "pipe", "pipe"],
  });
  processes.push(child);
  return child;
};

const waitForResponse = async (url, expectedStatus) => {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.status === expectedStatus) {
        return response;
      }
    } catch {
      // The process is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`${url} did not return ${expectedStatus}.`);
};

const assertExactKeys = (value, expected, label) => {
  const keys = Object.keys(value).toSorted();
  if (JSON.stringify(keys) !== JSON.stringify([...expected].toSorted())) {
    throw new Error(`${label} returned unexpected fields: ${keys.join(", ")}`);
  }
};

const assertHealth = async (url, status, expected) => {
  const response = await waitForResponse(url, status);
  const body = await response.json();
  assertExactKeys(body, Object.keys(expected), url);
  if (JSON.stringify(body) !== JSON.stringify(expected)) {
    throw new Error(`${url} returned an unexpected health contract.`);
  }
};

const verifyRejectedUpgrade = () =>
  new Promise((resolve, reject) => {
    const socket = connect(
      { host: "127.0.0.1", port: collaborationPort },
      () => {
        socket.write(
          [
            "GET /smoke-room HTTP/1.1",
            `Host: 127.0.0.1:${collaborationPort}`,
            "Connection: Upgrade",
            "Upgrade: websocket",
            "Sec-WebSocket-Version: 13",
            "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==",
            "Origin: http://127.0.0.1:5273",
            "",
            "",
          ].join("\r\n"),
        );
      },
    );
    let response = "";
    socket.setEncoding("utf8");
    socket.setTimeout(5_000);
    socket.on("data", (chunk) => {
      response += chunk;
    });
    socket.once("timeout", () => {
      socket.destroy();
      reject(new Error("Collaboration upgrade rejection timed out."));
    });
    socket.once("error", reject);
    socket.once("close", () => {
      if (
        response.startsWith("HTTP/1.1 403") &&
        response.includes("COLLAB_PERMISSION_DENIED")
      ) {
        resolve();
      } else {
        reject(
          new Error(`Unexpected collaboration upgrade response: ${response}`),
        );
      }
    });
  });

const stopProcesses = async () => {
  await Promise.all(
    processes.map(
      (child) =>
        new Promise((resolve) => {
          if (child.exitCode !== null) {
            resolve();
            return;
          }
          const force = setTimeout(() => child.kill("SIGKILL"), 3_000);
          child.once("exit", () => {
            clearTimeout(force);
            resolve();
          });
          child.kill("SIGTERM");
        }),
    ),
  );
};

try {
  start(process.execPath, [join(root, "apps/api/dist/main.js")], {
    cwd: join(root, "apps/api"),
    env: {
      ...process.env,
      APP_PROFILE: "local",
      API_HOST: "127.0.0.1",
      API_PORT: String(apiPort),
      ALLOWED_WEB_ORIGINS: `http://127.0.0.1:${webPort}`,
      RELEASE_ID: "stage-0a-smoke",
    },
  });
  start(process.execPath, [join(root, "apps/collaboration/dist/main.js")], {
    cwd: join(root, "apps/collaboration"),
    env: {
      ...process.env,
      APP_PROFILE: "local",
      COLLABORATION_HOST: "127.0.0.1",
      COLLABORATION_PORT: String(collaborationPort),
      ALLOWED_WEB_ORIGINS: `http://127.0.0.1:${webPort}`,
      RELEASE_ID: "stage-0a-smoke",
      SUPPORTED_EXCALIDRAW_VERSION: "0.18.1",
    },
  });
  start(
    join(root, "apps/web/node_modules/.bin/vite"),
    [
      "preview",
      "--host",
      "127.0.0.1",
      "--port",
      String(webPort),
      "--strictPort",
    ],
    {
      cwd: join(root, "apps/web"),
      env: process.env,
    },
  );

  await assertHealth(`http://127.0.0.1:${apiPort}/health/live`, 200, {
    service: "api",
    state: "live",
    releaseId: "stage-0a-smoke",
  });
  await assertHealth(`http://127.0.0.1:${apiPort}/health/ready`, 503, {
    service: "api",
    state: "not_ready",
    releaseId: "stage-0a-smoke",
    dependency: "foundation",
    code: "FOUNDATION_INCOMPLETE",
  });
  await assertHealth(
    `http://127.0.0.1:${collaborationPort}/health/live`,
    200,
    {
      service: "collaboration",
      state: "live",
      releaseId: "stage-0a-smoke",
    },
  );
  await assertHealth(
    `http://127.0.0.1:${collaborationPort}/health/ready`,
    503,
    {
      service: "collaboration",
      state: "not_ready",
      releaseId: "stage-0a-smoke",
      dependency: "foundation",
      code: "FOUNDATION_INCOMPLETE",
    },
  );

  const apiDomainRoute = await fetch(
    `http://127.0.0.1:${apiPort}/api/v1/rooms`,
  );
  if (apiDomainRoute.status !== 404) {
    throw new Error("The API shell exposed an unplanned domain route.");
  }
  const collaborationRoute = await fetch(
    `http://127.0.0.1:${collaborationPort}/rooms`,
  );
  if (collaborationRoute.status !== 404) {
    throw new Error("The collaboration shell exposed an unplanned HTTP route.");
  }

  await verifyRejectedUpgrade();

  const webResponse = await waitForResponse(
    `http://127.0.0.1:${webPort}`,
    200,
  );
  const webHtml = await webResponse.text();
  if (!webHtml.includes("Vega Canvas — Foundation Status")) {
    throw new Error("The built web entry document is unavailable.");
  }

  const entryMatch = webHtml.match(/<script[^>]+src="([^"]+)"/u);
  if (entryMatch?.[1] === undefined) {
    throw new Error("The built web entry asset was not found.");
  }
  const entryAsset = await readFile(
    join(root, "apps/web/dist", entryMatch[1].replace(/^\//u, "")),
    "utf8",
  );
  for (const forbidden of [
    "ALLOWED_WEB_ORIGINS",
    "API_HOST",
    "API_PORT",
    "COLLABORATION_HOST",
    "COLLABORATION_PORT",
    "DATABASE_URL",
    "guestEmail",
    "guest_email",
    "SESSION_SECRET",
    "OBJECT_STORAGE_SECRET",
    "PRIVATE_KEY",
    "SUPPORTED_EXCALIDRAW_VERSION",
  ]) {
    if (entryAsset.includes(forbidden)) {
      throw new Error(`The web bundle contains forbidden field ${forbidden}.`);
    }
  }

  process.stdout.write(
    "Application smoke checks passed: web available, health truthful, routes absent, collaboration fail-closed.\n",
  );
} finally {
  await stopProcesses();
}

import { spawn } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { connect } from "node:net";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  commandEnvironment,
  loadLocalEnvironment,
} from "./local-environment.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const localEnvironment = loadLocalEnvironment();
const environment = commandEnvironment(localEnvironment);
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
      if (expectedStatus === null || response.status === expectedStatus) {
        return response;
      }
    } catch {
      // The process is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`${url} did not return ${expectedStatus ?? "a response"}.`);
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
      ...environment,
      APP_PROFILE: "local",
      API_HOST: "127.0.0.1",
      API_PORT: String(apiPort),
      ALLOWED_WEB_ORIGINS: `http://127.0.0.1:${webPort}`,
      RELEASE_ID: "stage-0b-smoke",
      API_DATABASE_URL: localEnvironment.API_DATABASE_URL,
      OBJECT_STORAGE_ENDPOINT: localEnvironment.OBJECT_STORAGE_ENDPOINT,
      OBJECT_STORAGE_REGION: localEnvironment.OBJECT_STORAGE_REGION,
      OBJECT_STORAGE_BUCKET: localEnvironment.OBJECT_STORAGE_BUCKET,
      OBJECT_STORAGE_ACCESS_KEY: localEnvironment.OBJECT_STORAGE_ACCESS_KEY,
      OBJECT_STORAGE_SECRET_KEY: localEnvironment.OBJECT_STORAGE_SECRET_KEY,
      OBJECT_STORAGE_FORCE_PATH_STYLE: "true",
    },
  });
  start(process.execPath, [join(root, "apps/collaboration/dist/main.js")], {
    cwd: join(root, "apps/collaboration"),
    env: {
      ...process.env,
      ...environment,
      APP_PROFILE: "local",
      COLLABORATION_HOST: "127.0.0.1",
      COLLABORATION_PORT: String(collaborationPort),
      ALLOWED_WEB_ORIGINS: `http://127.0.0.1:${webPort}`,
      RELEASE_ID: "stage-0b-smoke",
      SUPPORTED_EXCALIDRAW_VERSION: "0.18.1",
      COLLABORATION_DATABASE_URL:
        localEnvironment.COLLABORATION_DATABASE_URL,
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
      env: environment,
    },
  );

  await assertHealth(`http://127.0.0.1:${apiPort}/health/live`, 200, {
    service: "api",
    state: "live",
    releaseId: "stage-0b-smoke",
  });

  await assertHealth(`http://127.0.0.1:${apiPort}/health/ready`, 200, {
    service: "api",
    state: "ready",
    releaseId: "stage-0b-smoke",
  });

  await assertHealth(
    `http://127.0.0.1:${collaborationPort}/health/live`,
    200,
    {
      service: "collaboration",
      state: "live",
      releaseId: "stage-0b-smoke",
    },
  );

  await assertHealth(
    `http://127.0.0.1:${collaborationPort}/health/ready`,
    200,
    {
      service: "collaboration",
      state: "ready",
      releaseId: "stage-0b-smoke",
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

  const forbiddenFields = [
    "ALLOWED_WEB_ORIGINS",
    "API_HOST",
    "API_PORT",
    "COLLABORATION_HOST",
    "COLLABORATION_PORT",
    "API_DATABASE_URL",
    "COLLABORATION_DATABASE_URL",
    "MIGRATION_DATABASE_URL",
    "OBJECT_STORAGE_ENDPOINT",
    "OBJECT_STORAGE_ACCESS_KEY",
    "OBJECT_STORAGE_SECRET_KEY",
    "OBJECT_STORAGE_BUCKET",
    "OBJECT_STORAGE_REGION",
    "DATABASE_URL",
    "guestEmail",
    "guest_email",
    "SESSION_SECRET",
    "PRIVATE_KEY",
    "SUPPORTED_EXCALIDRAW_VERSION",
  ];
  const secretFields = [
    "API_DATABASE_URL",
    "COLLABORATION_DATABASE_URL",
    "MIGRATION_DATABASE_URL",
    "OBJECT_STORAGE_ENDPOINT",
    "OBJECT_STORAGE_BUCKET",
    "OBJECT_STORAGE_ACCESS_KEY",
    "OBJECT_STORAGE_SECRET_KEY",
    "MINIO_ROOT_USER",
    "MINIO_ROOT_PASSWORD",
  ];
  const forbiddenValues = secretFields
    .map((field) => localEnvironment[field])
    .filter((value) => typeof value === "string" && value.length >= 8);
  const distDirectory = join(root, "apps/web/dist");
  const builtFiles = await readdir(distDirectory, {
    recursive: true,
    withFileTypes: true,
  });
  for (const file of builtFiles) {
    if (!file.isFile()) {
      continue;
    }
    const relativePath = join(file.parentPath, file.name);
    const asset = await readFile(relativePath, "utf8");
    for (const forbidden of forbiddenFields) {
      if (asset.includes(forbidden)) {
        throw new Error(
          `The web build contains forbidden server field ${forbidden}.`,
        );
      }
    }
    for (const forbidden of forbiddenValues) {
      if (asset.includes(forbidden)) {
        throw new Error("The web build contains a server-only value.");
      }
    }
  }

  process.stdout.write(
    "Application smoke checks passed: web available, health truthful, routes absent, collaboration fail-closed, secrets excluded.\n",
  );
} finally {
  await stopProcesses();
}

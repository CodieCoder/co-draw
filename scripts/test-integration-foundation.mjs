import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { connect, createServer } from "node:net";
import { join } from "node:path";

import {
  commandEnvironment,
  composeArgumentsFor,
  deriveLocalEnvironment,
  loadLocalEnvironment,
  repositoryRoot,
} from "./local-environment.mjs";

const suffix = randomBytes(4).toString("hex");
const projectName = `vega-canvas-it-${process.pid}-${suffix}`;
if (!/^vega-canvas-it-\d+-[a-f0-9]{8}$/u.test(projectName)) {
  throw new Error("Integration project name is not safely scoped.");
}

const reservePort = () =>
  new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (typeof address !== "object" || address === null) {
        server.close();
        reject(new Error("A local test port could not be allocated."));
        return;
      }
      const { port } = address;
      server.close((error) => {
        if (error) reject(error);
        else resolve(port);
      });
    });
  });

const [
  postgresPort,
  minioPort,
  minioConsolePort,
  apiPort,
  collaborationPort,
] = await Promise.all(
  Array.from({ length: 5 }, () => reservePort()),
);

const database = `vega_it_${suffix}`;
const migrationRole = `vega_migration_${suffix}`;
const apiRole = `vega_api_${suffix}`;
const collaborationRole = `vega_collaboration_${suffix}`;
const migrationPassword = `migration-${suffix}-Secret1`;
const apiPassword = `api-${suffix}-Secret1`;
const collaborationPassword = `collaboration-${suffix}-Secret1`;
const bucket = `vega-it-${suffix}`;
const releaseId = `stage-0b-integration-${suffix}`;
const baseEnvironment = loadLocalEnvironment();
const environment = commandEnvironment(
  deriveLocalEnvironment({
    ...baseEnvironment,
    CI: process.env.CI ?? "true",
    APP_PROFILE: "local",
    RELEASE_ID: releaseId,
    POSTGRES_USER: migrationRole,
    POSTGRES_PASSWORD: migrationPassword,
    POSTGRES_DB: database,
    POSTGRES_PORT: String(postgresPort),
    API_DATABASE_URL:
      `postgresql://${apiRole}:${apiPassword}` +
      `@127.0.0.1:${postgresPort}/${database}`,
    COLLABORATION_DATABASE_URL:
      `postgresql://${collaborationRole}:${collaborationPassword}` +
      `@127.0.0.1:${postgresPort}/${database}`,
    MIGRATION_DATABASE_URL:
      `postgresql://${migrationRole}:${migrationPassword}` +
      `@127.0.0.1:${postgresPort}/${database}`,
    OBJECT_STORAGE_ENDPOINT: `http://127.0.0.1:${minioPort}`,
    OBJECT_STORAGE_BUCKET: bucket,
    OBJECT_STORAGE_ACCESS_KEY: `vegaapi${suffix}`,
    OBJECT_STORAGE_SECRET_KEY: `storage-${suffix}-Secret1`,
    MINIO_ROOT_USER: `vegaroot${suffix}`,
    MINIO_ROOT_PASSWORD: `root-${suffix}-Secret1`,
    MINIO_API_PORT: String(minioPort),
    MINIO_CONSOLE_PORT: String(minioConsolePort),
    API_HOST: "127.0.0.1",
    API_PORT: String(apiPort),
    COLLABORATION_HOST: "127.0.0.1",
    COLLABORATION_PORT: String(collaborationPort),
    ALLOWED_WEB_ORIGINS: "http://127.0.0.1:5273",
  }),
);

const applicationProcesses = [];

const run = (
  executable,
  arguments_,
  label,
  expectedExitCodes = [0],
  stdio = "inherit",
) =>
  new Promise((resolve, reject) => {
    const child = spawn(executable, arguments_, {
      cwd: repositoryRoot,
      env: environment,
      stdio,
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (expectedExitCodes.includes(code ?? 1)) {
        resolve();
      } else {
        reject(new Error(`${label} exited with code ${code ?? 1}.`));
      }
    });
  });

const runCompose = (arguments_, label, expectedExitCodes = [0]) =>
  run(
    "docker",
    composeArgumentsFor(projectName, ...arguments_),
    label,
    expectedExitCodes,
  );

const composeOutput = (arguments_) =>
  new Promise((resolve, reject) => {
    const child = spawn(
      "docker",
      composeArgumentsFor(projectName, ...arguments_),
      {
        cwd: repositoryRoot,
        env: environment,
        stdio: ["ignore", "pipe", "ignore"],
      },
    );
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve(output.trim());
      else reject(new Error("Compose status inspection failed."));
    });
  });

const waitForHealthy = async (service) => {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    const output = await composeOutput([
      "ps",
      "--format",
      "json",
      service,
    ]);
    if (output) {
      const parsed = JSON.parse(output);
      const entry = Array.isArray(parsed) ? parsed[0] : parsed;
      if (entry?.Health === "healthy") {
        return;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`${service} did not become healthy.`);
};

const exactHealth = async (url, status, body, timeoutMs = 30_000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      const actual = await response.json();
      if (
        response.status === status &&
        JSON.stringify(actual) === JSON.stringify(body)
      ) {
        return;
      }
    } catch {
      // The process or restored dependency is still becoming available.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`${url} did not return its exact expected health contract.`);
};

const startApplication = (entrypoint) => {
  const child = spawn(process.execPath, [entrypoint], {
    cwd: repositoryRoot,
    env: environment,
    stdio: ["ignore", "inherit", "inherit"],
  });
  applicationProcesses.push(child);
};

const stopApplications = async () => {
  await Promise.all(
    applicationProcesses.map(
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

const proveUpgradeRejected = () =>
  new Promise((resolve, reject) => {
    const socket = connect(
      { host: "127.0.0.1", port: collaborationPort },
      () => {
        socket.write(
          [
            "GET /integration-room HTTP/1.1",
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
    socket.once("error", reject);
    socket.once("timeout", () => {
      socket.destroy();
      reject(new Error("Collaboration upgrade rejection timed out."));
    });
    socket.once("close", () => {
      if (
        response.startsWith("HTTP/1.1 403") &&
        response.includes("COLLAB_PERMISSION_DENIED")
      ) {
        resolve();
      } else {
        reject(new Error("Collaboration upgrade did not fail closed."));
      }
    });
  });

const psql = (sql) =>
  runCompose(
    [
      "exec",
      "--no-TTY",
      "postgres",
      "psql",
      "--username",
      migrationRole,
      "--dbname",
      database,
      "--set",
      "ON_ERROR_STOP=1",
      "--command",
      sql,
    ],
    "isolated psql assertion",
  );

const readyBody = (service) => ({
  service,
  state: "ready",
  releaseId,
});
const notReadyBody = (service, dependency, code) => ({
  service,
  state: "not_ready",
  releaseId,
  dependency,
  code,
});
const liveBody = (service) => ({
  service,
  state: "live",
  releaseId,
});

const apiUrl = `http://127.0.0.1:${apiPort}`;
const collaborationUrl = `http://127.0.0.1:${collaborationPort}`;

try {
  process.stdout.write(
    `Starting isolated Stage 0B integration project ${projectName}.\n`,
  );
  await run("corepack", ["pnpm", "build"], "integration build");
  await runCompose(
    ["up", "--detach", "postgres", "minio"],
    "isolated infrastructure start",
  );
  await Promise.all([waitForHealthy("postgres"), waitForHealthy("minio")]);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await runCompose(
      ["run", "--rm", "--no-deps", "postgres-init"],
      "idempotent PostgreSQL init",
    );
    await runCompose(
      ["run", "--rm", "--no-deps", "minio-init"],
      "idempotent MinIO init",
    );
  }

  await run(
    "corepack",
    ["pnpm", "exec", "tsx", "packages/database/src/migrate.ts"],
    "empty database migration",
  );
  await run(
    "corepack",
    ["pnpm", "exec", "tsx", "packages/database/src/migrate.ts"],
    "migration no-op rerun",
  );
  await run(
    "corepack",
    ["pnpm", "exec", "tsx", "packages/database/src/migrate-status.ts"],
    "migration status",
  );
  await run(
    "corepack",
    ["pnpm", "exec", "tsx", "apps/api/src/infra-check.ts"],
    "infrastructure contract check",
  );

  startApplication(join(repositoryRoot, "apps/api/dist/main.js"));
  startApplication(join(repositoryRoot, "apps/collaboration/dist/main.js"));

  await Promise.all([
    exactHealth(`${apiUrl}/health/live`, 200, liveBody("api")),
    exactHealth(
      `${collaborationUrl}/health/live`,
      200,
      liveBody("collaboration"),
    ),
    exactHealth(`${apiUrl}/health/ready`, 200, readyBody("api")),
    exactHealth(
      `${collaborationUrl}/health/ready`,
      200,
      readyBody("collaboration"),
    ),
  ]);

  const [apiRoute, collaborationRoute] = await Promise.all([
    fetch(`${apiUrl}/api/v1/rooms`),
    fetch(`${collaborationUrl}/rooms`),
  ]);
  if (apiRoute.status !== 404 || collaborationRoute.status !== 404) {
    throw new Error("An unplanned domain route is available.");
  }
  await proveUpgradeRejected();

  await runCompose(["stop", "postgres"], "isolated PostgreSQL stop");
  await Promise.all([
    exactHealth(`${apiUrl}/health/live`, 200, liveBody("api")),
    exactHealth(
      `${collaborationUrl}/health/live`,
      200,
      liveBody("collaboration"),
    ),
    exactHealth(
      `${apiUrl}/health/ready`,
      503,
      notReadyBody("api", "database", "DATABASE_UNAVAILABLE"),
    ),
    exactHealth(
      `${collaborationUrl}/health/ready`,
      503,
      notReadyBody(
        "collaboration",
        "database",
        "DATABASE_UNAVAILABLE",
      ),
    ),
  ]);

  await runCompose(["start", "postgres"], "isolated PostgreSQL restore");
  await waitForHealthy("postgres");
  await Promise.all([
    exactHealth(`${apiUrl}/health/ready`, 200, readyBody("api")),
    exactHealth(
      `${collaborationUrl}/health/ready`,
      200,
      readyBody("collaboration"),
    ),
  ]);

  await runCompose(["stop", "minio"], "isolated MinIO stop");
  await Promise.all([
    exactHealth(`${apiUrl}/health/live`, 200, liveBody("api")),
    exactHealth(
      `${apiUrl}/health/ready`,
      503,
      notReadyBody(
        "api",
        "object_storage",
        "OBJECT_STORAGE_UNAVAILABLE",
      ),
    ),
    exactHealth(
      `${collaborationUrl}/health/ready`,
      200,
      readyBody("collaboration"),
    ),
  ]);

  await runCompose(["start", "minio"], "isolated MinIO restore");
  await waitForHealthy("minio");
  await exactHealth(`${apiUrl}/health/ready`, 200, readyBody("api"));

  await psql(
    `INSERT INTO public.pgmigrations (name, run_on)
     VALUES ('999_unknown', NOW())`,
  );
  await run(
    "corepack",
    ["pnpm", "exec", "tsx", "packages/database/src/migrate-status.ts"],
    "unsupported migration status",
    [1],
    "ignore",
  );
  await Promise.all([
    exactHealth(
      `${apiUrl}/health/ready`,
      503,
      notReadyBody("api", "schema", "SCHEMA_UNSUPPORTED"),
    ),
    exactHealth(
      `${collaborationUrl}/health/ready`,
      503,
      notReadyBody(
        "collaboration",
        "schema",
        "SCHEMA_UNSUPPORTED",
      ),
    ),
  ]);
  await psql(`DELETE FROM public.pgmigrations WHERE name = '999_unknown'`);

  await psql(
    `REVOKE INSERT ON TABLE public.collaboration_documents
     FROM ${collaborationRole}`,
  );
  await exactHealth(
    `${collaborationUrl}/health/ready`,
    503,
    notReadyBody(
      "collaboration",
      "persistence",
      "PERSISTENCE_UNAVAILABLE",
    ),
  );
  await psql(
    `GRANT INSERT ON TABLE public.collaboration_documents
     TO ${collaborationRole}`,
  );
  await exactHealth(
    `${collaborationUrl}/health/ready`,
    200,
    readyBody("collaboration"),
  );

  process.stdout.write(
    "Stage 0B isolated integration checks passed: migration, privileges, privacy, exact health, interruption, and recovery.\n",
  );
} finally {
  await stopApplications();
  await runCompose(
    ["down", "--volumes", "--remove-orphans"],
    "isolated integration teardown",
    [0],
  );
}

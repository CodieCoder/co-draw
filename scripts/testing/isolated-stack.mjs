import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  mkdtemp,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:net";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  deriveLocalEnvironment,
  repositoryRoot,
} from "../local-environment.mjs";

const TEST_PROJECT_PATTERN = /^vega-canvas-it-\d+-[a-f0-9]{8}$/u;
const TEST_SUITE_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,22}[a-z0-9])?$/u;
const TEMP_DIRECTORY_PREFIX = "vega-canvas-test-";
const TEMP_DIRECTORY_SUFFIX_PATTERN = /^[A-Za-z0-9]{6}$/u;
const CHILD_SHUTDOWN_TIMEOUT_MS = 3_000;

const inheritedPublicEnvironmentKeys = [
  "CI",
  "COLORTERM",
  "FORCE_COLOR",
  "HOME",
  "LANG",
  "LC_ALL",
  "NODE_OPTIONS",
  "PATH",
  "PLAYWRIGHT_BROWSERS_PATH",
  "SHELL",
  "TERM",
  "TMP",
  "TMPDIR",
  "TEMP",
  "XDG_CACHE_HOME",
];

const pickPublicProcessEnvironment = () => {
  return Object.fromEntries(
    inheritedPublicEnvironmentKeys.flatMap((key) => {
      const value = process.env[key];
      return typeof value === "string" ? [[key, value]] : [];
    }),
  );
};

export const assertSafeTestProjectName = (projectName) => {
  if (!TEST_PROJECT_PATTERN.test(projectName)) {
    throw new Error("Refusing to operate on an unsafe test project name.");
  }
};

const temporaryDirectoryPrefix = (projectName) => {
  assertSafeTestProjectName(projectName);
  return `${TEMP_DIRECTORY_PREFIX}${projectName}-`;
};

const cleanupTemporaryDirectoriesByProjectName = async (projectName) => {
  const prefix = temporaryDirectoryPrefix(projectName);
  const entries = await readdir(tmpdir(), { withFileTypes: true });
  const ownedDirectories = entries.filter((entry) => {
    if (!entry.isDirectory() || !entry.name.startsWith(prefix)) {
      return false;
    }
    return TEMP_DIRECTORY_SUFFIX_PATTERN.test(
      entry.name.slice(prefix.length),
    );
  });

  await Promise.all(
    ownedDirectories.map(async ({ name }) =>
      rm(join(tmpdir(), name), {
        recursive: true,
        force: true,
      }),
    ),
  );
};

const assertSafeSuiteName = (suite) => {
  if (!TEST_SUITE_PATTERN.test(suite)) {
    throw new Error("Isolated test suite name is invalid.");
  }
};

const reservePort = () =>
  new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (typeof address !== "object" || address === null) {
        server.close();
        reject(new Error("A loopback test port could not be allocated."));
        return;
      }
      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve(port);
        }
      });
    });
  });

const execute = (
  executable,
  arguments_,
  {
    cwd = repositoryRoot,
    env = process.env,
    expectedExitCodes = [0],
    label,
    stdio = "inherit",
    trackedChildren,
  },
) =>
  new Promise((resolve, reject) => {
    const child = spawn(executable, arguments_, {
      cwd,
      env,
      stdio,
    });
    trackedChildren?.add(child);
    let settled = false;

    const finish = (callback) => {
      if (settled) {
        return;
      }
      settled = true;
      trackedChildren?.delete(child);
      callback();
    };

    child.once("error", (error) => {
      finish(() => reject(error));
    });
    child.once("exit", (code, signal) => {
      finish(() => {
        if (expectedExitCodes.includes(code ?? 1)) {
          resolve();
        } else {
          reject(
            new Error(
              `${label} exited with ${signal === null ? `code ${code ?? 1}` : `signal ${signal}`}.`,
            ),
          );
        }
      });
    });
  });

const capture = (
  executable,
  arguments_,
  {
    cwd = repositoryRoot,
    env = process.env,
    label,
    trackedChildren,
  },
) =>
  new Promise((resolve, reject) => {
    const child = spawn(executable, arguments_, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    trackedChildren?.add(child);
    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (callback) => {
      if (settled) {
        return;
      }
      settled = true;
      trackedChildren?.delete(child);
      callback();
    };

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.once("error", (error) => {
      finish(() => reject(error));
    });
    child.once("exit", (code) => {
      finish(() => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(
            new Error(
              `${label} exited with code ${code ?? 1}${stderr.trim() ? `: ${stderr.trim()}` : "."}`,
            ),
          );
        }
      });
    });
  });

const terminateChild = (child) =>
  new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }

    const force = setTimeout(() => {
      child.kill("SIGKILL");
    }, CHILD_SHUTDOWN_TIMEOUT_MS);
    child.once("exit", () => {
      clearTimeout(force);
      resolve();
    });
    child.kill("SIGTERM");
  });

const labelledDockerResources = async (projectName) => {
  assertSafeTestProjectName(projectName);
  const label = `label=com.docker.compose.project=${projectName}`;
  const [containers, networks, volumes] = await Promise.all([
    capture(
      "docker",
      ["ps", "--all", "--quiet", "--filter", label],
      { label: "container residue inspection" },
    ),
    capture(
      "docker",
      ["network", "ls", "--quiet", "--filter", label],
      { label: "network residue inspection" },
    ),
    capture(
      "docker",
      ["volume", "ls", "--quiet", "--filter", label],
      { label: "volume residue inspection" },
    ),
  ]);

  return { containers, networks, volumes };
};

export const assertNoDockerResources = async (projectName) => {
  const resources = await labelledDockerResources(projectName);
  const residualKinds = Object.entries(resources)
    .filter(([, value]) => value !== "")
    .map(([kind]) => kind);

  if (residualKinds.length > 0) {
    throw new Error(
      `Isolated test cleanup left project-scoped ${residualKinds.join(", ")}.`,
    );
  }
};

export const cleanupDockerResourcesByLabel = async (projectName) => {
  assertSafeTestProjectName(projectName);
  const resources = await labelledDockerResources(projectName);
  const identifiers = (value) =>
    value === "" ? [] : value.split(/\s+/u);

  const containers = identifiers(resources.containers);
  if (containers.length > 0) {
    await execute(
      "docker",
      ["rm", "--force", ...containers],
      {
        label: "exact test container cleanup",
      },
    );
  }

  const networks = identifiers(resources.networks);
  if (networks.length > 0) {
    await execute(
      "docker",
      ["network", "rm", ...networks],
      {
        label: "exact test network cleanup",
      },
    );
  }

  const volumes = identifiers(resources.volumes);
  if (volumes.length > 0) {
    await execute(
      "docker",
      ["volume", "rm", ...volumes],
      {
        label: "exact test volume cleanup",
      },
    );
  }

  await assertNoDockerResources(projectName);
  await cleanupTemporaryDirectoriesByProjectName(projectName);
};

const serializeEnvironment = (environment) =>
  `${Object.entries(environment)
    .toSorted(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => {
      if (/[\r\n]/u.test(value)) {
        throw new Error("Generated test configuration contains a line break.");
      }
      return `${key}=${value}`;
    })
    .join("\n")}\n`;

class IsolatedTestStack {
  constructor({
    suite,
    suffix,
    projectName,
    temporaryDirectory,
    environmentFile,
    environment,
    ports,
  }) {
    this.suite = suite;
    this.suffix = suffix;
    this.projectName = projectName;
    this.temporaryDirectory = temporaryDirectory;
    this.environmentFile = environmentFile;
    this.environment = Object.freeze({
      ...process.env,
      ...environment,
    });
    this.runId = `${suite}-${process.pid}-${suffix}`;
    this.releaseId = environment.RELEASE_ID;
    this.database = environment.POSTGRES_DB;
    this.migrationRole = environment.POSTGRES_USER;
    this.apiRole = environment.API_DATABASE_USER;
    this.collaborationRole = environment.COLLABORATION_DATABASE_USER;
    this.bucket = environment.OBJECT_STORAGE_BUCKET;
    this.ports = Object.freeze(ports);
    this.apiUrl = `http://127.0.0.1:${ports.api}`;
    this.collaborationUrl = `http://127.0.0.1:${ports.collaboration}`;
    this.webUrl = `http://127.0.0.1:${ports.web}`;
    this.publicEnvironment = Object.freeze({
      ...pickPublicProcessEnvironment(),
      CI: process.env.CI ?? "true",
      VEGA_TEST_API_BASE_URL: this.apiUrl,
      VEGA_TEST_COLLABORATION_BASE_URL: this.collaborationUrl,
      VEGA_TEST_RELEASE_ID: this.releaseId,
      VEGA_TEST_RUN_ID: this.runId,
      VEGA_TEST_WEB_BASE_URL: this.webUrl,
    });
    this.applicationProcesses = new Set();
    this.commandProcesses = new Set();
    this.composeStarted = false;
    this.cleanupPromise = undefined;
  }

  composeArguments(...arguments_) {
    assertSafeTestProjectName(this.projectName);
    return [
      "compose",
      "--file",
      join(repositoryRoot, "compose.yaml"),
      "--env-file",
      this.environmentFile,
      "--project-name",
      this.projectName,
      ...arguments_,
    ];
  }

  run(
    executable,
    arguments_,
    label,
    expectedExitCodes = [0],
    stdio = "inherit",
    extraEnv = {},
  ) {
    return execute(executable, arguments_, {
      env: { ...this.environment, ...extraEnv },
      expectedExitCodes,
      label,
      stdio,
      trackedChildren: this.commandProcesses,
    });
  }

  runPublic(
    executable,
    arguments_,
    label,
    expectedExitCodes = [0],
    stdio = "inherit",
    extraEnv = {},
  ) {
    return execute(executable, arguments_, {
      env: { ...this.publicEnvironment, ...extraEnv },
      expectedExitCodes,
      label,
      stdio,
      trackedChildren: this.commandProcesses,
    });
  }

  runCompose(
    arguments_,
    label,
    expectedExitCodes = [0],
    stdio = "inherit",
  ) {
    return this.run(
      "docker",
      this.composeArguments(...arguments_),
      label,
      expectedExitCodes,
      stdio,
    );
  }

  composeOutput(arguments_) {
    return capture(
      "docker",
      this.composeArguments(...arguments_),
      {
        env: this.environment,
        label: "Compose status inspection",
        trackedChildren: this.commandProcesses,
      },
    );
  }

  async build() {
    await this.run("corepack", ["pnpm", "build"], "isolated test build");
  }

  async startInfrastructure() {
    this.composeStarted = true;
    await this.runCompose(
      ["up", "--detach", "postgres", "minio"],
      "isolated infrastructure start",
    );
    await Promise.all([
      this.waitForHealthy("postgres"),
      this.waitForHealthy("minio"),
    ]);
  }

  async waitForHealthy(service) {
    const deadline = Date.now() + 45_000;
    while (Date.now() < deadline) {
      const output = await this.composeOutput([
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
  }

  async initializeInfrastructure(repetitions = 1) {
    for (let attempt = 0; attempt < repetitions; attempt += 1) {
      await this.runCompose(
        ["run", "--rm", "--no-deps", "postgres-init"],
        "idempotent PostgreSQL init",
        [0],
        "ignore",
      );
      await this.runCompose(
        ["run", "--rm", "--no-deps", "minio-init"],
        "idempotent MinIO init",
        [0],
        "ignore",
      );
    }
  }

  async migrate(repetitions = 1) {
    for (let attempt = 0; attempt < repetitions; attempt += 1) {
      await this.run(
        "corepack",
        [
          "pnpm",
          "exec",
          "tsx",
          "packages/database/src/migrate.ts",
        ],
        attempt === 0 ? "empty database migration" : "migration no-op rerun",
      );
    }
  }

  migrateStatus(expectedExitCodes = [0], stdio = "inherit") {
    return this.run(
      "corepack",
      [
        "pnpm",
        "exec",
        "tsx",
        "packages/database/src/migrate-status.ts",
      ],
      "migration status",
      expectedExitCodes,
      stdio,
    );
  }

  runInfrastructureCheck() {
    return this.run(
      "corepack",
      [
        "pnpm",
        "exec",
        "tsx",
        "apps/api/src/infra-check.ts",
      ],
      "infrastructure contract check",
    );
  }

  startApplication(application) {
    let executable;
    let arguments_;

    if (application === "api") {
      executable = process.execPath;
      arguments_ = [join(repositoryRoot, "apps/api/dist/main.js")];
    } else if (application === "collaboration") {
      executable = process.execPath;
      arguments_ = [
        join(repositoryRoot, "apps/collaboration/dist/main.js"),
      ];
    } else if (application === "web") {
      executable = "corepack";
      arguments_ = [
        "pnpm",
        "--filter",
        "@vega/web",
        "exec",
        "vite",
        "preview",
        "--host",
        "127.0.0.1",
        "--port",
        String(this.ports.web),
        "--strictPort",
      ];
    } else {
      throw new Error("Unknown isolated application.");
    }

    const child = spawn(executable, arguments_, {
      cwd: repositoryRoot,
      env: this.environment,
      stdio: ["ignore", "inherit", "inherit"],
    });
    this.applicationProcesses.add(child);
    child.once("exit", () => {
      this.applicationProcesses.delete(child);
    });
    child.once("error", (error) => {
      process.stderr.write(
        `Isolated ${application} process failed to start: ${error.message}\n`,
      );
    });
    return child;
  }

  async startApplications({ web = false } = {}) {
    this.startApplication("api");
    this.startApplication("collaboration");
    if (web) {
      this.startApplication("web");
    }

    await Promise.all([
      this.exactHealth(
        `${this.apiUrl}/health/live`,
        200,
        this.liveBody("api"),
      ),
      this.exactHealth(
        `${this.collaborationUrl}/health/live`,
        200,
        this.liveBody("collaboration"),
      ),
      this.exactHealth(
        `${this.apiUrl}/health/ready`,
        200,
        this.readyBody("api"),
      ),
      this.exactHealth(
        `${this.collaborationUrl}/health/ready`,
        200,
        this.readyBody("collaboration"),
      ),
      ...(web ? [this.waitForWeb()] : []),
    ]);
  }

  async waitForWeb() {
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      try {
        const response = await fetch(this.webUrl);
        if (response.status === 200) {
          return;
        }
      } catch {
        // The preview server is still starting.
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error("The isolated web application did not become available.");
  }

  async exactHealth(url, status, body, timeoutMs = 30_000) {
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
        // The application or restored dependency is still becoming available.
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(`${url} did not return its exact expected health contract.`);
  }

  readyBody(service) {
    return {
      service,
      state: "ready",
      releaseId: this.releaseId,
    };
  }

  liveBody(service) {
    return {
      service,
      state: "live",
      releaseId: this.releaseId,
    };
  }

  notReadyBody(service, dependency, code) {
    return {
      service,
      state: "not_ready",
      releaseId: this.releaseId,
      dependency,
      code,
    };
  }

  psql(sql) {
    return this.runCompose(
      [
        "exec",
        "--no-TTY",
        "postgres",
        "psql",
        "--username",
        this.migrationRole,
        "--dbname",
        this.database,
        "--set",
        "ON_ERROR_STOP=1",
        "--command",
        sql,
      ],
      "isolated psql assertion",
    );
  }

  stopInfrastructureService(service) {
    return this.runCompose(
      ["stop", service],
      `isolated ${service} stop`,
    );
  }

  async startInfrastructureService(service) {
    await this.runCompose(
      ["start", service],
      `isolated ${service} restore`,
    );
    await this.waitForHealthy(service);
  }

  async stopApplications() {
    const children = [...this.applicationProcesses];
    await Promise.all(children.map(terminateChild));
    this.applicationProcesses.clear();
  }

  async cleanup() {
    if (this.cleanupPromise !== undefined) {
      return this.cleanupPromise;
    }

    this.cleanupPromise = this.performCleanup();
    return this.cleanupPromise;
  }

  async performCleanup() {
    const errors = [];
    const runningChildren = [
      ...this.commandProcesses,
      ...this.applicationProcesses,
    ];
    await Promise.all(runningChildren.map(terminateChild));
    this.commandProcesses.clear();
    this.applicationProcesses.clear();

    if (this.composeStarted) {
      try {
        await execute(
          "docker",
          this.composeArguments(
            "down",
            "--volumes",
            "--remove-orphans",
          ),
          {
            env: this.environment,
            expectedExitCodes: [0],
            label: "isolated test teardown",
          },
        );
      } catch (error) {
        errors.push(error);
      }

      try {
        await assertNoDockerResources(this.projectName);
      } catch (error) {
        errors.push(error);
      }
    }

    try {
      if (
        !this.temporaryDirectory.startsWith(
          join(tmpdir(), temporaryDirectoryPrefix(this.projectName)),
        )
      ) {
        throw new Error("Refusing to remove an unsafe test temporary directory.");
      }
      await rm(this.temporaryDirectory, {
        recursive: true,
        force: true,
      });
    } catch (error) {
      errors.push(error);
    }

    if (errors.length > 0) {
      throw new AggregateError(
        errors,
        `Cleanup failed for isolated project ${this.projectName}.`,
      );
    }

    process.stdout.write(
      `Cleaned isolated test project ${this.projectName}.\n`,
    );
  }
}

export const createIsolatedTestStack = async ({
  suite = "general",
} = {}) => {
  assertSafeSuiteName(suite);
  const suffix = randomBytes(4).toString("hex");
  const projectName = `vega-canvas-it-${process.pid}-${suffix}`;
  assertSafeTestProjectName(projectName);
  const temporaryDirectory = await mkdtemp(
    join(tmpdir(), temporaryDirectoryPrefix(projectName)),
  );
  const environmentFile = join(temporaryDirectory, "environment");

  try {
    const [
      postgres,
      minio,
      minioConsole,
      api,
      collaboration,
      web,
    ] = await Promise.all(
      Array.from({ length: 6 }, async () => reservePort()),
    );
    const database = `vega_it_${suffix}`;
    const migrationRole = `vega_migration_${suffix}`;
    const apiRole = `vega_api_${suffix}`;
    const collaborationRole = `vega_collaboration_${suffix}`;
    const migrationPassword = `migration-${suffix}-Secret1`;
    const apiPassword = `api-${suffix}-Secret1`;
    const collaborationPassword = `collaboration-${suffix}-Secret1`;
    const releaseId = `stage-0c-${suite}-${suffix}`;

    const environment = deriveLocalEnvironment({
      ALLOWED_WEB_ORIGINS: `http://127.0.0.1:${web}`,
      API_DATABASE_URL:
        `postgresql://${apiRole}:${apiPassword}` +
        `@127.0.0.1:${postgres}/${database}`,
      API_HOST: "127.0.0.1",
      API_PORT: String(api),
      APP_PROFILE: "local",
      CI: process.env.CI ?? "true",
      COLLABORATION_DATABASE_URL:
        `postgresql://${collaborationRole}:${collaborationPassword}` +
        `@127.0.0.1:${postgres}/${database}`,
      COLLABORATION_HOST: "127.0.0.1",
      COLLABORATION_PORT: String(collaboration),
      MIGRATION_DATABASE_URL:
        `postgresql://${migrationRole}:${migrationPassword}` +
        `@127.0.0.1:${postgres}/${database}`,
      MINIO_CONSOLE_PORT: String(minioConsole),
      MINIO_ROOT_PASSWORD: `root-${suffix}-Secret1`,
      MINIO_ROOT_USER: `vegaroot${suffix}`,
      OBJECT_STORAGE_ACCESS_KEY: `vegaapi${suffix}`,
      OBJECT_STORAGE_BUCKET: `vega-it-${suffix}`,
      OBJECT_STORAGE_ENDPOINT: `http://127.0.0.1:${minio}`,
      OBJECT_STORAGE_FORCE_PATH_STYLE: "true",
      OBJECT_STORAGE_REGION: "us-east-1",
      OBJECT_STORAGE_SECRET_KEY: `storage-${suffix}-Secret1`,
      RELEASE_ID: releaseId,
      SUPPORTED_EXCALIDRAW_VERSION: "0.18.1",
      VITE_API_BASE_URL: `http://127.0.0.1:${api}`,
      VITE_APP_PROFILE: "local",
      VITE_COLLABORATION_URL: `ws://127.0.0.1:${collaboration}`,
      VITE_RELEASE_ID: releaseId,
    });
    await writeFile(
      environmentFile,
      serializeEnvironment(environment),
      { mode: 0o600 },
    );

    const stack = new IsolatedTestStack({
      suite,
      suffix,
      projectName,
      temporaryDirectory,
      environmentFile,
      environment,
      ports: {
        api,
        collaboration,
        minio,
        minioConsole,
        postgres,
        web,
      },
    });
    process.stdout.write(
      `Created isolated test project ${stack.projectName} for ${suite}.\n`,
    );
    return stack;
  } catch (error) {
    await rm(temporaryDirectory, {
      recursive: true,
      force: true,
    });
    throw error;
  }
};

const signalExitCodes = {
  SIGINT: 130,
  SIGTERM: 143,
};

export const withIsolatedTestStack = async (options, callback) => {
  const stack = await createIsolatedTestStack(options);
  let handlingSignal = false;
  const handlers = Object.fromEntries(
    Object.entries(signalExitCodes).map(([signal, exitCode]) => [
      signal,
      () => {
        if (handlingSignal) {
          return;
        }
        handlingSignal = true;
        void stack
          .cleanup()
          .then(() => process.exit(exitCode))
          .catch((error) => {
            process.stderr.write(`${String(error)}\n`);
            process.exit(1);
          });
      },
    ]),
  );

  for (const [signal, handler] of Object.entries(handlers)) {
    process.once(signal, handler);
  }

  let result;
  let primaryError;
  let cleanupError;
  try {
    result = await callback(stack);
  } catch (error) {
    primaryError = error;
  }

  try {
    await stack.cleanup();
  } catch (error) {
    cleanupError = error;
  } finally {
    for (const [signal, handler] of Object.entries(handlers)) {
      process.removeListener(signal, handler);
    }
  }

  if (primaryError !== undefined && cleanupError !== undefined) {
    throw new AggregateError(
      [primaryError, cleanupError],
      "The isolated test and its cleanup both failed.",
    );
  }
  if (primaryError !== undefined) {
    throw primaryError;
  }
  if (cleanupError !== undefined) {
    throw cleanupError;
  }
  return result;
};

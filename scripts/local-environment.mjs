import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";

export const repositoryRoot = resolve(import.meta.dirname, "..");
export const localEnvironmentPath = resolve(repositoryRoot, ".env.local");
// Preserve the original Compose project's named volumes across Stage 0B repairs.
export const composeProjectName = "vegait-hackerton";

const PLACEHOLDER_PATTERNS = [
  /\bchange[_-]?me\b/iu,
  /^<.+>$/u,
  /^your-/iu,
];

const fail = (field, reason) => {
  throw new Error(`Local configuration ${field} ${reason}.`);
};

const required = (environment, field) => {
  const value = environment[field]?.trim();
  if (!value) {
    return fail(field, "is required");
  }
  if (PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value))) {
    return fail(field, "contains a placeholder");
  }
  return value;
};

const decodeUrlPart = (value, field) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return fail(field, "contains invalid URL encoding");
  }
};

const databaseTarget = (environment, field) => {
  const rawValue = required(environment, field);
  let url;
  try {
    url = new URL(rawValue);
  } catch {
    return fail(field, "must be a PostgreSQL URL");
  }

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    return fail(field, "must use postgresql");
  }

  const username = decodeUrlPart(url.username, field);
  const password = decodeUrlPart(url.password, field);
  const database = decodeUrlPart(url.pathname.replace(/^\//u, ""), field);
  if (!username || !password || !database || !url.hostname) {
    return fail(field, "must include username, password, host, and database");
  }

  return {
    username,
    password,
    hostname: url.hostname,
    port: url.port || "5432",
    database,
  };
};

const assertSameDatabase = (expected, actual, field) => {
  if (
    expected.hostname !== actual.hostname ||
    expected.port !== actual.port ||
    expected.database !== actual.database
  ) {
    return fail(field, "must target the same local PostgreSQL database");
  }
};

const storagePort = (environment) => {
  const rawValue = required(environment, "OBJECT_STORAGE_ENDPOINT");
  let url;
  try {
    url = new URL(rawValue);
  } catch {
    return fail("OBJECT_STORAGE_ENDPOINT", "must be a URL");
  }
  if (
    url.protocol !== "http:" ||
    !["localhost", "127.0.0.1", "[::1]", "::1"].includes(url.hostname)
  ) {
    return fail(
      "OBJECT_STORAGE_ENDPOINT",
      "must use HTTP on a loopback host for local infrastructure",
    );
  }
  return url.port || "9000";
};

export const deriveLocalEnvironment = (environment) => {
  for (const [field, value] of Object.entries(environment)) {
    if (PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value.trim()))) {
      return fail(field, "contains a placeholder");
    }
  }

  const migration = databaseTarget(environment, "MIGRATION_DATABASE_URL");
  const api = databaseTarget(environment, "API_DATABASE_URL");
  const collaboration = databaseTarget(
    environment,
    "COLLABORATION_DATABASE_URL",
  );

  assertSameDatabase(migration, api, "API_DATABASE_URL");
  assertSameDatabase(migration, collaboration, "COLLABORATION_DATABASE_URL");

  if (
    new Set([migration.username, api.username, collaboration.username]).size !==
    3
  ) {
    return fail(
      "database roles",
      "must use distinct migration, API, and collaboration identities",
    );
  }

  const bucket = required(environment, "OBJECT_STORAGE_BUCKET");
  const accessKey = required(environment, "OBJECT_STORAGE_ACCESS_KEY");
  const secretKey = required(environment, "OBJECT_STORAGE_SECRET_KEY");

  return Object.freeze({
    ...environment,
    POSTGRES_USER: migration.username,
    POSTGRES_PASSWORD: migration.password,
    POSTGRES_DB: migration.database,
    POSTGRES_PORT: migration.port,
    API_DATABASE_USER: api.username,
    API_DATABASE_PASSWORD: api.password,
    COLLABORATION_DATABASE_USER: collaboration.username,
    COLLABORATION_DATABASE_PASSWORD: collaboration.password,
    MINIO_API_PORT: storagePort(environment),
    OBJECT_STORAGE_BUCKET: bucket,
    OBJECT_STORAGE_ACCESS_KEY: accessKey,
    OBJECT_STORAGE_SECRET_KEY: secretKey,
    MINIO_ROOT_USER: required(environment, "MINIO_ROOT_USER"),
    MINIO_ROOT_PASSWORD: required(environment, "MINIO_ROOT_PASSWORD"),
    MINIO_CONSOLE_PORT: required(environment, "MINIO_CONSOLE_PORT"),
  });
};

export const loadLocalEnvironment = () => {
  if (!existsSync(localEnvironmentPath)) {
    throw new Error(
      ".env.local not found. Copy .env.example and replace every placeholder.",
    );
  }

  return deriveLocalEnvironment(
    parseEnv(readFileSync(localEnvironmentPath, "utf8")),
  );
};

export const commandEnvironment = (localEnvironment) => ({
  ...process.env,
  ...localEnvironment,
});

export const composeArgumentsFor = (projectName, ...arguments_) => [
  "compose",
  "--env-file",
  localEnvironmentPath,
  "--project-name",
  projectName,
  ...arguments_,
];

export const composeArguments = (...arguments_) =>
  composeArgumentsFor(composeProjectName, ...arguments_);

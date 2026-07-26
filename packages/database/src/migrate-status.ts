import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { parseMigrationEnvironment } from "./migration-environment.js";
import { SUPPORTED_MIGRATIONS } from "./schema-version.js";

export interface MigrationStatus {
  readonly status: "up-to-date" | "pending" | "unsupported";
  readonly applied: readonly string[];
  readonly pending: readonly string[];
  readonly unknown: readonly string[];
}

export const classifyMigrationSet = (
  applied: readonly string[],
): MigrationStatus => {
  const appliedSet = new Set(applied);
  const supportedSet = new Set(SUPPORTED_MIGRATIONS);
  const pending = SUPPORTED_MIGRATIONS.filter((name) => !appliedSet.has(name));
  const unknown = applied.filter((name) => !supportedSet.has(name));
  const orderMatches =
    applied.length === SUPPORTED_MIGRATIONS.length &&
    SUPPORTED_MIGRATIONS.every((name, index) => applied[index] === name);

  const status =
    unknown.length > 0 || (pending.length === 0 && !orderMatches)
      ? "unsupported"
      : pending.length > 0
        ? "pending"
        : "up-to-date";
  return { status, applied: [...applied], pending, unknown };
};

export const inspectMigrationStatus = async (
  pool: pg.Pool,
): Promise<MigrationStatus> => {
  const tableCheck = await pool.query<{ exists: boolean }>(
    `SELECT to_regclass('public.pgmigrations') IS NOT NULL AS exists`,
  );
  if (!tableCheck.rows[0]?.exists) {
    return classifyMigrationSet([]);
  }

  const result = await pool.query<{ name: string }>(
    `SELECT name FROM public.pgmigrations ORDER BY id ASC`,
  );
  return classifyMigrationSet(result.rows.map(({ name }) => name));
};

const main = async (): Promise<void> => {
  const environment = parseMigrationEnvironment(process.env);
  const pool = new pg.Pool({
    connectionString: environment.databaseUrl,
    max: 1,
    connectionTimeoutMillis: 5_000,
    query_timeout: 5_000,
    statement_timeout: 5_000,
  });

  try {
    const status = await inspectMigrationStatus(pool);
    process.stdout.write(
      `Applied migrations: [${status.applied.join(", ") || "none"}]\n`,
    );
    process.stdout.write(
      `Supported migrations: [${SUPPORTED_MIGRATIONS.join(", ")}]\n`,
    );
    if (status.pending.length > 0) {
      process.stdout.write(
        `Pending migrations: [${status.pending.join(", ")}]\n`,
      );
    }
    if (status.unknown.length > 0) {
      process.stdout.write(
        `Unknown applied migrations: [${status.unknown.join(", ")}]\n`,
      );
    }
    process.stdout.write(`Status: ${status.status}\n`);
    if (status.status !== "up-to-date") {
      process.exitCode = 1;
    }
  } finally {
    await pool.end();
  }
};

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  void main().catch(() => {
    process.stderr.write("Migration status check failed.\n");
    process.exitCode = 1;
  });
}

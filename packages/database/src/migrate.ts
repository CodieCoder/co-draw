import { setTimeout as delay } from "node:timers/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { runner as migrationRunner } from "node-pg-migrate";
import pg from "pg";

import { parseMigrationEnvironment } from "./migration-environment.js";

const migrationsDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "migrations",
);
const lockId = 42_003;
const lockTimeoutMs = 5_000;

const migrationEnvironment = parseMigrationEnvironment(process.env);
const pool = new pg.Pool({
  connectionString: migrationEnvironment.databaseUrl,
  max: 1,
  connectionTimeoutMillis: 5_000,
});

const acquireMigrationLock = async (client: pg.PoolClient): Promise<void> => {
  const deadline = Date.now() + lockTimeoutMs;
  do {
    const result = await client.query<{ locked: boolean }>(
      `SELECT pg_try_advisory_lock($1) AS locked`,
      [lockId],
    );
    if (result.rows[0]?.locked) {
      return;
    }
    await delay(100);
  } while (Date.now() < deadline);

  throw new Error("MIGRATION_LOCK_UNAVAILABLE");
};

const run = async (): Promise<void> => {
  let client: pg.PoolClient | undefined;
  try {
    client = await pool.connect();
    await acquireMigrationLock(client);
    await client.query(
      `SELECT
         set_config('vega.api_runtime_role', $1, false),
         set_config('vega.collaboration_runtime_role', $2, false)`,
      [
        migrationEnvironment.apiRuntimeRole,
        migrationEnvironment.collaborationRuntimeRole,
      ],
    );

    process.stdout.write("Migration lock acquired. Applying migrations...\n");
    await migrationRunner({
      dbClient: client,
      dir: migrationsDirectory,
      direction: "up",
      migrationsTable: "pgmigrations",
      count: Infinity,
      logger: {
        info: (message: string) =>
          process.stdout.write(`[pg-migrate] ${message}\n`),
        warn: () =>
          process.stderr.write("[pg-migrate] Migration warning emitted.\n"),
        error: () =>
          process.stderr.write("[pg-migrate] Migration operation failed.\n"),
      },
    });
    process.stdout.write("Migrations complete.\n");
  } finally {
    if (client) {
      try {
        await client.query(`SELECT pg_advisory_unlock($1)`, [lockId]);
      } catch {
        // Closing the connection releases the session-level advisory lock.
      }
      client.release();
    }
    await pool.end();
  }
};

void run().catch((error: unknown) => {
  const code =
    error instanceof Error && error.message === "MIGRATION_LOCK_UNAVAILABLE"
      ? "MIGRATION_LOCK_UNAVAILABLE"
      : "MIGRATION_FAILED";
  process.stderr.write(`${code}\n`);
  process.exitCode = 1;
});

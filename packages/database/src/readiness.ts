import type pg from "pg";

import { withClient } from "./connection.js";
import { SUPPORTED_MIGRATIONS } from "./schema-version.js";

export type DatabaseReadiness =
  | { readonly ready: true }
  | {
      readonly ready: false;
      readonly reason: "connectivity" | "unsupported_schema" | "temp_failure";
    };

export type PersistenceReadiness =
  | { readonly ready: true }
  | { readonly ready: false };

const PROBE_TIMEOUT_MS = 5_000;

const REQUIRED_TABLES = [
  "guests",
  "guest_sessions",
  "rooms",
  "room_memberships",
  "room_share_links",
  "collaboration_documents",
  "assets",
  "audit_events",
] as const;

const connectivityFailure = (): DatabaseReadiness => ({
  ready: false,
  reason: "connectivity",
});

const schemaFailure = (): DatabaseReadiness => ({
  ready: false,
  reason: "unsupported_schema",
});

const isSchemaError = (error: unknown): boolean => {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";
  return code === "42P01" || code === "42501" || code === "3F000";
};

const checkSchemaCompatibility = async (
  client: pg.PoolClient,
): Promise<DatabaseReadiness> => {
  const migrationResult = await client.query<{ name: string }>(
    `SELECT name FROM public.pgmigrations ORDER BY id ASC`,
  );
  const applied = migrationResult.rows.map(({ name }) => name);
  if (
    applied.length !== SUPPORTED_MIGRATIONS.length ||
    !SUPPORTED_MIGRATIONS.every((name, index) => applied[index] === name)
  ) {
    return schemaFailure();
  }

  const tableResult = await client.query<{
    table_name: string;
  }>(
    `SELECT class.relname AS table_name
       FROM pg_catalog.pg_class AS class
       JOIN pg_catalog.pg_namespace AS namespace
         ON namespace.oid = class.relnamespace
      WHERE namespace.nspname = 'public'
        AND class.relkind = 'r'
        AND class.relname = ANY ($1::text[])`,
    [REQUIRED_TABLES],
  );
  const found = new Set(tableResult.rows.map(({ table_name }) => table_name));
  if (!REQUIRED_TABLES.every((table) => found.has(table))) {
    return schemaFailure();
  }

  const privilegeResult = await client.query<{
    ledger_select: boolean;
    temp_allowed: boolean;
  }>(
    `SELECT
       has_table_privilege(
         current_user,
         'public.pgmigrations',
         'SELECT'
       ) AS ledger_select,
       has_database_privilege(
         current_user,
         current_database(),
         'TEMP'
       ) AS temp_allowed`,
  );
  const privileges = privilegeResult.rows[0];
  return privileges?.ledger_select && privileges.temp_allowed
    ? { ready: true }
    : schemaFailure();
};

const checkTemporaryByteaCapability = async (
  client: pg.PoolClient,
): Promise<boolean> => {
  try {
    await client.query("BEGIN");
    await client.query(
      `CREATE TEMP TABLE vega_readiness_probe (
         value BYTEA NOT NULL
       ) ON COMMIT DROP`,
    );
    await client.query(
      `INSERT INTO vega_readiness_probe (value)
       VALUES (decode($1, 'hex'))`,
      ["766567612d72656164696e657373"],
    );
    const result = await client.query<{ value: string }>(
      `SELECT encode(value, 'hex') AS value
         FROM vega_readiness_probe`,
    );
    await client.query("ROLLBACK");
    return result.rows[0]?.value === "766567612d72656164696e657373";
  } catch {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Releasing the checked-out client removes any failed temporary state.
    }
    return false;
  }
};

const runDatabaseProbe = async (pool: pg.Pool): Promise<DatabaseReadiness> => {
  try {
    return await withClient(pool, async (client) => {
      try {
        const schema = await checkSchemaCompatibility(client);
        if (!schema.ready) {
          return schema;
        }
      } catch (error: unknown) {
        return isSchemaError(error) ? schemaFailure() : connectivityFailure();
      }

      return (await checkTemporaryByteaCapability(client))
        ? { ready: true }
        : { ready: false, reason: "temp_failure" };
    });
  } catch {
    return connectivityFailure();
  }
};

export const probeDatabaseReadiness = async (
  pool: pg.Pool,
): Promise<DatabaseReadiness> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<DatabaseReadiness>((resolve) => {
    timeoutHandle = setTimeout(() => resolve(connectivityFailure()), PROBE_TIMEOUT_MS);
  });

  try {
    return await Promise.race([runDatabaseProbe(pool), timeout]);
  } finally {
    clearTimeout(timeoutHandle);
  }
};

export const probePersistenceReadiness = async (
  pool: pg.Pool,
): Promise<PersistenceReadiness> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const probe = (async (): Promise<PersistenceReadiness> => {
    try {
      return await withClient(pool, async (client) => {
        const result = await client.query<{
          can_delete: boolean;
          can_insert: boolean;
          can_select: boolean;
          can_update: boolean;
        }>(
          `SELECT
             has_table_privilege(
               current_user,
               'public.collaboration_documents',
               'SELECT'
             ) AS can_select,
             has_table_privilege(
               current_user,
               'public.collaboration_documents',
               'INSERT'
             ) AS can_insert,
             has_table_privilege(
               current_user,
               'public.collaboration_documents',
               'UPDATE'
             ) AS can_update,
             has_table_privilege(
               current_user,
               'public.collaboration_documents',
               'DELETE'
             ) AS can_delete`,
        );
        const privileges = result.rows[0];
        if (
          !privileges?.can_select ||
          !privileges.can_insert ||
          !privileges.can_update ||
          !privileges.can_delete
        ) {
          return { ready: false };
        }
        return (await checkTemporaryByteaCapability(client))
          ? { ready: true }
          : { ready: false };
      });
    } catch {
      return { ready: false };
    }
  })();
  const timeout = new Promise<PersistenceReadiness>((resolve) => {
    timeoutHandle = setTimeout(
      () => resolve({ ready: false }),
      PROBE_TIMEOUT_MS,
    );
  });

  try {
    return await Promise.race([probe, timeout]);
  } finally {
    clearTimeout(timeoutHandle);
  }
};

/**
 * Supported migration set and schema version contract.
 *
 * The runtime readiness probe compares the applied migration names in the
 * database ledger against this exact set. Any missing or extra migration
 * means the schema is unsupported.
 *
 * Migration names match the node-pg-migrate `name` column in the pgmigrations
 * table. They are derived from the migration filename without the .sql
 * extension and are the canonical identifier for schema compatibility.
 */
export const SUPPORTED_MIGRATIONS: readonly string[] = Object.freeze([
  "001_initial-schema",
  "002_runtime-grants",
  "003_collab-select-grants",
  "004_stage-0b-corrections",
  "005_api-initial-snapshot-grant",
]);

/** Numeric schema version that must match the latest supported migration count. */
export const SUPPORTED_SCHEMA_VERSION = 5;

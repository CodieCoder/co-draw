/**
 * @vega/database — PostgreSQL client, migration, and readiness boundary.
 *
 * This package owns:
 * - Pool creation from an already-validated server configuration.
 * - The supported migration-set constant.
 * - Ordered migration commands and status inspection.
 * - A bounded database readiness probe.
 * - Pool shutdown.
 *
 * It does not own:
 * - Environment parsing.
 * - HTTP or WebSocket health responses.
 * - Permission, session, room, membership, asset, or audit business policy.
 * - Domain repositories or services.
 * - Yjs schema validation or Excalidraw normalisation.
 * - Object-storage access.
 */
export { createPool, endPool, withClient } from "./connection.js";
export type { Pool } from "pg";
export {
  probeDatabaseReadiness,
  probePersistenceReadiness,
} from "./readiness.js";
export type {
  DatabaseReadiness,
  PersistenceReadiness,
} from "./readiness.js";
export { SUPPORTED_MIGRATIONS, SUPPORTED_SCHEMA_VERSION } from "./schema-version.js";

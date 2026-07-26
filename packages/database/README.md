# `@vega/database`

`@vega/database` owns the Stage 0B PostgreSQL infrastructure boundary. It
provides pool lifecycle helpers, the exact supported migration registry,
bounded database/schema readiness, and collaboration persistence-capability
readiness.

## Public exports

- `createPool(databaseUrl)` and `endPool(pool)` own runtime pool lifecycle.
- `withClient(pool, callback)` releases checked-out clients reliably.
- `probeDatabaseReadiness(pool)` returns ready, connectivity failure,
  unsupported schema, or temporary-capability failure without rejecting.
- `probePersistenceReadiness(pool)` verifies the collaboration runtime can
  select, insert, update, and delete collaboration-document rows and use the
  temporary BYTEA capability.
- `SUPPORTED_MIGRATIONS` and `SUPPORTED_SCHEMA_VERSION` define exact schema
  compatibility.

## Migrations

From the repository root:

```sh
corepack pnpm db:migrate
corepack pnpm db:migrate:status
```

Both commands load `.env.local`. The migration, API, and collaboration URLs
must target one database with distinct roles. Migration status exits nonzero
for missing, reordered, or unknown migrations. Applications never run
migrations during startup.

The SQL files under `migrations/` are authoritative for the eight mandatory
Stage 0B tables and runtime grants. See the
[local persistence and readiness contract](../../docs/contracts/02-local-persistence-and-readiness.md)
for the exact set and privilege boundaries.

## Non-goals

This package does not contain domain repositories, seed data, an ORM, an
editable canvas scene model, asset bytes, or Yjs document serialization.
Application and authorization rows remain PostgreSQL-owned; Excalidraw remains
the canonical scene; object storage owns binary bytes.

# Local Persistence and Readiness

**Document path:** `docs/contracts/02-local-persistence-and-readiness.md`

**Document status:** Proposed

**Applicable work package:** `FND-003`

**Last updated:** 26 July 2026

**Primary owners:** Engineering and Architecture

---

# 1. Purpose

Define the implemented Stage 0B local infrastructure, relational schema,
runtime privilege, object-storage, and health-readiness boundaries.

This reference narrows the accepted
[persistence architecture](../architecture/03-data-model-and-persistence.md),
[service boundaries](../architecture/04-api-and-service-boundaries.md), and
[operational readiness policy](../architecture/12-deployment-and-operational-readiness.md).
It does not add a domain route or change state ownership.

---

# 2. Scope

Included:

- Repository-owned PostgreSQL 17 and MinIO local services.
- Separate migration, API runtime, and collaboration runtime identities.
- Four ordered SQL migrations and exact migration-name compatibility.
- The eight mandatory relational tables and their database constraints.
- A private, bucket-scoped S3-compatible runtime credential.
- Bounded database, schema, persistence, and storage readiness probes.
- Exact health failure mappings, dependency interruption, and recovery.

Excluded:

- Domain repositories, seeded data, and product routes.
- Yjs document load/save behavior or collaboration-room access.
- Asset upload/download routes, presigning, browser bucket CORS, and exports.
- Automatic application-startup migrations and destructive downgrades.
- Production provisioning, backup rehearsal, or a hosting-vendor decision.

---

# 3. Ownership and responsibilities

| Boundary | Responsibility |
| --- | --- |
| `compose.yaml` and root infrastructure scripts | Start loopback PostgreSQL and MinIO, preserve named volumes on ordinary stop, initialise roles, bucket, and policy idempotently. |
| `.env.example` and `.env.local` | Define placeholder-only committed configuration and ignored usable local values. |
| `packages/database` | Own the PostgreSQL pool, ordered SQL migrations, exact supported set, bounded database/schema probes, and collaboration persistence-capability probe. |
| `packages/config` | Validate and redact API and collaboration database/storage configuration. |
| `packages/contracts` | Own strict liveness, ready, and dependency-not-ready shapes. |
| `apps/api` | Own the API runtime pool, S3 client, database-to-schema-to-storage readiness order, and client shutdown. |
| `apps/collaboration` | Own its runtime pool, database-to-schema-to-persistence readiness order, and pre-document WebSocket denial. |

PostgreSQL is authoritative for application and authorization records.
Object storage is authoritative for binary bytes. Health results are public,
derived projections and never authoritative state.

---

# 4. Local topology and configuration flow

The documented flow is:

```text
.env.local
→ validate placeholders, URLs, ports, bucket, and distinct database roles
→ derive Compose PostgreSQL/runtime identity fields
→ start PostgreSQL and MinIO
→ wait for container health
→ initialise runtime roles and private bucket policy
→ apply migrations explicitly
→ verify schema, privileges, storage privacy, and cleanup
→ start application shells
```

Default published addresses are PostgreSQL `127.0.0.1:5433`, MinIO API
`127.0.0.1:9000`, and MinIO console `127.0.0.1:9001`. Published dependency
ports bind to loopback. The three PostgreSQL URLs must use distinct identities
against one database target. The MinIO root identity is local administration;
applications receive only the bucket-scoped runtime credential.

The committed example rejects every `CHANGE_ME` placeholder. Root local
commands load `.env.local`; values are not inferred from a global shell or
embedded in source code.

---

# 5. Relational schema and migrations

The exact supported migration ledger is:

1. `001_initial-schema`
2. `002_runtime-grants`
3. `003_collab-select-grants`
4. `004_stage-0b-corrections`

The schema contains:

- `guests`
- `guest_sessions`
- `rooms`
- `room_memberships`
- `room_share_links`
- `collaboration_documents`
- `assets`
- `audit_events`

Migration `001` creates the mandatory tables, foreign keys, uniqueness,
checks, and indexes. Migrations `002` and `003` establish initial runtime
grants. Migration `004` forward-corrects existing local volumes by enforcing a
non-negative collaboration snapshot sequence and replacing broad grants with
the final scoped privilege set.

The migration identity owns DDL. The API runtime can mutate API-owned
application tables but cannot mutate collaboration documents or create schema
objects. The collaboration runtime can mutate only collaboration documents
and has column-scoped authority reads that exclude guest email and unrelated
API-owned data. Both runtime identities may read the migration ledger and
create temporary tables solely for bounded readiness capability checks.

Migration status succeeds only when the applied names and order exactly match
the supported list. Missing, reordered, or unknown migrations are not
up-to-date. Application startup never applies migrations.

---

# 6. Readiness control flow

Liveness returns the strict HTTP `200 live` contract without contacting a
dependency.

API readiness is deterministic:

```text
database connectivity
→ exact migration ledger and mandatory table set
→ migration-ledger and temporary-table capability
→ private storage create/read/content-type/delete probe
→ HTTP 200 ready
```

Collaboration readiness is deterministic:

```text
database connectivity
→ exact migration ledger and mandatory table set
→ migration-ledger and temporary-table capability
→ collaboration-document SELECT/INSERT/UPDATE/DELETE capability
→ HTTP 200 ready
```

The storage probe uses a random `.health/` object, verifies returned bytes and
content type, deletes the object, and treats cleanup failure as not-ready.
Infrastructure verification additionally requires anonymous list and object
read denial and no residual `.health/` objects.

Failures use HTTP `503` with one exact mapping:

| Condition | Dependency | Code |
| --- | --- | --- |
| Database unavailable or timed out | `database` | `DATABASE_UNAVAILABLE` |
| Migration ledger or schema unsupported | `schema` | `SCHEMA_UNSUPPORTED` |
| API storage capability unavailable or cleanup fails | `object_storage` | `OBJECT_STORAGE_UNAVAILABLE` |
| Collaboration persistence privileges unavailable | `persistence` | `PERSISTENCE_UNAVAILABLE` |

Restoring a dependency or privilege returns readiness to `200` without
restarting the application. An idle PostgreSQL connection error does not
terminate either service.

---

# 7. Failure and security behavior

- Infrastructure initialisation fails on invalid configuration, unhealthy
  services, role failure, bucket failure, or policy failure.
- Ordinary `infra:down` does not remove volumes.
- Migration lock acquisition is bounded; a lock or migration failure exits
  nonzero with a stable redacted code.
- Readiness returns typed not-ready results rather than raw driver/provider
  errors.
- PostgreSQL URLs, credentials, hostnames, storage keys, object bodies, guest
  email, stack traces, and provider diagnostics never enter health responses.
- S3 operations have bounded request timeouts and use server-only
  configuration.
- The bucket is private and the runtime policy is restricted to the configured
  bucket.
- Every collaboration WebSocket upgrade receives
  `403 COLLAB_PERMISSION_DENIED` before a Yjs document is created, and the
  rejection does not terminate the collaboration process.
- No browser bundle may contain server configuration field names or usable
  server-only values.

---

# 8. Testing requirements

Focused unit tests cover configuration validation and redaction, strict health
factories, migration classification, readiness failure handling, storage
cleanup, and dependency lifecycle.

`corepack pnpm test:integration:foundation` must use a unique
`vega-canvas-it-*` Compose project and prove:

- Clean migration and no-op rerun.
- Exact tables, constraints, indexes, and scoped privileges.
- Idempotent PostgreSQL and MinIO initialisation.
- Private storage lifecycle, anonymous denial, and cleanup.
- Exact healthy liveness/readiness and route absence.
- Database and storage interruption, not-ready mapping, and recovery.
- Unknown migration rejection.
- Collaboration persistence-privilege loss and recovery.
- Fail-closed WebSocket behavior without process termination.
- Removal of only the isolated test project and its disposable volumes.

The application smoke additionally proves the built web entry point and
browser-bundle secret exclusions against the normal local stack.

---

# 9. Definition of done

This contract is implemented when the documented local commands are
reproducible, the exact migration set and privilege boundaries pass live
inspection, both readiness pipelines are truthful across healthy and failed
states, probes clean up, collaboration remains fail-closed, documentation and
privacy checks pass, and no excluded product behavior is exposed.

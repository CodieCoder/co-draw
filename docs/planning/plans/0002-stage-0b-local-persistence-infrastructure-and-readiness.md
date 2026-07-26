# Stage 0B — Local Persistence Infrastructure and Truthful Readiness

**Document path:** `docs/planning/plans/0002-stage-0b-local-persistence-infrastructure-and-readiness.md`

**Document status:** Proposed

**Execution status:** Passed

**Parent plan:** [MVP Implementation Plan](../01-mvp-implementation-plan.md)

**Applicable work packages:** `FND-003`

**Goal objective:** Establish reproducible local PostgreSQL and private
S3-compatible infrastructure, an ordered initial relational migration, and
server-owned dependency readiness without enabling any product route or room
connection.

**Completion statement:** From an isolated clean local infrastructure state,
the documented commands start pinned PostgreSQL and private object storage,
apply and verify the initial MVP migration, make API and collaboration
readiness return the exact ready contract while their required dependencies are
usable, preserve liveness and return exact redacted not-ready contracts during
dependency or schema failure, recover after dependency restoration, keep every
collaboration connection fail-closed, and pass every mandatory evidence gate
in this plan.

**Last updated:** 26 July 2026

**Primary owners:** Engineering, Architecture, and QA

---

# 1. Purpose

This plan delivers the `FND-003` portion of Stage 0 after the completed
[Stage 0A plan](./0001-stage-0a-monorepo-scaffold-and-executable-contracts.md).

It turns the reserved database, configuration, health, API, and collaboration
boundaries into a real but deliberately narrow infrastructure slice:

- PostgreSQL and private S3-compatible storage run reproducibly for local
  development.
- Relational migrations are explicit, ordered, and separate from ordinary
  runtime startup.
- The mandatory initial relational schema exists without domain services or
  seeded product data.
- API and collaboration runtimes can distinguish liveness from usable
  dependency readiness.
- Database, schema, persistence, and object-storage failures remain redacted
  and recoverable.
- The collaboration runtime retains an explicit server-owned deny-all access
  policy until later authenticated room work exists.

This plan does not complete Stage 0. `FND-004` through `FND-006` remain for
separate plans.

---

# 2. Goal contract

## 2.1 Objective

Deliver one reproducible infrastructure and readiness slice that proves the
five-unit topology's PostgreSQL and private object-storage dependencies without
claiming rooms, assets, collaboration, or authentication are implemented.

## 2.2 Completion statement

The goal is complete only when all of the following are simultaneously true:

- Local PostgreSQL and S3-compatible object storage start through documented,
  repository-owned commands using immutable or exact version references.
- The object-storage bucket is private and a bounded server-authenticated
  create/read/delete probe succeeds without leaving an object behind.
- An empty PostgreSQL database migrates to the supported schema in order, a
  second migration run is a safe no-op, and older or unknown newer schema state
  is rejected as unsupported.
- The mandatory eight MVP tables, their accepted ownership boundaries, and
  required foreign-key, uniqueness, check, and index constraints exist.
- API and collaboration liveness remain independent of external dependencies.
- API readiness checks configuration, PostgreSQL, supported schema, and object
  storage.
- Collaboration readiness checks configuration, PostgreSQL, supported schema,
  persistence initialisation, and the explicit fail-closed authority boundary.
- Healthy dependencies produce HTTP `200` with the exact strict ready shape.
- Unavailable or incompatible dependencies produce HTTP `503` with the exact
  stable dependency category and error code, without a secret, hostname,
  connection string, storage key, raw provider error, or stack trace.
- Readiness changes back to ready after an interrupted dependency is restored,
  without requiring product state to be recreated.
- Every room WebSocket upgrade is still rejected before a Yjs document exists,
  and no room, session, asset, share-link, or other domain route is exposed.
- Required unit, migration, integration, process-smoke, privacy, documentation,
  and regression gates pass.
- This plan and its index row contain the completed execution record and no
  unresolved mandatory blocker.

Effort spent, a running container, one successful health request, or an
exhausted time or token budget is not the stopping condition.

## 2.3 Ready-to-run implementation handoff

```text
/goal Implement the persisted plan at docs/planning/plans/0002-stage-0b-local-persistence-infrastructure-and-readiness.md in full. Treat its authoritative-source precedence, fixed implementation decisions, scope, execution steps, evidence matrix, and definition of done as the execution contract. Change execution status to In progress before the first implementation mutation, keep checkpoint status and evidence current, preserve unrelated user changes, and do not mark the goal complete until the completion statement and every mandatory definition-of-done item are proven. Do not start FND-004 through FND-006, Stage 1, or any product route; do not create a commit, push, pull request, deployment, or destructive local-data reset without separate authorization.
```

The plan is self-contained and model-neutral. An execution surface without a
`/goal` command should use the text after `/goal` as its task objective.

Starting implementation does not broaden filesystem, network, approval,
destructive-action, external-action, deployment, or Git authority.

---

# 3. Authoritative sources and constraints

Use this plan with:

- [Repository instructions](../../../AGENTS.md).
- [Documentation Index](../../README.md).
- [Product Requirements](../../product/01-product-requirements.md).
- [MVP Scope and Acceptance Criteria](../../product/02-mvp-scope-and-acceptance-criteria.md).
- [System Architecture](../../architecture/01-system-architecture.md).
- [Data Model and Persistence](../../architecture/03-data-model-and-persistence.md).
- [API and Service Boundaries](../../architecture/04-api-and-service-boundaries.md).
- [Asset and Media Architecture](../../architecture/08-asset-and-media-architecture.md).
- [Security, Permission, and Privacy Architecture](../../architecture/10-security-permission-and-privacy-architecture.md).
- [Testing and Quality Strategy](../../architecture/11-testing-and-quality-strategy.md).
- [Deployment and Operational Readiness](../../architecture/12-deployment-and-operational-readiness.md).
- [ADR 0003: Persistence and Asset Ownership Boundaries](../../adr/0003-persistence-and-asset-ownership-boundaries.md).
- [ADR 0006: Risk-Based TDD and QA-Intel Release Controls](../../adr/0006-risk-based-tdd-and-qa-intel-release-controls.md).
- [ADR 0007: Vendor-Neutral Five-Unit Deployment Topology](../../adr/0007-vendor-neutral-five-unit-deployment-topology.md).
- [Foundation Contracts](../../contracts/01-foundation-contracts.md).
- [MVP Implementation Plan — Stage 0](../01-mvp-implementation-plan.md#10-stage-0--execution-foundation).

Accepted product, architecture, and ADR sources govern if this proposed plan
conflicts with them.

Every implementation step must preserve these invariants:

1. Excalidraw remains the sole canvas renderer and canonical visual scene.
2. PostgreSQL stores application, authorisation, asset-metadata, audit, and
   encoded collaboration-persistence records; it does not store an independently
   editable relational scene.
3. Private object storage owns binary bytes; this plan does not place a binary
   in PostgreSQL, Yjs, a health response, or a log.
4. The browser never receives database, object-storage, migration, or
   administrative credentials.
5. Migrations run explicitly before readiness and never race from application
   startup.
6. Liveness never depends on PostgreSQL or object storage; readiness does.
7. Protected and collaboration access remains server-authoritative and
   fail-closed.
8. Guest email, credentials, signed URLs, raw storage keys, raw scenes, Yjs
   updates, recovery content, and binary bodies never enter public health,
   ordinary logs, examples, fixtures, or evidence.
9. Failure cannot appear as a ready service, durable save, ready asset, valid
   empty room, or successful collaboration connection.
10. No implementation choice in this plan selects a hosting vendor or the
    later direct-versus-proxied browser upload design.

---

# 4. Scope

## 4.1 Included

This plan includes:

- Root Docker Compose infrastructure for one local PostgreSQL service and one
  private S3-compatible object-storage service.
- A one-shot, idempotent object-storage initialisation path that creates the
  configured bucket and leaves anonymous access disabled.
- Loopback-only published local ports, service health checks, named local
  volumes, and an isolated internal Compose network.
- Exact dependency and container-image selection under the repository pinning
  policy.
- Ignored local environment handling plus a committed placeholder-only
  `.env.example`.
- Root commands for infrastructure start, non-destructive stop, status,
  migration, migration status, scoped infrastructure verification, and
  application development.
- A SQL-first PostgreSQL client and ordered migration boundary in
  `packages/database`.
- The initial migration for the eight mandatory MVP tables:
  `guests`, `guest_sessions`, `rooms`, `room_memberships`,
  `room_share_links`, `collaboration_documents`, `assets`, and
  `audit_events`.
- Required indexes and database constraints from the accepted persistence
  architecture.
- A supported relational schema-version contract and explicit older/newer
  incompatibility detection.
- Pure, redacted API and collaboration configuration parsing for their owned
  database and object-storage inputs.
- Strict health factories for ready and dependency-specific not-ready results.
- API-owned object-storage client and readiness probing.
- Shared database connectivity and schema-readiness probing used by the API
  and collaboration runtime.
- API and collaboration readiness wiring, bounded dependency timeouts,
  recovery after dependency restoration, and graceful dependency-client
  shutdown.
- Continued pre-document WebSocket rejection with the stable
  `COLLAB_PERMISSION_DENIED` reason.
- Focused unit and infrastructure integration tests needed to prove this slice.
- Process-level smoke coverage for healthy, unavailable, restored, and
  incompatible dependency states.
- Documentation and contract updates for actual commands, configuration,
  ownership, failure behaviour, and known limitations.

## 4.2 Excluded

The following are outside this plan:

- The general Vitest, service-integration, Playwright, synthetic multi-client,
  and QA fixture foundation owned by `FND-004`.
- The non-production inspection-hook boundary owned by `FND-005`.
- The comprehensive clean-machine and final Stage 0 onboarding package owned
  by `FND-006`, beyond documenting this slice's working commands.
- Guest registration, session creation, token transport, authentication,
  capability derivation, or authorisation for a real room.
- Room, membership, invitation, share-link, asset, audit, export, or
  collaboration-bootstrap HTTP routes.
- Repository or domain-service APIs that read or mutate the new tables.
- Seeded guests, sessions, rooms, memberships, assets, audit events, or
  collaboration documents.
- A Yjs document schema, room load/save path, Hocuspocus persistence extension,
  snapshot content, or collaboration-document migration.
- `collaboration_updates`, `exports`, or `deleted_object_index`, which remain
  optional after core reliability.
- Browser upload, signed URLs, proxy streaming, asset lifecycle operations, or
  a choice between direct and API-proxied upload.
- Browser-to-bucket CORS.
- Excalidraw mounting, scene round-trip, product objects, media UI, presence,
  IndexedDB, offline recovery, physics, archive, recycle bin, or general
  export.
- A hosting vendor, remote environment, production credentials, enterprise
  secret manager, Kubernetes, pub/sub, sharding, automatic failover, or
  multi-region infrastructure.
- Production backup and recovery rehearsal; those remain required before the
  release gate but are not needed to prove this local foundation slice.
- Automatic migration or destructive database downgrade during ordinary
  runtime startup.
- A root command that deletes persistent local volumes without a separate,
  explicit data-loss confirmation.

Stage 0 remains `In progress` after this plan passes. Only `FND-003` may change
to `Passed` through this plan.

## 4.3 Allowed incidental changes

The implementer may make these supporting changes only when required by an
included deliverable:

- Update workspace manifests, the exact dependency catalog, and
  `pnpm-lock.yaml`.
- Update `.gitignore` for introduced local secret, generated migration, or
  infrastructure artifacts.
- Add repository-owned scripts that implement the named root commands.
- Update existing Stage 0A smoke code rather than duplicating equivalent
  process orchestration.
- Remove Turbo's deprecated `--parallel` flag when `turbo.json` already
  preserves the same persistent concurrent development behaviour.
- Add focused tests, deterministic fixtures, and isolated infrastructure
  configuration for this slice.
- Add or update contract and package documentation required by the
  implementation.

Incidental work may not add a product feature, a new long-lived runtime, a new
shared package, a second scene model, a public storage fallback, or
client-authoritative permission.

---

# 5. Current state and execution preflight

## 5.1 Verified current state

At plan creation:

- The [Stage 0A plan](./0001-stage-0a-monorepo-scaffold-and-executable-contracts.md)
  is `Passed` for `FND-001` and `FND-002`.
- Node `24.18.0`, pnpm `11.17.0`, the exact dependency catalog, and
  `pnpm-lock.yaml` exist.
- The worktree contains the complete uncommitted Stage 0A implementation and
  documentation. It must be preserved.
- `packages/database` exports an empty reserved boundary and contains no
  driver, schema, migration, repository, or test helper.
- No Compose file, PostgreSQL client, object-storage client, migration, bucket
  initialiser, or local infrastructure command exists.
- API and collaboration configuration parsers contain no database or
  object-storage fields.
- API and collaboration liveness return `200`.
- API and collaboration readiness always returns the strict
  `503 foundation / FOUNDATION_INCOMPLETE` result.
- Every collaboration upgrade is rejected before Hocuspocus creates a Yjs
  document.
- The health contract already allowlists `database`, `object_storage`,
  `persistence`, and `schema` dependencies and their stable error codes.
- The existing application smoke script proves Stage 0A health, route absence,
  WebSocket rejection, and browser-bundle secret exclusions without external
  dependencies.

## 5.2 Mandatory preflight

Before the first implementation mutation, the implementer must:

1. Read the authoritative sources in Section 3 and this complete plan.
2. Run `git status --short` and record the existing dirty-worktree boundary.
3. Run `nvm use`, `node --version`, and `corepack pnpm --version`; require the
   pinned versions.
4. Run `docker version` and `docker compose version`; do not substitute an
   embedded database, SQLite, public bucket, or mock if Docker/Compose is
   unavailable.
5. Check whether the planned local ports are already bound and avoid stopping
   an unrelated user process.
6. Identify whether package downloads and container-image pulls require
   network approval before claiming the first step can pass.
7. Inspect current official support and select exact compatible releases or
   immutable digests for the fixed technologies in Section 6. Record the
   selected artifacts in the implementation record.
8. Confirm no real user or production data is present in any target local test
   resource before running an operation that tears down that isolated resource.

An existing `node_modules`, image cache, container, volume, or bucket is not
completion evidence.

## 5.3 External prerequisites and blockers

- Docker Engine with Compose v2 is required for local and integration proof.
- Initial package installation and container pulls may require network access.
- Local ports for PostgreSQL and the S3-compatible service must be available
  or explicitly overridden through documented non-secret configuration.
- A missing runtime, denied network action, unavailable container runtime, or
  port conflict that cannot be resolved without affecting unrelated work is a
  named blocker.
- Starting, stopping, or removing only resources created under this
  repository's explicit local or test Compose project is in scope.
- Deleting persistent developer volumes, changing global Docker state, or
  stopping unrelated processes is not authorised by this plan.

---

# 6. Fixed implementation decisions

These are implementation decisions within accepted architecture. They do not
change the five-unit topology and do not require a new ADR.

## 6.1 Local infrastructure

- Use a root `compose.yaml`.
- Use PostgreSQL 17 on Alpine for the local relational service.
- Use MinIO for local S3-compatible private object storage and the matching
  MinIO client image for idempotent bucket/user/policy initialisation.
- Commit exact release tags and immutable image digests when the registry
  supports them. Do not use `latest`, an unbounded major tag, or an
  architecture-specific local-only image.
- Bind published PostgreSQL, object-storage API, and optional administration
  ports to `127.0.0.1`.
- Keep the object bucket private. The initialiser must explicitly remove or
  reject anonymous access and create a server credential scoped to the one
  local bucket.
- Keep database and object-storage data in named local volumes. Ordinary
  `infra:down` preserves them.
- Application runtimes continue to run through the pnpm/Turborepo workspace;
  do not containerise them in this slice.
- Do not add Redis, a queue, pub/sub, a reverse proxy, tracing stack, or another
  infrastructure service.

The exact PostgreSQL patch, MinIO release, client release, and image digests are
selected during `S0B-01` from maintained official artifacts, recorded in the
Compose file and execution record, and frozen before implementation proceeds.
This bounded patch selection must not change the technologies or completion
criteria above.

## 6.2 Runtime libraries and version policy

Use:

- `pg` as the only runtime PostgreSQL driver.
- `node-pg-migrate` as the ordered relational migration runner.
- `@types/pg` for TypeScript types where required.
- `@aws-sdk/client-s3` as the API-owned S3-compatible client.

Add every external package as an exact entry in the workspace catalog and use
`catalog:` from consuming manifests. Regenerate and review the pnpm lockfile.
Do not introduce an ORM, schema generator, second migration framework, MinIO
vendor SDK, or runtime dependency on a globally installed CLI.

The SQL migrations are the relational schema source for this slice. Generated
clients or a parallel application schema model are not required.

## 6.3 Environment and secret handling

- Keep `.env`, `.env.*`, and `.env.local` ignored; retain only
  `.env.example`.
- `.env.example` lists required variable names and non-usable placeholders. It
  must not contain a working credential or token.
- Root local commands load `.env.local` explicitly. Application development
  uses Node 24's env-file support when invoking Turbo; Compose commands use the
  same file through `--env-file`.
- Missing `.env.local`, unchanged placeholder values, malformed URLs, invalid
  bucket names, or invalid numeric/boolean values fail with stable field paths
  and codes rather than provider errors or values.
- Demo and production-shaped profiles require explicit secure endpoints and
  credentials. They never reuse local defaults.
- Server secret fields remain absent from the web configuration type, web
  dependency graph, browser bundle, and public documentation examples.

Required ownership:

| Consumer | Configuration categories |
| --- | --- |
| Migration command | Migration-only PostgreSQL URL. |
| API runtime | API PostgreSQL URL; object-storage endpoint, region, bucket, access key, secret key, and path-style setting. |
| Collaboration runtime | Collaboration PostgreSQL URL. |
| Compose initialisation | Local PostgreSQL administration and object-storage administration values used only to create scoped runtime identities. |

Concrete environment-variable names are owned by `packages/config`, root
tooling, and the eventual infrastructure contract reference. The expected
server names are:

```text
MIGRATION_DATABASE_URL
API_DATABASE_URL
COLLABORATION_DATABASE_URL
OBJECT_STORAGE_ENDPOINT
OBJECT_STORAGE_REGION
OBJECT_STORAGE_BUCKET
OBJECT_STORAGE_ACCESS_KEY
OBJECT_STORAGE_SECRET_KEY
OBJECT_STORAGE_FORCE_PATH_STYLE
```

Compose-only administration names must not enter either application
configuration parser.

## 6.4 Database roles and migration ownership

Local initialisation creates distinct identities:

- A migration identity that owns DDL and applies ordered migrations.
- An API runtime identity with only the table and sequence access required by
  accepted API-owned operations.
- A collaboration runtime identity with read access to session/room authority
  records and read/write access to collaboration persistence records required
  by the accepted later runtime.

The migration command runs explicitly before either runtime can be ready.
Application startup must never apply, roll back, repair, or race migrations.
Runtime identities must not own application tables or receive `CREATE` on the
application schema. They may receive database `TEMP` plus the narrowly listed
table and sequence privileges needed for readiness and their accepted owning
boundaries. Later work must add privileges explicitly when it adds an owning
operation; this migration must not grant a blanket future capability.

Runtime readiness checks the committed migration ledger against the exact
supported migration set:

- Missing committed migrations mean the schema is older and unsupported.
- An applied migration unknown to the runtime means the schema is newer and
  unsupported.
- A failed or partially applied migration prevents readiness.
- The root migration command uses one migration connection, acquires a
  repository-constant PostgreSQL advisory lock before invoking
  `node-pg-migrate` with that connection, and releases it in `finally` or by
  closing the failed connection. A bounded lock-acquisition failure stops the
  command; it never starts a competing migration.
- The first migration may define a down path for isolated migration tests, but
  ordinary local or demo startup must not invoke it.

## 6.5 Initial mandatory relational schema

The first ordered migration creates only these mandatory tables:

| Table | Required ownership and constraints |
| --- | --- |
| `guests` | Native UUID primary key; private non-unique normalised email; visible username/colour; timestamps and disablement fields. |
| `guest_sessions` | Native UUID primary key; guest foreign key; unique token hash; expiry/revocation fields; no raw token column. |
| `rooms` | Native UUID primary key; creator foreign key; active/archived check; collaboration and Excalidraw versions; archive metadata. |
| `room_memberships` | Native UUID primary key; room/guest foreign keys; unique room/guest pair; owner/editor/viewer check; revocation metadata. |
| `room_share_links` | Native UUID primary key; room and creator foreign keys; unique token hash; editor/viewer-only default-role check; expiry/revocation/use limits; no raw token column. |
| `collaboration_documents` | Room primary/foreign key; encoded snapshot and optional state vector as binary fields; schema and Excalidraw versions; sequence and timestamps. |
| `assets` | Native UUID primary key; room/creator foreign keys; private generated storage key; kind/status checks; bounded metadata fields; no binary body or signed URL column. |
| `audit_events` | Native UUID primary key; optional room/actor foreign keys; stable event/target fields; JSON metadata and request identifier; no dedicated email/token field. |

The migration also creates:

- Foreign keys, non-null constraints, unique constraints, and the accepted text
  check constraints.
- Non-negative checks for counters, sizes, dimensions, and durations where
  those values are present.
- The required or recommended indexes in
  [Data Model and Persistence](../../architecture/03-data-model-and-persistence.md#41-database-indexes),
  excluding indexes for optional tables.
- The migration framework's private ledger.

The migration must not:

- Create `collaboration_updates`, `exports`, or `deleted_object_index`.
- Seed a guest, session, room, membership, share link, Yjs document, asset, or
  audit event.
- Add an independently editable table for Excalidraw elements.
- Store a raw token, credential, signed URL, binary asset body, or guest email
  copy outside its authoritative private field.
- Add triggers or stored procedures containing business permission policy.

Text columns with check constraints implement accepted enum-like values for
this MVP. PostgreSQL native `uuid`, `timestamptz`, `bytea`, and `jsonb` map to
the accepted TypeScript and persistence contracts.

## 6.6 `packages/database` boundary

`packages/database` owns:

- Pool creation for an already-validated server configuration.
- A supported migration-set/schema-version constant.
- Ordered migration commands and status inspection.
- A bounded database readiness probe.
- Pool shutdown.
- SQL/migration artifacts and focused schema tests.

It must not own:

- Environment parsing.
- HTTP or WebSocket health responses.
- Permission, session, room, membership, asset, or audit business policy.
- Domain repositories or services before a product slice needs them.
- Yjs schema validation or Excalidraw normalisation.
- Object-storage access.

The readiness probe verifies, with a bounded timeout:

1. Authenticated connectivity.
2. The expected database and runtime identity can be used.
3. The applied migration set exactly matches the supported set.
4. Required tables and the runtime's expected grants are present.
5. A transaction-scoped temporary table can be created, written, read, and
   discarded on the same checked-out connection. This uses the runtime's
   database `TEMP` privilege, does not require `CREATE` on the application
   schema, and never touches or retains a product row.

It returns an internal typed result and never exposes the URL, username,
password, database contents, SQL text containing values, or raw driver error.

## 6.7 API-owned object-storage boundary

The API owns a small infrastructure adapter using `@aws-sdk/client-s3`.
Collaboration and web code must not import it.

The adapter owns:

- Client construction from already-validated API configuration.
- Bucket identity and authenticated capability verification.
- A bounded active probe using a generated non-user key under a reserved
  readiness prefix.
- Create, read, content-type verify, and delete of a tiny synthetic probe
  object.
- Cleanup in `finally`, client shutdown where supported, timeout, and safe
  error classification.

Runtime readiness may cache a successful active probe for a short bounded
interval, but it must revalidate after a failure and demonstrate not-ready to
ready recovery. A public readiness request must not create unbounded objects,
leave failed probe content indefinitely, or use a real room/asset key.
Infrastructure verification separately proves that anonymous list and read
access fail while a synthetic probe object exists; a healthy authenticated
runtime probe alone is not evidence that the bucket is private.

This slice does not expose upload, download, presigning, streaming, lifecycle,
or cleanup APIs. Browser CORS remains disabled because the later upload
transport decision is unresolved.

## 6.8 Health and readiness semantics

Liveness remains the existing exact three-field contract and never queries an
external dependency.

Ready remains the exact three-field contract:

```json
{
  "service": "api",
  "state": "ready",
  "releaseId": "local-dev"
}
```

The collaboration response differs only in `service`.

Not-ready remains the exact five-field contract. Dependency/code combinations
used by this slice are fixed:

| Dependency | Error code | Runtime |
| --- | --- | --- |
| `database` | `DATABASE_UNAVAILABLE` | API and collaboration |
| `schema` | `SCHEMA_UNSUPPORTED` | API and collaboration |
| `object_storage` | `OBJECT_STORAGE_UNAVAILABLE` | API |
| `persistence` | `PERSISTENCE_UNAVAILABLE` | Collaboration |

Contract factories must prevent mismatched dependency/error combinations.
Health bodies contain no arbitrary message or diagnostic field.

Readiness evaluation order is deterministic:

```text
startup configuration parsing
→ database connectivity
→ relational schema compatibility
→ collaboration persistence boundary initialisation, for collaboration
→ object-storage readiness, for API
→ exact ready response
```

Invalid required configuration fails startup with the existing redacted
configuration error. Dependency unavailability after valid configuration does
not kill the process: liveness remains `200` and readiness returns the
appropriate `503`.

The collaboration runtime's current server-owned authority implementation is
an explicit deny-all foundation policy. Initialising that policy allows the
runtime to be operationally ready for its current Stage 0B behaviour while
every room connection still receives `403 COLLAB_PERMISSION_DENIED` before a
Yjs document exists. Readiness does not claim that guest sessions, roles,
rooms, or collaboration are implemented.

## 6.9 Root command contract

Implementation must publish these root commands and document any prerequisite:

| Command | Required behaviour |
| --- | --- |
| `corepack pnpm infra:up` | Validate local environment input, start only repository infrastructure, wait for container health, and initialise the private bucket and scoped identities. |
| `corepack pnpm infra:down` | Stop only this repository's local infrastructure and preserve named data volumes. |
| `corepack pnpm infra:status` | Report bounded service/health state without credentials or provider payloads. |
| `corepack pnpm db:migrate` | Apply committed migrations with the migration identity; never start application runtimes. |
| `corepack pnpm db:migrate:status` | Report supported, pending, failed, or unknown migration state without a connection string. |
| `corepack pnpm infra:check` | Prove PostgreSQL/schema and private-object-storage readiness through bounded server-side probes. |
| `corepack pnpm test:integration:foundation` | Run this slice's isolated migration, storage, health, dependency-failure, and recovery proof against uniquely named test resources. |
| `corepack pnpm dev` | Load the documented local environment and run the three application processes through Turbo after infrastructure and migrations are ready. |

No named command deletes persistent developer volumes. Test teardown may
remove only uniquely named test containers, networks, buckets, databases, and
volumes created by that test run.

---

# 7. Deliverables and ownership

| Deliverable | Owning boundary | Required output |
| --- | --- | --- |
| Local topology | Root Compose and infrastructure scripts | Pinned PostgreSQL, MinIO, initialiser, health checks, loopback ports, private network, and persistent local volumes. |
| Local configuration handoff | Root `.env.example`, ignored `.env.local`, root scripts | One documented env-file path with placeholder-only committed values and redacted validation. |
| Migration system | `packages/database` | `pg`, `node-pg-migrate`, migration ledger, initial migration, status command, and exact supported-set detection. |
| Initial schema | `packages/database/migrations` | Eight mandatory tables plus accepted constraints and indexes; no optional or seeded domain state. |
| Database runtime boundary | `packages/database` | Pool lifecycle and typed bounded readiness result; no business repositories. |
| Server configuration | `packages/config` | Pure API/collaboration parsing for owned database/storage fields with positive, negative, non-local, and redaction tests. |
| Health contracts | `packages/contracts` | Strict ready and dependency-not-ready factories with valid dependency/code mappings. |
| Object-storage readiness | API infrastructure boundary | Server-only S3-compatible client and bounded private-bucket probe. |
| API readiness | `apps/api` | Async dependency readiness, exact status/body mapping, and graceful client shutdown. |
| Collaboration readiness | `apps/collaboration` | Database/schema/persistence readiness plus unchanged pre-document connection rejection. |
| Infrastructure proof | Root scripts and focused tests | Healthy, interrupted, incompatible, restored, private, cleanup, and scope assertions. |
| Documentation | Root, contract, package, and planning docs | Actual commands, configuration ownership, readiness semantics, failure behaviour, limitations, and completed evidence. |

Authoritative database state, stored object bytes, transient client handles,
cached probe results, public health projections, and generated test artifacts
must remain distinguishable.

---

# 8. Execution steps

| Step | Action | Depends on | Required outputs | Verification | Status |
| --- | --- | --- | --- | --- | --- |
| `S0B-01` | Run preflight and freeze infrastructure/package artifacts. | `FND-001`, `FND-002`, completed plan `0001` | Recorded runtime and Docker versions; exact package versions; exact PostgreSQL/MinIO/client image tags and digests; confirmed worktree boundary; known approvals and ports. | Version commands, official-artifact inspection, `git status --short`, catalog/Compose review. | Passed |
| `S0B-02` | Add local environment, Compose topology, private bucket initialisation, and root lifecycle commands. | `S0B-01` | `compose.yaml`, placeholder `.env.example`, ignored local env policy, PostgreSQL and MinIO health checks, scoped identities, private bucket, non-destructive start/stop/status commands. | `infra:up`, container-health inspection, anonymous bucket denial, `infra:status`, `infra:down`, restart with volumes preserved. | Passed |
| `S0B-03` | Extend configuration and health contracts before runtime wiring. | `S0B-01` | Redacted API/collaboration server configuration; exact ready and dependency-not-ready factories; dependency/code mapping tests; browser export remains unchanged. | Focused config/contract tests, strict typecheck, bundle forbidden-field inspection. | Passed |
| `S0B-04` | Implement SQL-first migrations, the initial schema, schema status, and database readiness boundary. | `S0B-02`, `S0B-03` | `pg` pool lifecycle; `node-pg-migrate` commands; eight-table migration; constraints/indexes; exact supported migration detection; bounded readiness probe; no repositories or seed data. | Empty migration, no-op rerun, schema inspection, constraint tests, older/newer mismatch tests, teardown/recreate proof. | Passed |
| `S0B-05` | Implement the API-owned private object-storage readiness adapter. | `S0B-02`, `S0B-03` | Validated server-only client; private-bucket check; bounded create/read/content-type/delete probe; cleanup and stable safe failures; no asset route or browser CORS. | Authenticated probe, anonymous denial, missing bucket, unavailable service, cleanup, log/response redaction tests. | Passed |
| `S0B-06` | Wire API liveness/readiness and dependency lifecycle. | `S0B-04`, `S0B-05` | Liveness independent of dependencies; deterministic database/schema/storage readiness; exact `200`/`503` bodies; recovery after restore; graceful shutdown. | API process smoke across healthy, database-down, schema-mismatch, storage-down, and restored states. | Passed |
| `S0B-07` | Wire collaboration liveness/readiness while retaining the deny-all access boundary. | `S0B-04` | Database/schema/persistence readiness; exact `200`/`503` bodies; initialised deny-all authority; unchanged `403 COLLAB_PERMISSION_DENIED` before document creation; graceful shutdown. | Collaboration HTTP/WebSocket smoke across healthy, database-down, schema-mismatch, persistence-failure, and restored states. | Passed |
| `S0B-08` | Integrate isolated infrastructure verification and root regression gates. | `S0B-06`, `S0B-07` | Unique test resource naming; bounded failure injection and recovery; cleanup; updated application smoke; no domain routes, seeded rows, leaked secrets, residual probe objects, or claimed FND-004 foundation. | `test:integration:foundation`, root check, application smoke, coverage, boundary verification, generated-artifact and process cleanup inspection. | Passed |
| `S0B-09` | Reconcile documentation and execute the completion audit. | `S0B-08` | Updated root/contribution/contract/package docs; actual command/config/port/image records; completed evidence and progress; updated plan index; scope/privacy/diff audit. | `docs:check`, targeted contradiction/privacy searches, `git diff --check`, complete diff and plan-readiness/completion review. | Passed |

Execution rules:

- Change the plan and index to `In progress` immediately before the first
  implementation mutation.
- Keep at most one step `In progress`.
- A failed prerequisite becomes a stable blocker record; it does not permit an
  embedded substitute, mock, public bucket, weakened schema check, or narrowed
  completion statement.
- Run dependency-failure tests only against uniquely named local test
  resources. Never pause or remove an unrelated or production dependency.
- Record checkpoint outcomes and concise evidence in this plan.
- Do not mark `FND-004`, `FND-005`, `FND-006`, or Stage 0 as passed.

---

# 9. Data and control flows

## 9.1 Local infrastructure bootstrap

```text
Developer invokes infra:up
→ Root tooling validates ignored local environment input without printing it
→ Compose starts PostgreSQL and MinIO on the private project network
→ Container health checks pass
→ One-shot initialiser creates scoped identities and the configured bucket
→ Initialiser enforces no anonymous bucket access
→ Root tooling reports bounded service readiness
OR
→ Command fails with a stable owning-service category and preserves existing volumes
```

The initialiser is idempotent. It does not create product rows or asset
objects.

## 9.2 Migration

```text
Developer or deployment invokes db:migrate
→ Migration-only configuration is parsed and redacted
→ Migration identity acquires the migration runner's supported lock
→ Pending committed migrations apply in order inside supported transactions
→ Migration ledger records the applied set
→ Runtime grants are reconciled
→ db:migrate:status reports exact compatibility
OR
→ Migration stops, records a bounded failure, preserves recoverable database state,
  and application readiness remains schema/not-ready
```

Application startup never enters this flow.

## 9.3 API readiness

```text
GET /health/ready
→ API configuration was already validated
→ Database probe checks connectivity and exact migration set
→ Object-storage probe checks private mandatory bucket capability
→ Return exact 200 ready response
OR
→ Return the first deterministic exact 503 dependency/code response
```

No readiness branch reads or writes a real room, asset, guest, or
collaboration document.

## 9.4 Collaboration readiness and access

```text
GET /health/ready
→ Collaboration configuration was already validated
→ Database probe checks connectivity and exact migration set
→ Persistence boundary and deny-all authority policy are initialised
→ Return exact 200 ready response

Any WebSocket room upgrade
→ Server-owned deny-all policy runs before a document exists
→ Return 403 COLLAB_PERMISSION_DENIED
→ Allocate no Yjs room document
```

Operational readiness for the safe Stage 0B runtime is not a claim that real
collaboration is implemented.

## 9.5 Dependency interruption and recovery

```text
Dependency becomes unavailable
→ Application process remains live
→ Readiness probe times out within a bounded interval
→ Public response maps only to stable dependency/code
→ Protected or dependent traffic remains unavailable
→ Dependency is restored
→ Probe revalidates current capability and schema
→ Readiness returns exact ready without fabricated or lost product state
```

## 9.6 Shutdown

```text
SIGINT or SIGTERM
→ Runtime stops accepting work
→ Database pool and object-storage client resources close
→ HTTP/WebSocket server stops
→ Process exits without leaking credentials or leaving probe content
```

---

# 10. Failure and security behaviour

| Failure | Required behaviour |
| --- | --- |
| Missing or malformed required server configuration | Fail startup with `CONFIGURATION_INVALID` and field paths/codes only; do not print values. |
| PostgreSQL unavailable after valid startup configuration | API and collaboration remain live; readiness is `503 database / DATABASE_UNAVAILABLE`; no durability claim. |
| Migration missing, partial, or unknown newer migration present | Runtimes remain live; readiness is `503 schema / SCHEMA_UNSUPPORTED`; no automatic repair or downgrade. |
| Collaboration persistence boundary fails to initialise | Collaboration remains live; readiness is `503 persistence / PERSISTENCE_UNAVAILABLE`; every upgrade remains denied. |
| Object-storage endpoint or bucket unavailable | API remains live; readiness is `503 object_storage / OBJECT_STORAGE_UNAVAILABLE`; no asset-ready claim. |
| Anonymous bucket access succeeds | Infrastructure verification fails; bucket is not considered private or ready. |
| Readiness probe times out | Map to the owning stable dependency code; cancel or abandon the bounded probe safely. |
| Probe object create/read/delete fails | API is not ready; best-effort cleanup runs; residual keys are detected and reported without revealing the key. |
| Migration fails | Stop dependent readiness, preserve the database and migration evidence, and do not run a destructive rollback automatically. |
| Local port belongs to another process | Report a blocker or use a documented override; do not kill the process. |
| Docker or network access is unavailable | Record the exact prerequisite blocker; do not replace real dependencies with mocks and do not claim integration evidence. |
| Ordinary collaboration upgrade occurs | Reject with stable `COLLAB_PERMISSION_DENIED` before document creation even when readiness is otherwise `200`. |
| Shutdown occurs during a probe | Cancel/close clients, preserve database/object data, and avoid an unbounded hanging process. |

Security requirements:

- Bind local infrastructure ports to loopback only.
- Keep the bucket private and runtime credentials scoped to the one bucket.
- Separate migration and runtime database privileges.
- Never place a secret, raw token, signed URL, storage key, connection string,
  guest email, raw scene/Yjs content, or binary body in health responses,
  public docs, logs, fixtures, snapshots, reports, or the web bundle.
- Use synthetic, run-scoped test names and payloads.
- Do not use real application tables for retained readiness records.
- Do not log raw PostgreSQL, AWS SDK, MinIO, or Docker error objects.
- Do not enable permissive browser CORS or public bucket access as a local
  convenience.
- Do not run destructive volume, bucket, or database cleanup outside the
  explicitly named isolated test project.

---

# 11. Testing and evidence

## 11.1 Required test levels

### Unit and contract tests

Cover:

- Server database URL, object endpoint, region, bucket, credential presence,
  and path-style parsing.
- Required explicit non-local values and secure non-local endpoints.
- Invalid/missing values produce field paths and stable codes without retaining
  values.
- Exact ready and not-ready schemas.
- Every allowed dependency/error pair and rejection of mismatched pairs.
- Database readiness result mapping.
- Object-storage readiness error classification and cleanup branching.
- No server configuration export enters the web graph.

### Migration and database integration tests

Against an isolated PostgreSQL instance:

- Apply the migration to an empty database.
- Re-run with no duplicate objects or changed schema.
- Inspect exactly the eight required domain tables plus migration-owned
  metadata.
- Prove native UUID, foreign-key, unique, non-null, role/status, and
  non-negative constraints.
- Prove required indexes exist.
- Prove raw token, signed URL, binary asset body, or live-element table is
  absent.
- Detect a missing committed migration as older/unsupported.
- Detect an unknown applied migration as newer/unsupported.
- Prove migration failure leaves readiness unavailable and recoverable evidence
  intact.
- Prove runtime identities cannot perform migration DDL.

### Object-storage integration tests

Against an isolated private bucket:

- Initialisation is idempotent.
- Anonymous read/list access is denied.
- API runtime credentials can create, read, content-type check, and delete the
  tiny readiness object.
- A missing bucket, invalid scoped credential, or stopped service yields the
  exact stable unavailable result.
- Probe cleanup removes the object after success and failure where possible.
- No browser CORS or public policy is introduced.
- No credentials or raw keys appear in output.

### Process and protocol smoke tests

Prove:

- API and collaboration live `200` while all dependencies are healthy.
- API and collaboration ready `200` with exact three-field bodies.
- Stopping the isolated PostgreSQL test service leaves both processes live and
  changes readiness to exact database `503`.
- Restoring PostgreSQL changes readiness back to exact `200`.
- Stopping only object storage leaves collaboration ready, leaves API live, and
  changes API readiness to exact object-storage `503`.
- Restoring object storage changes API readiness back to exact `200`.
- An isolated unsupported schema produces exact schema `503`.
- A collaboration persistence initialisation failure produces exact
  persistence `503`.
- Unknown HTTP domain routes remain `404`.
- Every collaboration WebSocket upgrade remains `403
  COLLAB_PERMISSION_DENIED`.
- The web shell remains available and its bundle contains none of the new
  server configuration names or secret values.

### Regression and documentation tests

Run:

```text
corepack pnpm install --frozen-lockfile
corepack pnpm check
corepack pnpm test:coverage
corepack pnpm infra:check
corepack pnpm test:integration:foundation
corepack pnpm smoke:apps
corepack pnpm docs:check
git diff --check
```

If one command intentionally starts the isolated dependencies required by a
later command, document the lifecycle and prove cleanup. A skipped Docker
integration gate is not passing evidence.

## 11.2 Evidence matrix

| Requirement | Done condition | Proof command or artifact | Result | Evidence |
| --- | --- | --- | --- | --- |
| `E-01` — Reproducible selections and preflight | Pinned Node/pnpm, Docker/Compose, exact package releases, exact PostgreSQL/MinIO/client images, ports, approvals, and dirty-worktree boundary are verified and recorded. | Version commands; catalog, lockfile, Compose, official-artifact, port, and status inspection. | Passed | Node 24.18.0; pnpm 11.17.0; Docker 29.4.3; Compose 5.1.3; `pg` 8.22.0; `node-pg-migrate` 9.0.0; AWS S3 client 3.1095.0; three container digests recorded in `compose.yaml`. |
| `E-02` — Private local infrastructure | Root commands start healthy loopback PostgreSQL and MinIO, initialise scoped identities and a private bucket idempotently, preserve volumes on ordinary stop, and expose no anonymous object access. | `infra:up`; `infra:status`; container health; private-bucket tests; `infra:down`; restart proof. | Passed | Existing developer volumes preserved; two consecutive `infra:up` runs passed; final `infra:check` proved private storage, anonymous denial, scoped roles, and cleanup. |
| `E-03` — Ordered mandatory migration | An empty database reaches exactly the supported eight-table schema with accepted constraints/indexes; rerun is a no-op; optional tables and seeded product state are absent. | `db:migrate`; `db:migrate:status`; schema/constraint/index integration tests and inspection. | Passed | Local migration `004` applied and reran as no-op; isolated empty database applied migrations `001`–`004` in order, reran as no-op, and passed exact schema inspection. |
| `E-04` — Schema compatibility and privilege boundary | Older, partial, failed, and unknown newer migration states are not ready; runtime roles cannot migrate; no automatic runtime migration or destructive downgrade exists. | Focused migration-state, failure, lock, and role tests; application-startup inspection. | Passed | Unit classification rejects partial/reordered/unknown sets; integration rejects an injected unknown migration and proves API/collaboration DDL denial and scoped table privileges. |
| `E-05` — Configuration and secret isolation | API/collaboration configuration parses the owned fields, fails safely, uses placeholder-only committed examples, and remains absent from the web graph and bundle. | Config tests; `.gitignore`/`.env.example` inspection; bundle forbidden-field scan; bounded privacy search. | Passed | Seventeen configuration tests pass; `.env.example` contains only unusable placeholders; final smoke scans every built web file for server fields and usable local values. |
| `E-06` — Database runtime boundary | Pool lifecycle and bounded readiness checks prove connectivity, exact schema, isolated transactional capability, and safe shutdown without business repositories or leaked driver data. | Database unit/integration tests; public-export and source review; shutdown smoke. | Passed | Eight database tests plus isolated connectivity, schema, TEMP/BYTEA, privilege-loss, interruption, process-survival, recovery, and teardown checks pass. |
| `E-07` — Private object-storage boundary | The API-owned client proves the private bucket's bounded create/read/content-type/delete capability, handles failure and cleanup safely, and exposes no asset route or browser CORS. | Storage integration tests; anonymous denial; residual-object, route, CORS, output, and import inspection. | Passed | Storage unit tests cover success, cleanup failure, and unavailable service; live and isolated checks prove private create/read/content-type/delete and no residual `.health/` object. |
| `E-08` — API health and recovery | API liveness never depends on dependencies; readiness is exact `200` when usable and exact database/schema/object-storage `503` when not; recovery returns to ready. | API process smoke with isolated failure injection and restoration; exact key/body assertions. | Passed | Final isolated integration proves live/ready, database/schema/storage not-ready, liveness during outages, and recovery; final application smoke proves exact healthy contracts and route absence. |
| `E-09` — Collaboration health and fail-closed access | Collaboration readiness is exact for database/schema/persistence states, recovery works, and every room upgrade is still denied before a Yjs document exists. | Collaboration HTTP/WebSocket smoke; document-allocation and route-absence inspection. | Passed | Final isolated integration proves database/schema/persistence failure and recovery; denied upgrade remains `403 COLLAB_PERMISSION_DENIED`, process liveness survives, and no room route/document is exposed. |
| `E-10` — Integrated quality, documentation, privacy, and scope | Root checks, coverage, infrastructure integration, application smoke, docs, links, privacy/scope searches, generated-artifact cleanup, and full diff review pass; later work remains unclaimed. | Required command block; targeted source/output searches; `git status --short`; `git diff --check`; plan/index audit. | Passed | Frozen install, root check, 47 unit tests, coverage, live status/check, final isolated integration with cleanup, final smoke, 41-file docs check, stale-claim/privacy searches, and diff check pass on 26 July 2026. |

Every row is mandatory. Replace `Pending` with a dated concise result or a
durable artifact link during execution. Do not paste secrets, private data,
container environment dumps, raw connection strings, signed URLs, storage
keys, database rows, or unbounded command output into this plan.

---

# 12. Execution record

## 12.1 Progress log

| Date | Checkpoint | Outcome | Verification | Next step |
| --- | --- | --- | --- | --- |
| 26 July 2026 | Goal-ready plan prepared | `FND-003` scope, fixed choices, exclusions, commands, failure behaviour, evidence, and stopping condition pass the task-plan readiness gate. | Source-of-truth review; current implementation inspection; plan/index consistency and model-neutrality audit. | Start `S0B-01` after implementation is dispatched. |
| 26 July 2026 | Initial implementation review reopened | Prior completion evidence was invalidated by split local configuration, broad grants, permissive readiness/smoke behavior, simulated migration coverage, and stale documentation. | Full source, test, plan, and live-environment review; remediation plan `0003`. | Repair under plan `0003` and rerun every mandatory row. |
| 26 July 2026 | Local infrastructure and migration repaired | Existing developer volumes were preserved; pinned infrastructure initialised twice; migration `004`, exact status, scoped privileges, private storage, and cleanup passed. | Two `infra:up` runs; migration plus no-op rerun; `db:migrate:status`; `infra:check`. | Prove clean-stack failures and recovery. |
| 26 July 2026 | Isolated integration passed | Clean migrations, privacy, exact health, database/MinIO interruption, unknown schema, collaboration privilege loss, recovery, WebSocket process survival, and test-volume cleanup passed. | Final `corepack pnpm test:integration:foundation`. | Run final static, coverage, smoke, docs, privacy, and diff gates. |
| 26 July 2026 | Completion audit closed | All implementation, live, isolated, smoke, coverage, documentation, privacy, scope, and diff requirements pass; no mandatory blocker remains. | Frozen install; `corepack pnpm check`; coverage; live status/check; integration; smoke; docs check; searches; `git diff --check`; plan/index review. | Preserve Stage 0B record; `FND-004` through `FND-006` remain unimplemented. |

Update this log at meaningful checkpoints. Do not use it as a substitute for
step status or evidence.

## 12.2 Decisions and blockers

| ID | Type | Description | Evidence | Resolution |
| --- | --- | --- | --- | --- |
| `DEC-S0B-001` | Decision | Use root Docker Compose with PostgreSQL 17 and MinIO for the accepted local five-unit topology; select exact maintained release tags/digests during preflight. | Accepted deployment architecture and ADR 0007; Section 6.1 constraints. | Implemented with the three immutable digests recorded in `compose.yaml` and `E-01`. |
| `DEC-S0B-002` | Decision | Use SQL-first migrations with `pg` and `node-pg-migrate`; do not add an ORM or second schema framework. | Database package ownership and accepted SQL migration strategy. | Fixed for this plan; verify under `S0B-03`, `S0B-04`, `E-03`, and `E-06`. |
| `DEC-S0B-003` | Decision | Create all eight mandatory MVP tables in the initial migration but no optional tables, seed data, repositories, or domain services. | Data Model and Persistence Sections 47 and 64; parent `FND-003`. | Fixed for this plan; verify under `S0B-04`, `E-03`, and `E-10`. |
| `DEC-S0B-004` | Decision | Separate migration credentials and commands from API/collaboration runtime credentials; application startup never runs migrations. | Deployment migration and secret policies. | Fixed for this plan; verify under `E-04`. |
| `DEC-S0B-005` | Decision | Healthy infrastructure makes both shells operationally ready while the collaboration authority remains an explicit server-owned deny-all policy. | Foundation contract says Stage 0A `503` lasts until `FND-003`; no real room access exists before later stages. | Fixed for this plan; verify exact health and WebSocket behaviour under `E-08` and `E-09`. |
| `DEC-S0B-006` | Decision | Keep the object-storage adapter inside the API boundary and omit upload transport, browser CORS, and presigning until the later asset decision gate. | ADR 0003 and Asset and Media Architecture. | Fixed for this plan; verify under `E-07` and `E-10`. |

No blocker is known at plan readiness. Add a stable `BLK-S0B-NNN` row with the
exact failed dependency, evidence, mandatory-scope consequence, and safe
resolution before marking a step `Blocked`.

## 12.3 Assumptions requiring execution verification

- Docker Engine and Compose v2 can run Linux container images on the execution
  host.
- Maintained exact image releases exist for the fixed PostgreSQL 17 and MinIO
  choices.
- The selected `pg`, `node-pg-migrate`, AWS SDK, and type packages support
  Node 24, ESM, strict TypeScript, and the workspace's license constraints.
- Required loopback ports are available or can be overridden without changing
  documented defaults or affecting unrelated processes.
- The existing Stage 0A tests remain valid after readiness changes are
  intentionally updated.
- No existing local container/volume with the repository's intended project
  name contains user data that may be removed by isolated test teardown.

Each assumption must be proven before it becomes evidence. A failed assumption
becomes a blocker or a bounded implementation correction that preserves every
fixed decision and completion criterion.

---

# 13. Documentation updates required during implementation

Implementation must reconcile:

- Root `README.md`: Stage 0B status, prerequisites, infrastructure/migration/dev
  commands, ports, server configuration categories, readiness meanings,
  troubleshooting, and current limitations.
- `CONTRIBUTING.md`: local infrastructure lifecycle, migration discipline,
  focused integration commands, secret handling, and non-destructive teardown.
- `.env.example` and `.gitignore`: placeholder-only committed configuration and
  ignored usable local values.
- `docs/contracts/README.md`: index the new infrastructure/readiness contract
  reference.
- A new focused contract reference under `docs/contracts/` for the implemented
  local topology, configuration ownership, migration set, health mappings,
  failure behaviour, security, tests, and definition of done.
- `docs/contracts/01-foundation-contracts.md`: replace future-tense `FND-003`
  statements only where the implemented Stage 0B contract supersedes them;
  preserve Stage 0A history.
- `packages/database` package documentation: public exports, migration
  commands, schema ownership, readiness semantics, and explicit non-goals.
- This plan: step status, exact version/image decisions, progress, blockers,
  evidence, date, and final execution status.
- `docs/planning/plans/README.md`: matching final execution status.

Do not add the individual plan to `docs/planning/README.md`; that parent index
delegates the complete task-plan catalog to
[this folder index](./README.md).

No new ADR is required unless implementation cannot preserve a fixed decision
or accepted architecture and the user explicitly accepts a significant
replacement.

---

# 14. Definition of done

Stage 0B passes only when:

- [x] Every included deliverable exists at its assigned owning boundary.
  (`E-02` through `E-09`)
- [x] Exact package and container artifacts are pinned, compatible, and
  recorded after a complete preflight. (`E-01`)
- [x] Root commands start, inspect, stop, and restart only this repository's
  local PostgreSQL and private object-storage resources without deleting
  persistent developer data. (`E-02`)
- [x] The configured object bucket is private, server-accessible, and proven by
  a bounded clean create/read/content-type/delete operation. (`E-02`, `E-07`)
- [x] The explicit migration command creates exactly the supported mandatory
  schema from an empty database and a rerun is safe. (`E-03`)
- [x] Required foreign keys, uniqueness, text checks, non-negative checks, and
  indexes exist; optional tables, seed data, and a relational scene model do
  not. (`E-03`)
- [x] Older, partial, failed, and unknown newer migration states prevent
  readiness without automatic repair, downgrade, or data loss. (`E-04`)
- [x] Migration, API, and collaboration database identities preserve the
  required privilege separation. (`E-04`)
- [x] Server configuration is runtime validated and redacted, committed
  examples contain no usable secret, and no server field enters web code or the
  browser bundle. (`E-05`)
- [x] The database package owns only client, migration, schema, readiness, and
  shutdown concerns; domain policy remains absent. (`E-06`)
- [x] API liveness stays `200`; API readiness returns exact ready,
  database/schema/object-storage failure, and restored states. (`E-08`)
- [x] Collaboration liveness stays `200`; collaboration readiness returns exact
  ready, database/schema/persistence failure, and restored states. (`E-09`)
- [x] Every collaboration upgrade remains fail-closed before document
  allocation, and no product route exists. (`E-09`)
- [x] Dependency failures expose no credential, connection string, hostname
  where unnecessary, provider payload, stack, storage key, database row,
  private identity, scene/Yjs data, or binary. (`E-05`, `E-07`, `E-08`,
  `E-09`, `E-10`)
- [x] Every required unit, migration, integration, process-smoke, coverage,
  documentation, privacy, boundary, and diff gate passes without skipped
  mandatory coverage. (`E-03` through `E-10`)
- [x] The evidence matrix has no `Pending`, `Failed`, or `Blocked` mandatory
  row. (`E-01` through `E-10`)
- [x] Documentation, commands, contracts, package ownership, limitations, this
  plan, and the task-plan index match the implemented state. (`E-10`)
- [x] `FND-004` through `FND-006`, Stage 0 completion, Stage 1, and every
  excluded product feature remain unclaimed. (`E-10`)
- [x] No unresolved decision, assumption, question, or blocker prevents the
  goal objective. (`E-01`, `E-10`)
- [x] The final diff preserves pre-existing Stage 0A and user changes and
  contains no unintended artifact. (`E-10`)

---

# 15. Completion audit

Before changing execution status to `Passed` or allowing the goal to complete:

1. Re-read the objective, completion statement, authoritative precedence,
   fixed decisions, included scope, exclusions, incidental-change boundary,
   and external-authority limits.
2. Confirm each execution step is `Passed` in dependency order.
3. Map every Section 14 checkbox to the named current evidence rows.
4. Inspect the actual Compose file, env handling, catalog, lockfile, package
   exports, migrations, schema, grants, runtime wiring, probes, health
   responses, scripts, tests, and documentation.
5. Recreate the isolated infrastructure from a clean test state and rerun the
   empty migration, no-op rerun, private-bucket, healthy readiness, dependency
   failure, restoration, WebSocket rejection, and cleanup proofs.
6. Treat a cached image, pre-existing schema, manually corrected bucket,
   skipped Docker test, stale command, flaky retry, narrow health assertion, or
   indirect inspection as incomplete evidence.
7. Confirm every test resource is isolated and cleaned, no probe object
   remains, and no persistent developer volume was removed.
8. Search source, built web output, logs, fixtures, reports, and documentation
   for server configuration leakage, credential-shaped values, guest email,
   signed URLs, storage keys, raw scenes/Yjs content, binary payloads, public
   bucket policy, optional tables, domain routes, and a second scene model.
9. Run the complete required command block, documentation check, generated
   artifact inspection, `git status --short`, and `git diff --check`.
10. Review the complete diff against the original dirty-worktree boundary and
    preserve unrelated user work.
11. Update step statuses, evidence results, exact dependency/image selections,
    progress, decisions, blockers, last-updated date, this plan's execution
    status, and the matching plan-index row.

Only after this audit proves the full completion statement may this plan and
its index row change from `Ready` or `In progress` to `Passed`. The final
handoff must summarize delivered files and behaviour, fixed selections,
validation results, resolved blockers, known limitations, and the next
unimplemented Stage 0 work without naming an executing model as part of the
project contract.

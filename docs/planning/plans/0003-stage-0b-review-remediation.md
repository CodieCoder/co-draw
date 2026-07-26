# Stage 0B Review Remediation

**Document path:** `docs/planning/plans/0003-stage-0b-review-remediation.md`

**Document status:** Proposed

**Execution status:** Passed

**Parent plan:** [Stage 0B — Local Persistence Infrastructure and Truthful Readiness](./0002-stage-0b-local-persistence-infrastructure-and-readiness.md)

**Applicable work packages:** `FND-003`

**Goal objective:** Repair every actionable Stage 0B review finding while
preserving local developer data, the accepted architecture, and the original
Stage 0B completion contract.

**Completion statement:** The reviewed implementation is complete when every
remediation step and original Stage 0B evidence row passes current unit,
live-stack, isolated integration, smoke, privacy, documentation, and diff
verification; plans `0002` and `0003` then both record `Passed` without
claiming `FND-004` or product behavior.

**Last updated:** 26 July 2026

**Primary owners:** Engineering, Architecture, and QA

---

# 1. Purpose

This plan persists the repair work requested after review of the initial Stage
0B implementation. The review invalidated the earlier completion audit because
configuration was split across sources, clean migrations and destructive-path
tests were not real, runtime privileges were too broad, readiness could crash
or report ready after cleanup failure, and documentation described an obsolete
state.

The authoritative sources, architecture constraints, and full definition of
done remain those in the [parent plan](./0002-stage-0b-local-persistence-infrastructure-and-readiness.md).

---

# 2. Goal handoff

```text
/goal Implement and verify the persisted remediation plan at docs/planning/plans/0003-stage-0b-review-remediation.md. Preserve existing .env.local values and persistent developer volumes. Re-audit every mandatory row in parent plan 0002; do not mark either plan Passed until clean-stack integration, interruption/recovery, smoke, coverage, documentation, privacy, and diff gates all pass. Do not add FND-004 work, product routes, seed data, commits, pushes, deployments, or destructive developer-volume removal.
```

Starting this goal does not authorise deleting persistent local data or making
an external Git change.

---

# 3. Scope

## 3.1 Included

- Make `.env.local` the one validated source for local application, migration,
  PostgreSQL, and MinIO settings; derive Compose fields from the three URLs.
- Pin PostgreSQL, MinIO, and MinIO client images by digest and use idempotent
  fail-fast role, bucket, and bucket-scoped policy initialisation.
- Make infrastructure, migration, status, check, smoke, and development
  commands use the same environment and fail nonzero on unsupported state.
- Add migration `004_stage-0b-corrections` to forward-correct existing volumes,
  enforce non-negative snapshot sequences, and replace broad runtime grants.
- Use exact ordered migration-name compatibility and bounded advisory locking.
- Make database, persistence, and object-storage probes return typed
  not-ready results; make failed object deletion not-ready.
- Prevent idle PostgreSQL errors and denied WebSocket upgrades from terminating
  either service; close PostgreSQL and S3 clients exactly once.
- Replace simulated/skipped integration evidence with a unique disposable
  PostgreSQL/MinIO stack that proves clean migration, interruption, recovery,
  schema incompatibility, privilege loss, privacy, and cleanup.
- Update tests, manifests, lockfile, public documentation, package
  documentation, and both plan evidence records.

## 3.2 Excluded

- Domain repositories, product routes, seed data, Yjs load/save, real room
  authority, asset flows, browser automation, or general `FND-004` fixtures.
- A second scene model, public bucket fallback, or browser-held server secret.
- Commits, pushes, pull requests, deployments, or deletion of persistent
  developer volumes.

---

# 4. Fixed implementation decisions

- Keep the existing `vegait-hackerton` Compose project name so its named local
  volumes are preserved.
- Use the canonical migration URL to derive the PostgreSQL container identity;
  API and collaboration URLs provide distinct runtime roles on the same target.
- Use PostgreSQL
  `sha256:742f40ea20b9ff2ff31db5458d127452988a2164df9e17441e191f3b72252193`,
  MinIO
  `sha256:14cea493d9a34af32f524e538b8346cf79f3321eff8e708c1e2960462bd8936e`,
  and MinIO client
  `sha256:a7fe349ef4bd8521fb8497f55c6042871b2ae640607cf99d9bede5e9bdf11727`.
- Retain SQL-first `pg` plus `node-pg-migrate`; do not add an ORM.
- Keep all room upgrades denied before document creation. A handled hook
  sentinel stops Hocuspocus after the explicit 403 without crashing it.
- Use unique `vega-canvas-it-*` projects for destructive failure injection and
  remove only those disposable test volumes.

---

# 5. Execution steps

| Step | Action | Depends on | Verification | Status |
| --- | --- | --- | --- | --- |
| `REM-01` | Reopen plans `0002` and `0003`; preserve the dirty-worktree boundary and existing local data. | None | Plan/index diff and local target inspection. | Passed |
| `REM-02` | Unify environment derivation, Compose lifecycle, pinned images, runtime-role initialisation, and bucket-scoped MinIO policy. | `REM-01` | Compose config; two `infra:up` runs; live `infra:check`. | Passed |
| `REM-03` | Correct migrations, exact migration status, schema constraints, runtime grants, readiness results, and migration lifecycle. | `REM-02` | Live migration plus no-op rerun; exact status; clean-stack integration. | Passed |
| `REM-04` | Correct API storage cleanup/timeouts, database error handling, dependency lifecycle, and infrastructure verification. | `REM-03` | API unit tests, live storage/privacy check, outage/recovery integration. | Passed |
| `REM-05` | Correct collaboration persistence readiness, shutdown, and fail-closed upgrade control flow. | `REM-03` | Collaboration unit test; privilege-loss and WebSocket process-survival integration. | Passed |
| `REM-06` | Replace fake/skipped migration coverage and permissive smoke assertions with exact unit, integration, and process proofs. | `REM-04`, `REM-05` | Unit suite, isolated integration suite, application smoke. | Passed |
| `REM-07` | Reconcile root, contribution, contract, database-package, and planning documentation with executable behavior. | `REM-06` | Documentation checks and contradiction/privacy searches. | Passed |
| `REM-08` | Run the full current gate, inspect the complete diff, then close both plans only if every row passes. | `REM-07` | Frozen install, check, coverage, live checks, integration, smoke, docs, diff. | Passed |

---

# 6. Failure, security, and preservation behavior

- Invalid placeholders, URLs, role overlap, database targets, storage
  endpoints, bucket names, credentials, ports, or TLS settings fail before a
  provider command.
- Migration status exits nonzero for pending, reordered, or unknown migration
  sets. Runtime startup never migrates.
- Database and provider failures become stable readiness codes and never expose
  raw errors or values.
- Failed readiness cleanup is failure, not ready.
- Liveness remains available while PostgreSQL or MinIO is unavailable.
- The collaboration upgrade response remains exactly
  `403 COLLAB_PERMISSION_DENIED` and does not allocate a document or terminate
  the process.
- Ordinary infrastructure stop preserves volumes. The safety review denied
  deletion of temporary non-test volumes, so they remain preserved.
- No usable credential, guest email, connection string, storage key, scene,
  Yjs payload, or binary content may enter docs, health, browser output, or
  evidence.

---

# 7. Evidence matrix

| Requirement | Proof | Current result |
| --- | --- | --- |
| `RE-01` — Canonical local configuration | Shared derivation module; placeholder and cross-target tests; all root scripts consume it. | Passed — code and focused tests implemented. |
| `RE-02` — Reproducible private infrastructure | Pinned Compose images; two live `infra:up` runs; bucket-scoped policy; anonymous denial and cleanup in `infra:check`. | Passed — 26 July 2026. |
| `RE-03` — Exact schema and roles | Migration `004`; live migration/no-op/status; eight-table/constraint/index/grant inspection. | Passed — 26 July 2026. |
| `RE-04` — Truthful bounded readiness | Database/persistence/storage unit tests and exact outage responses in isolated integration. | Passed — 26 July 2026. |
| `RE-05` — Service survival and lifecycle | Database interruption/recovery, MinIO interruption/recovery, denied upgrade followed by liveness, idempotent shutdown tests. | Passed — 26 July 2026. |
| `RE-06` — Real clean-stack proof | `corepack pnpm test:integration:foundation` with unique project and successful volume cleanup. | Passed — 26 July 2026. |
| `RE-07` — Exact application smoke and browser privacy | `corepack pnpm smoke:apps`. | Passed — 26 July 2026. |
| `RE-08` — Unit and static quality | Root build, lint, typecheck, and test; database tests have no skip. | Passed — final `corepack pnpm check` completed 26 July 2026. |
| `RE-09` — Documentation and scope | New Stage 0B contract/package docs, updated root/contribution/foundation docs, stale-claim and privacy scans. | Passed — 41 Markdown files and indexes verified; stale current-state searches returned no match. |
| `RE-10` — Completion audit | Frozen install, complete gate, coverage, docs, diff check, plan/index review. | Passed — frozen install, root check, coverage, live status/check, isolated integration, application smoke, docs, and diff verification all completed 26 July 2026. |

---

# 8. Progress and resolved findings

| Date | Checkpoint | Outcome |
| --- | --- | --- |
| 26 July 2026 | Review accepted | Parent plan reopened because prior evidence relied on split configuration, permissive assertions, simulated migration coverage, and incomplete failure behavior. |
| 26 July 2026 | Real local stack repaired | Existing local volumes were retained; role and MinIO policy initialisation now succeeds twice; migration `004`, status, and `infra:check` pass. |
| 26 July 2026 | Clean-stack integration repaired | The first run found stale derived test roles; the next found service termination on idle database loss; diagnostics then found a crash after denied WebSocket upgrade. Each defect was corrected and the complete isolated suite passed. |
| 26 July 2026 | Application smoke passed | Exact healthy contracts, route absence, fail-closed upgrade, and browser secret exclusions pass against the local dependencies. |

No mandatory blocker remains.

---

# 9. Definition of done

- [x] Environment, infrastructure, migration, privilege, readiness, lifecycle,
  integration, and smoke remediations are implemented.
- [x] Existing `.env.local` values and the established local PostgreSQL/MinIO
  volumes are preserved.
- [x] The unique destructive-path integration project cleans up its own
  disposable containers, network, and volumes.
- [x] Documentation and package ownership references pass current validation.
- [x] The final frozen-install, static, unit, coverage, live, integration,
  smoke, privacy, scope, and diff gate passes.
- [x] Parent plan `0002`, this plan, and their index rows all record `Passed`
  with current evidence.
- [x] `FND-004` through `FND-006`, Stage 0 completion, and every excluded
  product behavior remain unclaimed.

The completion statement is proven and no unchecked mandatory item remains.

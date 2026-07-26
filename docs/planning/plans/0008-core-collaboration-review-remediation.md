# Core Collaboration Review Remediation

**Document path:** `docs/planning/plans/0008-core-collaboration-review-remediation.md`

**Document status:** Proposed

**Execution status:** Passed

**Parent plan:** [Stage 1/2 — Core Collaboration Demo Slice](./0007-stage-1-2-core-collaboration-demo-slice.md)

**Applicable work packages:** `CAN-001`–`CAN-004`, `COL-001`–`COL-005`, and the rectangle create/move/reload subset of `COL-006`

**Goal objective:** Turn the reviewed Stage 1/2 implementation into a secure, locally demoable two-editor collaboration slice whose runtime, persistence, and browser claims are supported by focused tests.

**Completion statement:** The goal may stop only when the API and collaboration runtimes start, two isolated guests can create/share/join a room and converge on one Excalidraw rectangle, the final scene survives collaboration-runtime restart and browser reload, the reviewed security boundaries fail closed, and every mandatory validation row below passes.

**Last updated:** 26 July 2026

**Primary owners:** Product Engineering and QA

---

# 1. Purpose

This plan remediates the concrete defects found while reviewing the in-progress implementation of plan 0007. It corrects unsupported completion claims, fixes the shortest secure demo path, and adds evidence at the boundaries that previously had only package-level unit-test results.

# 2. Goal contract

## 2.1 Objective

Turn the reviewed Stage 1/2 implementation into a secure, locally demoable two-editor collaboration slice whose runtime, persistence, and browser claims are supported by focused tests.

## 2.2 Completion statement

The goal may stop only when the API and collaboration runtimes start, two isolated guests can create/share/join a room and converge on one Excalidraw rectangle, the final scene survives collaboration-runtime restart and browser reload, the reviewed security boundaries fail closed, and every mandatory validation row below passes.

## 2.3 Goal handoff

```text
/goal Implement the persisted plan at docs/planning/plans/0008-core-collaboration-review-remediation.md in full. Treat its scope, constraints, ordered steps, evidence matrix, and definition of done as the execution contract. Keep the plan current, preserve unrelated user changes, and do not mark it Passed until every mandatory evidence row passes.
```

# 3. Authoritative sources and constraints

- [Repository instructions](../../../AGENTS.md)
- [Parent task plan](./0007-stage-1-2-core-collaboration-demo-slice.md)
- [Product requirements](../../product/01-product-requirements.md)
- [MVP acceptance criteria](../../product/02-mvp-scope-and-acceptance-criteria.md)
- [System architecture](../../architecture/01-system-architecture.md)
- [Collaboration design](../../architecture/02-collaboration-and-sync-design.md)
- [Data model](../../architecture/03-data-model-and-persistence.md)
- [API boundaries](../../architecture/04-api-and-service-boundaries.md)
- [Excalidraw integration](../../architecture/05-excalidraw-integration-design.md)
- [Frontend architecture](../../architecture/06-frontend-architecture.md)
- [Security and privacy](../../architecture/10-security-permission-and-privacy-architecture.md)
- [Testing strategy](../../architecture/11-testing-and-quality-strategy.md)

The implementation must preserve Excalidraw as the only canvas renderer, Yjs as shared collaboration state, PostgreSQL as current application authority and snapshot storage, server-side authorization, private guest email, hashed stored credentials, and the pinned Node/pnpm toolchain.

# 4. Scope

## 4.1 Included

- Correct Nest dependency injection and make the API bootstrap successfully.
- Make guest identity creation non-recoverable by unverified email and atomic with session creation.
- Enforce exact allowed origins, JSON mutation requests, secure cookies outside local HTTP, and nested redacted API errors.
- Require active-room owner authority for editor share-link creation.
- Revalidate collaboration tokens against the live session, guest, room, and membership records.
- Load Yjs documents through the Hocuspocus load hook and persist them with Hocuspocus's 750 ms debounce and awaited writes.
- Fix adapter ordering and once-per-remote-transaction application.
- Restore web runtime configuration, API base URL ownership, guest/invite/create-room routes, TanStack Query server-state ownership, adapter-owned Excalidraw CSS, and redacted test inspection.
- Restore the tracked Compose manifest.
- Add focused unit/integration/browser coverage and make plan evidence truthful.

## 4.2 Excluded

- Viewer invitations in the demo slice.
- Presence, assets, exports, physics, undo/redo expansion, deployment, or UI polish unrelated to the demo path.
- A second scene model, alternative renderer, or in-memory collaboration substitute.

## 4.3 Allowed incidental changes

- Tests, fixtures, scripts, package metadata, configuration examples, and run documentation needed by included behavior.
- Safe refactors that remove duplicated error/cookie/origin policy.

# 5. Baseline at remediation start

- Node `24.18.0` and pnpm `11.17.0` were verified before mutation.
- The worktree contained the user's in-progress plan-0007 implementation and was preserved rather than reset.
- Package builds and existing unit tests passed, but reviewed runtime and cross-boundary behavior was not yet covered.
- Local PostgreSQL/MinIO/Docker availability still needed proof before it could count as browser evidence.
- Browser verification uses synthetic identities and redacted scene projections only.

# 6. Deliverables and ownership

| Deliverable | Owning boundary | Required output |
| --- | --- | --- |
| API safety and authority | `apps/api`, contracts, config | Bootable modules, atomic guest/session path, owner-only editor links, exact-origin policy, safe errors |
| Collaboration correctness | `apps/collaboration` | Current-authority authentication, fail-closed load, awaited debounced snapshot persistence |
| Scene synchronization | `@vega/excalidraw-adapter` | Deterministic order and one remote callback per Yjs transaction |
| Demo workflow | `apps/web` | Configured API client, guest/invite/room routes, create/share/join canvas flow |
| Runtime foundation | repository root | Restored `compose.yaml` |
| Proof and records | tests and planning docs | Focused service/browser tests and populated evidence |

# 7. Execution steps

| Step | Action | Depends on | Required outputs | Verification | Status |
| --- | --- | --- | --- | --- | --- |
| `R-00` | Persist remediation contract, correct false parent statuses, verify toolchain, and restore the tracked Compose filename. | None | Plan 0008, updated indexes/statuses, `compose.yaml` | Docs inspection; `git diff --check` | Passed |
| `R-01` | Fix API boot, guest/session atomicity, cookie/origin policy, and safe error envelope. | `R-00` | Bootable Nest app and secure mutation/session behavior | API unit and integration tests | Passed |
| `R-02` | Enforce active-room membership/owner checks for room, share, invite, and collaboration bootstrap operations. | `R-01` | Editor-only owner-created invitations and current-authority bootstrap | Focused API tests | Passed |
| `R-03` | Correct Hocuspocus authentication, load, read-only, debounce, persistence, and shutdown behavior. | `R-02` | Fail-closed authenticated document lifecycle | Collaboration unit/integration tests | Passed |
| `R-04` | Correct adapter order publication and remote transaction coalescing. | `R-00` | Stable element order and one scene application per remote transaction | Adapter regression tests | Passed |
| `R-05` | Restore web configuration and implement the minimal guest/create/invite/room workflow with redacted test state and adapter-owned CSS. | `R-02`, `R-03`, `R-04` | Demoable configured frontend | Web unit tests; production boundary check | Passed |
| `R-06` | Add and run cross-service and two-context browser proof through collaboration restart/reload. | `R-05` | Deterministic end-to-end evidence | Focused integration and Playwright commands | Passed |
| `R-07` | Run repository gates, inspect privacy and diff, update both plans and documentation, and perform completion audit. | `R-06` | No pending mandatory evidence or false status | Full validation commands and audit | Passed |

# 8. Data and control flows

```text
Private guest form
→ exact-origin JSON API mutation
→ transaction inserts a new guest plus hashed session credential
→ HttpOnly cookie and public guest projection
```

```text
Owner creates editor link
→ API revalidates active room plus owner membership
→ database stores only share-token hash
→ invited guest resolves and atomically consumes raw URL token
→ editor membership is authoritative
```

```text
Room bootstrap
→ API revalidates cookie session plus active membership
→ short-lived room token
→ collaboration server verifies token and current database authority
→ Hocuspocus loads persisted Yjs update
→ Excalidraw adapter publishes local edits and applies each remote transaction once
→ Hocuspocus awaits snapshot persistence after its 750 ms debounce
```

PostgreSQL records are authoritative for identity, session, room, membership, and persisted snapshot. Yjs is authoritative for the live shared scene. React Query data is a server-state cache. Connection status and test projections are derived and must be redacted.

# 9. Failure and security behavior

- Missing, malformed, expired, revoked, disabled, mismatched, or inactive authority fails closed without a document.
- Entering an existing email creates a distinct guest; only a valid session cookie restores identity.
- A non-owner cannot mint a link, and the demo contract accepts only editor links.
- Mutation requests with a non-allowed or missing origin, or a body with a non-JSON content type, are rejected.
- API responses use stable nested error codes with request IDs; raw database/runtime errors, email, cookies, share tokens, and collaboration tokens are never returned as diagnostics or captured by test state.
- Snapshot-load failure rejects collaboration. Snapshot-store failure is surfaced to Hocuspocus so the document is retained for retry rather than unloaded as if saved.
- Tests must not destroy user-owned databases or files. Missing local runtime authority is recorded as a blocker rather than replaced with a fake proof.

# 10. Testing and evidence

## 10.1 Required levels

- Contract and service unit tests for validation, auth, errors, adapter ordering, and persistence helpers.
- PostgreSQL-backed API and collaboration integration tests.
- Web component/route tests plus production test-boundary verification.
- Focused two-browser Playwright create/move/restart/reload proof.
- Repository build, lint, typecheck, test, documentation, and diff checks.

## 10.2 Evidence matrix

| Requirement | Done condition | Proof command or artifact | Result | Evidence |
| --- | --- | --- | --- | --- |
| `REM-01` | API boots and guards resolve the database token. | API integration/bootstrap test | Passed | API suite: 3 files, 9 tests; isolated integration stack reached API readiness and passed 1/1 PostgreSQL-backed test. |
| `REM-02` | Matching unverified email cannot restore another guest; guest/session creation is atomic. | API service/integration tests | Passed | API suite covers distinct-guest creation, transaction boundaries, cookie sessions, and redacted public projections. |
| `REM-03` | Origin, JSON, cookie, owner, active-room, and safe-error policies are enforced. | API tests | Passed | API suite passed all 9 focused tests; two-context browser flow also proved owner-created editor invitation and active membership use. |
| `REM-04` | Collaboration revalidates current authority and loads/stores snapshots through correct Hocuspocus hooks. | Collaboration tests | Passed | Collaboration suite: 2 files, 5 tests; focused browser proof restarted only collaboration and recovered the stored scene. |
| `REM-05` | Adapter preserves reorder-only changes and invokes remote apply once per transaction. | `corepack pnpm --filter @vega/excalidraw-adapter test` | Passed | Adapter suite: 2 files, 16 tests, including reorder-only and remote-transaction coalescing regressions. |
| `REM-06` | Configured web routes complete guest/create/share/join and expose only redacted test state. | Web tests and production verification | Passed | Web suite: 3 files, 10 tests; production verification and both phases of `test:browser` passed with the production hook absent. |
| `REM-07` | Two isolated browser contexts converge and recover after collaboration restart/reload. | `corepack pnpm test:browser:collaboration` | Passed | Alice/Bob create, share, accept, create, move, collaboration-only restart, reload, redacted convergence, and privacy assertions passed. |
| `REM-08` | Repository and documentation gates pass with the intended diff. | build, lint, typecheck, test, docs check, `git diff --check` | Passed | `check`, `test:integration`, both browser commands, `verify:production`, `docs:check` for 56 Markdown files, and `git diff --check` passed. |

# 11. Execution record

## 11.1 Progress log

| Date | Checkpoint | Outcome | Verification | Next step |
| --- | --- | --- | --- | --- |
| 26 July 2026 | Review remediation started | Review findings converted to a dependency-ordered plan; false parent statuses reopened | Plan/index inspection; pinned runtime verified | Complete `R-00`, then API fixes |
| 26 July 2026 | Runtime and boundary remediation complete | API, collaboration, adapter, web, migration, and isolated-stack defects corrected | Focused API, collaboration, adapter, and web suites passed | Run cross-service proof |
| 26 July 2026 | Automated acceptance passed | Two isolated clients converged before and after collaboration-only restart; integration and production browser gates passed | `test:browser:collaboration`, `test:browser`, `test:integration`, `verify:production` | Complete live rehearsal and audit |
| 26 July 2026 | Completion audit passed | Documented live demo created a private guest and room, drew and reloaded a selectable rectangle, created a share link, stayed connected, and emitted no console errors | In-app browser rehearsal; `check`; `docs:check`; `git diff --check` | Goal complete |
| 26 July 2026 | Local-origin follow-up passed | Vite development and preview now use `localhost`, matching the configured API URL, collaboration URL, and exact origin allowlist | Web test/lint/typecheck; headless Chromium guest creation with zero console errors | Remediation remains passed |
| 26 July 2026 | Turbo environment follow-up passed | Strict-mode Turbo development tasks now receive the exact API, collaboration, storage, and public web runtime variables already validated from `.env.local` | API and collaboration started through filtered Turbo dev; headless Chromium guest creation passed with zero console errors | Remediation remains passed |

## 11.2 Decisions and blockers

| ID | Type | Description | Evidence | Resolution |
| --- | --- | --- | --- | --- |
| `DEC-008-01` | Decision | Restrict share-link creation to editor because viewer support is excluded by parent plan 0007. | Parent plan scope and review | Enforce in contract and API; retain server read-only defense for future tokens |
| `DEC-008-02` | Decision | Use Hocuspocus's 750 ms debounce and await each store hook instead of layering a second cancellable timer. | Hocuspocus lifecycle and persistence requirement | Configure server debounce and direct snapshot write |
| `DEC-008-03` | Decision | Prioritize the executable secure demo path; defer unrelated visual polish and post-MVP features. | Four-hour submission constraint | Enforced by exclusions |
| `DEC-008-04` | Decision | Use `localhost` consistently for browser-facing local web, API, and collaboration URLs. | Credentialed fetch, exact-origin CORS, and SameSite session-cookie boundaries | Vite serves and advertises `localhost`; isolated tests retain their explicit loopback fixture hosts |
| `DEC-008-05` | Decision | Keep Turbo in strict environment mode and explicitly forward only variables consumed by the three development runtimes. | Local preflight succeeded while API and collaboration child tasks reported missing database URLs | `turbo.json` owns the allowlist; boundary verification fails if a required development field is removed |

# 12. Documentation updates

- Keep this plan, plan 0007, and the task-plan index synchronized with actual results.
- Update local run/demo/config documentation only where commands or behavior changed.
- Record exact validation results without credentials or raw tokens.

# 13. Definition of done

- [x] API and collaboration runtimes start and fail safely under invalid authority. (`REM-01`, `REM-03`, `REM-04`)
- [x] Guest, session, room, and share-link behavior satisfies the private/server-authoritative contract. (`REM-02`, `REM-03`)
- [x] Excalidraw/Yjs order and remote-application regressions are fixed. (`REM-05`)
- [x] The configured web workflow is usable through supported routes. (`REM-06`)
- [x] The focused two-browser restart/reload scenario passes without private data in artifacts. (`REM-07`)
- [x] All repository and documentation gates pass and every plan status is evidence-backed. (`REM-08`)
- [x] The evidence matrix has no mandatory `Pending`, `Failed`, or `Blocked` row.
- [x] The final diff preserves unrelated user changes and contains no unintended artifact.

# 14. Completion audit

1. Re-read the objective, scope, parent plan, and every review finding represented above.
2. Inspect the actual runtime hooks and authorization queries, not only package test totals.
3. Run every evidence command using Node `24.18.0` and pnpm `11.17.0`.
4. Inspect browser artifacts and test API projections for email or raw credential exposure.
5. Review the full diff, Compose filename, documentation links, and plan status.
6. Resolve every mandatory pending/failed/blocked row.
7. Mark `R-00` through `R-07`, this plan, and the corresponding plan-0007 gates `Passed` only when their named evidence is current.

**Audit result:** Passed on 26 July 2026. All eight remediation rows and all execution steps passed under Node `24.18.0` and pnpm `11.17.0`; the browser proof and live rehearsal used only synthetic identities and retained no raw invitation or collaboration credential.

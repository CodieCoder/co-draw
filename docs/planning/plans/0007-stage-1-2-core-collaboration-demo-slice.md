# Stage 1/2 — Core Collaboration Demo Slice

**Document path:** `docs/planning/plans/0007-stage-1-2-core-collaboration-demo-slice.md`

**Document status:** Proposed

**Execution status:** Passed

**Parent plan:** [MVP Implementation Plan](../01-mvp-implementation-plan.md)

**Applicable work packages:** `CAN-001`–`CAN-004`, `COL-001`–`COL-005`, and the rectangle create/move/reload subset of `COL-006`

**Goal objective:** Deliver a locally demoable two-editor room in which private guest identities create, share, and join a room, then create and move one Excalidraw rectangle through the canonical Yjs/Hocuspocus path with PostgreSQL-backed reload recovery.

**Completion statement:** The goal may stop only when the automated two-browser demo creates Alice and Bob as separate guests, creates and accepts an editor invitation, synchronises Alice's rectangle creation and Bob's movement, restarts the collaboration runtime, reloads both browsers to the same final rectangle, and proves that no guest email or raw credential appears in public collaboration state or test evidence.

**Last updated:** 26 July 2026

**Primary owners:** Product Engineering and QA

---

# 1. Purpose

This plan extracts the shortest coherent Stage 1/2 vertical slice that proves the product's central idea under a four-hour submission constraint. It gives an implementation agent one dependency-ordered contract and small, independently verifiable checkpoints so time and model tokens are spent on executable progress rather than repeated planning.

Passing this plan does **not** mean that the parent plan's complete Stage 1 or Stage 2 exit gates pass. In particular, local undo/redo and the remainder of the Stage 2 browser scenario remain for a later plan. This plan may be marked `Passed` independently only for the bounded demo outcome stated above.

---

# 2. Goal contract

## 2.1 Objective

Deliver a locally demoable two-editor room in which private guest identities create, share, and join a room, then create and move one Excalidraw rectangle through the canonical Yjs/Hocuspocus path with PostgreSQL-backed reload recovery.

## 2.2 Completion statement

The goal may stop only when the automated two-browser demo creates Alice and Bob as separate guests, creates and accepts an editor invitation, synchronises Alice's rectangle creation and Bob's movement, restarts the collaboration runtime, reloads both browsers to the same final rectangle, and proves that no guest email or raw credential appears in public collaboration state or test evidence.

## 2.3 Goal handoff

```text
/goal Implement the persisted plan at docs/planning/plans/0007-stage-1-2-core-collaboration-demo-slice.md in full. Treat its scope, constraints, ordered execution steps, evidence matrix, and definition of done as the execution contract. Change execution status to In progress before the first implementation mutation, update the plan at every passed or blocked checkpoint, and preserve unrelated user changes. Work on only the earliest unpassed dependency-ready step at a time. Do not mark the goal complete until the completion audit proves every mandatory row.
```

On an execution surface without `/goal`, use the same text without the `/goal` prefix. The persisted plan is the source of detail; do not ask the implementation agent to recreate a plan.

## 2.4 Fast execution protocol

1. Start at the earliest `Ready` or `Not started` step whose dependencies pass.
2. Mark only that step `In progress`.
3. Implement its required outputs without widening scope.
4. Run its named verification.
5. Record `Passed` with concise evidence, or `Blocked` with the exact failing condition.
6. Continue immediately to the next dependency-ready step.

The target times are coordination checkpoints, not permission to weaken proof:

| Elapsed target | Required visible checkpoint |
| ---: | --- |
| 0:10 | Preflight and dependency choices recorded |
| 1:00 | Single-browser Excalidraw rectangle round-trips through the adapter and Yjs |
| 2:00 | Guest, room, editor invitation, and collaboration-bootstrap API tests pass |
| 2:50 | Two authorised clients synchronise rectangle creation and movement |
| 3:30 | Snapshot survives collaboration-runtime restart and browser reload |
| 4:00 | Focused browser proof, final validation, and demo rehearsal complete |

If a checkpoint slips, preserve the goal contract, stop unrelated polish, and record the blocker. Do not substitute an in-memory room, custom canvas, client-asserted role, or fake browser demonstration.

---

# 3. Authoritative sources and constraints

## 3.1 Sources

- [Repository instructions](../../../AGENTS.md)
- [MVP Implementation Plan](../01-mvp-implementation-plan.md)
- [Product Requirements](../../product/01-product-requirements.md)
- [MVP Scope and Acceptance Criteria](../../product/02-mvp-scope-and-acceptance-criteria.md)
- [System Architecture](../../architecture/01-system-architecture.md)
- [Collaboration and Sync Design](../../architecture/02-collaboration-and-sync-design.md)
- [Data Model and Persistence](../../architecture/03-data-model-and-persistence.md)
- [API and Service Boundaries](../../architecture/04-api-and-service-boundaries.md)
- [Excalidraw Integration Design](../../architecture/05-excalidraw-integration-design.md)
- [Frontend Architecture](../../architecture/06-frontend-architecture.md)
- [Security, Permission, and Privacy Architecture](../../architecture/10-security-permission-and-privacy-architecture.md)
- [Testing and Quality Strategy](../../architecture/11-testing-and-quality-strategy.md)
- [ADR-0001: Excalidraw Canvas Engine](../../adr/0001-excalidraw-canvas-engine-and-canonical-visual-scene.md)
- [ADR-0002: Yjs and Hocuspocus Collaboration](../../adr/0002-yjs-hocuspocus-collaboration-and-awareness.md)
- [ADR-0003: Persistence and Asset Boundaries](../../adr/0003-persistence-and-asset-ownership-boundaries.md)
- [ADR-0004: Server-Authoritative Permissions and Private Guest Identity](../../adr/0004-server-authoritative-permissions-and-private-guest-identity.md)
- [Task-Level Plan Index and Readiness Gate](./README.md)

## 3.2 Non-negotiable invariants

1. Excalidraw remains the only canvas renderer and interaction engine.
2. The Excalidraw scene remains canonical for canvas semantics; the product must not introduce a second complete scene model in React, Zustand, PostgreSQL, or custom rendering code.
3. Yjs owns shared collaboration state. Elements are stored by stable element ID with a separate shared order, not as a full-scene opaque replacement on every change.
4. Only the Excalidraw adapter/controller may translate between Excalidraw and Yjs or call the Excalidraw imperative scene API.
5. Local publication uses explicit transaction origin `local-excalidraw`. Remote reconstruction is marked as remote before applying it and must not republish through `onChange`.
6. Hocuspocus authenticates `room:{roomId}` against current server-side session, active room, membership, and role. The client cannot assert an authoritative role.
7. PostgreSQL stores room/application authority and a debounced Yjs snapshot. A persistence load failure must fail closed rather than present a false empty room.
8. Guest email is private. It must never enter responses that do not explicitly need it, Yjs, awareness, Excalidraw state, URLs, browser test hooks, screenshots, traces, or ordinary logs.
9. Session and share credentials use cryptographically random raw tokens; PostgreSQL stores only SHA-256 hashes. Raw credentials must not be logged.
10. The repository remains pnpm-only and must run with Node `24.18.0` and pnpm `11.17.0` selected through `.nvmrc` and Corepack.
11. Existing unrelated worktree changes, especially the active FND-006 documentation and validation work, must be preserved.

## 3.3 Fixed implementation decisions

| ID | Decision |
| --- | --- |
| `DEC-007-01` | Resolve parent `DEC-003` with an opaque session token in an `HttpOnly`, `SameSite=Lax`, `Path=/` cookie. Set `Secure` outside the explicit local HTTP profile. Browser HTTP calls use credentials. |
| `DEC-007-02` | Cookie-authenticated state mutations accept only JSON and require the request `Origin` to exactly match the configured frontend allowlist. Credentialed CORS uses explicit origins and never `*`. |
| `DEC-007-03` | Session and share-link raw tokens contain 32 random bytes encoded as base64url. Store `sha256(rawToken)` as lowercase hexadecimal. |
| `DEC-007-04` | Collaboration bootstrap issues a five-minute, HMAC-SHA256 signed compact token from `@vega/auth`. Its validated payload contains version, session ID, room ID, guest ID, role, issued-at, and expiry. The collaboration runtime also re-reads that session plus current room and membership authority during authentication. |
| `DEC-007-05` | The shared HMAC secret is at least 32 bytes, is validated by `@vega/config`, is shared only by API and collaboration runtimes, and is never exposed through client config or logs. |
| `DEC-007-06` | Parent `DEC-004` uses snapshot-only persistence with a 750 ms debounce. Persist `Y.encodeStateAsUpdate(document)`, the state vector, schema version, Excalidraw version, and an incremented snapshot sequence in `collaboration_documents`. |
| `DEC-007-07` | Room creation atomically inserts the room, owner membership, and initial empty Yjs snapshot using existing tables. Share-link acceptance atomically validates and consumes the link and upserts the editor membership. |
| `DEC-007-08` | Pin `@hocuspocus/provider` at `4.4.0` to match the existing Hocuspocus server. React Router and TanStack Query must be stable, non-prerelease releases whose declared peers support React 19. Pin exact catalog versions and record them in the execution decision log before installation. |
| `DEC-007-09` | Only owner/editor writable collaboration is included. Viewer links, viewer connections, role changes, and revocation while connected remain excluded and must not be claimed. |
| `DEC-007-10` | The focused demo uses server snapshot persistence only. IndexedDB/offline merge is excluded from this slice. |

No new ADR is required unless implementation discovers that one of these choices conflicts with an accepted boundary or must change a significant architectural decision.

---

# 4. Scope

## 4.1 Included

- Shared runtime contracts for guest-session, room, editor share-link, invite resolution/acceptance, room metadata, collaboration bootstrap, public guest, stable error envelope, and collaboration-token claims.
- Auth utilities for secure opaque token generation/hash comparison and signed short-lived collaboration tokens.
- Yjs room schema helpers for element map, element-order array, document metadata, validation, reconstruction, and initial empty snapshot.
- Excalidraw adapter/controller logic for normalization, durable element diffing, order updates, local publication, remote reconstruction, invalid-element quarantine, and callback-loop suppression.
- Minimal React routes `/`, `/guest`, `/invite/:shareToken`, and `/rooms/:roomId` using React Router and TanStack Query for HTTP server state.
- A thin Excalidraw room canvas, create/share/copy/join controls, actionable loading/error states, and a visible connecting/connected/reconnecting/failed indicator.
- API paths needed by the demo:
  - `POST /api/v1/guest-sessions`
  - `GET /api/v1/guest-sessions/current`
  - `POST /api/v1/rooms`
  - `GET /api/v1/rooms/:roomId`
  - `GET /api/v1/rooms/:roomId/collaboration`
  - `POST /api/v1/rooms/:roomId/share-links`
  - `GET /api/v1/share-links/:token`
  - `POST /api/v1/share-links/:token/accept`
- Hocuspocus authentication, room-document load, debounced snapshot store, and fail-closed error handling.
- Extension of the non-production canvas test API with redacted room, connection, and active-element inspection needed by the browser proof.
- Unit, integration, and a focused two-context Playwright test for the completion statement.
- Minimal operator/demo documentation for configuration, local startup, focused verification, and the exact demo script.

## 4.2 Excluded

- A claim that complete Stage 1 or Stage 2 passes.
- `CAN-005` local undo/redo and the undo/redo portion of `COL-006`.
- Presence, collaborator list, cursors, selections, awareness, or guest email display.
- Viewer invitations, viewer write enforcement, membership management, role changes, or active revocation.
- IndexedDB, offline editing, recovery UI, and offline publication.
- Sticky notes, assets, image/audio, export, recycle bin, archive, physics, radar/minimap, templates, and P1 work.
- Resize, rotate, style-change, delete, ordering-conflict, and simultaneous-edit acceptance scenarios.
- Production deployment, hosted infrastructure, CI expansion, multi-browser compatibility, performance optimization, and broad visual polish.
- A second scene model, mock collaboration transport, in-memory-only room persistence, or a custom canvas fallback.

## 4.3 Allowed incidental changes

- Exact dependency catalog entries and lockfile changes required by included libraries.
- Focused configuration schemas, environment examples, test fixtures, selectors, and package scripts required by this plan.
- Refactoring directly affected foundation files when necessary to register modules, routes, providers, or runtime hooks.
- Documentation corrections required to record the selected session transport and focused demo workflow.
- Focused test utilities that contain only synthetic identity data and redacted scene inspection.

---

# 5. Baseline at plan start

## 5.1 Verified baseline

- Stage 0 plans `0001`–`0006` are recorded as passed in the current worktree.
- `.nvmrc` selects Node `24.18.0`; `corepack pnpm --version` reports `11.17.0`.
- Excalidraw `0.18.1`, Hocuspocus server `4.4.0`, Yjs `13.6.31`, and React `19.2.8` are exactly pinned in `pnpm-workspace.yaml`.
- PostgreSQL migrations already create `guests`, `guest_sessions`, `rooms`, `room_memberships`, `room_share_links`, and `collaboration_documents`.
- `apps/web` was a foundation shell without the product routes.
- `apps/api` exposed foundation health/readiness only.
- `apps/collaboration` exposed health and rejected collaboration upgrades.
- `packages/auth` and `packages/collaboration-schema` were empty implementation boundaries.
- `packages/excalidraw-adapter` exposed only the pinned-version boundary and a basic element type.
- The worktree contained active FND-006 changes that were preserved.

## 5.2 Preconditions to verify during `D-00`

- Local PostgreSQL and object-storage services can start through the supported repository commands.
- The API and collaboration database roles have the grants required by the existing migrations.
- Required dependency metadata is reachable or the selected packages already exist in the pnpm store.
- Ports `5173`, `4000`, and `1234` or the repository-configured equivalents are available.
- A 32-byte-or-longer local collaboration signing secret is configured with a synthetic development value.

An unmet precondition is a blocker only for the dependent step. Continue any safe dependency-independent work and record the exact failure.

---

# 6. Deliverables and ownership

| Deliverable | Owning boundary | Required output |
| --- | --- | --- |
| Shared HTTP and token contracts | `packages/contracts` | Runtime-validated request, response, public identity, error, and collaboration-claim schemas |
| Token primitives | `packages/auth` | Opaque token generation/hashing and signed collaboration-token issue/verify helpers |
| Room Yjs schema | `packages/collaboration-schema` | Stable keys, initial document, element/order projection, validation, encode/decode helpers |
| Excalidraw/Yjs bridge | `packages/excalidraw-adapter` | Normalization, diff, local publish, remote apply suppression, and focused tests |
| Guest and room authority | `apps/api` | Session, room, invite, membership, and collaboration-bootstrap modules backed by PostgreSQL |
| Live document authority | `apps/collaboration` | Authenticated Hocuspocus document load/store with debounced PostgreSQL snapshots |
| Demo workflow | `apps/web` | Guest, home, invite, and room routes with Query-owned HTTP state and adapter-owned canvas |
| Redacted inspection | `apps/web/src/canvas-test-api` | Non-production read-only scene/room/connection snapshot; production absence preserved |
| Acceptance proof | `tests` and package tests | Focused unit, integration, security, and two-context Playwright coverage |
| Operator handoff | `README.md` and relevant architecture/config docs | Exact environment, startup, verification, and demo steps |

Authoritative state remains:

- Excalidraw: canvas semantics and editing behavior.
- Yjs: shared room scene state.
- PostgreSQL: guest/session/room/membership/share authority and persisted Yjs snapshot.

React Query caches HTTP state; the adapter may cache the last normalized projection only to compute diffs. Neither cache becomes authoritative.

---

# 7. Execution steps

Only the earliest dependency-ready step may be `In progress`.

## 7.1 Preflight

| Step | Target | Action | Depends on | Required outputs | Verification | Status |
| --- | ---: | --- | --- | --- | --- | --- |
| `D-00` | 10 min | Verify runtime, dirty worktree, services, ports, and dependency availability; set the plan to `In progress`; record exact selected browser dependency versions. | None | Preflight log, preserved unrelated-change list, dependency decision entries | `node --version`; `corepack pnpm --version`; `git status --short`; `corepack pnpm infra:status`; package metadata/store inspection | Passed |

## 7.2 Stage 1 demo increment — one canonical rectangle path

| Step | Target | Action | Depends on | Required outputs | Verification | Status |
| --- | ---: | --- | --- | --- | --- | --- |
| `S1-01` | 20 min | Add shared collaboration schemas and auth primitives before app code. Define exact Yjs keys, version metadata, complete element records by ID, order array, empty snapshot, token hashes, collaboration-token claims, and stable error/public DTOs. | `D-00` | Tested `@vega/contracts`, `@vega/auth`, and `@vega/collaboration-schema` exports | `corepack pnpm --filter @vega/contracts test`; `corepack pnpm --filter @vega/auth test`; `corepack pnpm --filter @vega/collaboration-schema test` | Passed |
| `S1-02` | 25 min | Implement the Excalidraw adapter/controller as the only scene bridge. Normalize durable properties, diff against the previous derived projection, update Yjs under `local-excalidraw`, reconstruct in shared order, quarantine invalid remote elements, and suppress remote callback publication explicitly. | `S1-01` | Adapter API plus tests for rectangle create/change, stable ID, order, malformed remote data, and no callback loop | `corepack pnpm --filter @vega/excalidraw-adapter test` | Passed |
| `S1-03` | 15 min | Mount pinned Excalidraw through a thin room-canvas controller using a local Y.Doc fixture, and extend the non-production test API with redacted active-element inspection. Preserve production absence. | `S1-02` | Interactive Excalidraw canvas, one rectangle round-trip, redacted inspect-only test hook | `corepack pnpm --filter @vega/web test`; `corepack pnpm verify:production` | Passed |
| `S1-GATE` | 5 min | Stop and prove the Stage 1 demo increment before adding API or networking. | `S1-03` | Browser-visible rectangle created and reconstructed through adapter/Yjs; no second scene state | Focused Playwright single-canvas test plus boundary inspection | Passed |

`S1-GATE` does not close parent Stage 1 because `CAN-005` and its full exit evidence are excluded.

## 7.3 Stage 2 demo increment — private guests and two-editor room

| Step | Target | Action | Depends on | Required outputs | Verification | Status |
| --- | ---: | --- | --- | --- | --- | --- |
| `S2-01` | 35 min | Implement cookie session creation/restoration, exact-origin protection, and atomic room/share/bootstrap services. Room creation inserts owner membership and an initial Yjs snapshot; share creation permits editor only in this slice; acceptance validates/consumes the raw link token atomically; bootstrap issues a five-minute room-scoped token from current authority. | `S1-GATE` | Included API endpoints, modules/services/repositories, explicit CORS/cookie configuration, stable safe failures | `corepack pnpm --filter @vega/api test`; focused API integration tests against PostgreSQL | Passed |
| `S2-02` | 30 min | Replace the collaboration reject-all path with authenticated Hocuspocus. Parse only `room:{roomId}`, verify the signed token, revalidate live session/room/membership, load the stored snapshot before exposing a document, and persist a debounced snapshot/state vector with sequence increment. | `S2-01` | Authorised writable owner/editor connections, fail-closed loads, 750 ms snapshot persistence | `corepack pnpm --filter @vega/collaboration test`; focused collaboration integration test | Passed |
| `S2-03` | 30 min | Implement the minimal frontend route and HTTP workflow. TanStack Query owns current-session, room, invite, and bootstrap data. Guest email is accepted only by the private form/API path. Invitation intent survives guest creation. Room UI exposes create/share/copy and actionable errors. | `S2-01` | `/`, `/guest`, `/invite/:shareToken`, `/rooms/:roomId`; cookie credentials; stable selectors | `corepack pnpm --filter @vega/web test` | Passed |
| `S2-04` | 25 min | Add the room-scoped Y.Doc/Hocuspocus Provider wrapper and connect it to the canvas controller. Show connection state, apply remote scene changes without republishing, and tear down provider, observers, and Y.Doc when the room changes or unmounts. | `S2-02`, `S2-03` | Real authenticated collaboration in the room route and redacted connection/scene inspection | `corepack pnpm --filter @vega/web test`; focused two-client integration proof | Passed |
| `S2-GATE` | 10 min | Prove Alice-to-Bob creation and Bob-to-Alice movement before persistence/restart work continues. | `S2-04` | Two independent browser contexts converge on one rectangle at the final position | Focused Playwright test through movement assertion | Passed |

## 7.4 Persistence, final proof, and handoff

| Step | Target | Action | Depends on | Required outputs | Verification | Status |
| --- | ---: | --- | --- | --- | --- | --- |
| `D-06` | 20 min | Finish the focused Playwright scenario: create two synthetic guests, create/share/accept, create/move rectangle, wait for acknowledged persistence, restart only the collaboration runtime through a controlled fixture, reload both pages, and compare stable redacted scene projections. Assert public/test outputs contain neither test email nor raw tokens. | `S2-GATE` | Deterministic two-context restart/reload acceptance test and failure artifacts | `corepack pnpm test:browser:collaboration` | Passed |
| `D-07` | 10 min | Update run/config/demo documentation, run the focused and repository validation gates, inspect privacy/boundaries/diff, complete the evidence matrix, and perform one manual demo rehearsal. | `D-06` | Exact local commands, recorded results, no pending mandatory evidence | Commands in Section 10 plus completion audit | Passed |

The implementation agent may combine command execution for speed, but it must not merge step ownership, skip an intermediate gate, or mark a step passed using a later test that does not exercise its required outputs.

---

# 8. Data and control flows

## 8.1 Guest session

```text
Username + private email
→ shared contract validates and API normalises
→ API transaction creates guest and hashed opaque session
→ raw session is set only as HttpOnly cookie
→ response returns public guest and expiry without email
OR
→ stable validation/auth error; no partial guest/session authority
```

## 8.2 Create and join room

```text
Authenticated Alice creates room
→ API transaction writes room + owner membership + empty Yjs snapshot
→ API returns room metadata
→ Alice creates editor share link
→ API stores token hash and returns raw invitation URL once
→ authenticated Bob accepts raw link
→ API transaction locks/validates link and room, increments use count, upserts editor membership
OR
→ expired/revoked/unknown link fails without membership
```

## 8.3 Collaboration bootstrap and connection

```text
Authenticated room member requests bootstrap
→ API revalidates active session + active room + current membership
→ API signs five-minute room/guest/role-scoped collaboration token
→ browser creates room Y.Doc and Hocuspocus Provider for room:{roomId}
→ collaboration runtime verifies signature and revalidates database authority
→ stored Yjs snapshot loads before document is exposed
OR
→ connection closes with stable safe failure; no false empty document
```

## 8.4 Local rectangle to remote canvas

```text
Alice edits through native Excalidraw
→ adapter normalises durable element records and diffs prior derived projection
→ one Yjs transaction with origin local-excalidraw updates element map + order
→ Hocuspocus distributes Yjs update
→ Bob reconstructs valid active elements in shared order
→ Bob marks remote application and updates Excalidraw through controller
→ resulting onChange is suppressed from republication
```

## 8.5 Snapshot and recovery

```text
Durable Yjs update reaches collaboration document
→ 750 ms debounce resets
→ collaboration runtime encodes complete Yjs snapshot and state vector
→ PostgreSQL upsert increments snapshot sequence
→ collaboration runtime restarts
→ next authorised connection loads and applies stored snapshot
→ both browsers reconstruct the same final rectangle
OR
→ load/store error remains visible and retryable; no successful empty-room state is claimed
```

---

# 9. Failure and security behaviour

## 9.1 Required failures

| Condition | Required behavior |
| --- | --- |
| Missing, expired, revoked session or disabled guest | Return `401`, clear/replace invalid browser state where applicable, and grant no room or collaboration access |
| Unknown, archived, or unauthorized room | Return stable `404` or `403` without revealing private membership details |
| Invalid, expired, revoked, or exhausted invitation | Do not create membership or increment use count; show an actionable safe route |
| Invalid request schema or non-JSON state mutation | Return `400`/`415` without a partial write |
| Missing or disallowed Origin on cookie-authenticated mutation | Return `403`; do not process the mutation |
| Invalid/expired collaboration token or mismatched document name | Reject the WebSocket before document access |
| Current membership no longer writable | Reject the connection or durable update; never trust the token role alone |
| Snapshot load failure or malformed mandatory metadata | Abort document exposure and report unavailable state; never manufacture a new empty room |
| Snapshot store failure | Preserve the in-memory collaborative document, expose degraded status/log a redacted error, and retry on a later store opportunity |
| Invalid remote Excalidraw element | Quarantine/ignore the invalid record, preserve valid shared data, and keep the room usable |
| Provider disconnect | Show reconnecting/failed state and preserve the current visible scene; do not silently claim persistence |

## 9.2 Privacy and credential rules

- Use only synthetic emails in tests.
- Never serialize email into Yjs, Excalidraw elements, awareness, public guest responses, browser test snapshots, screenshots, traces, or console output.
- Redact cookie values, invitation tokens, collaboration tokens, token hashes, SQL connection strings, and signing secrets from logs and evidence.
- Share URLs necessarily contain the raw invitation token; do not log them, persist them in analytics, or include them in durable test artifacts.
- Collaboration credentials travel in provider authentication data, never the document name, query string, awareness, or scene.
- Browser test artifacts may retain room IDs and public usernames but must redact credentials and email.
- No Git commit, push, deployment, destructive cleanup, or external write is authorized by this plan alone.

## 9.3 Blocker rule

Record a blocker rather than changing architecture when:

- Excalidraw cannot be updated remotely without a callback loop or parallel scene model.
- Hocuspocus cannot enforce current server-derived writable membership for the included role.
- PostgreSQL snapshot recovery cannot be proven after an actual collaboration-runtime restart.
- A required dependency cannot be installed under the pinned pnpm/Node runtime.
- Completion evidence exposes private email or a credential.

---

# 10. Testing and evidence

## 10.1 Required test levels

- Unit: runtime contracts, token generation/hash/sign/verify, Yjs schema, adapter diff/order/remote suppression.
- API integration: session privacy, cookie/origin policy, atomic room creation, share acceptance, membership-derived bootstrap, safe failures.
- Collaboration integration: auth rejection, existing snapshot load, debounced store, sequence increment, restart recovery.
- Browser: two isolated contexts executing the exact completion scenario through supported UI paths.
- Production boundary: non-production test API absent from production build.
- Documentation/static: links, structure, boundaries, private-data terms, formatting, lint, typecheck, and build.
- Manual: one submission demo rehearsal using the documented commands and no developer-only mutation hook.

## 10.2 Evidence matrix

| Requirement | Done condition | Proof command or artifact | Result | Evidence |
| --- | --- | --- | --- | --- |
| `REQ-01` | Contracts, auth tokens, and Yjs schema validate accepted and rejected inputs at their owning packages. | `corepack pnpm --filter @vega/contracts test`; `corepack pnpm --filter @vega/auth test`; `corepack pnpm --filter @vega/collaboration-schema test` | Passed | Contracts: 6 files/43 tests; auth: 2/13; collaboration schema: 1/14. |
| `REQ-02` | A native rectangle round-trips through adapter/Yjs with stable ID/order, malformed records are safe, and remote application does not republish. | `corepack pnpm --filter @vega/excalidraw-adapter test`; focused Stage 1 browser test | Passed | Adapter: 2 files/16 tests; browser smoke and live rehearsal created a native Excalidraw rectangle through the controller. |
| `REQ-03` | Guest creation/restoration uses the selected cookie transport, does not return email, and rejects invalid origin/session state. | `corepack pnpm --filter @vega/api test`; focused API integration suite | Passed | API: 3 files/9 tests; isolated integration stack reached readiness and passed its PostgreSQL-backed test. |
| `REQ-04` | Room creation atomically creates owner membership and empty collaboration snapshot; editor link acceptance atomically grants Bob membership. | Focused API/PostgreSQL integration suite | Passed | Migration 005 grants API initial-snapshot insertion; API tests and two-context browser acceptance passed the create/share/accept flow. |
| `REQ-05` | Collaboration bootstrap and Hocuspocus derive authority from current room/session/membership and reject invalid or mismatched access. | API and collaboration integration suites | Passed | API 3/9 and collaboration 2/5 passed; browser clients connected only with server-issued room credentials and live membership. |
| `REQ-06` | Alice's rectangle creation reaches Bob and Bob's movement reaches Alice without a callback loop. | `corepack pnpm test:browser:collaboration` | Passed | Two isolated contexts converged after Alice create and Bob move. |
| `REQ-07` | The final Yjs snapshot survives collaboration-runtime restart and both browser reloads with equivalent rectangle ID, type, position, dimensions, and deletion state. | `corepack pnpm test:browser:collaboration` | Passed | Collaboration-only restart plus both reloads produced equal redacted final projections; live rehearsal also reselected the persisted rectangle after reload. |
| `REQ-08` | Public API, Yjs/scene state, test hook, logs, and retained browser artifacts contain no synthetic email or raw credential. | Security assertions in API/collaboration/browser suites plus artifact inspection | Passed | Browser assertions rejected email and raw share URL in projections; source/artifact inspection found no retained private credential evidence. |
| `REQ-09` | Connection state and actionable guest/invite/room failures are visible through the supported UI. | `corepack pnpm --filter @vega/web test`; browser assertions | Passed | Web: 3 files/10 tests; browser smoke covered error/disconnected state and collaboration proof observed `Connected`. |
| `REQ-10` | Test inspection remains read-only, redacted, and absent from production. | `corepack pnpm verify:production`; canvas-test-api tests | Passed | Production verification and production-phase static bundle scan passed; test-phase browser inspection remained redacted. |
| `REQ-11` | Focused and repository validation gates pass under the pinned toolchain. | `corepack pnpm check`; `corepack pnpm test:integration`; `corepack pnpm docs:check`; `git diff --check` | Passed | Node `24.18.0`/pnpm `11.17.0`; 16 Turbo test tasks, integration 1/1, 56 Markdown files, and diff check all passed. |
| `REQ-12` | A person can run and rehearse the local demo from documented commands without hidden chat context. | README/demo runbook inspection and one recorded rehearsal | Passed | README commands were followed against persistent local infrastructure; guest, room, connection, draw, reload persistence, and share-link UI passed with zero console errors. |

Skipped, quarantined, flaky, partial, or unrun mandatory checks are not passing evidence. Store only concise redacted results in this document.

---

# 11. Execution record

## 11.1 Progress log

| Date | Checkpoint | Outcome | Verification | Next step |
| --- | --- | --- | --- | --- |
| 26 July 2026 | Plan prepared | Goal-readiness gate passed; implementation not started | Source review, current code inspection, and plan audit | Start `D-00` after execution authorization |
| 26 July 2026 | Core packages and application path implemented | Contracts, auth, schema, adapter, API, collaboration, and web routes passed focused suites | Package tests and production verification | Run cross-service acceptance |
| 26 July 2026 | Automated demo acceptance passed | Alice/Bob create, share, accept, create, move, restart, reload, and converge through supported UI | `test:browser:collaboration`; `test:browser`; `test:integration` | Complete documentation and rehearsal |
| 26 July 2026 | Completion audit passed | Repository gates, privacy inspection, README-driven live rehearsal, and plan evidence all passed | `check`; `docs:check`; `git diff --check`; in-app browser rehearsal | Goal complete |

## 11.2 Decisions and blockers

| ID | Type | Description | Evidence | Resolution |
| --- | --- | --- | --- | --- |
| `DEC-007-01` | Decision | Use HttpOnly cookie session transport with exact-origin mutation protection. | Parent `DEC-003` and accepted API/security architecture | Implement and record in config/run documentation |
| `DEC-007-04` | Decision | Use short-lived HMAC collaboration tokens plus live database revalidation. | Accepted bootstrap and collaboration-auth boundaries | Implement in `@vega/auth`, API, and collaboration tests |
| `DEC-007-06` | Decision | Use a 750 ms complete Yjs snapshot debounce. | Parent `DEC-004` and accepted sync design | Implement and prove actual restart recovery |
| `DEC-007-08` | Decision | Match provider/server major and select exact compatible router/query releases once. | Existing catalog and frontend architecture | Selected Hocuspocus provider/server `4.4.0`, React Router `7.18.1`, and TanStack Query `5.101.4` |
| `SCOPE-007-01` | Decision | Cut undo, presence, offline, viewer, assets, physics, deployment, and broad polish. | Four-hour constraint and parent dependency ordering | Do not claim full Stage 1/2 completion |
| `BLK-007-01` | Blocker | None at plan creation. | N/A | Closed |

---

# 12. Documentation updates

Implementation must:

- Add this plan to the canonical task-plan index in the same change.
- Record the selected guest-session transport and collaboration-token configuration in the relevant configuration/deployment documentation.
- Update the root README with the exact local infrastructure, migration, application startup, focused test, and demo-rehearsal commands.
- Document new public package exports and environment variables where repository conventions require it.
- Keep the parent plan honest: do not mark Stage 1 or Stage 2 passed from this slice.
- Add no real guest data, credentials, raw tokens, snapshots, or browser artifacts to documentation.

---

# 13. Definition of done

- [x] Every included deliverable exists at its owning boundary. (`REQ-01`–`REQ-12`)
- [x] Alice and Bob complete the create/share/join flow as separate synthetic guests through supported UI and API paths. (`REQ-03`, `REQ-04`, `REQ-12`)
- [x] Alice's native Excalidraw rectangle reaches Bob, and Bob's movement reaches Alice through adapter/Yjs/Hocuspocus without a duplicate scene model or callback loop. (`REQ-02`, `REQ-05`, `REQ-06`)
- [x] The final rectangle survives a collaboration-runtime restart and both browser reloads from PostgreSQL snapshot state. (`REQ-07`)
- [x] Guest email and raw credentials are absent from every public, collaborative, inspection, log, and retained-evidence surface. (`REQ-03`, `REQ-08`, `REQ-10`)
- [x] Mandatory authorization, invalid-origin, invalid-invite, invalid-token, and persistence-load failures fail closed. (`REQ-03`–`REQ-05`, `REQ-08`)
- [x] Connection and workflow failures are visible and actionable in the minimal UI. (`REQ-09`)
- [x] Every required test and validation gate passes without skipped mandatory coverage. (`REQ-01`–`REQ-11`)
- [x] The evidence matrix has no `Pending`, `Failed`, or `Blocked` mandatory row. (`REQ-01`–`REQ-12`)
- [x] Documentation and the task-plan index match the implemented state, and a manual rehearsal succeeds from those instructions. (`REQ-12`)
- [x] No excluded work or full Stage 1/2 completion is claimed. (`REQ-11`, `REQ-12`)
- [x] No unresolved decision or blocker prevents the goal objective. (`REQ-01`–`REQ-12`)
- [x] The final diff preserves unrelated user changes and contains no unintended generated, secret, or private-data artifact. (`REQ-08`, `REQ-11`)

---

# 14. Completion audit

Before changing execution status to `Passed`:

1. Re-read the objective, completion statement, included scope, and exclusions.
2. Confirm every execution step and gate is `Passed`; a timebox expiring is not completion.
3. Start from migrated PostgreSQL and supported local services using only documented commands.
4. Run the exact two-context browser scenario and retain only redacted bounded artifacts.
5. Ensure the test actually restarts the collaboration runtime, reloads both clients, and compares the same rectangle's stable redacted projection.
6. Run every command named in the evidence matrix under Node `24.18.0` and pnpm `11.17.0`.
7. Search source, logs, test output, screenshots, traces, Yjs projection, test API output, and documentation for the synthetic emails and any captured raw token; any match outside the private form/request fixture fails the audit.
8. Inspect the adapter and frontend ownership boundaries for a duplicated complete scene model or direct Excalidraw mutation outside the controller.
9. Run `corepack pnpm docs:check` and `git diff --check`, review the full diff, and preserve unrelated FND-006/user changes.
10. Update step statuses, evidence results, progress/decision/blocker records, document date, and the task-plan index.
11. Mark this plan `Passed` only when all mandatory evidence passes. Leave the parent Stage 1 and Stage 2 status unchanged and list undo, presence, offline, viewer enforcement, and remaining acceptance scenarios as deferred work.

The final implementation handoff must summarize delivered files and behavior, selected dependency versions, security decisions, exact validation results, the demonstrated workflow, and the excluded work that remains.

**Audit result:** Passed on 26 July 2026 for this bounded demo slice. The parent MVP Stage 1 and Stage 2 remain unchanged; undo/redo, presence, offline support, viewer enforcement, and the remaining acceptance scenarios are still deferred.

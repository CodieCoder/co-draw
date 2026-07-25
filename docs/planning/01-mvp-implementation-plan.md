# MVP Implementation Plan

## Real-Time Collaborative Infinite Canvas

**Document path:** `docs/planning/01-mvp-implementation-plan.md`

**Document status:** Proposed

**Product phase:** Two-day MVP / Hackathon

**Last updated:** 25 July 2026

**Primary owners:** Product, Engineering, and QA

---

# 1. Purpose

This plan converts the accepted product and architecture baseline into an implementation-ready, dependency-ordered delivery sequence.

It defines:

- Mandatory delivery stages and exit gates.
- Target application and package responsibilities.
- Work-package dependencies.
- Acceptance-criterion traceability.
- Decision deadlines.
- Required test and QA evidence.
- Failure, security, scope-control, and risk rules.
- The final MVP release gate.

This plan does not create new APIs, database tables, Yjs keys, product features, or architectural decisions. Detailed interfaces remain authoritative in the linked accepted documents and will become executable contracts during implementation.

---

# 2. Scope

## 2.1 Included

The active plan includes:

- P0 Excalidraw integration and canvas behaviour.
- Guest identity and session handling.
- Room creation and share-link joining.
- Real-time Yjs and Hocuspocus collaboration.
- Durable PostgreSQL-backed collaboration persistence.
- Owner, editor, and viewer permissions.
- Presence, connection feedback, and privacy.
- Required shapes, text, sticky notes, images, and audio.
- Responsive and accessible product-owned controls.
- IndexedDB-backed offline room recovery.
- Permission-gated reconciliation and recoverable rejected drafts.
- Risk-based TDD, integration tests, browser tests, and QA-Intel evidence.
- Local and demo operational readiness.

## 2.2 Excluded from the mandatory sequence

The following remain deferred until the full mandatory release gate passes:

- Matter.js physics, throwing, and collision.
- Mini-map and collaborator radar.
- Recycle bin and room archive.
- General PNG and JSON export.
- Attraction, repulsion, SVG export, and replay.
- Snapshot-plus-incremental persistence.
- Multi-instance scaling or enterprise infrastructure.

Recovery-only download for a rejected offline draft remains mandatory. It is not general room export.

---

# 3. Authoritative inputs

Read this plan with:

- [Product Documentation Index](../product/README.md).
- [Product Requirements](../product/01-product-requirements.md).
- [MVP Scope and Acceptance Criteria](../product/02-mvp-scope-and-acceptance-criteria.md).
- [Canvas Interaction Specification](../product/03-canvas-interaction-specification.md).
- [Architecture Documentation Index](../architecture/README.md).
- [System Architecture](../architecture/01-system-architecture.md).
- [ADR index](../adr/README.md).
- [Testing and Quality Strategy](../architecture/11-testing-and-quality-strategy.md).
- [Deployment and Operational Readiness](../architecture/12-deployment-and-operational-readiness.md).

Each work package also names the relevant domain architecture. Where this plan and an accepted source differ, the accepted source governs.

---

# 4. Non-negotiable implementation constraints

Every stage preserves these rules:

1. Excalidraw is the only canvas renderer and editor.
2. The Excalidraw scene is the canonical visual scene.
3. React, Zustand, PostgreSQL, tests, and product overlays must not contain a competing complete editable scene.
4. Yjs and Hocuspocus own collaborative scene synchronisation.
5. Yjs Awareness carries allowlisted ephemeral presence only.
6. PostgreSQL owns identity, sessions, rooms, membership, permission, asset metadata, audit, and collaboration persistence records.
7. Private object storage owns image and audio bytes.
8. IndexedDB owns device-local collaboration cache and rejected-draft recovery state; it never grants authority.
9. The API and collaboration runtime enforce current permissions.
10. Guest email remains private and is excluded from scene data, Yjs, Awareness, exports, recovery output intended for sharing, public room interfaces, test hooks, and ordinary logs.
11. Test hooks expose redacted derived state, remain non-authoritative, and are absent from production builds.
12. P1 and P2 work cannot begin while a mandatory acceptance scenario is failing.

---

# 5. Delivery method

## 5.1 Vertical-slice rule

Deliver working end-to-end behaviour through the accepted runtime boundaries. Do not complete all frontend work before server authority, persistence, and tests exist.

Each slice includes:

1. A documented acceptance target.
2. A failing test first where the accepted TDD policy applies.
3. The minimum executable contracts.
4. Implementation through the real owning boundaries.
5. Unit and integration verification.
6. Browser verification where user-visible or multi-client behaviour is involved.
7. Failure, privacy, and permission checks.
8. Evidence and known limitations.

## 5.2 Work-in-progress rule

Only one mandatory stage should be treated as the active integration gate at a time. Independent tasks inside that stage may run in parallel when they do not invent conflicting contracts.

Dependent feature work may start only after the prior stage's contract and state-ownership boundaries are stable. The prior stage must pass before the dependent stage is claimed complete.

## 5.3 Definition of ready

A work package is `Ready` only when:

- Its accepted behaviour and priority are linked.
- Owning applications and packages are known.
- Permission, persistence, privacy, and failure requirements are known.
- Required contract shapes are identified in accepted architecture.
- Test levels and observable evidence are defined.
- Blocking decisions are resolved.
- Out-of-scope behaviour is explicit.

## 5.4 Definition of done

A work package is `Passed` only when:

- Its acceptance criteria pass.
- Applicable unit, integration, and browser tests pass.
- Permission enforcement occurs at the owning server boundary.
- Persistence and reload behaviour pass where applicable.
- Private data is absent from public and diagnostic surfaces.
- Failure states do not masquerade as success.
- Required QA-Intel validation is complete where applicable.
- Documentation and executable contracts match implementation.
- Known limitations are recorded.

Manual success in one browser is not completion evidence.

---

# 6. Target ownership

These are target paths from the accepted architecture; they do not claim the directories already exist.

| Boundary | Target location | Delivery responsibility |
| --- | --- | --- |
| Web application | `apps/web` | Guest and room UI, Excalidraw, provider integration, presence, media, offline UX, product controls, redacted test API. |
| HTTP API | `apps/api` | Sessions, rooms, memberships, share links, capabilities, assets, audit, bootstrap, health. |
| Collaboration runtime | `apps/collaboration` | Authenticated Hocuspocus connections, Yjs documents, read-only viewers, Awareness, persistence, reconnect handling, health. |
| Shared contracts | `packages/contracts` | Runtime-validated public request, response, identifier, role, error, asset, and bootstrap shapes. |
| Excalidraw adapter | `packages/excalidraw-adapter` | Supported Excalidraw API boundary, normalisation, diffing, remote application, files, metadata, history suppression, compatibility. |
| Collaboration schema | `packages/collaboration-schema` | Canonical Yjs layout, Awareness allowlist, schema versions, transaction origins, migrations. |
| Canvas extensions | `packages/canvas-extensions` | Pure sticky-note, audio-card, projection, and later conditional P1 logic. |
| Database | `packages/database` | PostgreSQL schema, migrations, repositories, collaboration snapshot storage, test database setup. |
| Authentication | `packages/auth` | Session tokens, collaboration claims, roles, capability derivation, shared server permission helpers. |
| Configuration | `packages/config` | Typed configuration, environment validation, public/secret separation, application loaders. |
| Test utilities | `packages/test-utils` | Synthetic actors, scene and media fixtures, Yjs clients, isolated database helpers, Playwright helpers. |
| QA | Test and QA profiles | Independent release workflows, trace collection, redacted evidence, failure reporting. |

Business rules remain outside the database package. Production packages must not depend on test utilities.

---

# 7. Decision gates

The accepted architecture intentionally leaves several implementation choices open. Resolve each choice by its deadline; do not build multiple permanent paths to avoid choosing.

| ID | Decision | Deadline | Accepted boundary or default | Required record |
| --- | --- | --- | --- | --- |
| DEC-001 | Exact package versions, including Excalidraw | Before Stage 0 scaffold is declared passed | Excalidraw must be pinned and isolated behind the adapter. Other dependencies must be compatible with the accepted stack. | Lockfile, package manifests, root README, adapter compatibility test. |
| DEC-002 | Globally unique identifier library | Before shared identifier contracts or the first migration | IDs must be globally unique, difficult to enumerate, and compatible with PostgreSQL and public URLs. | Executable identifier contract, migration type, focused rationale in implementation docs. |
| DEC-003 | Secure cookie versus explicit bearer guest-session transport | Before browser guest-session integration in Stage 2 | HTTP-only secure cookie is preferred when deployment topology permits; bearer is a documented fallback with stricter client-storage exposure controls. | Auth contract, security tests, configuration and deployment documentation. |
| DEC-004 | Initial Yjs persistence strategy | Before collaboration persistence in Stage 2 | Snapshot-only, debounced persistence is the accepted recommended first MVP path. Incremental updates and compaction remain deferred until core reliability. | Database migration, persistence integration tests, documented limitation. |
| DEC-005 | Direct versus API-proxied asset upload | Before Stage 4 asset contract implementation | Either path must preserve room authorisation, private storage, lifecycle validation, and honest failure. | Asset contracts, CORS/security configuration, integration tests. |
| DEC-006 | Concrete hosting vendor | Before remote demo deployment in Stage 6 | The vendor must support the accepted five logical units, long-lived secure WebSockets, private dependencies, migrations, secrets, and logs. | Deployment configuration, runbook update, smoke evidence. |
| DEC-007 | MVP collaborative undo behaviour | Resolved before implementation | Client-local Excalidraw history; authorised results synchronise normally; no room-wide undo. | [Accepted policy](../architecture/02-collaboration-and-sync-design.md#151-mvp-collaborative-undo-policy) and adapter tests. |

An implementation choice needs a new ADR only when it adds or changes a significant architecture decision. Ordinary library selection within an accepted boundary belongs in executable configuration and focused implementation documentation.

---

# 8. Required control flows

## 8.1 Online collaboration

```text
Guest session
→ API creates or authorises room membership
→ API issues room-scoped collaboration bootstrap
→ Collaboration runtime authenticates session, room, and role
→ Hocuspocus attaches the client to the Yjs room document
→ Excalidraw adapter maps local scene differences into Yjs
→ Remote Yjs changes return through the adapter into Excalidraw
→ Debounced Yjs snapshot persists in PostgreSQL
```

No browser-provided role is authoritative.

## 8.2 Private media

```text
Editor requests asset authorisation
→ API validates session, room, role, kind, and limits
→ Browser uploads through the selected private path
→ Server verifies completion and marks the asset ready
→ Shared scene receives only stable asset and file references
→ Authorised clients resolve private content
```

Pending, failed, unauthorised, or temporary media must not appear successfully durable.

## 8.3 Protected offline recovery

```text
Previously opened room has compatible IndexedDB state
→ Network becomes unavailable
→ Eligible scene changes remain device-local
→ Reconnect starts in gated mode
→ API validates current session, room, and membership
→ Authorised candidate attaches and converges
OR
→ Rejected candidate stays isolated and recoverable
```

The writable provider must not attach before current permission validation.

---

# 9. Delivery-stage summary

| Stage | Required outcome | Blocking proof | Unlocks |
| --- | --- | --- | --- |
| 0 — Execution foundation | Monorepo, runtime shells, executable base contracts, local infrastructure, tests, and documented commands work. | Clean install/build/typecheck/test path; configuration and health failures are safe. | Stage 1 |
| 1 — Excalidraw foundation | Pinned Excalidraw loads through the adapter and round-trips one canonical rectangle without a competing scene model. | Adapter unit/integration tests and single-client browser smoke. | Stage 2 |
| 2 — First collaborative room | Alice and Bob use real authorised paths to create, join, synchronise, move, persist, and reload one rectangle. | Mandatory two-client vertical-slice E2E and persistence restart test. | Stage 3 |
| 3 — Identity, permissions, and presence | Complete identity validation, owner/editor/viewer enforcement, Awareness privacy, cursors, and connection states work. | Modified viewer cannot write; email is absent; QA-002 passes. | Stage 4 |
| 4 — Required content and media | Required native content, sticky notes, private images, audio, responsive controls, and associated metadata survive collaboration and reload. | QA-003 and QA-004 plus media failure and privacy tests. | Stage 5 |
| 5 — Protected offline recovery | Cached rooms reopen offline; authorised edits reconcile; rejected edits remain isolated and recoverable. | Authorised and revoked-permission multi-client workflows plus recovery privacy inspection. | Stage 6 |
| 6 — Release hardening | All P0, operational, performance, accessibility, test, QA, and demo gates pass together. | Accepted MVP release gate and recorded evidence. | Optional P1 selection |

Stages describe integration gates, not team assignments. Failure behaviour, security controls, tests, and documentation are part of every stage.

---

# 10. Stage 0 — Execution foundation

## 10.1 Goal

Create the smallest runnable repository foundation that supports the accepted three application runtimes, shared packages, local dependencies, automated tests, and later vertical slices.

## 10.2 Authoritative sources

- [System Architecture — repository and package boundaries](../architecture/01-system-architecture.md#6-repository-architecture).
- [Testing and Quality Strategy](../architecture/11-testing-and-quality-strategy.md).
- [Deployment and Operational Readiness](../architecture/12-deployment-and-operational-readiness.md).
- [ADR 0006](../adr/0006-risk-based-tdd-and-qa-intel-release-controls.md).
- [ADR 0007](../adr/0007-vendor-neutral-five-unit-deployment-topology.md).

## 10.3 Work packages

| ID | Deliverable | Dependencies | Required proof |
| --- | --- | --- | --- |
| FND-001 | pnpm/Turborepo workspace with React/Vite `web`, NestJS/Fastify `api`, and Hocuspocus `collaboration` application shells plus accepted shared-package boundaries. | DEC-001 | Install, build, typecheck, lint, and test tasks resolve from the repository root. |
| FND-002 | Minimum executable common contracts for identifiers, roles, stable errors, configuration, and health. | DEC-002 | Runtime validation and focused contract tests reject malformed values. |
| FND-003 | PostgreSQL and private S3-compatible local infrastructure with migration and readiness wiring. | FND-001, FND-002 | Empty migration succeeds; unavailable dependencies produce not-ready states without secret leakage. |
| FND-004 | Vitest, integration-test, and Playwright foundations with synthetic Alice, Bob, and Charlie contexts. | FND-001 | One unit test, one isolated service integration test, and one browser smoke test run through documented commands. |
| FND-005 | Non-production redacted test-hook boundary and production-disable assertion. | FND-004 | Production-shaped build has no test API; test profile exposes inspection only, not mutation authority. |
| FND-006 | Root README and CONTRIBUTING setup, validation, and troubleshooting commands based on the working scaffold. | FND-001–FND-005 | A clean environment can follow documented commands without undocumented manual steps. |

## 10.4 Failure and security requirements

- Required configuration fails fast with redacted errors.
- No server secret enters the web bundle.
- Database and object-storage dependencies are private.
- Test fixtures use synthetic data.
- Test reset or inspection paths are non-production and non-public.
- Empty application shells must not present mocked collaboration or persistence as complete.

## 10.5 Exit gate

Stage 0 passes when:

- All three application shells start.
- PostgreSQL migrates and private object storage is reachable in the local profile.
- Root validation commands work and are documented.
- Base contracts have runtime tests.
- Liveness and readiness distinguish process health from dependency readiness.
- Production-shaped output excludes test hooks and server secrets.

No product feature is claimed complete at this stage.

---

# 11. Stage 1 — Excalidraw foundation

## 11.1 Goal

Prove the canonical-canvas and adapter boundary before room, media, offline, or optional extension work expands the integration surface.

## 11.2 Authoritative sources

- [Excalidraw Integration Design](../architecture/05-excalidraw-integration-design.md).
- [Canvas Interaction Specification](../product/03-canvas-interaction-specification.md).
- [ADR 0001](../adr/0001-excalidraw-canvas-engine-and-canonical-visual-scene.md).

## 11.3 Work packages

| ID | Deliverable | Acceptance coverage | Required proof |
| --- | --- | --- | --- |
| CAN-001 | Web route embeds the pinned supported Excalidraw package through the application-owned adapter. | `P0-ENTRY-001`, `P0-EXCALIDRAW-001`, `P0-EXCALIDRAW-005` | Browser smoke confirms the app and canvas load; the exact version is documented and locked. |
| CAN-002 | Adapter owns scene load, normalisation, durable diffing, remote-application suppression, file mapping boundary, and redacted test projection. | `P0-EXCALIDRAW-002`, `P0-EXCALIDRAW-004` | Unit tests cover normalisation, meaningful diffing, invalid scene handling, callback suppression, and no duplicate complete scene store. |
| CAN-003 | Collaboration-schema package defines the accepted initial Yjs document layout, transaction origins, and reconstruction path. | `P0-EXCALIDRAW-003` | Two in-process Yjs documents reconstruct equivalent valid Excalidraw state from the shared schema. |
| CAN-004 | One rectangle can be created, observed, serialised through the accepted adapter/Yjs boundary, and restored. | `P0-CONTENT-001`, initial `P0-CANVAS-001`–`P0-CANVAS-004` | Single-client integration and browser tests prove rectangle round-trip, pan, zoom, negative coordinates, and local viewport ownership. |
| CAN-005 | Local undo/redo and remote-history suppression hooks follow the accepted policy. | `P0-MANIPULATION-009` integration boundary | Tests prove local history classification without implementing a room-wide undo stack. |

## 11.4 Control flow

```text
Excalidraw local action
→ Adapter normalises and classifies durable differences
→ Accepted Yjs structure receives the difference
→ Adapter reconstructs the scene
→ Excalidraw renders an equivalent result
```

The adapter may use test fixtures for this stage. It must not create a temporary production scene model that survives into later stages.

## 11.5 Failure and security requirements

- Invalid or incompatible scene data produces a recoverable error, not a convincing empty room.
- Remote-application simulation cannot create callback loops or duplicate history.
- Test projections exclude email, credentials, Awareness, signed URLs, and raw private content.
- Direct Excalidraw imperative access remains inside the adapter/controller boundary.

## 11.6 Exit gate

Stage 1 passes when a pinned Excalidraw canvas creates and restores one rectangle through the canonical adapter/Yjs representation, with no second editable scene, no callback loop, and passing unit, integration, and browser smoke tests.

Room creation, real remote collaboration, product objects, media, offline recovery, and P1 extensions remain out of scope.

---

# 12. Stage 2 — First collaborative room

## 12.1 Goal

Deliver the accepted first collaboration vertical slice through real session, room, membership, API, Hocuspocus, Yjs, PostgreSQL, and browser boundaries.

A thin valid guest and editor-invitation path is pulled into this stage because the collaboration proof must cross real server-authoritative access boundaries. Stage 3 completes validation, role changes, viewer enforcement, presence, and connection-state behaviour.

## 12.2 Authoritative sources

- [Collaboration and Synchronisation Design — first vertical slice](../architecture/02-collaboration-and-sync-design.md#68-first-collaboration-vertical-slice).
- [Data Model and Persistence](../architecture/03-data-model-and-persistence.md).
- [API and Service Boundaries](../architecture/04-api-and-service-boundaries.md).
- [ADR 0002](../adr/0002-yjs-hocuspocus-collaboration-and-awareness.md).
- [ADR 0003](../adr/0003-persistence-and-asset-ownership-boundaries.md).
- [ADR 0004](../adr/0004-server-authoritative-permissions-and-private-guest-identity.md).

## 12.3 Work packages

| ID | Deliverable | Acceptance coverage | Required proof |
| --- | --- | --- | --- |
| COL-001 | Valid guest-session happy path with opaque credential handling and restoration. | `P0-IDENTITY-001`, `P0-ENTRY-002` | API integration and browser tests create and restore a synthetic guest without exposing email publicly. |
| COL-002 | Atomic room creation creates the room, owner membership, and initial collaboration document. | `P0-ROOM-001`, `P0-ROOM-003`, `P0-PERMISSION-001` | PostgreSQL integration test proves transaction atomicity and initial recoverable snapshot. |
| COL-003 | Owner creates an editor share link and Bob accepts it through supported API/UI paths. | `P0-ROOM-002`, `P0-JOIN-001`, `P0-JOIN-002`, `P0-PERMISSION-002` | Browser contexts have independent sessions and Bob receives only server-derived editor capability. |
| COL-004 | Room-scoped bootstrap authenticates Hocuspocus and attaches Alice and Bob to the canonical Yjs document. | `P0-COLLAB-001`, `P0-COLLAB-002` | Collaboration integration test rejects invalid room or session claims and synchronises creation and movement once. |
| COL-005 | Debounced snapshot-only Yjs persistence reloads after client and collaboration-runtime restart. | `P0-COLLAB-008`, `P0-ROOM-003` | Persistence restart test reconstructs equivalent scene, order, metadata version, and Excalidraw version. |
| COL-006 | Two-client Playwright vertical slice covers create, join, rectangle create, move, local undo/redo, persistence, and reload. | `QA-001`, supported `P0-MANIPULATION-009` | Alice and Bob finish with equivalent state; unrelated remote work survives undo; no duplicate publication occurs. |

## 12.4 Required browser proof

```gherkin
Scenario: Rectangle synchronises and persists
  Given Alice creates a room
  And Bob joins as an editor
  When Alice creates a rectangle
  Then Bob sees the rectangle
  When Bob moves the rectangle
  Then Alice sees the final position
  When both reload the room
  Then both see the rectangle in the final position
```

## 12.5 Failure and security requirements

- A room URL alone never grants access.
- Raw session and share tokens are hashed or handled according to accepted transport rules and never logged.
- Collaboration connection failure shows a real reconnecting/error state.
- Persistence failure never produces a false durability claim.
- API and collaboration logs contain stable identifiers and categories, not guest email or raw scene/Yjs content.
- The web client cannot select its authoritative role.

## 12.6 Exit gate

Stage 2 passes only when the exact two-editor rectangle scenario succeeds through supported product paths, remains equivalent after reload and collaboration-runtime restart, and produces deterministic automated evidence.

No sticky note, image, audio, presence overlay, offline recovery, or P1 feature begins before this slice is reliable.

---

# 13. Stage 3 — Identity, permissions, presence, and connection state

## 13.1 Goal

Complete guest-session validation and establish the owner/editor/viewer, Awareness, presence, and connection-state security boundaries.

## 13.2 Authoritative sources

- [API and Service Boundaries](../architecture/04-api-and-service-boundaries.md).
- [Realtime Presence and Awareness](../architecture/07-realtime-presence-and-awareness.md).
- [Security, Permission, and Privacy Architecture](../architecture/10-security-permission-and-privacy-architecture.md).
- [Frontend Architecture](../architecture/06-frontend-architecture.md).
- [ADR 0004](../adr/0004-server-authoritative-permissions-and-private-guest-identity.md).

## 13.3 Work packages

| ID | Deliverable | Acceptance coverage | Required proof |
| --- | --- | --- | --- |
| IAM-001 | Complete username/email validation, invalid-session handling, expiry, revocation, and private-email storage. | `P0-ENTRY-003`, `P0-IDENTITY-002`–`P0-IDENTITY-006` | Unit/API/browser tests cover invalid values and prove email is absent from public outputs. |
| IAM-002 | Invalid or expired share links fail safely and do not create membership. | `P0-JOIN-003` | Transaction and browser tests preserve existing room membership state. |
| IAM-003 | Owner role change, editor access, viewer UI mode, and collaboration-server write rejection use one shared capability policy. | `P0-PERMISSION-003`–`P0-PERMISSION-006`, `P0-SECURITY-002` | A modified viewer client still cannot publish; active downgrade takes effect safely. |
| PRE-001 | Awareness allowlist, active collaborator list, cursor, selection, viewport, cleanup, throttling, and colour assignment. | `P0-PRESENCE-001`–`P0-PRESENCE-004` | Multi-client tests prove ephemeral presence, disconnect cleanup, and email exclusion. |
| CON-001 | Connected, reconnecting, access-denied, and recoverable collaboration failure states are visible and accessible. | `P0-CONNECTION-001`, `P0-CONNECTION-002`, `P0-CONNECTION-004`, `P0-ERROR-001`, `P0-ACCESSIBILITY-002` | Browser tests use stable state and non-colour-only UI; failure does not clear valid scene state. |
| SEC-001 | Security test suite covers role tampering, cross-room access, Awareness rejection, token redaction, and production test-hook absence. | `P0-SECURITY-001`, `P0-SECURITY-002` | API, collaboration, browser, and production-shaped checks pass. |

## 13.4 Control flow

```text
Server session + room + membership
→ Derived capability
→ API response and collaboration bootstrap
→ Web interface mode
→ Collaboration runtime independently enforces read-only or writable access
```

Awareness is validated separately and never grants durable capability.

## 13.5 Failure and security requirements

- Permission-service or session-validation failure fails protected actions closed.
- Live editor-to-viewer downgrade prevents subsequent durable publication.
- Invalid Awareness fields are dropped or rejected without disconnecting healthy room state unnecessarily.
- Presence expiry does not delete durable content.
- Email remains absent from awareness, scene data, membership display, hooks, exports, and logs.

## 13.6 Exit gate

Stage 3 passes when Alice owns, Bob edits, and Charlie observes through separate browser contexts; Charlie cannot publish even with client tampering; role changes take effect; remote cursors and cleanup work; connection states are accessible; and `QA-002` passes.

---

# 14. Stage 4 — Required content, media, and responsive controls

## 14.1 Goal

Complete mandatory canvas content and product-owned mixed-media behaviour without duplicating Excalidraw or weakening private asset controls.

## 14.2 Authoritative sources

- [Canvas Interaction Specification](../product/03-canvas-interaction-specification.md).
- [Excalidraw Integration Design](../architecture/05-excalidraw-integration-design.md).
- [Asset and Media Architecture](../architecture/08-asset-and-media-architecture.md).
- [Frontend Architecture](../architecture/06-frontend-architecture.md).
- [ADR 0003](../adr/0003-persistence-and-asset-ownership-boundaries.md).

## 14.3 Work packages

| ID | Deliverable | Acceptance coverage | Required proof |
| --- | --- | --- | --- |
| CNT-001 | Required native shapes, freehand, text, selection, multi-selection, resize, rotation, duplicate, group, ungroup, z-order, and local undo/redo remain available through Excalidraw. | `P0-CONTENT-001`–`P0-CONTENT-006`, `P0-MANIPULATION-001`–`P0-MANIPULATION-009` | Integration/browser coverage focuses on product integration and collaboration, not retesting all Excalidraw internals. |
| COL-EXT-001 | Collaboration propagates resize, rotation, style, deletion, order, and simultaneous independent changes through the canonical element map and order. | `P0-COLLAB-003`–`P0-COLLAB-007` | Two-client integration and browser tests prove each supported change converges once and persists after reload. |
| STK-001 | Sticky-note composition, editing, colour variation, metadata association, collaboration, and reload. | `P0-STICKY-001`–`P0-STICKY-004` | Unit metadata tests and two-client browser reload proof. |
| AST-001 | Server-authorised private asset metadata, selected upload flow, lifecycle validation, stable references, and authorised resolution. | `P0-IMAGE-001`, `P0-IMAGE-004`–`P0-IMAGE-006`, `P0-SECURITY-003` | API/storage integration tests cover editor success, viewer/non-member denial, unsafe input, missing binary, and false-ready prevention. |
| IMG-001 | Excalidraw image file mapping, remote rendering, cache management, and reload. | `P0-IMAGE-002`, `P0-IMAGE-003`, `QA-003` | Bob sees Alice's image and still sees it after reload; URLs and object resources are disposed safely. |
| AUD-001 | Microphone permission, recording lifecycle, private upload, audio-card composition, remote rendering, playback, cleanup, and reload. | `P0-AUDIO-001`–`P0-AUDIO-006`, `QA-004` | Deterministic media test path plus real-browser smoke; denial leaves ordinary canvas editing usable. |
| UX-001 | Desktop authoring, tablet usability, mobile viewing, and keyboard-accessible product controls. | `P0-RESPONSIVE-001`–`P0-RESPONSIVE-003`, `P0-ACCESSIBILITY-001` | Responsive and accessibility browser checks on target viewports. |
| EXT-001 | Product-extension and asset failures are isolated and visible. | `P0-ERROR-003` | Failed overlay, upload, recording, or media resolution does not corrupt the canonical scene. |

## 14.4 Media control flow

```text
Create pending asset metadata
→ Authorise editor upload
→ Validate private binary
→ Mark asset ready
→ Insert or complete the scene object with stable identifiers
→ Resolve privately for authorised collaborators
```

An asset placeholder may show `pending` or `failed`; it must not claim `ready` before authoritative completion.

## 14.5 Failure and security requirements

- Image and audio bytes never enter PostgreSQL rows or Yjs.
- Temporary upload and download URLs never become durable scene state.
- Viewers and non-members cannot upload or resolve unauthorised private assets.
- Unsupported files and microphone denial leave the canvas usable.
- Missing assets preserve the valid scene object with an honest unavailable state.
- Media streams, object URLs, and room-scoped subscriptions are released on teardown.

## 14.6 Exit gate

Stage 4 passes when required native content and sticky notes collaborate correctly, private image and audio workflows synchronise and survive reload, failure states remain honest, responsive/accessibility checks pass, and `QA-003` plus `QA-004` produce redacted evidence.

---

# 15. Stage 5 — Protected offline recovery

## 15.1 Goal

Deliver the mandatory offline differentiator for previously opened rooms without allowing stale local permission assumptions to publish.

## 15.2 Authoritative sources

- [Offline Sync and Recovery](../architecture/09-offline-sync-and-recovery.md).
- [Collaboration and Synchronisation Design](../architecture/02-collaboration-and-sync-design.md).
- [Security, Permission, and Privacy Architecture](../architecture/10-security-permission-and-privacy-architecture.md).
- [ADR 0005](../adr/0005-permission-gated-offline-reconciliation.md).

## 15.3 Work packages

| ID | Deliverable | Acceptance coverage | Required proof |
| --- | --- | --- | --- |
| OFF-001 | Online room initialises compatible IndexedDB collaboration cache and exposes honest readiness. | Prerequisite for `MVP-D-OFFLINE-001` | Browser storage integration proves room-scoped cache isolation and compatible reload. |
| OFF-002 | Previously opened room loads offline; uncached or incompatible room fails honestly rather than appearing empty. | `MVP-D-OFFLINE-001`, `MVP-D-OFFLINE-002`, `P0-CONNECTION-003`, `P0-ERROR-004` | Browser tests distinguish cached, uncached, invalid, and schema-incompatible state. |
| OFF-003 | Eligible scene changes and supported local undo/redo remain device-local with visible unsynchronised status. | `MVP-D-OFFLINE-003` | Browser reload preserves candidate state without claiming server durability. |
| OFF-004 | Reconnect gate validates current session, room, and membership before writable provider attachment and authorised convergence. | `MVP-D-OFFLINE-004`, `QA-005` | Alice reconnects as current editor and Bob observes converged changes. |
| OFF-005 | Revoked or denied candidate remains isolated; current authorised room loads separately; recovery artifact is privacy-filtered. | `MVP-D-OFFLINE-005` and mandatory rejection workflow | Another online client revokes Alice; Alice's reconnect publishes nothing; local recovery remains available. |
| OFF-006 | Offline asset action is queued or blocked honestly; quota, storage, schema, and server-unavailable failures preserve recovery where feasible. | `MVP-D-OFFLINE-006`, `P0-ERROR-002` | Unit/integration/browser tests cover each failure category and bounded retry state. |

## 15.4 Reconnection order

```text
Detect network recovery
→ Pause writable attachment
→ Validate session
→ Validate room status
→ Validate current membership and capability
→ Load current remote room separately
→ Reconcile only when authorised
→ Otherwise isolate and offer recovery
```

Reordering this gate is a security defect.

## 15.5 Failure and security requirements

- IndexedDB possession never grants room authority.
- An uncached room is never shown as a valid empty room.
- Server-unavailable revalidation remains gated and retries safely.
- Rejected drafts never attach to the writable shared document.
- Recovery output excludes email, credentials, Awareness, signed URLs, storage keys, and diagnostics.
- Cache cleanup never removes the only recoverable copy of unsynchronised work.

## 15.6 Exit gate

Stage 5 passes when both mandatory paths succeed:

1. An authorised offline edit converges after current permission validation.
2. A permission-revoked offline edit remains absent from shared state and recoverable locally.

Evidence must come from isolated browser contexts and include state assertions, traces, logs, and relevant network results. Screenshots alone are insufficient.

---

# 16. Stage 6 — Release hardening and demonstration

## 16.1 Goal

Make the assembled mandatory product reliable, observable, secure, demonstrable, and honestly scoped.

## 16.2 Authoritative sources

- [MVP release gate](../product/02-mvp-scope-and-acceptance-criteria.md#42-mvp-release-gate).
- [Testing and Quality Strategy](../architecture/11-testing-and-quality-strategy.md).
- [Deployment and Operational Readiness](../architecture/12-deployment-and-operational-readiness.md).
- [ADR 0006](../adr/0006-risk-based-tdd-and-qa-intel-release-controls.md).
- [ADR 0007](../adr/0007-vendor-neutral-five-unit-deployment-topology.md).

## 16.3 Work packages

| ID | Deliverable | Acceptance coverage | Required proof |
| --- | --- | --- | --- |
| REL-001 | Full acceptance traceability and mandatory automated suites are green. | All P0 and `MVP-D-*` criteria | Recorded run with no skipped or quarantined mandatory test. |
| REL-002 | Representative 100-element, two-client scene remains usable; batching and cleanup avoid obvious degradation. | `P0-CANVAS-005`, `P0-PERFORMANCE-001` | Behavioural performance evidence and browser diagnostics. |
| REL-003 | Collaboration, persistence, invalid scene, dependency, asset, and extension failures report honestly and preserve safe state. | `P0-ERROR-001`–`P0-ERROR-004` | Failure-injection integration and browser tests. |
| REL-004 | Vendor-neutral demo deployment, migrations, health/readiness, private storage, secure WebSocket, redacted logs, backup, and recovery rehearsal work. | Engineering and operational release gate | Production-shaped smoke, hook-absence check, restart tests, and recorded recovery rehearsal. |
| REL-005 | QA-Intel executes mandatory room, viewer, image, audio, authorised offline, and rejected-draft workflows against the release candidate. | `QA-001`–`005` plus mandatory rejection workflow | Evidence includes revision, environment, roles, trace, logs, network failures, redacted state, result, and known limitation. |
| REL-006 | Demo and fallback sequence is rehearsed with synthetic data and no hidden manual state. | Demonstration release gate | Repeatable primary demo plus approved safe fallback evidence. |

## 16.4 Release failure rules

- A retry diagnoses flakiness but does not erase the original failure.
- A quarantined mandatory test remains a release blocker.
- No known P0 data-loss, permission-bypass, privacy, false-durability, or offline-publication defect may remain.
- Missing media support in a browser is disclosed; it is not presented as universal support.
- A failed optional capability is removed or disabled and does not block MVP only when it is outside mandatory scope.
- Fallbacks never make assets public, disable permissions, publish rejected work, clear the only recovery copy, or replace Excalidraw.

## 16.5 Exit gate

Stage 6 and the MVP pass only when the complete [accepted MVP release gate](../product/02-mvp-scope-and-acceptance-criteria.md#42-mvp-release-gate) passes in one identified release candidate and the team can perform the accepted demonstration reliably.

---

# 17. Acceptance traceability

| Accepted area | Criteria | Primary stage | Minimum evidence |
| --- | --- | --- | --- |
| Application entry and identity | `P0-ENTRY-001`–`P0-ENTRY-003`, `P0-IDENTITY-001`–`P0-IDENTITY-006` | 1–3 | Unit/API/browser validation and private-data inspection. |
| Excalidraw integration | `P0-EXCALIDRAW-001`–`P0-EXCALIDRAW-005` | 1–2 | Adapter tests, version pin, scene round-trip, multi-client reload. |
| Rooms and joining | `P0-ROOM-001`–`P0-ROOM-003`, `P0-JOIN-001`–`P0-JOIN-003` | 2–3 | Transaction tests and supported create/share/join browser flow. |
| Permissions | `P0-PERMISSION-001`–`P0-PERMISSION-006` | 2–3 | Shared capability tests and hostile viewer write rejection. |
| Scene collaboration | `P0-COLLAB-001`–`P0-COLLAB-008` | 2–4 | Yjs/Hocuspocus integration and multi-client browser convergence. |
| Presence | `P0-PRESENCE-001`–`P0-PRESENCE-004` | 3 | Awareness validation, cursor/presence browser proof, cleanup and privacy. |
| Canvas navigation | `P0-CANVAS-001`–`P0-CANVAS-005` | 1 and 6 | Adapter/browser interaction plus representative-scene evidence. |
| Native content | `P0-CONTENT-001`–`P0-CONTENT-006` | 1 and 4 | Product integration smoke and collaboration/reload proof. |
| Sticky notes | `P0-STICKY-001`–`P0-STICKY-004` | 4 | Metadata unit tests and multi-client reload. |
| Images | `P0-IMAGE-001`–`P0-IMAGE-006` | 4 | API/storage integration, private resolution, QA-003. |
| Audio | `P0-AUDIO-001`–`P0-AUDIO-006` | 4 | Recorder-state tests, remote playback, denial path, QA-004. |
| Manipulation | `P0-MANIPULATION-001`–`P0-MANIPULATION-009` | 1, 2, and 4 | Excalidraw integration, collaboration, z-order, and local-history policy tests. |
| Responsive behaviour | `P0-RESPONSIVE-001`–`P0-RESPONSIVE-003` | 4 and 6 | Target viewport browser checks. |
| Connection states | `P0-CONNECTION-001`–`P0-CONNECTION-004` | 3 and 5 | State-machine tests and accessible browser feedback. |
| Protected offline | `MVP-D-OFFLINE-001`–`MVP-D-OFFLINE-006` | 5 | IndexedDB integration, authorised reconciliation, rejected-draft recovery. |
| Error handling | `P0-ERROR-001`–`P0-ERROR-004` | 2–6 | Boundary-specific failure injection and honest UI state. |
| Accessibility | `P0-ACCESSIBILITY-001`, `002` | 3, 4, and 6 | Keyboard and non-colour-only checks. |
| Security | `P0-SECURITY-001`–`P0-SECURITY-003` | 2–6 | Server rejection, privacy inspection, upload safety, production-hook absence. |
| Performance | `P0-PERFORMANCE-001` | 6 | Representative 100-element, two-client behavioural evidence. |
| Independent QA | `QA-001`–`QA-005` plus rejected-draft flow | 2–6 | Release-shaped QA-Intel evidence. |

Conditional P1 and P2 criteria do not appear in the mandatory completion column.

---

# 18. Test execution and evidence

## 18.1 Unit tests

Use unit tests for deterministic validation, mapping, policy, transitions, redaction, diffing, conflict helpers, offline branching, and configuration.

Do not recreate Excalidraw's internal test suite or a mocked full-system workflow.

## 18.2 Integration tests

Use real boundary-appropriate PostgreSQL, private object storage, Yjs, Hocuspocus, IndexedDB, API, and adapter instances where a mock would hide the principal risk.

Each integration environment must be isolated and must not use production data or credentials.

## 18.3 Browser tests

Use separate browser contexts:

- Alice as owner.
- Bob as editor.
- Charlie as viewer.
- An additional authoritative context when revoking Alice while Alice is offline.

Browser tests use supported UI and API paths. Test hooks may inspect redacted derived state but cannot mutate scene, Yjs, role, permission, or recovery authority.

## 18.4 QA-Intel

QA-Intel independently validates the release-shaped system. It records:

- Application revision.
- Environment and enabled feature flags.
- Browser and version.
- Synthetic roles and run identifier.
- Pass, fail, or blocked result.
- Screenshots at meaningful checkpoints.
- Playwright trace.
- Console warnings and errors.
- Relevant failed network requests and stable error codes.
- Redacted test-state assertions.
- Likely failure boundary and known limitation.

Evidence must not contain real personal data, raw credentials, signed URLs, raw scenes, Yjs updates, rejected drafts, or media bodies.

## 18.5 Command ownership

Stage 0 must publish the real root commands for:

- Install.
- Build.
- Typecheck.
- Lint.
- Unit tests.
- Integration tests.
- Browser tests.
- Production-shaped build.
- Local infrastructure and migrations.

This plan does not fabricate commands before the scaffold exists.

---

# 19. Blocker and failure policy

A blocker record must name:

- The blocked work-package ID.
- The failed dependency or unresolved decision.
- Evidence or reproduction.
- Whether mandatory scope is affected.
- The safe next investigation step.
- The scope or schedule consequence.

When a mandatory boundary fails:

1. Preserve authoritative and recoverable state.
2. Stop dependent completion claims.
3. Fix the owning boundary or reduce optional scope.
4. Rerun the failed level and the affected vertical slice.
5. Record any remaining limitation honestly.

Do not create a parallel persistence path, alternate scene model, client-only permission bypass, public bucket, or unreviewed fallback to make a blocked demonstration appear complete.

---

# 20. Security release checklist

Before MVP acceptance:

- Confirm the selected session transport and browser-storage policy.
- Confirm API and collaboration capability derivation uses current server state.
- Confirm a modified viewer cannot publish.
- Inspect scene, Yjs, Awareness, exports, recovery, hooks, and logs for email and credentials.
- Confirm share links cannot grant owner and raw tokens are not logged.
- Confirm assets are private and room-authorised.
- Confirm unsafe uploads do not become ready.
- Confirm reconnect validates permission before publication.
- Confirm rejected drafts remain isolated and recovery is privacy-filtered.
- Confirm internal control paths are authenticated and non-public.
- Confirm production-shaped builds have no test API or server secret.
- Confirm backup and recovery preserve roles, collaboration state, assets, and local drafts.

---

# 21. Risk register

| ID | Risk or trigger | Impact | Mitigation and fallback |
| --- | --- | --- | --- |
| R-001 | Direct Excalidraw access spreads outside the adapter. | Upgrade fragility and inconsistent scene behaviour. | Enforce package boundaries and adapter tests; stop feature work that bypasses the boundary. |
| R-002 | A complete scene copy appears in React, Zustand, PostgreSQL tables, or tests. | Competing authority, drift, and data loss. | Remove the duplicate model; derive disposable projections only from Excalidraw/Yjs. |
| R-003 | Remote updates loop back as local publications. | Duplicate history, traffic, and non-convergence. | Explicit origins, suppression state, scene comparison, and two-client loop tests. |
| R-004 | Browser role or view mode is treated as security. | Viewer write bypass. | Shared server capability policy and hostile-client tests at API and collaboration boundaries. |
| R-005 | Guest email or credentials enter public collaboration or evidence. | Privacy and credential exposure. | Allowlists, redaction tests, synthetic fixtures, and direct output inspection. |
| R-006 | Collaboration persistence reports success before durable snapshot save. | False durability and room loss. | Debounced snapshot integration tests, readiness signals, restart recovery, honest client status. |
| R-007 | Media metadata and binary lifecycle diverge. | Broken or falsely ready objects. | Explicit pending/ready/failed state machine, private resolution, reconciliation tests, honest fallback. |
| R-008 | Browser audio support or fake-media automation varies. | Demo or test instability. | Chromium-first deterministic fixture path, real smoke test, disclosed browser limitations, ordinary canvas fallback. |
| R-009 | Writable collaboration attaches before reconnect permission validation. | Unauthorised offline publication. | Explicit reconnection gate, denied-candidate isolation tests, and no bypass fallback. |
| R-010 | IndexedDB quota, schema, or cleanup removes recoverable work. | Local data loss. | Visible storage state, bounded cleanup, compatibility checks, and preserve-only recovery fallback. |
| R-011 | P1 work starts before mandatory slices pass. | Two-day MVP failure. | Enforce stage gates and remove optional polish before reducing mandatory behaviour or evidence. |
| R-012 | Browser tests rely on screenshots or shared contexts. | False convergence and permission confidence. | Separate contexts, stable redacted state hooks, traces, and network assertions. |
| R-013 | Vendor or environment cannot sustain secure long-lived WebSockets. | Remote collaboration failure. | Verify compatibility before selection; preserve a prevalidated local demo fallback without weakening security. |
| R-014 | Documentation and executable contracts drift. | Frontend, API, and collaboration incompatibility. | Update contracts and docs with implementation, run contract tests, and reject silent architecture changes. |

---

# 22. Scope control and optional activation

When time is constrained, apply the accepted scope-reduction order before changing mandatory work.

The following activation gate applies to every P1 capability:

1. Stages 0–6 pass.
2. No P0 acceptance scenario is failing or quarantined.
3. No known P0 data-loss, permission, privacy, media, or offline-publication defect remains.
4. The selected P1 capability has accepted behaviour, permission, persistence, failure, and test boundaries.
5. Its implementation cannot destabilise the mandatory release candidate.

Matter.js remains a temporary client-side projection. If physics is selected later, it receives an implementation plan and any required standalone architecture review at that time.

---

# 23. Immediate implementation kickoff

After this plan is accepted, begin in this order:

1. Resolve DEC-001 and DEC-002.
2. Scaffold the pnpm/Turborepo workspace and target applications/packages.
3. Add root configuration validation and executable base contracts.
4. Start PostgreSQL and private S3-compatible local infrastructure.
5. Establish migrations, health checks, and isolated test profiles.
6. Pin Excalidraw and implement the adapter boundary.
7. Prove one rectangle round-trip through the accepted adapter/Yjs structure.
8. Resolve DEC-003 before browser session integration.
9. Implement the real two-editor room vertical slice.
10. Stop and verify the Stage 2 exit gate before adding custom objects.

---

# 24. Plan definition of done

This plan is implementation-ready when:

- Every mandatory release area maps to a delivery stage and evidence type.
- Stage dependencies follow accepted runtime and state ownership.
- Decision deadlines prevent parallel permanent implementations of open choices.
- The first collaborative vertical slice uses real authority and persistence boundaries.
- Media and offline work cannot begin before their prerequisites pass.
- P1 and P2 capabilities remain outside the mandatory sequence.
- Failure, security, privacy, testing, and operational requirements are part of each stage.
- No plan item creates a second canvas model, client-authoritative permission, public asset path, private-email exposure, or unauthorised offline publication.
- All links resolve and the plan is explicitly reviewed before its status changes from `Proposed`.

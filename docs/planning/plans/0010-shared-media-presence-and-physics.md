# Shared Media, Spatial Presence, and Physics

**Document path:** `docs/planning/plans/0010-shared-media-presence-and-physics.md`

**Document status:** Proposed

**Execution status:** Blocked

**Parent plan:** [MVP Implementation Plan](../01-mvp-implementation-plan.md)

**Applicable work packages:** `PRE-001`, `AST-001`, `IMG-001`, `P1-MINIMAP-001`–`P1-MINIMAP-003`, `P1-RADAR-001`–`P1-RADAR-002`, and `P1-PHYSICS-001`–`P1-PHYSICS-007`

**Goal objective:** Make shared images render for every authorised participant, expose live collaborator location through a private Awareness-driven mini-map/radar, and provide bounded Matter.js physics that converges as valid Excalidraw transforms.

**Completion statement:** This goal is complete when two authorised browser contexts share and reload a private image, see and navigate to each other's location without exposing email, and converge after an eligible physics interaction, with all scoped repository and documentation gates passing.

**Last updated:** 27 July 2026

**Primary owners:** Product Engineering, Collaboration Engineering, and QA

---

# 1. Purpose

This plan addresses three observable collaboration gaps in the current demo:

- Excalidraw image elements synchronise, but their binary files do not, so
  remote participants see placeholders.
- The Hocuspocus provider is connected, but no allowlisted Yjs Awareness state
  is published or rendered; collaborator location and mini-map behaviour are
  absent.
- The accepted P1 physics experience has no implementation.

The plan delivers those related interactive behaviours without adding a second
canvas model. It also records that protected offline recovery remains mandatory
but unimplemented and time-travel replay remains unimplemented P2 scope.

# 2. Goal contract

## 2.1 Objective

Make shared images render for every authorised participant, expose live
collaborator location through a private Awareness-driven mini-map/radar, and
provide bounded Matter.js physics that converges as valid Excalidraw transforms.

## 2.2 Completion statement

Two authorised browser contexts must share and reload a private image, see and
navigate to each other's location without exposing email, and converge after an
eligible physics interaction, with all scoped repository and documentation
gates passing.

## 2.3 Goal handoff

```text
/goal Implement the persisted plan at docs/planning/plans/0010-shared-media-presence-and-physics.md in full. Treat its scope, constraints, execution steps, evidence matrix, and definition of done as the execution contract. Keep the execution record current, preserve unrelated user changes, and do not mark the plan Passed until every mandatory evidence row passes.
```

# 3. Authoritative sources and constraints

- [Repository instructions](../../../AGENTS.md)
- [Product requirements](../../product/01-product-requirements.md)
- [MVP acceptance criteria](../../product/02-mvp-scope-and-acceptance-criteria.md)
- [MVP implementation plan](../01-mvp-implementation-plan.md)
- [Excalidraw integration design](../../architecture/05-excalidraw-integration-design.md)
- [Realtime presence and Awareness](../../architecture/07-realtime-presence-and-awareness.md)
- [Asset and media architecture](../../architecture/08-asset-and-media-architecture.md)
- [Security, permission, and privacy architecture](../../architecture/10-security-permission-and-privacy-architecture.md)
- [ADR 0002](../../adr/0002-yjs-hocuspocus-collaboration-and-awareness.md)
- [ADR 0003](../../adr/0003-persistence-and-asset-ownership-boundaries.md)

The implementation must preserve these invariants:

- Excalidraw remains the only visual scene and renderer.
- Yjs carries scene records and stable asset mappings, never binary bodies,
  object URLs, signed URLs, credentials, or guest email.
- PostgreSQL owns asset lifecycle metadata and private object storage owns
  image bytes.
- API membership checks guard every upload and resolution path.
- Awareness is ephemeral, allowlisted, room-scoped, and non-authoritative.
- Matter.js is temporary client-side simulation; only ordinary Excalidraw
  element transforms become durable shared state.
- A bounded interaction lease prevents competing physics publishers and
  expires automatically.

# 4. Scope

## 4.1 Included

- API-proxy image asset creation, binary upload, completion, metadata lookup,
  and authenticated content streaming.
- PNG, JPEG, and WebP validation with a 10 MB maximum and honest non-ready
  states.
- Stable Excalidraw file-ID to product asset-ID mapping in Yjs product metadata.
- Remote image resolution, Excalidraw file registration, reload persistence,
  in-flight request deduplication, and disposable data handling.
- Allowlisted Awareness identity, cursor, viewport, selection, connection
  lifecycle, throttling, and email exclusion.
- Native Excalidraw remote cursor rendering plus a compact scene mini-map,
  collaborator markers, off-screen radar actions, and local-only navigation.
- Matter.js activation for rectangles, ellipses, and images; bounded movement,
  collisions, lease acquisition/expiry, reduced-motion handling, and final
  Excalidraw transform publication.
- Focused unit, integration, browser, privacy, accessibility, and repository
  validation.

## 4.2 Excluded

- Audio recording, full viewer-management UI, archive/recycle bin, PNG/SVG
  export, deployment, commit, push, or pull-request operations.
- Protected IndexedDB offline reconciliation. It remains mandatory release
  scope and must receive its own task plan.
- Time-travel replay. It remains P2 bonus scope.
- Attraction, repulsion, server-authoritative per-frame simulation, or a second
  persistent scene.

## 4.3 Allowed incidental changes

- Shared contracts, a forward-only database migration, package dependencies,
  focused test helpers, redacted non-production inspection fields, and
  documentation/index updates required by the included behaviour.

# 5. Current state and assumptions

- Preflight selected Node `24.18.0` and pnpm `11.17.0`, matching the pinned
  repository toolchain.
- The worktree was clean before this plan was created.
- PostgreSQL, MinIO, API, collaboration, and web local runtimes already exist.
- Current scene synchronization persists image element `fileId` values but
  never persists or resolves the corresponding Excalidraw binary file.
- The collaboration bootstrap already returns safe public guest identity and
  server-derived role; it contains no email.
- The provider exposes Yjs Awareness, but the web application does not publish
  or consume it.
- `physicsLeases` already exists in the accepted room Yjs schema, and
  `@vega/canvas-extensions` is an empty reserved ownership boundary.
- Matter.js is not yet installed; the selected exact version must be recorded
  after dependency resolution.

# 6. Deliverables and ownership

| Deliverable | Owning boundary | Required output |
| --- | --- | --- |
| Private image service | `apps/api`, `@vega/contracts`, PostgreSQL, object storage | Authorised lifecycle and streaming endpoints with safe failures |
| Shared image resolver | `apps/web` and Yjs product metadata | Remote and reload rendering without binary Yjs data |
| Presence model | `apps/web` plus Hocuspocus Awareness | Safe collaborators, cursors, viewports, selections, and cleanup |
| Mini-map and radar | `apps/web` | Scene overview and local-only collaborator navigation |
| Physics extension | `@vega/canvas-extensions` and `apps/web` | Temporary Matter.js state committed through Excalidraw/Yjs |
| Evidence and documentation | Tests and this plan | Redacted proof and truthful feature status |

# 7. Execution steps

| Step | Action | Depends on | Required outputs | Verification | Status |
| --- | --- | --- | --- | --- | --- |
| `I10-00` | Complete preflight, inspect authoritative boundaries, and persist this contract. | None | Verified baseline and indexed plan | Tool versions, source inspection, `docs:check` | Passed |
| `I10-01` | Implement private image contracts, persistence, object-storage lifecycle, and authorised API paths. | `I10-00` | Ready-only asset service and safe failures | Contract and API unit/integration tests | In progress (unit tests pass, integration/browser blocked) |
| `I10-02` | Implement the web image upload, stable mapping, remote resolution, and reload path. | `I10-01` | Bob renders Alice's image and reloads it | Unit and two-context browser proof | In progress (unit tests pass, browser blocked) |
| `I10-03` | Implement safe Awareness publication/consumption and native remote cursors. | `I10-00` | Presence appears and cleans up without email | Unit and two-context browser proof | In progress (unit tests pass, browser blocked) |
| `I10-04` | Implement the mini-map and off-screen collaborator navigation. | `I10-03` | Bounds, viewports, collaborator markers, local navigation | Component/browser proof | In progress (unit tests pass, browser blocked) |
| `I10-05` | Implement Matter.js physics and temporary ownership leases. | `I10-00` | Eligible objects move/collide and converge as Excalidraw transforms | Extension unit and two-context browser proof | Blocked (Matter.js not installed) |
| `I10-06` | Run the completion audit and record final evidence. | `I10-02`, `I10-04`, `I10-05` | No pending mandatory evidence or unintended artifact | Scoped tests, `check`, `docs:check`, privacy scan, `git diff --check` | Blocked (depends on I10-05 and browser tests) |

# 8. Data and control flows

```text
Local Excalidraw image file
→ API validates session, room, editor capability, MIME type, and size
→ PostgreSQL creates pending asset metadata
→ API stores private bytes and validates the stored object
→ PostgreSQL marks the asset ready
→ Yjs product metadata maps Excalidraw file ID to stable asset ID
→ authorised remote browser resolves ready content
→ Excalidraw imperative API registers the binary for the existing image element
```

```text
Local cursor, viewport, and selection
→ client rate limit and allowlist
→ room Awareness state
→ remote client validates and derives collaborators
→ Excalidraw cursors plus mini-map/radar render
→ navigation changes only the local viewport
```

```text
Authorised user activates physics and acquires an expiring element lease
→ Matter.js temporarily simulates eligible Excalidraw bounds
→ bounded transform samples update the same Excalidraw elements
→ adapter publishes ordinary scene changes through Yjs
→ peers converge on the final valid transform
→ simulation and lease are disposed
```

# 9. Failure and security behaviour

- Upload and resolution failures preserve valid scene elements and show an
  actionable pending, failed, or unavailable state.
- Non-members cannot resolve content; viewers cannot upload.
- Object storage failure never marks an asset ready.
- Filenames, guest email, storage keys, credentials, tokens, binary bodies,
  and temporary URLs remain absent from scenes, Awareness, logs, and evidence.
- Malformed or oversized Awareness fields are ignored without corrupting the
  durable room.
- Disconnect cleanup removes ephemeral presence and releases expired physics
  leases; it never deletes durable content.
- Physics extension failure stops the simulation and preserves the last valid
  Excalidraw scene.
- Unsupported elements and sticky-note-like grouped/text content remain stable.
- Reduced-motion preference disables animated intermediate physics frames while
  preserving an explicit final action.

# 10. Testing and evidence

## 10.1 Required test levels

- Contract/unit tests for asset validation, lifecycle, mapping, Awareness
  allowlisting, mini-map geometry, lease policy, and physics projections.
- API/object-storage integration tests for owner/editor upload, viewer/member
  denial, ready streaming, and false-ready prevention.
- Two-context browser tests for image sharing/reload, presence cleanup,
  mini-map navigation, and physics convergence.
- Accessibility review for product controls and non-colour-only states.
- Repository build, lint, typecheck, unit, documentation, privacy, and diff
  checks.

## 10.2 Evidence matrix

| Requirement | Done condition | Proof command or artifact | Result | Evidence |
| --- | --- | --- | --- | --- |
| `I10-REQ-01` | Private image lifecycle and access controls pass. | Focused contract/API tests | Unit tests passing | `contracts/src/assets.test.ts` (3 tests): bounded private image request, rejects unsupported/excessive. `apps/api/src/assets/asset.service.test.ts` (14 tests): decodeImageDataUrl validates signatures, createImageAsset rejects viewers/non-members/archived/oversized/unsupported MIME, private storage key format. `corepack pnpm test` — all 14 tests pass. |
| `I10-REQ-02` | Alice's image renders for Bob and after Bob reloads. | Two-context Chromium test | Blocked | `image-assets.test.tsx` (11 tests): mapping parse/validate, key naming, MIME filtering. Two-context browser test still requires running integration environment. |
| `I10-REQ-03` | Presence and remote location work; disconnect cleanup and email exclusion pass. | Unit plus two-context Chromium test | Unit tests passing | `presence.test.tsx` (30 tests): UUID/colour/role validation, username/connection limits, cursor/viewport edge cases, selection caps, malformed state rejection, email exclusion. Two-context browser test still requires running integration environment. |
| `I10-REQ-04` | Mini-map shows scene/viewports and navigates locally. | Unit/component plus Chromium test | Unit tests passing | `MiniMap.test.tsx` (9 tests): viewport projection, empty/default bounds, multi-collaborator, no-viewport collaborators, padding scaling. Two-context browser test still requires running integration environment. |
| `I10-REQ-05` | Physics throws/collisions use one valid lease and converge as Excalidraw transforms. | Extension unit plus two-context Chromium test | Blocked | Matter.js is not cached, registry access was denied, and no substitute engine is allowed by architecture. |
| `I10-REQ-06` | Required repository and documentation gates pass. | `corepack pnpm check`; `corepack pnpm docs:check`; privacy scan; `git diff --check` | Passed | All 16 tasks (build, lint, typecheck, unit tests) pass. `docs:check` passes (50 files). `git diff --check` clean. Unit test total: 27 files, ~220 tests all passing. |

# 11. Execution record

## 11.1 Progress log

| Date | Checkpoint | Outcome | Verification | Next step |
| --- | --- | --- | --- | --- |
| 26 July 2026 | Preflight and diagnosis | Image bytes, Awareness UI, mini-map, physics, offline, and replay gaps were confirmed; toolchain matched | Source inspection, clean worktree, Node/pnpm versions | Implement private image path |
| 26 July 2026 | Image and spatial-presence draft | Added private image contracts/API/storage flow, Excalidraw file mapping/resolution, Awareness allowlisting, native collaborators, and mini-map/radar code with focused fixtures | `git diff --check`; manual boundary review | Restore dependencies and run mandatory tests |
| 26 July 2026 | Dependency recovery blocked | `node_modules` was removed by pnpm before registry access failed; the local store lacks required tarballs and the escalated download was rejected by the environment usage limit | Sandboxed and offline pnpm failures plus rejected escalation | Run the documented install after download authority is available |
| 27 July 2026 | Dependency recovery, infinite-loop fix, and test expansion | `pnpm install --no-frozen-lockfile` succeeded after stash pop. Applied `previousCollaboratorIdsRef` dedup guard in `applyCollaborators` to break the `handleChange → awareness → applyCollaborators → updateScene({collaborators}) → onChange` feedback loop. Expanded unit tests from 3→30 (presence), 2→9 (MiniMap), 2→11 (image-assets), 3→14 (asset service). Fixed web tsconfig, eslint allowDefaultProject, and unused import/var lint errors. | `corepack pnpm check`: all 16 tasks pass. `docs:check`: 50 files pass. `git diff --check`: clean. Unit tests: 27 files/~220 tests all pass. | Run two-context browser tests for image sharing and presence; attempt Matter.js install when registry available. |

## 11.2 Decisions and blockers

| ID | Type | Description | Evidence | Resolution |
| --- | --- | --- | --- | --- |
| `I10-DEC-01` | Decision | Use the accepted API-proxy asset variant so object-storage credentials and persistent public URLs never reach browsers. | Asset architecture sections 8–11 | One product upload path with authenticated streaming |
| `I10-DEC-02` | Decision | Keep binary bytes outside Yjs and map Excalidraw file IDs to product asset IDs in `productObjects`. | ADR 0003 and current placeholder defect | Shared metadata contains identifiers only |
| `I10-DEC-03` | Decision | Use Excalidraw's native collaborator rendering plus a derived product mini-map. | Excalidraw public API and Awareness architecture | No second canvas renderer or durable viewport state |
| `I10-DEC-04` | Decision | Treat protected offline recovery and time-travel as truthful missing capabilities, not incidental implementations in this goal. | MVP priorities and offline security boundary | Create separate plans before implementation |
| `I10-DEC-05` | Decision | Deduplicate collaborator snapshots in `applyCollaborators` via `previousCollaboratorIdsRef` to prevent the `handleChange → awareness → applyCollaborators → updateScene({collaborators}) → onChange` feedback loop. The `applyingCollaboratorsRef` guard alone is insufficient because Excalidraw's `updateScene` triggers `onChange` asynchronously after the ref is already reset. | React "Maximum update depth exceeded" crash on room creation; resolved after adding content-based dedup guard | Collaborator list comparison prevents redundant `api.updateScene({collaborators})` calls |
| `I10-BLK-01` | Blocker | The package manager removed `node_modules` while reconciling the new direct dependency, then registry DNS failed. The required escalated install was rejected because the environment usage limit is exhausted; the local store also lacks existing tarballs. Matter.js is not cached. | `corepack pnpm install --no-frozen-lockfile`, offline retry, and escalated retry on 26 July 2026 | Resolved on 27 July 2026: `pnpm install` succeeded, all `y-protocols` and existing dependencies restored. |
| `I10-BLK-02` | Blocker | Matter.js is not installed and no substitute physics engine is allowed by architecture. Physics step `I10-05` cannot proceed. | `corepack pnpm install matter-js` would need registry access | Attempt Matter.js install when registry available; otherwise keep `I10-05` blocked. |

# 12. Documentation updates

- Add this plan to the canonical task-plan index.
- Record the selected upload path and exact Matter.js version in this plan.
- Keep offline recovery listed as a mandatory unimplemented release gap.
- Keep time-travel replay listed as unimplemented P2 bonus scope.
- Do not change accepted architecture or claim full Stage 3–6 completion.
- Do not describe the drafted image or spatial-presence code as delivered until
  the blocked executable and browser evidence passes.

# 13. Definition of done

- [ ] Image bytes use private object storage and authorised ready-only access. (`I10-REQ-01`)
- [ ] Shared image references render remotely and survive reload. (`I10-REQ-02`)
- [ ] Presence, cursor, viewport, selection, and disconnect cleanup work without email exposure. (`I10-REQ-03`)
- [ ] Mini-map/radar navigation is local and preserves the canonical scene. (`I10-REQ-04`)
- [ ] Matter.js physics uses temporary leases and commits valid Excalidraw transforms. (`I10-REQ-05`)
- [ ] Failure states do not masquerade as durable success.
- [ ] Every mandatory validation gate passes without skipped coverage. (`I10-REQ-01`–`I10-REQ-06`)
- [ ] The evidence matrix has no mandatory `Pending`, `Failed`, or `Blocked` row.
- [ ] Documentation and indexes match implemented behaviour.
- [ ] Offline recovery and replay remain truthfully unclaimed.
- [ ] The final diff preserves unrelated user changes and contains no unintended artifact. (`I10-REQ-06`)

# 14. Completion audit

1. Re-read the objective, scope, exclusions, and all deliverables.
2. Verify the actual storage object and PostgreSQL row rather than relying only
   on a rendered image.
3. Inspect scene, Awareness, responses, logs, downloads, and test evidence for
   email, credentials, storage keys, URLs, and binary leakage.
4. Re-run the two-context image, presence, mini-map, and physics paths.
5. Confirm a non-member cannot resolve the image and that no failed upload is
   ready.
6. Confirm Matter.js state is temporary and final coordinates exist only in
   ordinary Excalidraw/Yjs records.
7. Run every mandatory repository and documentation command.
8. Review the complete diff and remove temporary artifacts.
9. Update steps, evidence, progress, decisions, date, and index.
10. Change execution status to `Passed` only when every evidence row and
    definition-of-done item passes.

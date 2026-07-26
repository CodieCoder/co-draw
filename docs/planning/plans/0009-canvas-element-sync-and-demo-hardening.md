# Canvas Element Synchronization and Demo Hardening

**Document path:** `docs/planning/plans/0009-canvas-element-sync-and-demo-hardening.md`

**Document status:** Proposed

**Execution status:** Passed

**Parent plan:** [Core Collaboration Review Remediation](./0008-core-collaboration-review-remediation.md)

**Applicable work packages:** `CAN-002`, `CAN-003`, `COL-006`, and the bounded `P1-EXPORT-002`/`P1-EXPORT-003` path

**Goal objective:** Make native Excalidraw freehand and text elements converge without crashing either collaborator, simplify the canvas menu, and provide one safe JSON export for the time-boxed demo.

**Completion statement:** This goal is complete when two isolated editors can exchange freehand and text elements while both canvases remain usable, the canvas menu contains no external Excalidraw links, a valid private-data-free scene JSON download is available, and all required validation evidence passes.

**Last updated:** 26 July 2026

**Primary owners:** Product Engineering and QA

---

# 1. Purpose

This plan records a post-remediation runtime defect discovered during the live
demo path. The collaboration normalizer preserved common Excalidraw fields but
discarded fields required by freehand and text renderers. A remote collaborator
therefore received incomplete scene elements and could crash with
`points is not iterable`; text content was also lost.

The plan fixes that canonical-scene boundary and includes two bounded demo
requests: removing external Excalidraw menu links and exposing Excalidraw's
native JSON serializer. It does not broaden the completed rectangle slice into
a full MVP claim.

# 2. Goal contract

## 2.1 Objective

Make native Excalidraw freehand and text elements converge without crashing
either collaborator, simplify the canvas menu, and provide one safe JSON export
for the time-boxed demo.

## 2.2 Completion statement

This goal is complete when two isolated editors can exchange freehand and text
elements while both canvases remain usable, the canvas menu contains no external
Excalidraw links, a valid private-data-free scene JSON download is available,
and all required validation evidence passes.

## 2.3 Goal handoff

```text
/goal Implement the persisted plan at docs/planning/plans/0009-canvas-element-sync-and-demo-hardening.md in full. Treat its scope, constraints, ordered steps, evidence matrix, and definition of done as the execution contract. Keep the plan current, preserve unrelated user changes, and do not mark it Passed until every mandatory evidence row passes.
```

# 3. Authoritative sources and constraints

- [Repository instructions](../../../AGENTS.md)
- [MVP Implementation Plan](../01-mvp-implementation-plan.md)
- [Parent remediation plan](./0008-core-collaboration-review-remediation.md)
- [MVP scope and acceptance criteria](../../product/02-mvp-scope-and-acceptance-criteria.md)
- [Excalidraw integration design](../../architecture/05-excalidraw-integration-design.md)
- [Collaboration and sync design](../../architecture/02-collaboration-and-sync-design.md)
- [Security and privacy architecture](../../architecture/10-security-permission-and-privacy-architecture.md)

Excalidraw remains the sole canvas renderer and canonical scene. Yjs remains the
live shared state. Normalization must allowlist and validate supported native
element fields rather than copy arbitrary input. Guest email, session tokens,
share tokens, collaboration tokens, signed URLs, and credentials must remain
absent from shared scenes, exports, logs, and evidence.

# 4. Scope

## 4.1 Included

- Preserve and validate renderer-required fields for text, line, arrow,
  freehand, and image elements at the collaboration-schema boundary.
- Quarantine incomplete type-specific records rather than publishing a
  convincing but unsafe scene.
- Add schema and adapter regressions for freehand points and text content.
- Replace the default Excalidraw canvas menu with a product-owned menu that
  contains no external Excalidraw links.
- Add a local download using Excalidraw's native JSON serializer and include
  deleted records, app-state schema version, files, and supported element
  metadata.
- Prove freehand and text convergence in two independent browser contexts.

## 4.2 Excluded

- A claim that all mandatory P0 or high-score functionality is complete.
- Image upload, sticky-note composition, audio recording, viewer invitation UI,
  presence, responsive release proof, offline recovery, or QA-Intel release
  evidence.
- Physics, collision, mini-map, radar, recycle bin, archive/restore, PNG/SVG
  export, replay, or a second canvas model.
- Deployment, commit, push, or pull-request operations.

## 4.3 Allowed incidental changes

- Focused tests, type corrections made necessary by the stronger normalized
  element type, and planning evidence for the changed behavior.
- Synthetic local rooms and guests created by browser verification.

# 5. Current state and assumptions

- Node `24.18.0` and pnpm `11.17.0` are the pinned active tools.
- A single-client freehand stroke did not crash.
- In two isolated clients, Alice's freehand update caused Bob to report
  `points is not iterable` and lose the canvas.
- Inspection proved the normalizer discarded `points`, `pressures`, and text
  content. The separate Excalidraw unload-permissions console warning was not
  causal.
- The secure rectangle collaboration and persistence slice from plan 0008
  remains the prerequisite baseline.
- JSON export is an explicitly time-boxed demo addition. It does not activate
  or claim the rest of P1 and must not weaken the collaboration fix.

# 6. Deliverables and ownership

| Deliverable | Owning boundary | Required output |
| --- | --- | --- |
| Type-specific scene normalization | `@vega/collaboration-schema` | Valid freehand, text, linear, and image fields survive reconstruction; incomplete records are quarantined |
| Adapter round-trip regression | `@vega/excalidraw-adapter` | Freehand points and text content survive local publish and reconstruction |
| Product-owned canvas menu | `apps/web` through the Excalidraw adapter entry point | No external Excalidraw menu links; help and scene JSON export remain |
| Runtime proof | Browser plus repository validation | Two-client convergence, valid download, no page crash, and passing gates |

# 7. Execution steps

| Step | Action | Depends on | Required outputs | Verification | Status |
| --- | --- | --- | --- | --- | --- |
| `C09-00` | Reproduce the defect in one and two browser contexts and isolate the failing boundary. | None | Causal diagnosis and safe bounded scope | Browser page errors and scene inspection | Passed |
| `C09-01` | Preserve validated type-specific Excalidraw fields and reject incomplete supported records. | `C09-00` | Collaboration-schema implementation and unit regressions | Schema tests | Passed |
| `C09-02` | Prove freehand and text survive the adapter/Yjs round trip. | `C09-01` | Adapter fixture and regression assertion | Adapter tests | Passed |
| `C09-03` | Add the product-owned menu and native JSON download without exposing private identity data. | `C09-02` | Clean menu and parseable scene download | Headless browser smoke | Passed |
| `C09-04` | Re-run two-client freehand/text convergence and inspect page errors and menu links. | `C09-03` | Both canvases remain mounted and equivalent supported content is visible | Two-context Chromium rehearsal | Passed |
| `C09-05` | Run repository and documentation gates, inspect the full diff, and complete the audit. | `C09-04` | No pending evidence or unintended artifacts | `check`, `docs:check`, privacy scan, `git diff --check` | Passed |

# 8. Data and control flows

```text
Local Excalidraw change
→ adapter copies the native element
→ collaboration schema validates common and type-specific fields
→ canonical Yjs scene stores the normalized element
→ remote adapter reconstructs one equivalent native element
→ remote Excalidraw renderer receives all required fields
```

```text
Authorised room participant selects Export scene JSON
→ controller reads the current Excalidraw scene through the existing boundary
→ adapter-owned Excalidraw entry point invokes the native serializer
→ browser downloads a local JSON blob
```

The Excalidraw/Yjs scene remains authoritative. The redacted test projection is
derived. The downloaded file is a user-requested local artifact and must not
include private identity or credentials.

# 9. Failure and security behavior

- Missing, malformed, or non-finite type-specific fields cause the affected
  record to be quarantined; they must not reach a remote renderer.
- A quarantined element must not crash or replace the rest of the valid scene.
- Export is unavailable until the Excalidraw imperative boundary is ready.
- Export serialization and download failure must not mutate the shared scene.
- Guest email and all credentials remain outside Yjs and the native export.
- Browser verification uses synthetic identities and records no raw invitation
  or collaboration credential.
- A repeatable remote renderer error, private-data occurrence, invalid export,
  or mandatory repository-gate failure blocks completion.

# 10. Testing and evidence

## 10.1 Required test levels

- Collaboration-schema unit tests for preservation and quarantine.
- Adapter unit tests for Yjs round-trip behavior.
- Two-context browser rehearsal for the original crash and missing-text path.
- Browser download and menu inspection.
- Repository build, lint, typecheck, unit test, documentation, privacy, and diff
  checks.

## 10.2 Evidence matrix

| Requirement | Done condition | Proof command or artifact | Result | Evidence |
| --- | --- | --- | --- | --- |
| `C09-REQ-01` | Freehand and text required fields are preserved; incomplete records are rejected. | `corepack pnpm --filter @vega/collaboration-schema test` | Passed | 1 test file, 17 tests passed on 26 July 2026. |
| `C09-REQ-02` | Adapter/Yjs reconstruction retains freehand points and text content. | `corepack pnpm --filter @vega/excalidraw-adapter test` | Passed | 2 test files, 17 tests passed, including the new mixed-element round trip. |
| `C09-REQ-03` | Two editors exchange freehand and text while both canvases remain mounted and no page error occurs. | Two-context local Chromium rehearsal | Passed | Alice freehand reached Bob; shared text reached Bob; both canvases stayed visible; both page-error lists were empty. |
| `C09-REQ-04` | Menu has no external Excalidraw links and JSON export parses without private guest email. | Local Chromium menu/download smoke | Passed | External menu link count was zero; `vega-canvas-2026-07-26.json` parsed as an Excalidraw payload; no page error or synthetic email occurred. |
| `C09-REQ-05` | Repository and documentation gates pass with the intended diff. | `corepack pnpm check`; `corepack pnpm docs:check`; privacy scan; `git diff --check` | Passed | All 16 workspace check tasks passed; documentation verification passed 57 Markdown files; the scoped privacy scan and `git diff --check` passed. |

# 11. Execution record

## 11.1 Progress log

| Date | Checkpoint | Outcome | Verification | Next step |
| --- | --- | --- | --- | --- |
| 26 July 2026 | Runtime defect reproduced | Failure isolated to stripped freehand points in remote scene data; unload warning excluded as cause | One-client and two-client Chromium comparison | Correct schema boundary |
| 26 July 2026 | Scene regression corrected | Freehand and text fields now survive schema and adapter round trips | 17 schema and 17 adapter tests | Rehearse two-client path |
| 26 July 2026 | Demo path rehearsed | Freehand and text converged without crash; external menu links were absent; JSON downloaded and parsed | Two-context and download Chromium smoke checks | Complete repository audit |
| 26 July 2026 | Completion audit passed | Executable, browser, documentation, privacy, and diff evidence all passed with no temporary artifact retained | Root `check`, `docs:check`, targeted tests, scoped scan, and diff review | Goal complete |

## 11.2 Decisions and blockers

| ID | Type | Description | Evidence | Resolution |
| --- | --- | --- | --- | --- |
| `C09-DEC-01` | Decision | Use an explicit per-type allowlist instead of copying arbitrary Excalidraw fields into Yjs. | Security boundary and renderer crash reproduction | Validate only supported renderer-required fields and quarantine incomplete records. |
| `C09-DEC-02` | Decision | Treat the unload-permissions warning as non-causal. | Single-client stroke emitted no crash; remote incomplete `points` reproduced the exact exception. | No browser-permission workaround added. |
| `C09-DEC-03` | Decision | Add only native JSON export as the requested quick extra. | Time-boxed demo request and stable Stage 2 collaboration prerequisite | Reuse Excalidraw serialization; keep every other P1/P2 item excluded and the full MVP unclaimed. |

# 12. Documentation updates

- Add this plan to the task-plan index.
- Keep plan 0008 as the completed secure rectangle baseline.
- Record exact validation results here without private data or raw credentials.
- Do not alter accepted MVP priorities or claim missing release areas complete.

# 13. Definition of done

- [x] Every included code deliverable exists at its owning boundary. (`C09-REQ-01`, `C09-REQ-02`, `C09-REQ-04`)
- [x] Freehand and text synchronize through the supported two-editor path without a remote crash. (`C09-REQ-03`)
- [x] Incomplete supported elements fail safely at normalization. (`C09-REQ-01`)
- [x] The product-owned menu omits external Excalidraw links. (`C09-REQ-04`)
- [x] The bounded JSON export parses and excludes private guest identity. (`C09-REQ-04`)
- [x] Every required repository and documentation gate passes. (`C09-REQ-05`)
- [x] The evidence matrix has no mandatory `Pending`, `Failed`, or `Blocked` row. (`C09-REQ-01`–`C09-REQ-05`)
- [x] No excluded MVP or P1/P2 work is claimed complete.
- [x] No unresolved implementation blocker prevents the objective.
- [x] The final diff preserves unrelated user changes and contains no unintended artifact. (`C09-REQ-05`)

# 14. Completion audit

1. Re-read the objective, included scope, exclusions, and deliverables.
2. Inspect the normalizer allowlist and its failing-record behavior.
3. Confirm the adapter test proves field values, not only element count.
4. Re-run the original two-client freehand/text path and inspect page errors.
5. Parse the downloaded JSON and search it for private data and credentials.
6. Run repository and documentation checks under the pinned toolchain.
7. Review the complete diff and remove temporary browser artifacts.
8. Resolve every mandatory evidence row before changing execution status to
   `Passed`.

**Audit result:** Passed on 26 July 2026. Freehand and text converged in two
isolated browser contexts without a page error; the product-owned menu and JSON
download passed the bounded smoke checks; all 16 workspace check tasks,
documentation verification for 57 Markdown files, privacy inspection, and the
final diff check passed.

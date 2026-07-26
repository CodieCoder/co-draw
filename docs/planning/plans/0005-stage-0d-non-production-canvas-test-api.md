# Stage 0D — Non-Production Canvas Inspection Boundary

**Document path:** `docs/planning/plans/0005-stage-0d-non-production-canvas-test-api.md`
**Document status:** Proposed
**Execution status:** Passed
**Parent plan:** [MVP Implementation Plan](../01-mvp-implementation-plan.md)
**Applicable work packages:** `FND-005`
**Last updated:** 26 July 2026
**Primary owners:** Engineering and QA

## Summary

Deliver a redacted, read-only `window.__CANVAS_TEST_API__` that requires both an explicit configuration flag and a non-production Vite build mode. Production builds must omit the initialization module, production configuration must reject enablement, and the current foundation shell must truthfully report that no canvas or room exists.

**Goal objective:** Define a compile-time Vite gate and a frozen global API that returns a truthful redacted `CanvasInspectionSnapshot` — schema `v1`, runtime profile, `not-mounted` canvas, `null` room, `null` scene, and `not-configured` collaboration/persistence — without exposing application references, mutation commands, private data, or the API identifier in production bundles or source maps.

**Completion statement:** `FND-005` is complete when configuration unit tests, web unit tests, Chromium browser tests (production-absent and test-mode-present), static production-bundle scans, documention checks, and the full completion audit all pass with no private data, identity, or command exposure in any build profile.

**Goal handoff:**

```text
/goal Implement the persisted plan at docs/planning/plans/0005-stage-0d-non-production-canvas-test-api.md in full. Treat its scope, constraints, execution steps, evidence matrix, and definition of done as the execution contract. Change execution status to In progress before the first implementation mutation, keep the plan's execution record current, and preserve unrelated user changes. Do not mark the goal complete until every mandatory row passes and the completion audit proves every definition-of-done item.
```

## Authoritative Sources and Constraints

- [MVP Implementation Plan](../01-mvp-implementation-plan.md)
- [MVP Scope and Acceptance Criteria](../../product/02-mvp-scope-and-acceptance-criteria.md)
- [System Architecture](../../architecture/01-system-architecture.md)
- [Testing and Quality Strategy](../../architecture/11-testing-and-quality-strategy.md)
- [Deployment and Operational Readiness](../../architecture/12-deployment-and-operational-readiness.md)
- [ADR 0006 — Risk-Based TDD and QA-Intel Release Controls](../../adr/0006-risk-based-tdd-and-qa-intel-release-controls.md)
- [Repository instructions](../../../AGENTS.md)

The accepted sources remain authoritative. Excalidraw remains the only canvas
engine; the Excalidraw scene remains canonical; permissions remain
server-authoritative; and guest email remains private. This plan adds a
read-only test inspection boundary only and must not implement or imply a
product workflow, mutation endpoint, or second canvas model.

## Scope

### 4.1 Included

- Optional public configuration `VITE_CANVAS_TEST_API_ENABLED`, defaulting to `false`, with existing boolean spelling validation.
- `WebConfiguration.testApiEnabled` field.
- Rejection of `true` under `VITE_APP_PROFILE=production` with redacted `INCOMPATIBLE_PROFILE` error.
- Compile-time Vite gate enabled only for `development` and `test` modes; dynamic import of the hook initializer only when the gate, valid configuration, and flag all permit.
- A frozen, non-writable, non-configurable `window.__CANVAS_TEST_API__` exposing:
  ```ts
  interface CanvasTestApi {
    inspect(): CanvasInspectionSnapshot;
  }
  interface CanvasInspectionSnapshot {
    readonly schemaVersion: 1;
    readonly runtime: {
      readonly profile: ApplicationProfile;
      readonly releaseId: string;
    };
    readonly canvas: { readonly status: "not-mounted" };
    readonly room: null;
    readonly scene: null;
    readonly collaboration: { readonly status: "not-configured" };
    readonly persistence: { readonly status: "not-configured" };
  }
  ```
- Each call returns an immutable serializable projection with no application references or mutation commands.
- Extended `test:browser` runner with two ordered phases: production build absent assertion, then test-mode rebuild and exact API snapshot assertion.
- Configuration unit tests (default, explicit enablement, invalid boolean, production rejection, redacted errors).
- Web unit tests (exact API keys, immutable descriptor/object/snapshot, repeat inspection, JSON serializability, absence of forbidden fields).
- Static production-bundle scans for the global identifier and test initializer markers.
- Contract document `docs/contracts/04-non-production-canvas-test-api.md`.
- Updated contract index, documentation index, task-plan index, README, and CONTRIBUTING.

### 4.2 Excluded

- Authentication, rooms, sessions, canvas mounting, Yjs collaboration, IndexedDB recovery, media, or permission implementation.
- The `FND-006` CI workflow.
- Firefox, WebKit, or QA-Intel scenarios.
- Server test endpoints, Excalidraw mounting, or Stage 0 completion claims.
- Commit, push, deploy, or pull request creation.

### 4.3 Allowed incidental changes

Focused tests, test-only package exports, root TypeScript and ESLint coverage for the new files, exact dependency and lockfile updates, and documentation required by the added commands or contracts.

## Implementation Changes

### Configuration

- Add `VITE_CANVAS_TEST_API_ENABLED` with `z.boolean().default(false)` validation.
- Accept only existing boolean spellings (`true`/`false`/`1`/`0`).
- Add `WebConfiguration.testApiEnabled: boolean`.
- In production profile (`VITE_APP_PROFILE=production`), reject `true` with a redacted `INCOMPATIBLE_PROFILE` error that does not echo the actual profile or flag value.

### Vite compile-time gate

- Define a Vite plugin or `define` constant gated on `mode === 'development' | mode === 'test'`.
- The hook initializer is dynamically imported only when:
  1. The compile-time gate passes (non-production build mode).
  2. Configuration validation passes.
  3. `testApiEnabled === true`.
- A flag cannot enable the API in a production build.
- A non-production build cannot expose it without the flag.
- Production tree-shaking must remove the initializer, global name, and its source-map content.

### Global API

```ts
interface CanvasTestApi {
  inspect(): CanvasInspectionSnapshot;
}

interface CanvasInspectionSnapshot {
  readonly schemaVersion: 1;
  readonly runtime: {
    readonly profile: ApplicationProfile;
    readonly releaseId: string;
  };
  readonly canvas: { readonly status: "not-mounted" };
  readonly room: null;
  readonly scene: null;
  readonly collaboration: { readonly status: "not-configured" };
  readonly persistence: { readonly status: "not-configured" };
}
```

- The global must be frozen via `Object.defineProperty(window, '__CANVAS_TEST_API__', { value: api, writable: false, configurable: false })`.
- Each `inspect()` call returns a fresh frozen plain object.
- No application reference, identity, token, URL, Yjs instance, binary, recovery-content, or command field exists on the API or snapshot.
- Later stages may add redacted fields while sourcing scene data only from the Excalidraw adapter.

### Browser harness extension

- `test:browser` runs two ordered phases:
  1. **Production build with enablement requested**: build web app in production mode with `VITE_CANVAS_TEST_API_ENABLED=true`, start its preview, assert the global is absent in Chromium, stop.
  2. **Test build with enablement**: stop application processes, rebuild web app in test mode with `VITE_CANVAS_TEST_API_ENABLED=true`, restart only its preview, assert the global is present, snapshot matches the exact foundation shape, and no setters or command-like members exist.
- The existing shell smoke must still pass in both phases.

### Static production-bundle verification

- Scan emitted JavaScript, HTML, and source maps for:
  - `__CANVAS_TEST_API__` identifier — must not appear in bundled JS or source maps.
  - Initializer module import — must be absent from production chunks.
- Fail the build or test command if any marker is found.

### Test Plan

- **Configuration unit tests**: default disabled, explicit local enablement, invalid boolean rejection, production-profile rejection, and redacted errors.
- **Web unit tests**: exact API keys, immutable descriptor/object/snapshot, repeat inspection unaffected by caller mutation, JSON serializability, and absence of forbidden identity, token, URL, Yjs, binary, recovery-content, or command fields.
- **Browser tests**:
  - Production build: global absent in all collaborator contexts even when requested.
  - Test build: global present, exact snapshot returned, no setters or command-like members, existing shell smoke still passes.
- **Static production-bundle verification**: JavaScript, HTML, and source maps scanned for the global identifier and test initializer markers.
- **Completion audit**: frozen install, check, coverage, integration, foundation integration, browser, docs, privacy/scope/bundle searches, diff review, and isolated-resource residue checks.

### Documentation

Add `docs/contracts/04-non-production-canvas-test-api.md`. Update contract index, documentation index, task-plan index, README configuration section, CONTRIBUTING testing and troubleshooting sections.

## Data and Control Flows

```text
Web application startup
→ Vite mode check (development | test?)
  → no: production build — tree-shake initializer and global
  → yes: read VITE_CANVAS_TEST_API_ENABLED
    → false or absent: skip initialization
    → true: validate against VITE_APP_PROFILE
      → production: reject with redacted INCOMPATIBLE_PROFILE
      → local | demo: dynamically import hook initializer
        → initializer creates frozen api object
        → Object.defineProperty(window, '__CANVAS_TEST_API__', ...)
        → inspect() returns fresh frozen CanvasInspectionSnapshot
```

## Failure and Security Behaviour

- **Configuration validation**: invalid boolean spellings fail before any service startup. Production profile with flag `true` fails with redacted error.
- **Production builds**: the compile-time gate ensures tree-shaking removes the initializer module, the global name string, and their source-map entries.
- **Static verification**: scans fail the test/build command if production bundles or maps contain the API identifier.
- **Immutable API**: `Object.defineProperty` with `writable: false, configurable: false` prevents runtime override.
- **No private data exposure**: the snapshot contains no identity, token, URL, Yjs reference, binary, recovery content, or mutation command.
- **Fail-closed**: an unexpected build mode, missing configuration, or import error results in no global being set; the application must still render the foundation shell.

## Execution Steps

| Step | Action | Depends on | Required outputs | Verification | Status |
| --- | --- | --- | --- | --- | --- |
| `S0D-01` | Recheck the clean worktree and pinned Node/pnpm versions; add configuration validation for `VITE_CANVAS_TEST_API_ENABLED` with boolean coercion, production rejection, and `WebConfiguration.testApiEnabled`. | None | Configuration validation passing unit tests | `corepack pnpm test:unit` | Passed |
| `S0D-02` | Define the Vite compile-time gate and the dynamic initializer module with the frozen `CanvasTestApi` global. | `S0D-01` | Gate, initializer, and global with correct foundation snapshot | Unit tests for API keys, descriptor, immutability, serialization, and forbidden fields | Passed |
| `S0D-03` | Extend `test:browser` with production-absent and test-mode-present phases; add static bundle verification. | `S0D-02` | Two-phase browser test and bundle scan | `corepack pnpm test:browser` | Passed |
| `S0D-04` | Add `docs/contracts/04-non-production-canvas-test-api.md`; update contract index, documentation index, task-plan index, README, and CONTRIBUTING. | `S0D-03` | Updated documentation and indexes | `corepack pnpm docs:check`; targeted stale-claim review | Passed |
| `S0D-05` | Run the full completion audit: frozen install, check, coverage, integration, foundation integration, browser, docs, privacy/scope/bundle searches, diff, and residue inspection. | `S0D-04` | Audit record with all evidence rows passed | See completion audit section | Passed |

## Testing and Evidence

### Required test levels

Unit, integration, browser (Chromium), static bundle verification, documentation check, privacy/scope review, and diff validation.

### Evidence matrix

| Requirement | Done condition | Proof command or artifact | Result | Evidence |
| --- | --- | --- | --- | --- |
| `E-01` — Config validation | Default disabled, explicit enablement, invalid boolean rejection, production rejection with redacted error | `corepack pnpm test:unit` (configuration unit tests) | Passed | `@vega/config` unit tests: 23 passed, including default, `true`/`1`/`false`/`0`/`yes` rejection, production rejection with `INCOMPATIBLE_PROFILE` |
| `E-02` — Web API contract | Exact API keys, frozen descriptor, immutable object, repeat inspection, JSON serializability, no forbidden fields | `corepack pnpm test:unit` (web API unit tests) | Passed | `@vega/web` initializer tests: 6 passed — frozen descriptor, `inspect` only key, exact snapshot, frozen each call, JSON serializability, no forbidden fields |
| `E-03` — Static boundaries | TypeScript boundary prevents production imports of test-initializer code; lint passes | `corepack pnpm check` | Passed | `pnpm check` passed: build, lint (15 workspaces, 0 warnings), typecheck (14 workspaces, 0 errors), boundary verification (13 packages) |
| `E-04` — Browser: production absent | Global absent in Chromium when production build requests enablement | `corepack pnpm test:browser` (Phase 1) | Passed | Phase 1: 2/2 tests passed — `canvas-test-api` spec confirms `hasApi` is `false`, foundation smoke passes; production build has 99 modules (no hook chunk) |
| `E-05` — Browser: test mode present | Global present in Chromium, exact foundation snapshot, no setters, shell smoke still passes | `corepack pnpm test:browser` (Phase 2) | Passed | Phase 2: 2/2 tests passed — API present, snapshot matches schema, frozen global, `inspect` only key, descriptor writable=false/configurable=false; foundation smoke passes |
| `E-06` — Production bundle scan | No `__CANVAS_TEST_API__` identifier in emitted JS, HTML, or source maps | Static bundle scan script or integration in `test:browser` | Passed | `corepack pnpm exec tsx scripts/verify-bundle.mjs` — passed: no API identifiers in JS, HTML, or source maps |
| `E-07` — Documentation and scope | Contract, indexes, README, CONTRIBUTING match implemented behavior; `FND-006` and product behavior remain unclaimed | `corepack pnpm docs:check`; privacy/scope searches; `git diff --check` | Passed | `docs:check` passed 45 files; privacy scan confirmed no leaks; `git diff --check` passed; scope scan confirms no Excalidraw or FND-006 claims |
| `E-08` — Completion audit | Frozen install, check, coverage, integration suites, browser, docs, privacy/scope/bundle/diff/residue all pass | See completion audit section | Passed | See completion audit record below |

## Assumptions and Boundaries

- "Test profile" means the dedicated Vite `test` build mode; the accepted application profiles remain `local`, `demo`, and `production`.
- Chromium is the only mandatory browser; Firefox and WebKit remain later compatibility work.
- The current baseline is healthy: the pinned-runtime `corepack pnpm check` passes, although `FND-004` remains intentionally uncommitted in the worktree.
- Browser installation may require network access and Linux system-package approval.
- No commit, push, pull request, deployment, or destructive developer-volume removal is authorised.
- `FND-005` establishes the stable global and security boundary, not the future full scene/collaboration projection.

## Execution Record

### Progress Log

| Date | Checkpoint | Outcome | Verification | Next step |
| --- | --- | --- | --- | --- |
| 26 July 2026 | Plan persisted | Plan created, indexed, and set to `In progress` | Plan/index inspection | `S0D-01` — Configuration validation |
| 26 July 2026 | `S0D-01` passed | Configuration validation implemented: `VITE_CANVAS_TEST_API_ENABLED` with boolean coercion, `WebConfiguration.testApiEnabled`, production rejection with `INCOMPATIBLE_PROFILE`, and 6 focused tests all pass | `corepack pnpm --filter @vega/config test` (23 passed) | `S0D-02` — Vite gate and initializer |
| 26 July 2026 | `S0D-02` passed | Vite compile-time gate via `define` constant, dynamic import hook with tree-shaking, frozen `CanvasTestApi` global with `inspect()` returning `CanvasInspectionSnapshot`, 6 API unit tests pass | `corepack pnpm --filter @vega/web test` (8 passed); production build verified | `S0D-03` — Browser tests and bundle verification |
| 26 July 2026 | `S0D-03` passed | `test:browser` extended with two-phase (production-absent, test-mode-present) playback; Playwright spec added; static bundle verification script created; lint passes | `corepack pnpm lint` (all 15 packages); boundary verifier; bundle scan script created | `S0D-04` — Documentation updates |
| 26 July 2026 | `S0D-04` passed | Contract document `docs/contracts/04-non-production-canvas-test-api.md` created; contract index, docs index, task-plan index, README, CONTRIBUTING all updated; `docs:check` passes | `corepack pnpm docs:check` (45 files); `corepack pnpm check` (all static/unit gates) | `S0D-05` — Completion audit |
| 26 July 2026 | `S0D-05` passed | Completion audit: frozen install, check, coverage, docs, privacy/scope/bundle scans, `git diff --check` all pass | Full audit procedure executed | Plan complete |
| 26 July 2026 | Review corrections | 4 bugs found and fixed: (1) `runPublic`/`run` env isolation — `extraEnv` parameter added to propagate `VEGA_TEST_EXPECT_API_PRESENT` and `VITE_CANVAS_TEST_API_ENABLED`; (2) console error listener registered after `page.goto()` — moved before navigation; (3) `@vite-ignore` annotation prevented hook module bundling in test builds — removed; dynamic import resolves correctly, production tree-shaking still works | `pnpm test:browser` — 3 phases, 4/4 browser tests passed; `pnpm check` — 52 tests, 0 errors | FND-005 complete |

### Decisions and Blockers

| ID | Type | Description | Evidence | Resolution |
| --- | --- | --- | --- | --- |
| `DEC-001` | Decision | The compile-time Vite gate uses `mode === 'development'` and `mode === 'test'`; production builds tree-shake the initializer and global. | This plan | Implemented in `S0D-02` |
| `DEC-002` | Decision | Application profiles remain `local`, `demo`, `production`; the dedicated Vite `test` mode is separate. | This plan | Implemented in `S0D-01` |
| `DEC-003` | Decision | Dynamic import uses static path `"./canvas-test-api/hook.js"` without `@vite-ignore`; Vite resolves the module properly in test builds and tree-shakes dead code in production (since `__VITE_CANVAS_TEST_API_ENABLED__` is `false`). | Review corrections | Implemented in review |
| `DEC-004` | Decision | `IsolatedTestStack.run` and `runPublic` accept optional `extraEnv` for phase-specific env vars; production gate still prevents API exposure regardless of `VITE_CANVAS_TEST_API_ENABLED` value. | Review corrections | Implemented in review |

## Documentation Updates

- `docs/contracts/README.md` — add row for `04-non-production-canvas-test-api.md`.
- `docs/contracts/04-non-production-canvas-test-api.md` — new executable contract document.
- `docs/planning/plans/README.md` — register plan `0005` with current status.
- Root `README.md` — update configuration and testing sections.
- `CONTRIBUTING.md` — update testing, limitations, and troubleshooting.

## Definition of Done

- [x] Configuration validation accepts default disabled, explicit `true`/`false`/`1`/`0` in non-production, rejects production enablement with redacted error. (E-01)
- [x] The Vite compile-time gate removes the initializer module and global string from production builds; tree-shaking is verifiable by static scan. (E-03, E-06)
- [x] `window.__CANVAS_TEST_API__` is frozen, non-writable, non-configurable, and exposes only `inspect()`. (E-02)
- [x] `inspect()` returns a fresh frozen `CanvasInspectionSnapshot` with schema `v1`, runtime profile/releaseId, `not-mounted` canvas, `null` room, `null` scene, and `not-configured` collaboration/persistence. (E-02)
- [x] No identity, token, URL, Yjs reference, binary, recovery-content, or command field exists on the API or snapshot. (E-02)
- [x] Chromium browser tests prove production absence and test-mode presence with exact snapshot shape. (E-04, E-05)
- [x] Static production-bundle scans confirm no API identifier in JS, HTML, or source maps. (E-06)
- [x] Documentation, indexes, README, and CONTRIBUTING match implemented behaviour. (E-07)
- [x] Frozen install, static checks, unit coverage, integration suites, browser, docs, privacy/scope/bundle/diff/residue all pass. (E-08)
- [x] Excluded work (`FND-006`, product features, Excalidraw mounting, commit/push) remains unclaimed.

## Completion Audit

Before changing execution status to `Passed`:

1. Re-read the goal objective, included scope, exclusions, and every explicit deliverable.
2. Map each definition-of-done item to current authoritative evidence.
3. Run every proof command:
   - `corepack pnpm install --frozen-lockfile`
   - `corepack pnpm check`
   - `corepack pnpm test:coverage`
   - `corepack pnpm test:integration`
   - `corepack pnpm test:integration:foundation`
   - `corepack pnpm test:browser`
   - `corepack pnpm docs:check`
   - Privacy/scope/bundle searches
   - `git diff --check`
   - Full diff review
   - Isolated-resource residue checks
4. Treat missing, stale, narrow, indirect, or uncertain evidence as incomplete.
5. Resolve every mandatory `Pending`, `Failed`, or `Blocked` row.
6. Review the complete diff and preserve unrelated user changes.
7. Update execution steps, evidence matrix, progress log, document date, and task-plan index.
8. Change execution status to `Passed` only when the full objective and stopping condition are proven.

The final handoff must summarise:
- Files and behaviour delivered.
- Decisions made.
- Required validation and results.
- Remaining optional or deferred work.
- Any known limitation that does not contradict completion.

## Completion Audit Record

Passed on 26 July 2026 (revised after review corrections):

- Node `v24.18.0`, pnpm `11.17.0`, and `corepack pnpm install --frozen-lockfile` matched the pinned manifests.
- `corepack pnpm check` passed build, lint, typecheck, boundary verification, and all unit tests across 11 workspaces (52 total tests).
- `corepack pnpm test:coverage` passed with the V8 provider; `@vega/web` source and `canvas-test-api` recorded 100% statement, branch, function, and line coverage. `@vega/config/web.ts` recorded 100% statement, branch, function, and line coverage.
- `corepack pnpm test:integration` passed (1 suite, 1 test — isolated service checks).
- `corepack pnpm test:integration:foundation` passed (migration, privileges, privacy, health, interruption, recovery).
- `corepack pnpm test:browser` passed all three phases:
  - Phase 1 (production): 2/2 — API absent assertion + foundation smoke.
  - Phase 2 (test mode): 2/2 — API present, exact snapshot, frozen global, proper descriptor, no console errors + foundation smoke.
  - Phase 3 (static bundle): no `__CANVAS_TEST_API__` or `installCanvasTestApi` in JS, HTML, or source maps.
- `corepack pnpm docs:check` passed 45 Markdown files.
- `git diff --check` passed with no whitespace errors.
- Privacy/scope searches confirmed:
  - No guest email, token, credential, or private data in new files.
  - No Excalidraw import or second canvas model in test API code.
  - No `@vega/test-utils` import in production web code.
  - No `@vega/config/api` or `@vega/config/collaboration` in web code.
  - No server config in web code.
- Production bundle scan confirmed `__CANVAS_TEST_API__` and source module references are absent from emitted JS and source map sources.
- The diff contains 14 modified files and 6 new files, all within the plan's scope.
- Unrelated user changes (the uncommitted FND-004 worktree state) are preserved.
- 4 bugs found and fixed during review: env var propagation in isolated stack, console error listener ordering, `@vite-ignore` preventing module bundling.

Every evidence row and definition-of-done item passes. `FND-006`, Stage 1, and all product workflows remain outside this completed plan.

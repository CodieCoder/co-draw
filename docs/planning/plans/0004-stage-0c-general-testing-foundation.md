# Stage 0C — General Testing Foundation

**Document path:** `docs/planning/plans/0004-stage-0c-general-testing-foundation.md`  
**Document status:** Proposed  
**Execution status:** Passed  
**Parent plan:** [MVP Implementation Plan](../01-mvp-implementation-plan.md)  
**Applicable work package:** `FND-004`  
**Last updated:** 26 July 2026  
**Primary owners:** Engineering and QA

## Summary

Deliver a reusable, isolated testing foundation where unit, service-integration, and Chromium browser smoke tests run through documented root commands without using developer or production data.

**Goal objective:** Establish consistent Vitest conventions, shared synthetic collaborator fixtures, an isolated service stack, and Playwright coverage suitable for later multi-client work.

**Completion statement:** `FND-004` is complete when the unit fixture test, isolated service integration suite, three-context browser smoke, cleanup probes, documentation checks, and completion audit all pass with no leaked processes, Compose resources, credentials, or private data.

**Goal handoff:**

```text
/goal Implement the persisted plan at docs/planning/plans/0004-stage-0c-general-testing-foundation.md in full. Treat its scope, fixed decisions, execution steps, evidence matrix, and definition of done as the execution contract. Change execution status to In progress before the first mutation, preserve unrelated changes, and do not mark the goal complete until every mandatory row passes and isolated test resources are proven cleaned up.
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
server-authoritative; and guest email remains private. This plan adds test
infrastructure only and must not implement or imply a product workflow.

## Scope

Included:

- Vitest conventions and shared synthetic fixtures.
- One isolated service-integration lifecycle and smoke.
- Playwright configuration and a Chromium browser smoke.
- Separate Alice, Bob, and Charlie contexts.
- Documented root commands, generated-artifact policy, and CI-safe cleanup.

Excluded:

- Authentication, rooms, sessions, canvas mounting, Yjs collaboration,
  IndexedDB recovery, media, or permission implementation.
- The `FND-005` test-hook boundary and `FND-006` CI workflow.
- Firefox, WebKit, QA-Intel scenarios, and provider-specific CI.
- Production or developer data access and destructive developer-volume
  operations.

Allowed incidental changes are focused tests, test-only package exports,
root TypeScript and ESLint coverage for the new tests, exact dependency and
lockfile updates, and documentation required by the added commands.

## Implementation Changes

### Test conventions and fixtures

- Keep colocated Vitest unit tests named `*.test.ts` or `*.test.tsx`; reserve `tests/integration/**/*.integration.test.ts` for isolated service tests and `tests/browser/**/*.spec.ts` for Playwright.
- Standardize test-bearing Vitest configurations on explicit imports, `globals: false`, Node by default, mock restoration, environment/global unstubbing, and project-specific V8 coverage.
- Expand `@vega/test-utils` with test-only exports:
  - `createSyntheticActors(runId)` returns frozen Alice/owner, Bob/editor, and Charlie/viewer fixtures with unique UUIDv7 guest IDs, safe usernames, and run-scoped `example.test` private emails.
  - `createCollaboratorContexts(browser, { baseUrl, runId })` creates three distinct non-persistent Playwright contexts and pages plus idempotent `close()`.
- The browser helper must not place actor roles, IDs, or emails into application state, simulate authentication, or grant authority.

### Isolated service harness

- Introduce one reusable lifecycle module under `scripts/testing/` and refactor `test:integration:foundation` to use it instead of maintaining a second orchestration model.
- Each run generates a strict `vega-canvas-it-<pid>-<random>` Compose project, database, bucket, release ID, credentials, loopback ports, and mode-`0600` temporary environment file. It must not read `.env.local`.
- The harness starts PostgreSQL and MinIO, initialises scoped roles and the private bucket, applies migrations, starts requested built applications, waits for exact readiness, and exposes only public URLs/run identifiers to test-runner children.
- Cleanup is idempotent and handles success, thrown errors, `SIGINT`, and `SIGTERM`: stop children with bounded `SIGTERM`/`SIGKILL`, run exact-project `compose down --volumes --remove-orphans`, verify no project resources remain, then remove the temporary environment.
- Cleanup refuses project names outside the strict prefix, never touches the developer Compose project, never runs global Docker prune, and makes cleanup failure fail the command. Untrappable `SIGKILL` is documented as a limitation with the exact safe project cleanup command.

### Service integration and Playwright

- Add `test:integration` to run a Vitest service smoke against the isolated built API and collaboration services. Assert exact live/ready contracts, one shared run release ID, absent domain routes, and resource cleanup.
- Pin `@playwright/test` `1.61.1` in the pnpm catalog and run the repository’s Chromium-first path. Playwright contexts provide independent cookies and browser storage, matching the accepted isolation model. ([Playwright context isolation](https://playwright.dev/docs/browser-contexts))
- Configure zero retries, CI `workers: 1`, `forbidOnly`, flaky-test failure, accessible locators, and failure-retained screenshots/traces under ignored `reports/playwright/`. ([Playwright CI guidance](https://playwright.dev/docs/ci))
- `test:browser` builds and launches the isolated API, collaboration, and web stack, then runs one smoke that:
  - Opens Alice, Bob, and Charlie in separate contexts.
  - Proves their cookies/local storage are independent.
  - Loads the foundation shell and asserts its accessible heading/status in all contexts.
  - Captures unexpected console or page errors.
  - Confirms the shell still states that no room or scene exists, avoiding a false product-feature claim.
- Do not add `window.__CANVAS_TEST_API__`; that remains `FND-005`.

### Root commands and documentation

Add and document:

| Command                                                      | Contract                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------------ |
| `corepack pnpm test`                                         | Existing unit-suite compatibility command.                         |
| `corepack pnpm test:unit`                                    | Explicit alias for all Vitest unit projects.                       |
| `corepack pnpm test:integration`                             | Self-contained isolated service suite and cleanup verification.    |
| `corepack pnpm test:integration:foundation`                  | Existing Stage 0B failure/recovery suite using the shared harness. |
| `corepack pnpm test:browser`                                 | Self-contained Chromium Playwright smoke.                          |
| `corepack pnpm test:cleanup -- <exact-project>`              | Guarded Docker and temporary-environment recovery for one project.  |
| `corepack pnpm exec playwright install chromium`             | Local browser installation.                                        |
| `corepack pnpm exec playwright install --with-deps chromium` | CI browser and Linux dependency installation.                      |

`check` remains the fast build/lint/typecheck/unit gate; documentation must state that integration and browser commands are additional mandatory full-validation gates.

Update the root README, CONTRIBUTING guide, main documentation index, contract
index, and add `docs/contracts/03-general-testing-foundation.md`. Register plan
`0004` as `Proposed` and keep its execution status current through the
documented lifecycle.

## Data and Control Flows

```text
Root integration or browser command
→ validate and generate an exact test-run scope
→ write a private mode-0600 temporary environment
→ start isolated PostgreSQL and MinIO
→ initialise roles and bucket
→ apply and verify migrations
→ start only the required built applications
→ pass public loopback URLs and run identifiers to the test runner
→ execute assertions
→ terminate child processes
→ remove exact-project containers, network, and volumes
→ verify no labelled resource remains
→ remove the temporary environment
```

The application scene and PostgreSQL data models remain authoritative in their
existing boundaries. Test actors, run IDs, browser contexts, ports, temporary
credentials, reports, and isolated provider resources are synthetic and
ephemeral. Browser-local storage used by the smoke is only an isolation probe,
not application state or authority.

## Failure and Security Behaviour

- Invalid suite names, run IDs, base URLs, or cleanup targets fail before a
  provider action and do not echo rejected private values.
- Service and browser commands fail closed when setup, readiness, assertions,
  cleanup, or residue verification fails.
- Cleanup is idempotent on success, thrown errors, `SIGINT`, and `SIGTERM`.
- Untrappable `SIGKILL` requires the exact printed-project cleanup command
  after the owning process is confirmed dead. That command removes both exact
  project-labelled Docker resources and the generated temporary environment
  bound to the project name.
- Cleanup may target only the strict generated project pattern. It must never
  use wildcard cleanup, global Docker prune, the developer Compose project, or
  persistent developer volumes.
- Credentials, private actor emails, connection strings, and provider
  diagnostics must not enter browser state, public output, logs, reports, or
  evidence.

## Execution Steps

| Step     | Action                                                                                                                                    | Depends on | Verification                                                                                                   | Status      |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- | ----------- |
| `S0C-01` | Recheck the clean worktree and pinned Node/pnpm/Docker versions; add exact Playwright/root test dependencies and regenerate the lockfile. | None       | Frozen install and installed-version inspection.                                                               | Passed      |
| `S0C-02` | Standardize Vitest configuration and implement/test the synthetic actor fixtures.                                                         | `S0C-01`   | Unit suite, strict typecheck, and coverage.                                                                    | Passed      |
| `S0C-03` | Implement the isolated lifecycle harness and migrate the Stage 0B integration runner onto it.                                             | `S0C-02`   | Foundation integration regression and cleanup-focused tests.                                                   | Passed      |
| `S0C-04` | Add the general service integration configuration, smoke, and root command.                                                               | `S0C-03`   | `corepack pnpm test:integration`.                                                                              | Passed      |
| `S0C-05` | Add Playwright configuration, collaborator-context helper, browser runner, and Chromium smoke.                                            | `S0C-04`   | `corepack pnpm test:browser`.                                                                                  | Passed      |
| `S0C-06` | Update root commands, test contracts, troubleshooting, generated-artifact policy, indexes, and the plan record.                           | `S0C-05`   | Documentation checks and targeted scope/privacy searches.                                                      | Passed      |
| `S0C-07` | Run the full completion audit and record current evidence.                                                                                | `S0C-06`   | Frozen install, check, coverage, both integration commands, browser smoke, docs, diff, and residue inspection. | Passed      |

## Test and Evidence Plan

| Requirement                      | Done condition                                                                                                                                          | Proof                                                                   | Result                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------- |
| `E-01` — Vitest foundation       | Conventions are consistent and actor fixtures enforce Alice/owner, Bob/editor, Charlie/viewer with synthetic run-scoped identities.                     | `corepack pnpm test:unit`; `corepack pnpm test:coverage`.               | Passed — 26 July 2026 |
| `E-02` — Static boundaries       | Tests and helpers typecheck/lint; production code cannot import `@vega/test-utils`.                                                                     | `corepack pnpm check`; boundary verifier.                               | Passed — 26 July 2026 |
| `E-03` — Service integration     | Fresh isolated dependencies, migrations, API, and collaboration services pass exact smoke assertions.                                                   | `corepack pnpm test:integration`.                                       | Passed — 26 July 2026 |
| `E-04` — Stage 0B regression     | Existing interruption, recovery, privacy, and migration coverage remains intact on the shared harness.                                                  | `corepack pnpm test:integration:foundation`.                            | Passed — 26 July 2026 |
| `E-05` — Browser smoke           | Chromium uses three separate actor contexts; storage isolation, accessible shell rendering, and clean browser diagnostics pass without retry.           | `corepack pnpm test:browser`; Playwright report/trace on failure.       | Passed — 26 July 2026 |
| `E-06` — CI-safe cleanup         | Normal, exception, and signal paths target only the generated project and leave no child process, container, network, volume, or temporary secret file. | Harness lifecycle tests plus post-run exact-project inspection.         | Passed — 26 July 2026 |
| `E-07` — Documentation and scope | Commands, prerequisites, cleanup, artifacts, and limitations match executable behavior; `FND-005` and product behavior remain unclaimed.                | `corepack pnpm docs:check`; privacy/scope searches; `git diff --check`. | Passed — 26 July 2026 |

## Assumptions and Boundaries

- Chromium is the only mandatory Stage 0C browser; Firefox and WebKit remain later compatibility work.
- No provider-specific CI workflow is added. The commands and lifecycle are CI-safe and provider-neutral.
- Browser installation may require network access and Linux system-package approval; tests fail with an actionable installation command rather than downloading implicitly.
- The current dependency directory must be reconciled with the pinned runtime through a frozen install before executable evidence is accepted.
- Authentication, rooms, sessions, Excalidraw mounting, Yjs collaboration, permission enforcement, IndexedDB recovery, media, QA-Intel scenarios, and production test hooks remain excluded.
- No commit, push, pull request, deployment, destructive developer-volume removal, or production-data access is authorised.

`Passed` is allowed only when every evidence row passes, documentation and index statuses agree, the final diff is scoped, and no generated test resource remains.

## Execution Record

### Progress Log

| Date | Checkpoint | Outcome | Verification | Next step |
| --- | --- | --- | --- | --- |
| 26 July 2026 | Execution started | Plan and index changed to `In progress` before implementation mutation; the pinned Node and pnpm runtime was selected. | Plan/index inspection and version output. | Implement fixtures and test configuration. |
| 26 July 2026 | Vitest and fixtures implemented | Test-bearing workspaces use explicit shared conventions; Alice, Bob, and Charlie fixtures build and pass focused tests. | Package build, typecheck, and unit tests. | Build the isolated lifecycle. |
| 26 July 2026 | Isolated lifecycle implemented | General integration and the complete Stage 0B regression pass using the shared exact-project harness. | Both root integration commands. | Add browser coverage. |
| 26 July 2026 | Cleanup probe corrected | An initial signal probe exposed an unsettled process; the exact disposable project was removed by label and the probe was changed to retain a live handle until `SIGTERM`. Exception and signal cleanup then passed without residue. | Cleanup probes and exact Docker label inspection. | Run browser and documentation gates. |
| 26 July 2026 | Browser smoke implemented | One retry-free Chromium test passed for three separate contexts and independent browser storage. | `corepack pnpm test:browser`. | Complete documentation and final audit. |
| 26 July 2026 | Documentation reconciled | Root commands, lifecycle, cleanup, limitations, contract indexes, and current-state references were updated. | Documentation and targeted stale-claim review. | Run the final completion audit. |
| 26 July 2026 | Privacy and hard-kill recovery tightened | Audit output exposed generated initializer credentials and one temporary environment left by the earlier failed probe. Initializer output was suppressed, the exact disposable directory was removed, temp paths were bound to project names, and the guarded manual cleanup path was added to the automated cleanup proof. | Repeated general integration, manual/exception/`SIGTERM` cleanup probes, and empty temp/Docker residue inspection. | Rerun every current-state gate. |
| 26 July 2026 | Completion audit passed | Pinned-runtime install, static/unit/coverage, both integration suites, Chromium, docs, privacy/scope, diff, process, Docker, and temporary-directory checks all passed. | Commands and inspections recorded in the completion audit. | Preserve the passed plan and hand off. |

### Decisions and Blockers

- Playwright is pinned at `1.61.1`; Chromium is the only mandatory Stage 0C
  browser.
- Browser contexts receive only a base URL. Synthetic identities and roles
  remain fixture metadata and do not simulate authentication.
- The shared lifecycle owns both new service integration and the existing
  Stage 0B regression, avoiding a second orchestration model.
- Cleanup uses exact Compose project labels and rejects the persistent
  `vegait-hackerton` developer target before Docker access.
- No mandatory blocker remains.

## Definition of Done

- [x] All test-bearing workspaces use the documented explicit Vitest
  conventions and the complete unit and coverage suites pass.
- [x] `@vega/test-utils` provides frozen, run-scoped Alice/owner, Bob/editor,
  and Charlie/viewer fixtures without making client-side authority claims.
- [x] General service integration and the complete Stage 0B regression pass
  against fresh isolated PostgreSQL and MinIO resources.
- [x] The retry-free Chromium smoke proves three separate contexts,
  independent storage, accessible foundation-shell output, and clean browser
  diagnostics.
- [x] Success, callback exception, `SIGTERM`, and exact manual-recovery
  boundaries are tested; no test container, network, volume, child process, or
  temporary secret remains.
- [x] Root commands, browser prerequisites, artifacts, cleanup, limitations,
  and ownership are documented and all relative links pass.
- [x] Production imports of test utilities remain prohibited; guest email,
  credentials, and excluded `FND-005` or product behaviour do not enter public
  state or completion claims.
- [x] Frozen install, static checks, unit coverage, both integration suites,
  browser smoke, documentation, privacy/scope searches, diff validation, and
  final residue inspection all pass on the pinned runtime.
- [x] This plan and its index row record `Passed` only after the completion
  audit proves every preceding item.

## Completion Audit

Passed on 26 July 2026:

- Node `v24.18.0`, pnpm `11.17.0`, Playwright `1.61.1`, and
  `corepack pnpm install --frozen-lockfile` matched the pinned manifests.
- `corepack pnpm check` passed build, lint, boundary verification, strict
  package/root typechecking, and 49 unit tests across eight test-bearing
  workspaces.
- `corepack pnpm test:coverage` passed with the V8 provider; the synthetic
  actor fixture source recorded 100% statement, branch, function, and line
  coverage. The browser-only context helper is exercised by Playwright rather
  than counted as Vitest source.
- `corepack pnpm test:integration` passed the service smoke plus guarded
  manual recovery, callback-exception cleanup, and delivered-`SIGTERM`
  cleanup.
- `corepack pnpm test:integration:foundation` passed clean migration,
  idempotent initialisation and migration, exact readiness, route absence,
  fail-closed upgrade, database and storage interruption/recovery, unknown
  schema, collaboration privilege loss/recovery, and exact teardown.
- `corepack pnpm test:browser` passed one retry-free Chromium test using one
  worker and three separate actor contexts with independent cookies/local
  storage and clean console/page diagnostics.
- `corepack pnpm docs:check` passed 43 Markdown files; `git diff --check`,
  production-import, test-hook, private-data, stale-claim, destructive-cleanup,
  and generated-artifact reviews passed.
- Final Docker label inspection found no `vega-canvas-it-*` container,
  network, or volume. Process inspection found no test runner or preview
  child. Both operating-system temp locations contained no
  `vega-canvas-test-*` directory. Existing unrelated Compose projects were
  left untouched.
- The one disposable test project and temporary environment leaked by the
  initial failed signal-probe experiment were removed by exact target during
  the audit; neither is recoverable or expected to be retained.

Every evidence row and definition-of-done item passes. `FND-005`, `FND-006`,
Stage 1, and all product workflows remain outside this completed plan.

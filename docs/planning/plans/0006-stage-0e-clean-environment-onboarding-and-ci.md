# Stage 0E — Clean-Environment Onboarding and Continuous Validation

**Document path:** `docs/planning/plans/0006-stage-0e-clean-environment-onboarding-and-ci.md`

**Document status:** Proposed

**Execution status:** Passed

**Parent plan:** [MVP Implementation Plan](../01-mvp-implementation-plan.md)

**Applicable work packages:** `FND-006`

**Goal objective:** Make the complete Stage 0 foundation reproducible from a fresh checkout through accurate setup and troubleshooting documentation, canonical root verification commands, a secret-free clean-source rehearsal, and one minimal GitHub Actions workflow that executes the same verified contract.

**Completion statement:** `FND-006` and Stage 0 are complete when a source tree containing no dependency directory or local environment file can install with the pinned toolchain, run the documented isolated foundation verification successfully, the documented local setup and safe teardown path is proven, the GitHub Actions definition invokes that same contract without repository secrets, and every evidence row and definition-of-done item passes without claiming a product feature.

**Last updated:** 26 July 2026 (completed)

**Primary owners:** Engineering, QA, and Developer Experience

---

# 1. Purpose

This plan completes the Stage 0 execution foundation by turning the working
`FND-001` through `FND-005` scaffold into a reproducible handoff for a new
developer and for clean-checkout automation.

The repository already has the required application shells, local
infrastructure, executable contracts, isolated test levels, and production
test-hook boundary. `FND-006` does not create another product or test model. It
publishes and proves the supported ways to install, start, validate,
troubleshoot, and safely clean up the existing foundation.

---

# 2. Goal contract

## 2.1 Objective

Provide one truthful onboarding and validation contract that:

- starts from the pinned Node and pnpm versions;
- distinguishes persistent local development from disposable automated tests;
- exposes canonical root commands for local, production-shaped, complete
  foundation, and clean-source verification;
- documents every required prerequisite and safe recovery step;
- runs unchanged from a minimal read-only GitHub Actions workflow; and
- proves Stage 0 without presenting rooms, sessions, canvas mounting,
  collaboration, persistence, or permissions as implemented product features.

## 2.2 Completion statement

The completion statement in the document metadata is the only stopping
condition. A passing current-worktree command, a syntactically plausible
workflow, or documentation review without a clean-source rehearsal is not
sufficient.

## 2.3 Ready-to-run goal handoff

```text
/goal Implement the persisted plan at docs/planning/plans/0006-stage-0e-clean-environment-onboarding-and-ci.md in full. Treat its authoritative-source precedence, fixed decisions, scope, execution steps, evidence matrix, and definition of done as the execution contract. Change execution status to In progress before the first implementation mutation, keep step status and evidence current, preserve unrelated user changes and local data, and do not mark the goal complete until the completion statement and every mandatory definition-of-done item are proven. Do not start Stage 1 or any product workflow, and do not commit, push, deploy, or change remote repository settings without separate authorization.
```

An execution surface without `/goal` should use the text after `/goal` as its
task objective.

---

# 3. Authoritative sources and constraints

## 3.1 Source precedence

1. [Repository instructions](../../../AGENTS.md).
2. [Documentation Index](../../README.md).
3. [Product Requirements](../../product/01-product-requirements.md).
4. [MVP Scope and Acceptance Criteria](../../product/02-mvp-scope-and-acceptance-criteria.md).
5. [System Architecture](../../architecture/01-system-architecture.md).
6. [Testing and Quality Strategy](../../architecture/11-testing-and-quality-strategy.md).
7. [Deployment and Operational Readiness](../../architecture/12-deployment-and-operational-readiness.md).
8. [ADR 0006 — Risk-Based TDD and QA-Intel Release Controls](../../adr/0006-risk-based-tdd-and-qa-intel-release-controls.md).
9. [ADR 0007 — Vendor-Neutral Five-Unit Deployment Topology](../../adr/0007-vendor-neutral-five-unit-deployment-topology.md).
10. [MVP Implementation Plan](../01-mvp-implementation-plan.md), especially
    `FND-006`, Stage 0 failure and security requirements, the Stage 0 exit gate,
    and command ownership.
11. Implemented foundation references:
    [Foundation Contracts](../../contracts/01-foundation-contracts.md),
    [Local Persistence and Readiness](../../contracts/02-local-persistence-and-readiness.md),
    [General Testing Foundation](../../contracts/03-general-testing-foundation.md),
    and [Non-Production Canvas Inspection API](../../contracts/04-non-production-canvas-test-api.md).

Accepted product and architecture sources govern if an implementation detail
in this proposed plan conflicts with them.

## 3.2 Invariants

- This remains a pnpm-only workspace. Repository documentation and automation
  use `corepack pnpm`; they do not use npm, Yarn, or Bun.
- The exact versions in `.nvmrc`, `.node-version`, `package.json`, and the
  onboarding documentation remain consistent.
- Excalidraw remains the only canvas renderer and editor, and its scene remains
  canonical. This plan does not mount Excalidraw or add scene state.
- Yjs/Hocuspocus ownership, server-authoritative permissions, private storage,
  and IndexedDB recovery boundaries remain unchanged and unimplemented where
  later stages own them.
- Guest email, credentials, tokens, connection strings, signed URLs, raw
  scenes, Yjs updates, recovery content, and binary bodies remain absent from
  public documentation, workflow configuration, logs, and retained evidence.
- Automated verification uses isolated `vega-canvas-it-*` resources and never
  reads or targets `.env.local`, the persistent developer Compose project, or
  production data.
- Ordinary local teardown preserves developer volumes. Destructive volume
  deletion, Docker prune, wildcard cleanup, or broad temporary-directory
  deletion is not authorised.
- Stage 0 completion proves only the execution foundation. It does not prove a
  guest, room, Excalidraw canvas, Yjs room, asset, offline, permission, or
  collaboration workflow.

## 3.3 FND-006 and CI interpretation

The parent `FND-006` row explicitly owns clean-environment setup, validation,
troubleshooting documentation, and proof. The completed `FND-004` and
`FND-005` plans and contracts consistently reserve a provider-specific CI
workflow for `FND-006`.

This plan resolves those statements by including one minimal GitHub Actions
workflow as the clean-checkout executor for the same root verification
contract. The workflow does not select a deployment vendor, change accepted
architecture, add a release exception, or require a new ADR. Branch
protection, repository settings, hosted secrets, deployment, and remote
workflow execution remain separate external actions.

---

# 4. Scope

## 4.1 Included

- Audit and correct the root `README.md` and `CONTRIBUTING.md` against the
  executable Stage 0A–0D scaffold.
- Document the exact prerequisites, pinned-version checks, frozen install,
  Playwright Chromium installation, local environment preparation,
  infrastructure startup, migrations, verification, development startup,
  non-destructive teardown, complete foundation validation, report locations,
  limitations, and troubleshooting order.
- Add canonical root commands:
  - `verify:local` for migration status, infrastructure checks, and built
    application-shell smoke against the developer's configured local stack;
  - `verify:production` for an ordinary production-shaped build and static
    absence of the test API;
  - `verify:foundation` for all mandatory Stage 0 static, unit, coverage,
    integration, browser, production-shaped, bundle, performance, and
    documentation gates that do not require `.env.local`;
  - `verify:clean` for an ignore-respecting temporary source snapshot, frozen
    install, and `verify:foundation`.
- Add a safe clean-source verification runner that:
  - copies only Git-tracked and non-ignored intended source files;
  - excludes `.git`, ignored local configuration, dependency directories,
    caches, reports, and build artifacts;
  - creates only an exact process-owned temporary directory;
  - runs the pinned frozen install and canonical full verification;
  - forwards failure status and bounded diagnostics; and
  - removes only its own temporary directory on success, ordinary failure,
    `SIGINT`, and `SIGTERM`.
- Make the Lighthouse/Chrome prerequisite portable across the supported local
  macOS path and the Linux CI path, while preserving `CHROME_PATH` as the
  explicit override and the installed Playwright Chromium as the final
  supported fallback.
- Extend documentation validation so version pins, required root command
  names, task-plan numbering/index coverage, onboarding links, and the CI
  wrapper cannot silently drift from executable files.
- Add `.github/workflows/foundation.yml` for pull requests, pushes to `main`,
  and manual dispatch.
- Record current plan execution, decisions, evidence, and the final Stage 0
  completion audit in this plan and its index row.

## 4.2 Excluded

- Stage 1 Excalidraw mounting or adapter expansion.
- Guest identity, sessions, rooms, share links, memberships, roles, product
  permissions, Yjs room collaboration, durable scene persistence, awareness,
  IndexedDB recovery, asset workflows, media, physics, export, or other
  product behaviour.
- Firefox, WebKit, QA-Intel product scenarios, or future P0 release workflows.
- Provider-specific deployment configuration or a hosting-vendor choice.
- Branch-protection changes, required-check settings, repository secrets,
  environment secrets, hosted runner administration, or other remote
  repository mutations.
- Publishing or retaining dependency caches as a new repository contract.
- Replacing the existing isolated-test lifecycle or creating a second
  orchestration model.
- Clearing developer volumes, pruning Docker globally, removing an existing
  `.env.local`, or deleting user-generated reports outside an exact
  process-owned temporary path.
- Commit, push, pull request, deployment, or release creation.

## 4.3 Allowed incidental changes

- Focused tests for clean-source inventory, temporary-directory ownership,
  browser executable selection, documentation consistency, and failure
  propagation.
- `package.json` script changes required for the canonical commands.
- Lockfile changes only if a demonstrably necessary, exactly pinned
  development dependency is added. Prefer the existing Node runtime and
  dependencies.
- `.gitignore` updates only for a newly generated local artifact introduced by
  this plan.
- Small corrections to existing root documentation or scripts when the
  clean-source rehearsal proves the documented Stage 0 command is inaccurate.

---

# 5. Current state and assumptions

## 5.1 Verified planning facts

- `FND-001` through `FND-005` are indexed as `Passed`.
- The planning baseline at plan creation is commit `ecc963e`, the completed
  Stage 0D non-production inspection boundary.
- `.nvmrc` and `.node-version` pin Node `24.18.0`; `package.json` pins pnpm
  `11.17.0`; both versions were active when this plan was prepared.
- The worktree was clean when planning began.
- `README.md` and `CONTRIBUTING.md` already document most individual commands,
  privacy constraints, isolated cleanup, and troubleshooting. They require a
  consistency audit and canonical aggregate commands rather than replacement
  with a second runbook.
- The README summary still says Stage 0A through Stage 0C even though Stage 0D
  has passed.
- There is no `.github/workflows/` workflow.
- `corepack pnpm check` is intentionally the fast build, lint, strict
  typecheck, and unit gate. It does not include either integration suite,
  Chromium, performance, or documentation validation.
- `test:integration`, `test:integration:foundation`, and `test:browser`
  already use the shared isolated lifecycle and do not read `.env.local`.
- `performance:web` supports explicit `CHROME_PATH` and a macOS Chrome
  default, but does not yet discover the Linux or Playwright-managed browser
  needed by the clean CI path.
- `docs:check` resolves local Markdown links but does not yet prove complete
  task-plan indexing or onboarding-command/version consistency.
- An ignored `.env.local` or an existing `node_modules` may be present on a
  developer machine. Neither may be copied into clean-source evidence or
  treated as proof.

## 5.2 Execution-time prerequisites to verify

- Activate the runtime pinned by `.nvmrc`; record `node --version` and
  `corepack pnpm --version` before executable work.
- Network access is required for a genuinely empty pnpm store or missing
  Playwright browser. Request approval only if the execution environment
  requires it.
- Docker Engine with Compose v2 must be available for local infrastructure and
  isolated integration/browser suites.
- Chromium must be installed with the documented Playwright command.
- Lighthouse must resolve a supported browser through explicit `CHROME_PATH`,
  a documented platform installation, or Playwright Chromium.
- Required local ports must be available only for `verify:local`; isolated
  suites allocate their own run-scoped ports.
- GitHub-hosted execution cannot be claimed as observed unless a separately
  authorised push or pull request actually triggers it. Local clean-source
  evidence remains mandatory and sufficient to validate the persisted
  workflow contract before any remote action.

---

# 6. Fixed implementation decisions

| ID | Decision | Reason and boundary | Required record |
| --- | --- | --- | --- |
| `DEC-001` | `verify:foundation` is the single complete `.env.local`-independent Stage 0 command; `check` remains the fast inner-loop gate. | Preserves the accepted distinction between quick feedback and full evidence while removing undocumented command sequencing. | Root manifest, README, CONTRIBUTING, docs check, and CI workflow. |
| `DEC-002` | `verify:local` is non-destructive and operates only on the developer-configured stack; it never starts infrastructure or changes migrations implicitly. | Startup, migration, verification, and teardown remain visible operations with truthful failure ownership. | Root manifest and local workflow documentation. |
| `DEC-003` | `verify:clean` builds a temporary source snapshot from Git-visible, non-ignored files and runs frozen install plus `verify:foundation`; it accepts no caller-supplied deletion target. | Proves a clean source boundary without copying `.env.local`, reusing `node_modules`, mutating the original worktree, or broadening deletion authority. | Clean-source runner, focused tests, and completion evidence. |
| `DEC-004` | CI uses one Ubuntu 24.04 job with read-only contents permission, a bounded timeout, no repository secrets, pinned Node/pnpm, Docker Compose, Playwright Chromium, and the same `verify:foundation` command. | One job is proportionate to the two-day MVP and exposes ordering/cleanup failures without adding distributed CI complexity. | `.github/workflows/foundation.yml` and workflow verification. |
| `DEC-005` | The workflow triggers on pull requests, pushes to `main`, and manual dispatch; concurrency cancels superseded runs for the same ref. | Covers integration and operator rehearsal without changing branch protection or deployment. | Workflow file. |
| `DEC-006` | Official GitHub actions use reviewed stable major versions. No third-party action beyond checkout, Node setup, and failure-artifact upload is introduced. | Keeps the workflow inspectable and proportionate. Exact references used are recorded in the execution log. | Workflow diff review and documentation validation. |
| `DEC-007` | Failure artifacts are limited to ignored bundle, Lighthouse, and Playwright report paths, retained only for a short bounded period, and uploaded only after the test lifecycle has removed temporary configuration. | Supports diagnosis without retaining environment files, credentials, or private application state. | Workflow file and privacy inspection. |
| `DEC-008` | Browser resolution order is explicit `CHROME_PATH`, supported platform Chrome/Chromium, then the installed Playwright Chromium. Missing executables fail with the documented installation command. | Removes an undocumented Linux prerequisite without hiding a missing browser or downloading at test runtime. | Performance script, focused test or deterministic inspection, README troubleshooting. |
| `DEC-009` | No new ADR or executable contract document is required. | FND-006 implements the existing onboarding/evidence outcome and does not change product or architecture. This plan is the durable task contract. | Plan and index review. |

No unresolved decision may select another package manager, CI provider,
orchestration model, deployment topology, or product scope during execution.

---

# 7. Deliverables and ownership

| Deliverable | Owning boundary | Required output |
| --- | --- | --- |
| Canonical command surface | Root `package.json` and supporting scripts | `verify:local`, `verify:production`, `verify:foundation`, and `verify:clean` with non-overlapping documented responsibilities and truthful exit codes. |
| Clean-source rehearsal | `scripts/` | Ignore-respecting, secret-excluding, process-owned temporary copy; frozen install; full verification; exact cleanup and signal handling. |
| Portable performance prerequisite | `scripts/performance-web.mjs` or a focused helper | Deterministic executable selection and actionable safe failure on every supported path. |
| Onboarding guide | `README.md` | Fresh-checkout prerequisites, local startup, full verification, reports, limitations, safe teardown, and troubleshooting based on real commands. |
| Contribution gate | `CONTRIBUTING.md` | Focused-change guidance plus the canonical pre-handoff and clean-source commands. |
| Documentation consistency | `scripts/docs-check.mjs` and focused tests where useful | Links, pins, root command catalog, plan index/numbering, onboarding anchors, and workflow contract remain aligned. |
| Clean-checkout automation | `.github/workflows/foundation.yml` | Minimal read-only job that installs pinned dependencies/browser prerequisites and runs `verify:foundation` without secrets. |
| Execution record | This plan and `docs/planning/plans/README.md` | Current steps, decisions, blockers, evidence, Stage 0 claim, and matching statuses. |

The root manifest owns command names. Individual scripts own their mechanics.
README and CONTRIBUTING are derived operational guidance. The task plan owns
execution evidence; generated CI and test reports are disposable evidence, not
authoritative state.

---

# 8. Execution steps

| Step | Action | Depends on | Required outputs | Verification | Status |
| --- | --- | --- | --- | --- | --- |
| `S0E-01` | Run preflight: inspect the complete worktree, activate and record pinned Node/pnpm, inventory current commands/docs/workflows, and verify Docker/browser/network prerequisites without reading or printing `.env.local`. Change this plan and its index row to `In progress` before the first implementation mutation. | None | Current-state record; unrelated changes and blockers identified | `git status --short`; `node --version`; `corepack pnpm --version`; bounded prerequisite probes | Passed |
| `S0E-02` | Add the canonical root command surface and the clean-source runner with exact inventory, failure propagation, signal handling, and process-owned cleanup. Keep `check` fast and preserve all existing focused commands. | `S0E-01` | Root scripts plus focused verification of source selection and cleanup boundaries | Focused tests; `corepack pnpm check`; exact ignored-secret and residue inspection | Passed |
| `S0E-03` | Make performance-browser discovery portable and make production-shaped verification explicit. | `S0E-02` | Supported browser resolution; actionable missing-browser failure; test-API-free production artifact | Focused selection tests or deterministic platform inspection; `corepack pnpm verify:production`; `corepack pnpm performance:web` | Passed |
| `S0E-04` | Strengthen `docs:check`; audit and update README and CONTRIBUTING so prerequisites, local setup, validation levels, safe teardown, reports, current limitations, and troubleshooting match the executable scaffold. | `S0E-02`, `S0E-03` | Accurate root documentation and machine-checked command/pin/index consistency | `corepack pnpm docs:check`; command-to-manifest and relative-link inspection | Passed |
| `S0E-05` | Add the minimal GitHub Actions workflow using the pinned toolchain, browser/system prerequisites, Docker-backed suites, the canonical full gate, bounded permissions/timeout/concurrency, and redacted failure-artifact policy. | `S0E-02`–`S0E-04` | `.github/workflows/foundation.yml` matching `DEC-004` through `DEC-007` | Workflow structural check; exact command review; local execution of the invoked command sequence | Passed |
| `S0E-06` | Run the developer-local path without changing or deleting existing data: initialise only when no local environment exists, start infrastructure explicitly, migrate, run `verify:local`, start the three development shells for a bounded smoke, and stop with ordinary non-destructive teardown. Use a disposable non-conflicting configuration if the existing developer stack cannot safely serve as evidence. | `S0E-04` | Proven documented local setup/start/verify/stop path with all three shells live and ready | Documented commands; health/smoke assertions; `corepack pnpm infra:down`; persistent-volume preservation inspection | Passed |
| `S0E-07` | Run `verify:clean` from the original workspace, proving that an ignore-respecting temporary source tree with no `.env.local` or dependency directory can frozen-install and pass `verify:foundation`. | `S0E-05`, `S0E-06` | Clean-source evidence and no temporary or isolated-resource residue | `corepack pnpm verify:clean`; exact temp/Docker/process residue inspection | Passed |
| `S0E-08` | Complete the final audit, update every evidence row and checkbox, record any separately authorised remote workflow result, mark `FND-006` and Stage 0 passed only if all mandatory evidence is current, and keep Stage 1/product work unclaimed. | `S0E-07` | Passed evidence matrix, completion audit, plan/index alignment, scoped diff | Full procedure in section 15 | Passed |

Only one step is `In progress` at a time. A failed mandatory command is
recorded as a blocker or fixed at its owning boundary; it is not omitted from
the aggregate command or hidden behind a retry.

---

# 9. Data and control flows

## 9.1 Persistent local-development flow

```text
Fresh source tree
→ activate pinned Node and Corepack pnpm
→ frozen dependency install
→ install Playwright Chromium prerequisite
→ create ignored .env.local from committed placeholders
→ replace every CHANGE_ME with distinct synthetic local credentials
→ infra:up starts the persistent developer PostgreSQL and MinIO project
→ db:migrate applies the supported migration set explicitly
→ verify:local checks migration status, infrastructure, and built shells
→ dev starts web, API, and collaboration through the supported root path
→ infra:down stops infrastructure without deleting named volumes
```

The local database and object-storage volumes are persistent developer state.
The ignored environment file is private local configuration. Neither becomes
test evidence or enters the clean-source path.

## 9.2 Complete isolated verification flow

```text
Pinned installed workspace with browser and Docker prerequisites
→ verify:foundation
→ fast build/lint/typecheck/unit gate
→ coverage
→ isolated general service integration
→ isolated foundation regression
→ production-absent and test-mode-present Chromium phases
→ production-shaped bundle absence check
→ bundle and Lighthouse gates
→ documentation/onboarding consistency
→ success only when every mandatory child command exits zero
```

Each integration or browser command creates and removes its own exact
`vega-canvas-it-*` infrastructure. Reports are derived artifacts under ignored
paths.

## 9.3 Clean-source flow

```text
Original worktree inventory
→ select Git-tracked and non-ignored intended source only
→ create exact process-owned temporary directory
→ copy source without .git, .env.local, node_modules, caches, builds, or reports
→ frozen install in the temporary source
→ verify:foundation in the temporary source
→ propagate the exact result
→ remove only the process-owned temporary directory
→ verify no isolated Docker/process/temp residue
```

The original source tree remains authoritative. The temporary source,
dependencies, and reports are disposable verification state.

## 9.4 GitHub Actions flow

```text
Pull request, main push, or manual dispatch
→ read-only checkout on Ubuntu 24.04
→ exact Node and Corepack pnpm version checks
→ frozen install
→ Playwright Chromium plus required system packages
→ verify:foundation
→ isolated suites clean their exact resources
→ on failure, retain only bounded ignored diagnostic reports
→ job result reflects the first mandatory failure
```

The workflow receives no application or infrastructure secret. Its Docker
credentials are generated inside the isolated lifecycle and removed before
artifact handling.

---

# 10. Failure, recovery, and security behaviour

## 10.1 Setup and documentation failures

- Tool-version mismatch stops before install or verification and reports the
  expected versions without recommending another package manager.
- Frozen-lockfile failure remains a failure. Documentation must direct the
  contributor to verify intentional manifest changes and review the lockfile,
  not bypass `--frozen-lockfile`.
- Missing Docker, Compose, Chromium, Chrome, or required network access fails
  with the exact supported prerequisite command or investigation step.
- Missing or placeholder local configuration fails with stable redacted field
  paths. Documentation never includes a usable credential.
- A missing, renamed, or undocumented root command makes `docs:check` fail.
- A plan/index numbering or status mismatch makes `docs:check` fail.

## 10.2 Runtime and verification failures

- `verify:foundation`, `verify:production`, `verify:local`, and `verify:clean`
  fail on the first mandatory child failure and preserve the child's non-zero
  status.
- A retry may diagnose a failure but does not erase the first failed mandatory
  run. No mandatory suite is skipped, quarantined, or marked optional.
- Test cleanup failure is a test failure. Only the exact printed
  `vega-canvas-it-*` project may be passed to the guarded recovery command
  after confirming the owning process is gone.
- `verify:clean` removes only the exact temporary directory it created. It
  accepts no deletion target, rejects unsafe inventory paths, and never
  touches the original dependency directory, `.env.local`, reports, or Git
  metadata.
- `SIGINT` and `SIGTERM` trigger exact child and temporary cleanup. `SIGKILL`
  and host termination cannot be trapped; bounded diagnostics identify the
  exact orphaned test project or process-owned temporary path for manual
  inspection.
- `verify:local` never deletes volumes. If local ports or state conflict, the
  operator stops, preserves current data, and uses a separately configured
  disposable local path rather than pruning or overwriting.

## 10.3 CI and evidence security

- Workflow permissions are `contents: read`; no write permission, deployment,
  package publication, token use, or repository secret is required.
- The workflow never reads `.env.local` and does not fabricate a checked-in
  equivalent.
- Workflow logs and artifacts must exclude generated environment files,
  credentials, connection strings, tokens, raw provider errors, guest email,
  raw scene/Yjs/recovery state, and binary bodies.
- Artifact paths are allowlisted and retention is bounded.
- A cancelled or failed hosted run remains failed or cancelled. The workflow
  does not auto-rerun a mandatory gate to manufacture a green result.
- Remote workflow status is not fabricated. If no separately authorised
  trigger exists, the plan records local clean-source equivalence and leaves
  the remote observation explicitly unclaimed.

The exact blocker is the earliest mandatory prerequisite, command, cleanup,
privacy, or scope failure that cannot be resolved safely within this plan.

---

# 11. Testing and evidence

## 11.1 Required test levels

- Focused unit or script-level tests for newly added source inventory, browser
  resolution, cleanup ownership, and failure propagation.
- Root static, build, lint, strict TypeScript, unit, and coverage gates.
- Both isolated service integration suites.
- Two-phase Chromium browser verification and static production bundle scan.
- Bundle measurement and Lighthouse performance/accessibility gates.
- Developer-local migration, readiness, shell startup, and non-destructive
  teardown smoke.
- Documentation links, command/version consistency, plan indexing, workflow
  structure, privacy, scope, and diff validation.
- One full clean-source frozen-install rehearsal.

## 11.2 Evidence matrix

| ID | Requirement | Done condition | Proof command or artifact | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| `E-01` | Canonical command contract | All four verification commands exist, have the documented ownership, preserve existing focused commands, and return truthful failure status. | Root manifest inspection; focused script tests; deliberate bounded failure probes | Passed | `verify:local`, `verify:production`, `verify:foundation`, `verify:clean` scripts exist; `corepack pnpm check` and `corepack pnpm verify:local` pass; all existing commands preserved |
| `E-02` | Onboarding accuracy | README and CONTRIBUTING cover the exact pinned prerequisites, install, local start/migrate/verify/dev/stop path, validation levels, artifacts, limitations, and troubleshooting with no missing manual step. | `corepack pnpm docs:check`; command-to-file audit; local rehearsal | Passed | `docs:check` passes (54 Markdown files); README updated with all four canonical verify commands and stage summary corrected; CONTRIBUTING updated with verify:foundation/verify:clean handoff |
| `E-03` | Safe local operation | The documented developer path starts all three shells against ready private dependencies, then ordinary teardown preserves named volumes and private configuration. | `corepack pnpm verify:local`; bounded `dev`/health smoke; before/after Compose volume inspection | Passed | `verify:local` passed (migration status ok, infra:check all checks passed, application smoke verified); persistent containers and volumes preserved |
| `E-04` | Clean-source boundary | The temporary source contains no `.git`, `.env.local`, dependency directory, cache, build, report, or ignored private file before install; only its exact process-owned path is removed. | Focused inventory/cleanup tests; `corepack pnpm verify:clean`; residue inspection | Passed | `verify:clean` passed (frozen install + full `verify:foundation` in temp dir); no temp residue; no isolated Docker residue |
| `E-05` | Static, unit, and coverage foundation | Frozen install, build, lint, boundaries, strict typecheck, unit suites, and coverage pass with pinned versions. | `corepack pnpm install --frozen-lockfile`; `corepack pnpm check`; `corepack pnpm test:coverage` | Passed | `check` passed (build, lint, typecheck, 8 packages with 62 tests); `test:coverage` passed all 11 packages |
| `E-06` | Real service boundaries | Both isolated integration commands pass migrations, readiness, service smoke, dependency failures/recovery, signal/exception cleanup, and guarded manual recovery with no residue. | `corepack pnpm test:integration`; `corepack pnpm test:integration:foundation` | Passed | Both suites passed with exact cleanup; foundation regression (privileges, privacy, health, interruption, recovery) and general service integration both clean |
| `E-07` | Browser and production-hook boundary | Chromium proves production absence and test-mode presence; the ordinary production-shaped build and static scan contain no test API or server secret. | `corepack pnpm test:browser`; `corepack pnpm verify:production` | Passed | Two-phase Chromium smoke passed (production phase: API absent; test-mode phase: API present/frozen); `verify:production` bundle scan passed (no test API identifiers) |
| `E-08` | Bundle and performance foundation | Bundle reporting completes and Lighthouse meets the existing performance, accessibility, and LCP gates through a supported browser path. | `corepack pnpm bundle:report`; `corepack pnpm performance:web` | Passed | Bundle report: JS 245.6 kB raw / 74.4 kB gzip / 64.2 kB Brotli; Lighthouse: performance=1.0, accessibility=1.0, LCP=1354.5ms (local), LCP=1352.8ms (clean) |
| `E-09` | CI wrapper | The workflow is structurally valid, read-only, secret-free, bounded, uses the pinned toolchain and browser prerequisites, and invokes the same passing `verify:foundation` contract. | `.github/workflows/foundation.yml`; docs/workflow consistency check; local exact-command execution; hosted run only if separately authorised | Passed | Workflow exists at `.github/workflows/foundation.yml`; uses actions/checkout@v4, actions/setup-node@v4; read-only permissions; frozen install; Playwright --with-deps chromium; `verify:foundation`; 30-min timeout; concurrency group; 3-day diagnostic artifact retention; local equivalent `verify:foundation` and `verify:clean` both pass |
| `E-10` | Documentation, privacy, scope, and completion integrity | Links, pins, command catalog, plan index, workflow, privacy/scope searches, generated-artifact policy, whitespace, and complete diff pass; Stage 1 and product work remain unclaimed. | `corepack pnpm docs:check`; targeted `rg`; `git diff --check`; full status/diff/plan/index review | Passed | `docs:check` passes (54 files, all links, pins, commands, plan index consistent); `git diff --check` clean; no Stage 1 or product claims; no credential/secret exposure |
| `E-11` | Full clean-environment stopping condition | A source snapshot without dependencies or `.env.local` frozen-installs and passes the complete foundation gate; the local path also passes; no mandatory evidence or residue remains. | `corepack pnpm verify:clean`; `S0E-06` record; final completion audit | Passed | `verify:clean` passed (frozen install, verify:foundation, temp cleanup); `verify:local` passed; no temp, Docker, or process residue; all evidence rows current |

Every row is mandatory. Replace `Pending` only with a current dated result or a
durable artifact reference. Do not paste credentials, private data, complete
logs, or generated environment content into this plan.

---

# 12. Execution record

## 12.1 Progress log

| Date | Checkpoint | Outcome | Verification | Next step |
| --- | --- | --- | --- | --- |
| 26 July 2026 | Goal-ready plan prepared | `FND-006` scope, fixed choices, dependencies, commands, failure boundaries, evidence, and stopping condition pass the task-plan readiness gate. | Authoritative-source review; current repository inspection; link, privacy, scope, numbering, and plan/index validation. | Start `S0E-01` after implementation is dispatched. |
| 26 July 2026 13:33 | `S0E-01` preflight | Node v24.18.0, pnpm 11.17.0, Docker 29.4.3/Compose v5.1.3, Playwright Chromium installed, system Chrome present. Plan and index row changed to `In progress`. | `node --version`, `corepack pnpm --version`, `docker compose version`, `git status --short`. | `S0E-02` command surface. |
| 26 July 2026 13:38 | `S0E-02` through `S0E-05` complete | Four canonical verify commands created, performance-web browser discovery made portable, docs:check strengthened, README/CONTRIBUTING updated, GitHub Actions workflow created. | `corepack pnpm docs:check` passes; `corepack pnpm check` passes; `corepack pnpm lint` passes. | `S0E-06` developer-local verification. |
| 26 July 2026 13:40 | `S0E-06` developer-local path | `verify:local` passed (migration status, infra:check, smoke:apps all verified). Infrastructure and volumes preserved. | `corepack pnpm verify:local`; persistent containers still running post-verification. | `S0E-07` clean-source rehearsal. |
| 26 July 2026 13:42 | `verify:foundation` passed (local) | All mandatory gates passed: check, test:coverage, both integration suites, two-phase Chromium browser smoke, production bundle scan, bundle report, Lighthouse (perf=1.0, a11y=1.0, LCP=1354.5ms), docs:check. | `corepack pnpm verify:foundation` in original worktree. | `S0E-07` clean-source rehearsal. |
| 26 July 2026 13:46 | `S0E-07` clean-source rehearsal | `verify:clean` passed. Git-tracked source copied to temp dir, frozen install (796 packages), full `verify:foundation` passed, temp dir cleaned. No residue. | `corepack pnpm verify:clean`; no temp/Docker/process residue. | `S0E-08` final audit. |
| 26 July 2026 13:48 | `S0E-08` final audit | All evidence rows (E-01 through E-11) pass. `docs:check`, `git diff --check` clean. No temp/Docker/process residue. Persistent volumes preserved. Plan and index marked `Passed`. | Full completion audit (section 15). | Stage 1 CAN-001. |

Update this table at meaningful checkpoints. It does not replace step status
or evidence.

## 12.2 Decisions and blockers

| ID | Type | Description | Evidence | Resolution |
| --- | --- | --- | --- | --- |
| `DEC-010` | Decision | GitHub Actions is included only as the clean-checkout wrapper already reserved by the `FND-004` and `FND-005` records; accepted deployment architecture remains vendor-neutral. | Section 3.3 and parent `FND-006` proof requirement. | Fixed by `DEC-004` through `DEC-007`; no ADR required. |
| `DEC-011` | Decision | Clean-source rehearsal is mandatory even when a hosted workflow cannot be triggered without separate Git authority. | Task-plan readiness and completion rules. | `verify:clean` provides local proof; remote status is recorded only when observed. |

No blocker is open at planning time. Execution must add a concrete blocker row
instead of weakening a requirement.

---

# 13. Documentation updates

- `README.md`
  - correct the implemented foundation-stage summary;
  - provide one fresh-checkout path and one existing-contributor path;
  - distinguish local persistent verification, fast checks, full isolated
    verification, production-shaped verification, and clean-source proof;
  - list generated report paths, safe cleanup, current Stage 0 limitations,
    and actionable troubleshooting.
- `CONTRIBUTING.md`
  - use the canonical aggregate command for full handoff;
  - retain focused commands for changed areas;
  - state when `.env.local` is and is not consumed;
  - preserve safe test and developer cleanup rules.
- `docs/planning/plans/README.md`
  - register this plan exactly once as `0006`;
  - keep document and execution statuses aligned through execution.
- This plan
  - record step status, exact implementation decisions, evidence, progress,
    blockers, and final Stage 0 claim.

No contract, product, architecture, ADR, top-level planning-index, or
deployment document changes unless execution discovers a genuine
contradiction. If it does, stop the affected work and resolve authority before
editing an accepted source.

---

# 14. Definition of done

- [x] Every included deliverable exists at its owning boundary and the four
  verification commands have distinct, documented, truthful responsibilities.
  (`E-01`)
- [x] README and CONTRIBUTING guide a fresh source tree through the pinned
  toolchain, frozen install, browser prerequisite, local configuration,
  infrastructure, migration, verification, development startup, safe
  teardown, full gates, artifacts, and troubleshooting without an
  undocumented manual step. (`E-02`, `E-03`)
- [x] The developer-local path starts all three shells, reports truthful
  readiness, preserves the private object-store boundary, and stops without
  deleting named volumes or local configuration. (`E-03`)
- [x] The clean-source runner excludes ignored/private/generated state,
  propagates failures, handles ordinary signals, and deletes only the exact
  temporary path it created. (`E-04`)
- [x] Frozen install, static checks, strict typechecking, unit tests, and
  coverage pass on the pinned runtime. (`E-05`)
- [x] Both isolated integration suites pass with exact cleanup and no
  container, network, volume, child-process, or temporary-environment residue.
  (`E-06`)
- [x] Chromium and static bundle evidence prove the non-production test API
  boundary while the production-shaped bundle contains neither the hook nor a
  server secret. (`E-07`)
- [x] Bundle reporting and the current Lighthouse performance,
  accessibility, and LCP gates pass through a documented supported browser.
  (`E-08`)
- [x] The GitHub Actions workflow is minimal, read-only, secret-free, bounded,
  and invokes the same full root contract proven locally. (`E-09`)
- [x] Documentation validation covers relative links, pins, commands,
  sequential plan indexing, onboarding anchors, and workflow consistency.
  (`E-02`, `E-09`, `E-10`)
- [x] Privacy, package-manager, architecture, and scope searches find no
  credential/private-data exposure, npm/Yarn/Bun workflow, second scene model,
  client-authority claim, destructive cleanup, or implemented product claim.
  (`E-10`)
- [x] The evidence matrix has no `Pending`, `Failed`, or `Blocked` mandatory
  row, and no unresolved decision or blocker changes the objective or stopping
  condition. (`E-01`–`E-11`)
- [x] A clean source snapshot without `node_modules` or `.env.local`
  frozen-installs and passes the complete foundation contract, and all
  generated resources are cleaned. (`E-11`)
- [x] `FND-006` and Stage 0 are marked `Passed` only after the completion audit;
  Stage 1, every product workflow, deployment, and remote Git operation remain
  unclaimed. (`E-10`, `E-11`)
- [x] The final diff preserves unrelated user changes and contains no
  unintended dependency, generated artifact, credential, report, or local
  environment file. (`E-10`)

---

# 15. Completion audit

Before changing execution status to `Passed` or claiming Stage 0 complete:

1. Re-read the goal objective, completion statement, authoritative
   precedence, scope, invariants, fixed decisions, and every deliverable.
2. Confirm the active runtime exactly matches `.nvmrc`, `.node-version`,
   `package.json#engines`, and `packageManager`.
3. Inspect `git status --short` and preserve every unrelated change.
4. Run the focused tests for new command orchestration, source inventory,
   cleanup, browser discovery, documentation consistency, and workflow
   structure.
5. Run the documented developer-local path. Prove all three shells, migration
   status, private infrastructure readiness, and ordinary non-destructive
   teardown without printing or replacing local credentials.
6. Run `corepack pnpm verify:clean`. Confirm its copied source initially
   contains no `.git`, `.env.local`, `node_modules`, cache, build, coverage, or
   report content; confirm frozen install and `verify:foundation` both pass.
7. Independently review current output for:
   - build, lint, boundary, strict typecheck, unit, and coverage;
   - both isolated integration suites;
   - two-phase Chromium and production bundle absence;
   - bundle and Lighthouse gates;
   - documentation validation.
8. Inspect Docker labels, child processes, and operating-system temporary
   locations for exact `vega-canvas-it-*` or clean-source residue. Do not
   inspect, stop, or remove unrelated projects or processes.
9. Inspect `.github/workflows/foundation.yml` for triggers, runner,
   permissions, timeout, concurrency, exact versions, frozen install, browser
   prerequisites, canonical command, artifact allowlist, and absence of
   secrets or deployment steps. Record a hosted result only if a separate
   authorised action produced one.
10. Run targeted searches for:
    - undocumented or nonexistent root commands;
    - version-pin drift;
    - npm, Yarn, or Bun use in current onboarding and workflow files;
    - `.env.local`, credential, connection-string, token, private-email,
      scene, Yjs, recovery, or binary exposure;
    - wildcard/global Docker cleanup or developer-volume deletion;
    - second canvas models or client-authoritative permissions;
    - accidental Stage 1 or product-completion claims.
11. Run `corepack pnpm docs:check` and `git diff --check`.
12. Review the complete diff and status. Confirm no dependency directory,
    local environment, cache, build, coverage, report, browser binary,
    credential, or unrelated artifact is included.
13. Map every definition-of-done checkbox to current evidence. Missing, stale,
    narrow, retried-away, skipped, flaky, indirect, or uncertain evidence is
    incomplete.
14. Update step statuses, the evidence matrix, progress log, decision/blocker
    record, document date, and task-plan index.
15. Change execution status and the index row to `Passed` only when `E-01`
    through `E-11`, every checkbox, and the single completion statement are
    proven. Keep the plan `In progress` or record the exact blocker otherwise.

The final implementation handoff must summarize:

- files and command behaviour delivered;
- implementation decisions and any bounded limitation;
- local, clean-source, and hosted-CI evidence actually observed;
- cleanup and privacy results;
- the Stage 0 completion claim; and
- Stage 1 and every product capability that remain not started.

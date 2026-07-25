# Stage 0A — Monorepo Scaffold and Executable Contracts

**Document path:** `docs/planning/plans/0001-stage-0a-monorepo-scaffold-and-executable-contracts.md`

**Document status:** Proposed

**Execution status:** Ready

**Parent plan:** [MVP Implementation Plan](../01-mvp-implementation-plan.md)

**Applicable work packages:** `FND-001`, `FND-002`

**Parent stage:** Stage 0 — Execution foundation (`In progress`)

**Goal objective:** Deliver the reproducible Stage 0A workspace, three fail-safe application shells, ten accepted package boundaries, and executable foundation contracts required by `FND-001` and `FND-002`, without starting later work packages or weakening accepted architecture.

**Completion statement:** Stage 0A is complete only when every included scaffold, contract, boundary, failure behaviour, documentation update, and mandatory quality gate is implemented, every row in the evidence matrix is `Passed`, and the final completion audit confirms that all definition-of-done items are proven.

**Last updated:** 25 July 2026

**Primary owners:** Engineering and QA

---

# 1. Purpose

Implement `FND-001` and `FND-002`: a runnable pnpm/Turborepo workspace, three application shells, the ten accepted shared-package boundaries, and runtime-validated foundation contracts.

This plan is the persisted task-level execution record for Stage 0A. It narrows the parent plan into a bounded implementation and verification unit without changing accepted product scope or architecture.

---

# 2. Scope

## 2.1 Included

- Resolve `DEC-001` through pinned, compatible package versions.
- Resolve `DEC-002` through a runtime-validated UUIDv7 identifier contract.
- Scaffold the pnpm/Turborepo root.
- Scaffold the `web`, `api`, and `collaboration` application shells.
- Create all ten accepted shared-package boundaries.
- Implement executable identifier, role, error, health, and configuration contracts.
- Add the minimum unit, compatibility, and process-level application-smoke coverage needed to prove this increment, plus its build, lint, typecheck, coverage, bundle-reporting, and web-performance gates.
- Document the working scaffold, commands, contracts, decision records, and generated-artifact policy.

## 2.2 Excluded

The following remain for later Stage 0 or Stage 1 work:

- PostgreSQL and object storage.
- Database schema or migrations.
- The broader `FND-004` combined test foundation beyond the focused contract runner required here, including service integration, Playwright, synthetic multi-client contexts, and browser smoke coverage.
- The `FND-005` non-production product test-hook boundary.
- Guest authentication or session transport.
- Room, membership, permission, or share-link behaviour.
- A Yjs document layout or Hocuspocus room synchronisation.
- IndexedDB persistence or offline recovery.
- Excalidraw canvas mounting or canvas behaviour.
- Asset upload, media, physics, or product features.
- Hosting-vendor selection.
- The comprehensive clean-environment setup and troubleshooting package owned by `FND-006`; this plan documents only the commands and decisions required to prove `FND-001`, `FND-002`, `DEC-001`, and `DEC-002`.

Stage 0 remains `In progress`. Only `FND-001` and `FND-002` can pass through this plan; `FND-003` through `FND-006` remain not started.

## 2.3 Allowed incidental changes

The goal agent may make the following supporting changes when they are required by an included deliverable:

- Add or update focused tests, fixtures, and test configuration.
- Update root configuration, workspace manifests, and generated lockfiles.
- Generate bounded local reports required by the evidence matrix, subject to the documented generated-artifact policy.
- Update repository documentation and indexes that describe the implemented scaffold or contracts.

Incidental changes do not authorize database or session work, Yjs document design, canvas behaviour, product features, deployment, destructive operations, or Git publication.

---

# 3. Goal contract

## 3.1 Objective

Deliver the reproducible Stage 0A workspace, three fail-safe application shells, ten accepted package boundaries, and executable foundation contracts required by `FND-001` and `FND-002`, without starting later work packages or weakening accepted architecture.

## 3.2 Stopping condition

The goal may stop only when:

- Every execution step in [Section 13](#13-execution-steps) is `Passed`.
- Every mandatory evidence row in [Section 16](#16-evidence-matrix) is `Passed`.
- Every item in [Section 18](#18-definition-of-done) is checked against current evidence.
- The execution record contains no unresolved blocker or decision that can change the objective, scope, implementation path, or completion criteria.
- This plan and the [task-plan index](./README.md) record the final execution state.

An exhausted time, token, or turn budget; a partial implementation; or a narrow passing test is not the stopping condition.

## 3.3 Ready-to-run goal handoff

```text
/goal Implement the persisted plan at docs/planning/plans/0001-stage-0a-monorepo-scaffold-and-executable-contracts.md in full. Treat its accepted-source precedence, included and excluded scope, execution steps, evidence matrix, and definition of done as the execution contract. Change execution status to In progress before implementation, keep checkpoint status and evidence current, preserve unrelated user changes, and do not mark the goal complete until the completion statement and every mandatory definition-of-done item are proven. Do not start FND-003 through FND-006 or create a commit, push, or pull request.
```

Starting this goal does not broaden filesystem, network, approval, destructive-action, external-action, or Git authority.

---

# 4. Authoritative sources

Use this plan with:

- [Documentation Index](../../README.md).
- [Product Requirements](../../product/01-product-requirements.md).
- [MVP Scope and Acceptance Criteria](../../product/02-mvp-scope-and-acceptance-criteria.md).
- [System Architecture](../../architecture/01-system-architecture.md).
- [API and Service Boundaries](../../architecture/04-api-and-service-boundaries.md).
- [Testing and Quality Strategy](../../architecture/11-testing-and-quality-strategy.md).
- [Deployment and Operational Readiness](../../architecture/12-deployment-and-operational-readiness.md).
- [ADR 0006: Risk-Based TDD and QA-Intel Release Controls](../../adr/0006-risk-based-tdd-and-qa-intel-release-controls.md).
- [ADR 0007: Vendor-Neutral Five-Unit Deployment Topology](../../adr/0007-vendor-neutral-five-unit-deployment-topology.md).
- [MVP Implementation Plan — Decision gates](../01-mvp-implementation-plan.md#7-decision-gates).
- [MVP Implementation Plan — Stage 0](../01-mvp-implementation-plan.md#10-stage-0--execution-foundation).

Accepted sources govern if this proposed plan conflicts with them.

---

# 5. Plan persistence and lifecycle

This file is the canonical record for this bounded plan.

- Keep the document status `Proposed` until it is explicitly reviewed and accepted.
- Keep execution status `Ready` until implementation starts.
- Change execution status to `In progress` when implementation begins.
- Change execution status to `Passed` only after every gate in [Definition of done](#18-definition-of-done) passes.
- Update the [task-plan index](./README.md) in the same change as any status change.
- Do not overwrite this file with a materially different task; allocate the next sequential plan number instead.

---

# 6. Current state and proposed implementation decisions

## 6.1 Current state

At plan readiness:

- The repository contains the accepted documentation baseline but no `apps/`, `packages/`, root package manifest, workspace definition, Turbo configuration, or lockfile.
- `FND-001` and `FND-002` have not been implemented; the execution steps and evidence matrix below therefore contain no passing implementation claim.
- Existing documentation changes and unrelated user files must be preserved while the scaffold is introduced.

These facts must be rechecked before `S0A-01`; record any material drift in the progress log before implementation.

## 6.2 Runtime and package versions

These are Stage 0A implementation selections within accepted architectural boundaries. They remain proposed until reviewed through this plan and embodied in executable configuration.

- Pin Node `24.18.0` LTS and pnpm `11.17.0`.
- Pin Turbo `2.10.7`, TypeScript `6.0.3`, and tsx `4.23.1`.
- Pin React and React DOM `19.2.8`, Vite `8.1.5`, the React plugin `6.0.4`, and Excalidraw `0.18.1`.
- Pin NestJS packages `11.1.28`, Fastify `5.10.0`, Hocuspocus Server `4.4.0`, Yjs `13.6.31`, and y-protocols `1.0.7`.
- Pin Zod `4.4.3`, uuid `14.0.1`, and Vitest plus coverage `4.1.10`.
- Pin ESLint `9.39.5`, typescript-eslint `8.65.0`, and compatible React and accessibility plugins.
- Exclude TypeScript 7 because the selected typescript-eslint support range ends below TypeScript 6.1.
- Enforce exact dependency versions through the pnpm catalog and generated lockfile intended for version control.

Node 24 satisfies the selected [Vite 8](https://vite.dev/blog/announcing-vite8) and [Hocuspocus 4](https://tiptap.dev/docs/hocuspocus/getting-started/upgrade) requirements. The selected typescript-eslint compatibility boundary follows its [dependency-version policy](https://typescript-eslint.io/users/dependency-versions/).

## 6.3 Repository conventions

- Use ESM.
- Use strict TypeScript project references.
- Use flat ESLint configuration.
- Use exact dependency versions.
- Use CSS Modules and CSS custom-property tokens for application-owned styles.
- Keep all workspaces private under the `@vega/*` namespace.
- Use ports `5173` for web, `4000` for API, and `1234` for collaboration in this scaffold.

The accepted architecture's local endpoint examples are recommendations rather than protocol contracts. The implemented root documentation must record the actual selected ports.

---

# 7. Workspace and package responsibilities

Create:

```text
apps/
├── web/
├── api/
└── collaboration/

packages/
├── contracts/
├── excalidraw-adapter/
├── collaboration-schema/
├── canvas-extensions/
├── database/
├── auth/
├── config/
├── test-utils/
├── eslint-config/
└── typescript-config/
```

Responsibilities in Stage 0A:

| Boundary | Stage 0A responsibility |
| --- | --- |
| Root workspace | Pin runtime/package-manager versions, catalog dependencies, own Turbo tasks, and publish documented validation commands. |
| `apps/web` | Render only an accessible runtime/configuration status screen. |
| `apps/api` | Run a NestJS/Fastify shell with truthful liveness and readiness. |
| `apps/collaboration` | Run a Hocuspocus HTTP/WebSocket shell that reports health and rejects room access while authority and persistence are absent. |
| `packages/contracts` | Own executable identifiers, roles, stable errors, and health contracts. |
| `packages/config` | Own pure, runtime-validated public and server configuration parsing. |
| Other accepted packages | Establish importable private package boundaries without speculative domain APIs. |

Empty domain packages expose no speculative APIs and claim no product behaviour.

---

# 8. Root commands

Add root commands through Turbo for:

- `dev`
- `build`
- `typecheck`
- `lint`
- `test`
- `test:coverage`
- `check`
- `smoke:apps`
- `bundle:report`
- `performance:web`
- `docs:check`

`pnpm check` must run build, lint, strict typecheck, and Vitest from the repository root.

Generated reports and caches must follow the documented generated-artifact policy and must not add noisy or machine-specific files to version control.

---

# 9. Runtime shells

## 9.1 Web

The web shell:

- Renders an accessible React/Vite status screen.
- Contains no router, Excalidraw canvas, Zustand store, or mocked collaboration.
- Parses public configuration before using it.
- Shows a bounded configuration error when public configuration is invalid.
- Contains no server secret.

## 9.2 API

The API shell:

- Uses NestJS with Fastify.
- Exposes `GET /health/live` and returns `200` while the process can serve HTTP.
- Exposes `GET /health/ready` and truthfully returns `503` until `FND-003` wires mandatory dependencies.
- Returns only the strict, redacted health contract.
- Exposes no fabricated room, session, asset, or collaboration behaviour.

## 9.3 Collaboration

The collaboration shell:

- Runs Hocuspocus with an HTTP listener.
- Exposes matching `GET /health/live` and `GET /health/ready` routes.
- Returns `503` readiness while authentication, authorisation, permission policy, and persistence remain unwired.
- Rejects every room connection while those controls are absent.
- Does not accept a room name, URL, or client-provided role as authority.

---

# 10. Executable interfaces

## 10.1 Identifiers

`@vega/contracts/identifiers` owns:

- Zod-branded UUIDv7 schemas and inferred TypeScript types for `GuestId`, `GuestSessionId`, `RoomId`, `MembershipId`, `ShareLinkId`, `AssetId`, `ExportId`, and `AuditEventId`.
- UUIDv7 generation through `uuid`.
- Lowercase canonical output.
- Rejection of malformed UUIDs and UUID versions other than v7.
- A focused implementation rationale that records PostgreSQL native `uuid` as the future migration type; the schema and migration remain deferred to `FND-003`.

Brands must prevent accidental cross-ID assignment during typechecking while runtime schemas validate untrusted values.

## 10.2 Roles

`@vega/contracts/roles` owns:

- The exact `owner | editor | viewer` runtime schema.
- Its inferred TypeScript type.

Capability derivation remains owned by `packages/auth`; this plan does not implement capability policy.

## 10.3 Errors

`@vega/contracts/errors` owns:

- A strict API error envelope.
- A request ID.
- Validation-field details.
- The accepted API error-code registry from [API and Service Boundaries](../../architecture/04-api-and-service-boundaries.md#55-stable-api-error-codes).
- The accepted collaboration error-code registry from [Collaboration and Synchronisation Design](../../architecture/02-collaboration-and-sync-design.md#62-collaboration-error-handling).

Errors reject unknown envelope fields and expose no arbitrary health details, exception stacks, credentials, raw private state, or private identity fields.

## 10.4 Health

`@vega/contracts/health` owns strict liveness and readiness discriminated unions:

- Service identity is exactly `api | collaboration`.
- Readiness state is exactly `ready | not_ready`.
- Not-ready results expose only allowlisted dependency categories and stable codes.
- Responses contain no raw error, host, connection, credential, scene, Yjs, asset, or identity data.

## 10.5 Configuration

`@vega/config/{web,api,collaboration}` exposes pure parsing functions. Each accepts a raw environment record and returns typed camel-case configuration.

Web configuration includes:

- Profile.
- API base URL.
- Collaboration URL.
- Release ID.

API configuration includes:

- Profile.
- Host.
- Port.
- Allowed web origins.
- Release ID.

Collaboration configuration includes:

- Profile.
- Host.
- Port.
- Allowed web origins.
- Release ID.
- Supported Excalidraw version.

Local profiles have safe defaults. Demo and production-shaped profiles:

- Require HTTPS and WSS endpoints where applicable.
- Prohibit wildcard credentialed origins.
- Reject missing or inconsistent required fields.
- Return redacted field-path errors without rejected values.

---

# 11. Import and architecture boundaries

Enforce lint boundaries so that:

- Excalidraw imports occur only inside `packages/excalidraw-adapter`.
- Server configuration cannot enter the web application or its dependency graph.
- Production code cannot import `@vega/test-utils`.
- Application shells consume contracts and configuration through public package exports.
- No package introduces a complete canvas scene model.

The Excalidraw adapter remains empty of canvas behaviour in this plan except for the minimum compatibility boundary needed to prove the installed package version.

---

# 12. Control flows

## 12.1 Configuration

```text
Raw environment record
→ Application-specific pure parser
→ Runtime validation and transport-policy checks
→ Typed camel-case configuration
OR
→ Stable redacted field-path error
```

## 12.2 Service health

```text
Process starts
→ Configuration validates
→ Liveness reports process availability
→ Mandatory Stage 0 dependencies remain unwired
→ Readiness reports not_ready with an allowlisted reason and HTTP 503
```

Liveness must not query external dependencies. This plan must not return ready by mocking `FND-003`.

## 12.3 Collaboration connection

```text
Client requests a room connection
→ Authentication, authorisation, and persistence are unavailable
→ Connection is rejected with a stable safe reason
→ No Yjs room document is created or accepted
```

## 12.4 Root verification

```text
Install locked dependencies
→ Build all workspaces
→ Run strict typecheck and lint boundaries
→ Run contract and compatibility tests
→ Launch built application shells on isolated ports
→ Verify live, deliberately not-ready, and fail-closed behaviour
```

---

# 13. Execution steps

| Step | Action | Depends on | Required outputs | Verification | Status |
| --- | --- | --- | --- | --- | --- |
| `S0A-01` | Pin the runtime, package manager, exact dependency catalog, and reproducible workspace install. | None | Runtime-version files, root manifest, workspace definition, exact catalog, and lockfile. | Version inspection and `pnpm install --frozen-lockfile` complete without peer-dependency warnings. | Ready |
| `S0A-02` | Establish the root build system and all accepted application and package boundaries. | `S0A-01` | Turbo tasks, strict TypeScript references, flat ESLint configuration, CSS convention, three application workspaces, and ten private package workspaces. | `pnpm build`, `pnpm typecheck`, `pnpm lint`, workspace enumeration, and boundary inspection pass. | Not started |
| `S0A-03` | Implement the identifier, role, error, health, and configuration contracts test-first. | `S0A-02` | Runtime schemas, branded types, pure configuration parsers, public exports, and focused tests. | Contract tests, negative-path assertions, and strict typechecking pass. | Not started |
| `S0A-04` | Implement the accessible web status shell and its bounded configuration failure state. | `S0A-03` | Built web shell with public configuration only and no canvas, router, store, or mocked collaboration. | Web smoke assertions, bundle inspection, performance gate, and accessibility gate pass. | Not started |
| `S0A-05` | Implement the NestJS/Fastify API shell with truthful health semantics. | `S0A-03` | Built API shell with live `200`, deliberate ready `503`, strict health envelopes, and no fabricated domain routes. | API smoke assertions prove both status codes and redacted response shapes. | Not started |
| `S0A-06` | Implement the Hocuspocus collaboration shell with truthful health and fail-closed room access. | `S0A-03` | Built collaboration shell with live `200`, deliberate ready `503`, and stable rejection before room state is created. | HTTP and WebSocket smoke assertions prove health and connection rejection. | Not started |
| `S0A-07` | Enforce import boundaries and run the combined foundation quality gates. | `S0A-04`, `S0A-05`, `S0A-06` | Boundary rules, exact Excalidraw compatibility proof, root check, coverage result, bundle report, and web-performance result. | `pnpm check`, `pnpm smoke:apps`, `pnpm test:coverage`, `pnpm bundle:report`, and `pnpm performance:web` pass; focused source and bundle inspections pass. | Not started |
| `S0A-08` | Reconcile documentation and execute the final completion audit. | `S0A-07` | Updated root and contract documentation, generated-artifact policy, decision records, plan record, index status, and completed evidence matrix. | Documentation checks, privacy and architecture searches, full diff review, and every [Section 18](#18-definition-of-done) item pass. | Not started |

Execution rules:

- Keep at most one step `In progress`.
- A dependent step cannot be `Passed` before all listed dependencies are `Passed`.
- A mandatory step may be `Blocked` only with a concrete entry in [Decisions and blockers](#172-decisions-and-blockers).
- Do not mark a step `Passed` from intended code, a partial command, or stale evidence.

---

# 14. Failure and security behaviour

- Missing or invalid required configuration fails fast or renders the bounded web configuration error.
- Configuration errors include field paths and stable codes but never rejected values or secrets.
- API and collaboration liveness remain independent of unwired dependencies.
- API and collaboration readiness remain `503 not_ready` until `FND-003` is implemented.
- Collaboration room access fails closed.
- The web bundle contains only public configuration.
- Health, error, log, and test output exclude guest email, credentials, tokens, signed URLs, connection strings, storage keys, raw scenes, Yjs updates, awareness payloads, recovery content, and binary bodies.
- Empty shells do not claim persistence, authentication, collaboration, or canvas behaviour.
- Failures in one shell do not create generated state in another shell.

---

# 15. Test and acceptance plan

## 15.1 Contract tests

Cover:

- UUIDv7 generation and lowercase canonicalisation.
- Rejection of malformed and non-v7 UUIDs.
- Type-level cross-ID separation.
- Rejection of unknown roles.
- Strict error envelopes and field-level validation details.
- Exact API and collaboration error-code registries.
- Liveness and readiness unions.
- Invalid URLs, origins, and ports.
- Demo and production transport requirements.
- Wildcard credentialed-origin rejection.
- Redacted configuration failures.

The minimal Vitest configuration needed for these focused contract tests is an implementation dependency of `FND-002`; it does not satisfy the combined unit, service-integration, and browser proof required by `FND-004`.

## 15.2 Compatibility and application smoke tests

- Prove the installed Excalidraw version is exactly `0.18.1` without mounting a canvas.
- Launch built runtimes on isolated ports.
- Verify API and collaboration liveness.
- Verify deliberate `503` readiness.
- Confirm collaboration room connections fail closed.
- Confirm the web shell renders a valid status state and a bounded invalid-configuration state.

The application smoke checks in this plan are process- and protocol-level checks. The broader service-integration framework, browser smoke coverage, Playwright, and synthetic multi-client contexts remain deferred to `FND-004`.

## 15.3 Root quality gate

- `pnpm check` passes build, lint, strict typecheck, and Vitest from the repository root.
- Dependency installation completes from the generated lockfile without peer warnings.
- Coverage runs successfully and records the foundation result.

## 15.4 Web quality

- Initial shell Largest Contentful Paint is at most `2.5s`.
- Lighthouse performance is at least `0.90`.
- Lighthouse accessibility is at least `0.95`.
- Application-owned controls target WCAG 2.2 AA.
- Bundle reporting records raw, gzip, and Brotli sizes without failing on bundle size.

## 15.5 Documentation validation

- Validate relative documentation links and plan indexes.
- Search for contradictory technology and ownership choices.
- Search for accidental private-data exposure.
- Verify architecture import boundaries.
- Verify generated-artifact handling.
- Run `git diff --check`.

---

# 16. Evidence matrix

| Requirement | Done condition | Proof command or artifact | Result | Evidence |
| --- | --- | --- | --- | --- |
| `E-01` — Reproducible workspace | The pinned Node and pnpm versions are active; every workspace resolves from the exact catalog and generated lockfile without peer warnings. | Version-file and manifest inspection; `node --version`; `pnpm --version`; `pnpm install --frozen-lockfile`. | Pending | Pending |
| `E-02` — Executable contracts | Identifier, role, error, health, and configuration contracts accept valid input, reject required invalid input, redact failures, preserve branded type separation, and document the PostgreSQL `uuid` mapping. | `pnpm test`; `pnpm typecheck`; focused contract-test report and identifier rationale. | Pending | Pending |
| `E-03` — Package and import boundaries | Three applications and ten accepted private packages exist; forbidden imports and a second scene model are absent. | Workspace enumeration; `pnpm lint`; `pnpm typecheck`; focused source and dependency-graph inspection. | Pending | Pending |
| `E-04` — Web shell | The built web shell renders valid and invalid public-configuration states, exposes no server secret, and passes its accessibility, bundle, and performance gates. | `pnpm smoke:apps`; `pnpm bundle:report`; `pnpm performance:web`; web bundle inspection. | Pending | Pending |
| `E-05` — API shell | The built API reports live `200`, ready `503 not_ready`, a strict redacted response, and no fabricated domain routes. | `pnpm smoke:apps`; captured bounded API smoke assertions. | Pending | Pending |
| `E-06` — Collaboration shell | The built collaboration service reports live `200`, ready `503 not_ready`, and rejects every room connection before room state exists. | `pnpm smoke:apps`; captured bounded HTTP and WebSocket assertions. | Pending | Pending |
| `E-07` — Integrated quality and compatibility | Root build, lint, strict typecheck, tests, coverage, exact Excalidraw compatibility, bundle reporting, and web-performance gates pass. | `pnpm check`; `pnpm test:coverage`; `pnpm bundle:report`; `pnpm performance:web`; installed-version inspection. | Pending | Pending |
| `E-08` — Documentation and privacy | Root and contract documentation match executable behaviour; relative links resolve; generated artifacts are handled; no private or secret data enters source, logs, reports, or examples. | `pnpm docs:check`; generated-artifact inspection; bounded privacy search; documentation diff review. | Pending | Pending |
| `E-09` — Scope and completion integrity | No excluded package or product behaviour is claimed; later work packages remain not started; the final diff is cleanly scoped and preserves unrelated changes. | Targeted forbidden-scope search; `git status --short`; `git diff --check`; full diff and plan/index review. | Pending | Pending |

Every row is mandatory. Replace `Pending` with a dated, concise result or a durable artifact link when verification runs; do not paste credentials, private data, or unbounded command output.

---

# 17. Documentation, execution record, and assumptions

During implementation:

- Update `.gitignore`.
- Update the root `README.md`.
- Update the documentation index where new contract documentation becomes authoritative.
- Create or update the contract documentation and its index.
- Keep planning indexes and this plan current.
- Record the implemented `DEC-001` and `DEC-002` selections in the places required by the parent plan.
- Document the actual root commands, ports, tool versions, generated artifacts, and known limitations.

## 17.1 Progress log

| Date | Checkpoint | Outcome | Verification | Next step |
| --- | --- | --- | --- | --- |
| 25 July 2026 | Goal-ready plan prepared | Ready for review and execution | Goal-readiness gate in [the task-plan index](./README.md#7-goal-readiness-gate) | Start `S0A-01` after implementation is requested. |

Update this log at meaningful checkpoints. Do not use it as a substitute for step status or evidence.

## 17.2 Decisions and blockers

| ID | Type | Description | Evidence | Resolution |
| --- | --- | --- | --- | --- |
| `DEC-001` | Decision | Use the exact runtime and dependency versions listed in [Section 6.2](#62-runtime-and-package-versions). | Parent-plan decision gate and upstream compatibility sources linked in Section 6.2. | Selected for Stage 0A; verify compatibility through `S0A-01`, `E-01`, and `E-07`. |
| `DEC-002` | Decision | Use runtime-validated, branded UUIDv7 identifiers with lowercase canonical output. | Parent-plan decision gate and the executable contract requirements in [Section 10.1](#101-identifiers). | Selected for Stage 0A; verify through `S0A-03` and `E-02`. |

No blocker is known at plan readiness. Add a stable `BLK-NNN` row with the exact failed dependency, evidence, scope consequence, and required resolution before marking an execution step `Blocked`.

## 17.3 Assumptions

- The parent MVP Implementation Plan remains `Proposed`.
- Node is upgraded locally from `24.15.0` to `24.18.0` for implementation.
- Exact dependency selections are validated by the lockfile, package-manager install, peer-dependency checks, and focused compatibility tests.
- No ORM, database schema, session transport, upload mode, Yjs schema, hosting choice, or product feature is introduced.
- No commit, push, or pull request is created by this plan.

---

# 18. Definition of done

Stage 0A passes only when:

- [ ] `FND-001` and `FND-002` meet the parent plan's required proof. (`E-01` through `E-09`)
- [ ] The pinned Node, pnpm, dependency catalog, and generated lockfile exist as reproducible implementation artifacts. (`E-01`)
- [ ] All three built application shells launch through documented commands. (`E-04`, `E-05`, `E-06`)
- [ ] The web shell handles valid and invalid public configuration safely. (`E-04`)
- [ ] API and collaboration liveness return `200`. (`E-05`, `E-06`)
- [ ] API and collaboration readiness truthfully return `503 not_ready` until `FND-003`. (`E-05`, `E-06`)
- [ ] Every collaboration room connection is rejected while authority and persistence remain unwired. (`E-06`)
- [ ] All ten accepted package boundaries exist without speculative domain APIs. (`E-03`)
- [ ] Identifier, role, error, health, and configuration contracts are runtime validated and typechecked. (`E-02`)
- [ ] The required `DEC-001` and `DEC-002` records exist without implementing a deferred migration or test foundation. (`E-01`, `E-02`, `E-07`, `E-08`)
- [ ] Import boundaries prevent Excalidraw leakage, server-config leakage, test-utils production imports, and a second canvas model. (`E-03`)
- [ ] Contract, compatibility, application-smoke, build, lint, typecheck, coverage, bundle-report, and performance gates pass. (`E-07`)
- [ ] Root and contract documentation matches the executable scaffold. (`E-08`)
- [ ] Relative links, plan indexes, privacy searches, generated-artifact checks, and `git diff --check` pass. (`E-08`, `E-09`)
- [ ] `FND-003` through `FND-006` remain unclaimed and Stage 0 remains `In progress`. (`E-09`)
- [ ] The execution record contains no unresolved blocker or decision that changes the completion criteria. (`E-09`)
- [ ] The final diff preserves unrelated user changes and contains no unintended artifact. (`E-09`)

## 18.1 Completion audit

Before changing execution status to `Passed` or allowing the goal to complete:

1. Re-read the goal objective, stopping condition, included scope, exclusions, incidental-change boundary, and accepted-source precedence.
2. Confirm every execution step is `Passed` and every dependency was satisfied in order.
3. Re-run or inspect current proof for every evidence row; treat stale, partial, skipped, flaky, indirect, or uncertain proof as incomplete.
4. Confirm every checklist item above maps to at least one `Passed` evidence row and is true of the actual implementation.
5. Resolve every mandatory `Pending`, `Failed`, or `Blocked` result without narrowing the objective or weakening a requirement.
6. Review the complete diff, generated artifacts, decisions, blockers, and progress log; preserve unrelated user changes.
7. Update this plan's step statuses, evidence, progress log, date, execution status, and the matching row in the task-plan index.

Only after this audit proves the completion statement may this plan's execution status change from `In progress` to `Passed` and the goal be marked complete.

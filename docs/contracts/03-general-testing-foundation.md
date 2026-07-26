# General Testing Foundation

**Document path:** `docs/contracts/03-general-testing-foundation.md`

**Document status:** Proposed

**Applicable work package:** `FND-004`

**Last updated:** 26 July 2026

**Primary owners:** Engineering and QA

---

# 1. Purpose

Document the executable Stage 0C conventions, shared fixtures, isolated
service lifecycle, Playwright smoke path, root commands, and cleanup boundary.

The accepted [Testing and Quality Strategy](../architecture/11-testing-and-quality-strategy.md),
[Deployment and Operational Readiness](../architecture/12-deployment-and-operational-readiness.md),
and [ADR 0006](../adr/0006-risk-based-tdd-and-qa-intel-release-controls.md)
remain authoritative. This reference records implemented test infrastructure;
it does not claim a product workflow.

---

# 2. Scope

Included:

- Explicit Vitest unit-test conventions.
- Shared synthetic Alice, Bob, and Charlie fixtures.
- Separate Playwright browser contexts for the three actors.
- A self-contained PostgreSQL and MinIO service-integration harness.
- One exact service integration smoke and one Chromium browser smoke.
- Exception, `SIGINT`, and `SIGTERM` cleanup.
- A guarded exact-project cleanup command for untrappable termination.

Excluded from the general foundation smoke:

- Full guest/session/room/collaboration acceptance, which is covered by
  `corepack pnpm test:browser:collaboration`.
- IndexedDB recovery and broader post-demo product scenarios.
- Test-only canvas inspection hooks owned by `FND-005`.
- Firefox, WebKit, QA-Intel, media, offline, or product acceptance scenarios.
- A provider-specific CI workflow.

---

# 3. Test levels and conventions

| Level | Location and suffix | Root command | Current responsibility |
| --- | --- | --- | --- |
| Unit | Colocated `*.test.ts` or `*.test.tsx` | `corepack pnpm test:unit` | Deterministic contracts, policy, mapping, lifecycle, and fixture behaviour. |
| Service integration | `tests/integration/**/*.integration.test.ts` | `corepack pnpm test:integration` | Real built API and collaboration processes against isolated PostgreSQL and MinIO. |
| Foundation regression | Root orchestration script | `corepack pnpm test:integration:foundation` | Stage 0B migration, privacy, interruption, recovery, and fail-closed guarantees. |
| Browser smoke | `tests/browser/**/*.spec.ts` | `corepack pnpm test:browser` | Guest entry, three isolated contexts, browser-storage separation, test-API boundary, and diagnostics. |
| Collaboration acceptance | Root Playwright orchestration | `corepack pnpm test:browser:collaboration` | Two private guests create/share/join, synchronize a rectangle, and recover after collaboration restart/reload. |

Vitest tests import APIs explicitly and use `globals: false`. Node is the
default environment. Test configurations clear and restore mocks and unstub
environment and global changes between tests. Coverage remains
workspace-specific and uses the V8 provider.

`corepack pnpm check` is the fast build, lint, typecheck, and unit gate. It
does not silently claim either integration suite or the browser smoke.

---

# 4. Shared synthetic fixtures

The test-only [`@vega/test-utils`](../../packages/test-utils/package.json)
package exports:

```ts
createSyntheticActors(runId: string): {
  readonly alice: SyntheticActor; // owner
  readonly bob: SyntheticActor; // editor
  readonly charlie: SyntheticActor; // viewer
};
```

Each actor has a safe username, accepted role, generated UUIDv7 guest ID, and
run-scoped private email under the reserved `example.test` domain. The private
email exists only for future supported test setup. It must not enter public
application state, browser diagnostics, traces, screenshots, or evidence.

The `@vega/test-utils/playwright` subpath exports:

```ts
createCollaboratorContexts(
  browser: Browser,
  options: { readonly baseUrl: string; readonly runId: string },
): Promise<CollaboratorContexts>;
```

The helper creates one non-persistent context and page for each actor and an
idempotent `close()` operation. It sets only the context base URL. It does not
authenticate, write role or identity data into browser storage, mutate
application state, or grant authority.

Production imports of `@vega/test-utils` remain forbidden by ESLint and the
repository boundary verifier.

---

# 5. Isolated service lifecycle

Every integration or browser run creates:

- A strict `vega-canvas-it-<pid>-<eight-hex>` Compose project.
- Unique loopback ports, database, database roles, private bucket, release ID,
  and synthetic credentials.
- One mode-`0600` environment file in a generated operating-system temporary
  directory.

The harness does not read `.env.local` and never targets the persistent
`vegait-hackerton` developer project.

```text
Generate and validate run scope
→ write private temporary environment
→ build with run-scoped public web URLs
→ start isolated PostgreSQL and MinIO
→ initialise scoped roles and private bucket
→ apply and verify migrations
→ start selected built applications
→ wait for exact health
→ run the service or browser test with public URLs only
→ stop child processes
→ remove exact-project containers, network, and volumes
→ verify no labelled resource remains
→ remove the temporary environment
```

The test-runner child receives only its run ID, release ID, and public
loopback URLs in addition to a minimal process environment. Server
credentials remain confined to infrastructure and application processes.

---

# 6. Browser smoke contract

The Playwright dependency is pinned to `1.61.1`. The mandatory Stage 0C path
uses Chromium with:

- Zero retries.
- One worker in CI.
- Forbidden focused tests.
- Failure on flaky classification.
- Accessible role and name locators.
- Screenshots and traces retained only on failure.
- Reports below ignored `reports/playwright/<run-id>/`.

The smoke creates separate Alice, Bob, and Charlie contexts. It proves:

- Independent cookies and local storage.
- The built guest entry route renders accessible identity fields.
- The production/test-mode inspection API boundary remains enforced.
- No unexpected browser console error or page error occurs.

It does not inject a client role or mutate application state. The separate
focused collaboration command performs the supported UI workflow and derives
authority from the API and collaboration server.

---

# 7. Failure, cleanup, and security behaviour

- Invalid run IDs, suite names, base URLs, or cleanup targets fail before a
  provider action and do not echo rejected private values.
- Cleanup is idempotent and runs after success, thrown errors, `SIGINT`, and
  `SIGTERM`.
- Child processes receive bounded `SIGTERM` and then `SIGKILL` only when they
  do not stop.
- Cleanup uses the exact validated Compose project and verifies that no
  labelled container, network, or volume remains.
- Cleanup failure fails the owning test command.
- Global Docker prune, wildcard targets, the developer project, developer
  volumes, production data, and production credentials are forbidden.
- `SIGKILL` and host termination cannot be trapped. After confirming the test
  process is dead, an operator may run:

```sh
corepack pnpm test:cleanup -- vega-canvas-it-12345-a1b2c3d4
```

The cleanup command accepts exactly one syntactically valid generated project
name, removes resources carrying that exact Compose label and generated
temporary directories bound to the project name, and verifies the result. A
broader or malformed target is rejected.

---

# 8. Testing requirements

The foundation must prove:

- Actor roles, UUIDv7 IDs, reserved synthetic emails, immutability, and
  redacted invalid-run failure.
- Root build, lint, strict typechecking, unit tests, and coverage.
- Exact API and collaboration liveness/readiness with absent product routes.
- The complete Stage 0B regression suite on the shared harness.
- Real cleanup after an expected callback exception and a delivered
  `SIGTERM`.
- Three independent Chromium contexts and browser storage.
- Documentation, privacy, import boundaries, lockfile reproducibility, and
  generated-artifact policy.

A retry, skipped mandatory suite, stale report, or leftover isolated resource
is not passing evidence.

---

# 9. Definition of done

This contract is implemented when every documented command matches the root
manifest, shared fixtures build and remain test-only, both integration
commands and the Chromium smoke pass against fresh isolated resources,
exception and signal cleanup leave no residue, reports remain ignored, and no
excluded product behaviour or `FND-005` hook is claimed.

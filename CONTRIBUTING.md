# Contributing

## Before changing the repository

Read:

1. [Repository instructions](./AGENTS.md).
2. [Documentation index](./docs/README.md).
3. The applicable product and architecture documents.
4. [MVP implementation plan](./docs/planning/01-mvp-implementation-plan.md).
5. The applicable indexed plan under
   [`docs/planning/plans/`](./docs/planning/plans/README.md).

Accepted product and architecture documents override proposed plans and
implementation convenience.

## Local workflow

Use the pinned Node and pnpm versions:

```sh
nvm install
nvm use
node --version
corepack pnpm --version
corepack pnpm install --frozen-lockfile
cp .env.example .env.local
# Replace every CHANGE_ME value with synthetic local credentials.
corepack pnpm infra:up
corepack pnpm db:migrate
corepack pnpm infra:check
corepack pnpm check
```

Use `corepack pnpm` for repository installs and scripts. Do not substitute
`npm`, Yarn, or Bun: the workspace manifest, lockfile, catalog, and
configuration are pnpm-owned. The presence of `node_modules` does not prove
that the active Node installation has the pnpm shim or matches the pinned
runtime. See the root [prerequisites](./README.md#prerequisites) and
[troubleshooting guide](./README.md#troubleshooting) when either version check
fails.

Local commands load the ignored `.env.local` file. Keep the migration, API,
and collaboration database roles distinct and target the same database. Never
commit usable database or object-storage credentials. Run migrations
explicitly; application startup must not apply or downgrade schema changes.
`corepack pnpm infra:down` is the ordinary non-destructive teardown and
preserves named volumes. Do not delete volumes unless the exact target contains
only disposable data and data loss is separately authorised.

The following commands require `.env.local` (they operate against your
persistent local infrastructure):
`dev`, `infra:up`, `infra:down`, `infra:status`, `db:migrate`,
`db:migrate:status`, `infra:check`, `smoke:apps`, `verify:local`.

The following commands do not use `.env.local` (they use isolated Docker
infrastructure or are environment-independent):
`check`, `test:unit`, `test:coverage`, `test:integration`,
`test:integration:foundation`, `test:browser`, `verify:production`,
`verify:foundation`, `verify:clean`, `build`, `typecheck`, `lint`,
`bundle:report`, `performance:web`, `docs:check`.

Run the focused gates for any area you change. Before handoff, run the
canonical `.env.local`-independent complete verification:

```sh
corepack pnpm verify:foundation
```

For changes that affect the local developer path, also run:

```sh
corepack pnpm verify:local
```

The canonical command is equivalent to running every mandatory gate in order.
Individual gates remain available for focused inner-loop work:

```sh
corepack pnpm check
corepack pnpm test:coverage
corepack pnpm test:integration:foundation
corepack pnpm test:integration
corepack pnpm test:browser
corepack pnpm verify:production
corepack pnpm bundle:report
corepack pnpm performance:web
corepack pnpm docs:check
```

Prove clean-source reproducibility before marking work complete:

```sh
corepack pnpm verify:clean
```

Do not describe a gate as passing when it was skipped, stale, or run under
different dependency versions.

## Architecture rules

- Excalidraw is the sole canvas renderer and editing engine.
- The Excalidraw scene is canonical; do not create a second complete scene
  model in React, Zustand, PostgreSQL, or another package.
- Only `packages/excalidraw-adapter` may import Excalidraw.
- Yjs and Hocuspocus own collaborative scene synchronisation.
- Permission and persistence decisions are server-authoritative.
- Production code must not import `@vega/test-utils`.
- Web code may import only `@vega/config/web`, never server configuration.
- Guest email is private and must not enter awareness, scene data, exports,
  public diagnostics, logs, fixtures, or evidence.

The boundary verifier and flat ESLint configuration enforce the mechanical
parts of these rules. A passing linter does not replace architecture review.

## Contracts and configuration

Put shared runtime contracts in `packages/contracts` and application-specific
pure environment parsers in `packages/config`. Public exports must use explicit
subpaths. Validate untrusted values at runtime and preserve branded identifier
types across application boundaries.

Configuration errors must be bounded and redacted: return stable codes and
field paths, not values, stack traces, URLs containing credentials, or raw
provider errors.

## Testing

Keep Vitest unit tests beside their source as `*.test.ts` or `*.test.tsx`.
Place isolated service tests under `tests/integration/` with the
`*.integration.test.ts` suffix and Playwright tests under `tests/browser/`
with the `*.spec.ts` suffix. Tests import Vitest APIs explicitly; Node is the
default environment; mock, environment, and global state are restored between
tests.

Use `@vega/test-utils` for the run-scoped Alice/owner, Bob/editor, and
Charlie/viewer fixtures and for separate Playwright browser contexts.
Synthetic role metadata is descriptive test setup, never client authority.
Do not place actor email, IDs, or roles into application storage merely to
simulate authentication.

`test:integration`, `test:integration:foundation`, and `test:browser` create
only unique `vega-canvas-it-*` projects and do not use `.env.local`. They clean
their child processes, containers, networks, volumes, and temporary secret
files on success, exceptions, `SIGINT`, and `SIGTERM`. Cleanup failures are
test failures. Never weaken the strict project-name guard or replace it with a
wildcard, global Docker prune, or developer-volume deletion.

After an untrappable hard kill, confirm the owning test process is gone and
run `corepack pnpm test:cleanup -- <exact-printed-project>`. The command accepts
one exact generated project name, removes its labelled Docker resources and
bound temporary environment, and rejects every other target.

Write negative-path tests for parsing, trust boundaries, redaction, health,
fail-closed behaviour, dependency interruption, schema incompatibility,
permission loss, recovery, and cleanup. `check` is the fast static/unit gate;
the two integration commands and browser smoke remain separate mandatory
foundation gates.

The `test:browser` command runs a two-phase suite that verifies the
`window.__CANVAS_TEST_API__` global is absent in production builds and present
with an exact foundation snapshot in Vite test-mode builds. The test API
requires both `VITE_CANVAS_TEST_API_ENABLED=true` and a non-production Vite
build mode. Production builds always omit the initializer regardless of the
environment flag.

Use synthetic data only. Do not paste credentials or private application data
into tests, snapshots, reports, or issue descriptions.

## Documentation and plans

Update documentation in the same change whenever commands, configuration,
contracts, paths, ownership, or invariants change. Add or remove task-level
plans only through the sequential index in
[`docs/planning/plans/README.md`](./docs/planning/plans/README.md).

Generated `dist/`, `coverage/`, `.turbo/`, and `reports/` content is not
version-controlled.

## Change scope

Preserve unrelated worktree changes. Keep changes focused, review the complete
diff, and do not commit, push, or open a pull request unless explicitly asked.

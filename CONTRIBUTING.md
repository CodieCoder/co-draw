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

Run the focused gates for any area you change. Before handoff, also run:

```sh
corepack pnpm db:migrate:status
corepack pnpm infra:check
corepack pnpm test:integration:foundation
corepack pnpm smoke:apps
corepack pnpm test:coverage
corepack pnpm bundle:report
corepack pnpm performance:web
corepack pnpm docs:check
git diff --check
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

Stage 0 uses focused Vitest contract tests, a uniquely scoped infrastructure
integration suite, and process/protocol smoke checks. Write negative-path tests
for parsing, trust boundaries, redaction, health, fail-closed behaviour,
dependency interruption, schema incompatibility, permission loss, recovery,
and cleanup. The foundation integration script may create and remove only its
generated `vega-canvas-it-*` Compose project. Browser automation and the
general service-integration fixture foundation remain owned by `FND-004`; do
not quietly claim them from the Stage 0B checks.

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

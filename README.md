# Vega Canvas

Vega Canvas is a real-time collaborative infinite-canvas application built
around Excalidraw. This repository currently implements the Stage 0A through
Stage 0C foundations: a reproducible monorepo, executable shared contracts,
three application shells, PostgreSQL and private S3-compatible local
infrastructure, an ordered relational migration set, truthful readiness, and
isolated Vitest, service-integration, and Chromium Playwright foundations.

The scaffold deliberately does **not** create rooms, sessions, or canvas
state. API and collaboration liveness always return `200`. Readiness returns
exact `200 ready` when PostgreSQL, schema, and object-storage dependencies
are healthy, and exact `503` dependency/code pairs when they are not. Every
collaboration upgrade is rejected with `403 COLLAB_PERMISSION_DENIED` until
server-authoritative controls planned for later stages exist.

## Prerequisites

- Node.js `24.18.0` (pinned in [`.node-version`](./.node-version) and
  [`.nvmrc`](./.nvmrc))
- Corepack
- pnpm `11.17.0` (pinned by `packageManager`)
- Docker Engine with Compose v2 (required for local PostgreSQL and MinIO)
- Playwright Chromium when running browser tests
- Google Chrome when running the Lighthouse performance gate

With nvm:

```sh
nvm install
nvm use
node --version
corepack pnpm --version
```

The reported versions must be Node `v24.18.0` and pnpm `11.17.0`.
Repository commands intentionally use `corepack pnpm` so they do not depend on
a globally installed `pnpm` binary.

To make the shorter `pnpm` command available in the active Node installation:

```sh
corepack enable pnpm
hash -r
pnpm --version
```

Corepack shims are installed alongside the active Node version. A newly
installed or selected nvm version may therefore need its own
`corepack enable pnpm`.

## Install

```sh
corepack pnpm install --frozen-lockfile
```

Use `corepack pnpm install` only when intentionally updating
[`pnpm-lock.yaml`](./pnpm-lock.yaml). Exact external dependency versions live
in the catalog in [`pnpm-workspace.yaml`](./pnpm-workspace.yaml).

Install the pinned Playwright Chromium binary once per machine:

```sh
corepack pnpm exec playwright install chromium
```

On a Linux CI worker that also needs browser system packages:

```sh
corepack pnpm exec playwright install --with-deps chromium
```

## Run the local foundation

```sh
cp .env.example .env.local
# Replace every CHANGE_ME value with a distinct local credential.
corepack pnpm infra:up
corepack pnpm db:migrate
corepack pnpm infra:check
corepack pnpm dev
```

The committed example is intentionally unusable. `infra:up`, migration, check,
smoke, and development commands all load the same ignored `.env.local` file.
Ordinary `infra:down` preserves PostgreSQL and MinIO data volumes.

| Runtime | Default address | Stage 0B behaviour |
| --- | --- | --- |
| Web | `http://127.0.0.1:5173` | Accessible public-configuration status only |
| API | `http://127.0.0.1:4000` | Liveness is dependency-independent; readiness checks database, schema, and private object storage |
| Collaboration | `http://127.0.0.1:1234` | Liveness and readiness use HTTP; every WebSocket upgrade fails closed |
| PostgreSQL | `127.0.0.1:5433` | Persistent local database with separate migration, API, and collaboration roles |
| MinIO API | `http://127.0.0.1:9000` | Private S3-compatible bucket with a bucket-scoped API credential |
| MinIO console | `http://127.0.0.1:9001` | Local administration only |

The collaboration rejection reason is the stable,
non-private `COLLAB_PERMISSION_DENIED`. No Yjs room document is created.

## Root commands

| Command | Purpose |
| --- | --- |
| `corepack pnpm infra:up` | Start healthy PostgreSQL and MinIO, then idempotently initialise scoped identities and the private bucket |
| `corepack pnpm infra:down` | Stop repository infrastructure without deleting persistent volumes |
| `corepack pnpm infra:status` | Show local infrastructure state |
| `corepack pnpm db:migrate` | Apply supported migrations with the migration identity and advisory lock |
| `corepack pnpm db:migrate:status` | Exit successfully only when the exact supported migration set is applied |
| `corepack pnpm infra:check` | Verify schema, constraints, scoped privileges, private storage, and probe cleanup |
| `corepack pnpm dev` | Verify migrations and infrastructure, then run the three development shells |
| `corepack pnpm build` | Build all applications and libraries through Turbo |
| `corepack pnpm typecheck` | Run strict TypeScript project checks |
| `corepack pnpm lint` | Run flat ESLint rules and repository boundary checks |
| `corepack pnpm test` | Run focused unit and contract suites |
| `corepack pnpm test:unit` | Run the explicit Vitest unit-suite alias |
| `corepack pnpm test:coverage` | Record coverage under workspace `coverage/` directories |
| `corepack pnpm check` | Build, lint, typecheck, and test from the root |
| `corepack pnpm test:integration` | Create an isolated stack, prove exception/SIGTERM cleanup, and run the general service integration suite |
| `corepack pnpm test:integration:foundation` | Create an isolated stack and prove migrations, failures, recovery, permissions, and cleanup |
| `corepack pnpm test:browser` | Create an isolated assembled stack and run the three-context Chromium smoke |
| `corepack pnpm test:cleanup -- <exact-project>` | Remove one printed orphaned `vega-canvas-it-*` project and its temporary environment after an untrappable hard kill |
| `corepack pnpm smoke:apps` | Launch built shells on isolated ports against local dependencies and verify protocols |
| `corepack pnpm bundle:report` | Record web raw, gzip, and Brotli measurements |
| `corepack pnpm performance:web` | Enforce Lighthouse performance, accessibility, and LCP gates |
| `corepack pnpm docs:check` | Validate relative Markdown links and documentation indexes |

Generated caches and reports are ignored by Git. Bundle measurements are
written to `reports/bundle/`; Lighthouse JSON is written to
`reports/lighthouse/`; Playwright output is written below
`reports/playwright/<run-id>/`. The foundation records bundle size without
introducing a failing size budget.

`check` is intentionally the fast build, lint, typecheck, and unit gate. Full
foundation verification additionally runs both integration commands and
`test:browser`.

## Testing foundation

Vitest unit tests stay beside their source as `*.test.ts` or `*.test.tsx`.
Service tests live under `tests/integration/` as `*.integration.test.ts`;
Playwright tests live under `tests/browser/` as `*.spec.ts`.

`@vega/test-utils` owns the shared synthetic Alice/owner, Bob/editor, and
Charlie/viewer fixtures and the helper that creates one non-persistent
Playwright context per actor. The current browser smoke proves independent
cookies and local storage plus accessible shell rendering. It does not
authenticate the actors, inject roles into client state, or claim room,
canvas, or collaboration behaviour.

The integration and browser commands do not read `.env.local`. Each creates a
unique `vega-canvas-it-<pid>-<suffix>` project, temporary mode-`0600`
configuration, database, private bucket, ports, and release ID. Success,
ordinary failure, `SIGINT`, and `SIGTERM` trigger exact-project cleanup.
Cleanup failure makes the command fail.

`SIGKILL` and host termination cannot be trapped. If either leaves an isolated
project, confirm the owning process is no longer running and use only the
exact project name printed by the failed run:

```sh
corepack pnpm test:cleanup -- vega-canvas-it-12345-a1b2c3d4
```

The cleanup command rejects every broader or malformed target and never
operates on the persistent `vegait-hackerton` developer project. It removes
only Docker resources with the exact Compose project label and generated
temporary directories bound to that project name.

## Configuration

All parsers are pure functions exported by `@vega/config`. Local development
has safe defaults. Demo and production-shaped profiles require explicit secure
values.

### Web

| Field | Local default | Non-local rule |
| --- | --- | --- |
| `VITE_APP_PROFILE` | `local` | `demo` or `production` |
| `VITE_API_BASE_URL` | `http://localhost:4000` | Explicit `https:` URL |
| `VITE_COLLABORATION_URL` | `ws://localhost:1234` | Explicit `wss:` URL |
| `VITE_RELEASE_ID` | `local-dev` | Explicit bounded identifier |

Only `VITE_` public fields enter the browser build.

### API

| Field | Requirement |
| --- | --- |
| `APP_PROFILE` | `local` |
| `API_HOST` | `127.0.0.1` |
| `API_PORT` | `4000` |
| `ALLOWED_WEB_ORIGINS` | `http://localhost:5173` |
| `RELEASE_ID` | `local-dev` |
| `API_DATABASE_URL` | Required PostgreSQL URL for the API runtime role |
| `OBJECT_STORAGE_ENDPOINT` | Required S3 endpoint; local HTTP must use loopback |
| `OBJECT_STORAGE_REGION` | Required S3 region |
| `OBJECT_STORAGE_BUCKET` | Required private bucket name |
| `OBJECT_STORAGE_ACCESS_KEY` | Required server-only bucket credential |
| `OBJECT_STORAGE_SECRET_KEY` | Required server-only bucket credential |
| `OBJECT_STORAGE_FORCE_PATH_STYLE` | Required boolean; `true` for local MinIO |

### Collaboration

| Field | Requirement |
| --- | --- |
| `APP_PROFILE` | `local` |
| `COLLABORATION_HOST` | `127.0.0.1` |
| `COLLABORATION_PORT` | `1234` |
| `ALLOWED_WEB_ORIGINS` | `http://localhost:5173` |
| `RELEASE_ID` | `local-dev` |
| `SUPPORTED_EXCALIDRAW_VERSION` | `0.18.1` |
| `COLLABORATION_DATABASE_URL` | Required PostgreSQL URL for the collaboration runtime role |

`MIGRATION_DATABASE_URL` is required only by migration commands. It must target
the same database as both runtime URLs with a distinct role. Compose derives
its PostgreSQL settings from that URL. `MINIO_ROOT_USER`,
`MINIO_ROOT_PASSWORD`, and `MINIO_CONSOLE_PORT` are local-infrastructure
administration fields and never enter application configuration.

`ALLOWED_WEB_ORIGINS` is a comma-separated list of exact origins. Wildcards,
credential-bearing URLs, path-bearing origins, and insecure non-local origins
are rejected. Configuration failures expose field paths and stable codes, but
never rejected values.

## Repository boundaries

```text
apps/
├── api/
├── collaboration/
└── web/

packages/
├── auth/
├── canvas-extensions/
├── collaboration-schema/
├── config/
├── contracts/
├── database/
├── eslint-config/
├── excalidraw-adapter/
├── test-utils/
└── typescript-config/
```

Excalidraw is the only canvas engine and may be imported only by
`@vega/excalidraw-adapter`. The Excalidraw scene remains canonical. Production
code cannot import `@vega/test-utils`, and server configuration cannot enter the
web dependency graph.

## Current limitations

- No room, guest-session, membership, asset, or export routes exist.
- PostgreSQL contains schema and privilege foundations only; no domain
  repository or seeded product data exists.
- Object storage is used only by an authenticated readiness probe; asset
  upload, download, signing, and lifecycle routes do not exist.
- No canvas is mounted and no Yjs document schema is exposed.
- Collaboration readiness proves database and persistence capability, but no
  Yjs document load/save path exists and every upgrade remains denied.
- Authentication and real room permission decisions remain unimplemented.
- The browser foundation has no guest-session, room, permission, canvas, Yjs,
  IndexedDB, asset, or offline workflow to exercise yet.
- The redacted non-production test API and its production-disable assertion
  remain in `FND-005`.

These are safe Stage 0C boundaries, not mocked product behaviour.

## Documentation

- [Documentation index](./docs/README.md)
- [Foundation contract reference](./docs/contracts/01-foundation-contracts.md)
- [Local persistence and readiness contract](./docs/contracts/02-local-persistence-and-readiness.md)
- [General testing foundation contract](./docs/contracts/03-general-testing-foundation.md)
- [Stage 0B implementation plan](./docs/planning/plans/0002-stage-0b-local-persistence-infrastructure-and-readiness.md)
- [Stage 0C implementation plan](./docs/planning/plans/0004-stage-0c-general-testing-foundation.md)
- [Contributing guide](./CONTRIBUTING.md)

## Troubleshooting

- **`pnpm: command not found` or Turbo cannot find the package-manager
  binary:** activate the pinned runtime with `nvm use`, verify it with
  `node --version`, and run commands as `corepack pnpm <command>`. To restore
  the plain `pnpm` command for that Node installation, run
  `corepack enable pnpm` followed by `hash -r`. Do not fall back to
  `npm run`; this is a pnpm workspace, and npm will warn about the
  pnpm-specific [`.npmrc`](./.npmrc) settings.
- **Engine mismatch:** run `nvm use` and confirm both pinned versions before
  installation.
- **Frozen-lockfile failure:** do not bypass it in verification. Confirm the
  manifest change was intentional, regenerate the lockfile with the pinned
  runtime, and review the diff.
- **Port already in use:** stop the conflicting local process or change the
  port in all three PostgreSQL URLs, the object-storage endpoint, or
  `MINIO_CONSOLE_PORT` as applicable. Runtime server ports remain separately
  configurable. The web development port is fixed at `5173`; integration,
  smoke, and performance scripts use isolated ports.
- **Migration status fails:** run `corepack pnpm db:migrate`. Unknown,
  reordered, or partially applied migrations require investigation; the
  applications deliberately report schema not-ready.
- **Readiness returns 503:** inspect only the stable dependency and code in the
  response, then run `corepack pnpm infra:status` and
  `corepack pnpm infra:check`. Provider errors and credentials are deliberately
  absent from health responses.
- **Lighthouse cannot find Chrome:** set `CHROME_PATH` to a local Chrome or
  Chromium executable.
- **Playwright cannot launch Chromium:** run
  `corepack pnpm exec playwright install chromium`. On Linux CI, use
  `corepack pnpm exec playwright install --with-deps chromium`.
- **An isolated test was hard-killed:** copy its exact printed
  `vega-canvas-it-<pid>-<suffix>` name, confirm the owning process is gone,
  then run `corepack pnpm test:cleanup -- <exact-project>`. Never use a
  wildcard, Docker prune, or the developer project name.

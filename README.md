# Vega Canvas

Vega Canvas is a real-time collaborative infinite-canvas application built
around Excalidraw. This repository currently implements the Stage 0A
foundation: a reproducible monorepo, executable shared contracts, and three
fail-safe application shells.

The scaffold deliberately does **not** create rooms, sessions, persistence, or
canvas state. API and collaboration liveness are available, readiness remains
`503 not_ready`, and every collaboration upgrade is rejected until the
server-authoritative controls planned for `FND-003` exist.

## Prerequisites

- Node.js `24.18.0` (pinned in [`.node-version`](./.node-version) and
  [`.nvmrc`](./.nvmrc))
- Corepack
- pnpm `11.17.0` (pinned by `packageManager`)
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

## Run the Stage 0A shells

```sh
corepack pnpm dev
```

| Runtime | Default address | Stage 0A behaviour |
| --- | --- | --- |
| Web | `http://127.0.0.1:5173` | Accessible public-configuration status only |
| API | `http://127.0.0.1:4000` | `GET /health/live` is `200`; `GET /health/ready` is `503` |
| Collaboration | `ws://127.0.0.1:1234` | Health over HTTP; every WebSocket upgrade fails closed |

The collaboration rejection reason is the stable,
non-private `COLLAB_PERMISSION_DENIED`. No Yjs room document is created.

## Root commands

| Command | Purpose |
| --- | --- |
| `corepack pnpm dev` | Run the three development shells after dependency builds |
| `corepack pnpm build` | Build all applications and libraries through Turbo |
| `corepack pnpm typecheck` | Run strict TypeScript project checks |
| `corepack pnpm lint` | Run flat ESLint rules and repository boundary checks |
| `corepack pnpm test` | Run focused Stage 0A Vitest suites |
| `corepack pnpm test:coverage` | Record coverage under workspace `coverage/` directories |
| `corepack pnpm check` | Build, lint, typecheck, and test from the root |
| `corepack pnpm smoke:apps` | Launch built shells on isolated ports and verify protocols |
| `corepack pnpm bundle:report` | Record web raw, gzip, and Brotli measurements |
| `corepack pnpm performance:web` | Enforce Lighthouse performance, accessibility, and LCP gates |
| `corepack pnpm docs:check` | Validate relative Markdown links and documentation indexes |

Generated caches and reports are ignored by Git. Bundle measurements are
written to `reports/bundle/`; Lighthouse JSON is written to
`reports/lighthouse/`. Stage 0A records bundle size without introducing a
failing size budget.

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

| Field | Local default |
| --- | --- |
| `APP_PROFILE` | `local` |
| `API_HOST` | `127.0.0.1` |
| `API_PORT` | `4000` |
| `ALLOWED_WEB_ORIGINS` | `http://localhost:5173` |
| `RELEASE_ID` | `local-dev` |

### Collaboration

| Field | Local default |
| --- | --- |
| `APP_PROFILE` | `local` |
| `COLLABORATION_HOST` | `127.0.0.1` |
| `COLLABORATION_PORT` | `1234` |
| `ALLOWED_WEB_ORIGINS` | `http://localhost:5173` |
| `RELEASE_ID` | `local-dev` |
| `SUPPORTED_EXCALIDRAW_VERSION` | `0.18.1` |

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
- No PostgreSQL, object-storage, authentication, permission, or persistence
  wiring exists.
- No canvas is mounted and no Yjs document schema is exposed.
- Readiness remains intentionally unavailable until `FND-003`.
- Broader service integration, Playwright, and synthetic multi-client testing
  remain in `FND-004`.

These are safe Stage 0A boundaries, not mocked product behaviour.

## Documentation

- [Documentation index](./docs/README.md)
- [Foundation contract reference](./docs/contracts/01-foundation-contracts.md)
- [Stage 0A implementation plan](./docs/planning/plans/0001-stage-0a-monorepo-scaffold-and-executable-contracts.md)
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
- **Port already in use:** stop the conflicting local process or override the
  documented server port variables. The web development port is fixed at
  `5173`; smoke and performance scripts use isolated ports.
- **Lighthouse cannot find Chrome:** set `CHROME_PATH` to a local Chrome or
  Chromium executable.
- **Readiness returns 503:** that is the required Stage 0A behaviour.

# Non-Production Canvas Inspection API

**Document path:** `docs/contracts/04-non-production-canvas-test-api.md`

**Document status:** Proposed

**Applicable work package:** `FND-005`

**Last updated:** 26 July 2026

**Primary owners:** Engineering and QA

---

# 1. Purpose

Document the executable `window.__CANVAS_TEST_API__` boundary: a redacted,
read-only inspection entry point that exists only in non-production Vite builds
when explicitly enabled by configuration. Production builds must omit the
initializer module and its source-map content.

The accepted [Testing and Quality Strategy](../architecture/11-testing-and-quality-strategy.md),
[Frontend Architecture](../architecture/06-frontend-architecture.md),
and [ADR 0006](../adr/0006-risk-based-tdd-and-qa-intel-release-controls.md)
remain authoritative. This reference records implemented behaviour; it does not
expand accepted product scope or introduce a second canvas model.

---

# 2. Scope

Included:

- Configuration field `VITE_CANVAS_TEST_API_ENABLED` with `z.boolean()` coercion.
- Production-profile rejection with redacted `INCOMPATIBLE_PROFILE` error.
- Vite compile-time `define` gate enabled only for `development` and `test` modes.
- Dynamically imported hook module that installs `window.__CANVAS_TEST_API__`.
- Frozen, non-writable, non-configurable global with `inspect()` method.
- `CanvasInspectionSnapshot` with schema `v1`, runtime profile/releaseId,
  redacted canvas/room/scene/connection state, and no identity or credential.
- Static production-bundle scans verifying the API identifier is absent.
- Two-phase browser test (production-absent, test-mode-present).

Excluded:

- Mutation, authentication, or permission decisions through the inspection API.
- Mutation, command, or identity-bearing fields on the API or snapshot.
- The `FND-006` CI workflow or provider-specific CI.
- Firefox, WebKit, or QA-Intel scenarios.

---

# 3. Configuration

| Field | Type | Local default | Production rule |
| --- | --- | --- | --- |
| `VITE_CANVAS_TEST_API_ENABLED` | boolean (`true`/`false`/`1`/`0`) | `false` | Rejected with `INCOMPATIBLE_PROFILE` |

The field is validated by the `readBoolean` helper in `@vega/config`. Only
existing boolean spellings are accepted. In non-local profiles the field is
required when explicitly set; a missing value defaults to `false` in local
profile.

---

# 4. Compile-time gate

The Vite configuration defines `__VITE_CANVAS_TEST_API_ENABLED__` as a
compile-time constant, set to `true` when `mode` is `development` or `test`,
and `false` otherwise.

```text
Main entry point
→ production build (__VITE_CANVAS_TEST_API_ENABLED__ = false)
  → tree-shaken: hook import and initializer module removed
  → static scan confirms absence in JS, HTML, and source maps
→ non-production build (__VITE_CANVAS_TEST_API_ENABLED__ = true)
  → runtime checks VITE_CANVAS_TEST_API_ENABLED
    → false: skip initialization
    → true: import ./canvas-test-api/hook.js
      → hook parses configuration
      → installCanvasTestApi creates frozen global
```

---

# 5. API surface

```ts
// Installed on window.__CANVAS_TEST_API__ and var __CANVAS_TEST_API__
interface CanvasTestApi {
  inspect(): CanvasInspectionSnapshot;
}

interface CanvasInspectionSnapshot {
  readonly schemaVersion: 1;
  readonly runtime: {
    readonly profile: ApplicationProfile;
    readonly releaseId: string;
  };
  readonly canvas: {
    readonly status: "not-mounted" | "mounted";
    readonly adapter?: {
      readonly excalidrawVersion: string;
      readonly elementCount: number;
    };
  };
  readonly room: {
    readonly id: string;
    readonly status: string;
    readonly role: string;
  } | null;
  readonly scene: {
    readonly elementCount: number;
    readonly elementTypes: string[];
    readonly order: string[];
    readonly elements: readonly {
      readonly id: string;
      readonly type: string;
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
      readonly isDeleted: boolean;
    }[];
  } | null;
  readonly collaboration: {
    readonly status:
      | "disconnected"
      | "connecting"
      | "connected"
      | "reconnecting"
      | "failed";
    readonly documentName?: string;
  };
  readonly persistence: { readonly status: "not-configured" };
}
```

Properties:
- `__CANVAS_TEST_API__` — installed via `Object.defineProperty` with
  `writable: false, configurable: false`.
- `api` object is frozen via `Object.freeze`.
- Each `inspect()` call returns a fresh frozen plain object.
- The snapshot has no identity, token, URL, Yjs instance, binary,
  recovery-content, or command field.
- Scene fields are a redacted projection sourced only from the Excalidraw
  adapter; they are not a second scene model.

---

# 6. Failure and security behaviour

- Invalid boolean spellings fail configuration with `INVALID_FORMAT`.
- Production profile with flag `true` fails with `INCOMPATIBLE_PROFILE` and
  redacted values.
- The compile-time gate ensures production tree-shaking removes the
  initializer, the global name, and their source-map content.
- Static verification scans fail the test command if production bundles or
  source maps contain the API identifier.
- Hook module installation failure (e.g. invalid config) silently leaves the
  global absent; the application renders its normal state.
- The global is immutable at runtime — `Object.defineProperty` with
  `writable: false, configurable: false` prevents override.

---

# 7. Root commands

`test:browser` runs two ordered phases:

1. **Production absent**: builds the web application in production mode with
   `VITE_CANVAS_TEST_API_ENABLED=true`, starts the full isolated stack, runs
   the Playwright spec that asserts the global is absent.
2. **Test mode present**: rebuilds the web application in Vite `test` mode with
   `VITE_CANVAS_TEST_API_ENABLED=true`, restarts the web preview, runs the
   same Playwright spec that asserts the global is present with the exact
   initial guest-route snapshot.

Static bundle verification runs after both phases, rebuilding in production
mode and scanning all emitted JS, HTML, and source maps.

`corepack pnpm test:browser:collaboration` uses the enabled read-only
inspection boundary to compare redacted scene projections across two contexts
and after collaboration restart/reload. It never exposes or mutates a Y.Doc,
Excalidraw API, token, URL, or private identity.

---

# 8. Test levels

- **Configuration unit tests**: default disabled, explicit enablement, invalid
  boolean, production rejection, redacted errors.
- **Web unit tests**: exact API keys, frozen descriptor, immutable object,
  repeat inspection, JSON serializability, absence of forbidden fields.
- **Browser tests**: production absence and test-mode presence with exact
  snapshot shape and immutability checks.
- **Static bundle verification**: production bundle scan for the API identifier
  in JS, HTML, and source maps.

---

# 9. Definition of done

- Configuration accepts default disabled, explicit `true`/`false`/`1`/`0` in
  non-production, rejects production enablement with redacted `INCOMPATIBLE_PROFILE`.
- Vite compile-time gate removes the initializer and global identifier from
  production builds.
- `window.__CANVAS_TEST_API__` is frozen, non-writable, non-configurable, and
  exposes only `inspect()`.
- `inspect()` returns a fresh frozen `CanvasInspectionSnapshot` with the
  documented schema and no forbidden fields.
- Chromium browser tests prove production absence and test-mode presence.
- Static production-bundle scans confirm no API identifier in emitted
  artifacts.
- Documentation, indexes, README, and CONTRIBUTING match implemented behaviour.

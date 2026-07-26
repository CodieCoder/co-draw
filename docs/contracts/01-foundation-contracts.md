# Foundation Contracts

**Document path:** `docs/contracts/01-foundation-contracts.md`

**Document status:** Proposed

**Applicable work package:** `FND-002`

**Last updated:** 26 July 2026

**Primary owners:** Engineering and Architecture

---

# 1. Purpose

Document the executable foundation identifier, role, error, health, and
configuration contracts without duplicating later domain APIs.

The runtime implementations are:

- [`packages/contracts`](../../packages/contracts/package.json)
- [`packages/config`](../../packages/config/package.json)

The accepted [API boundaries](../architecture/04-api-and-service-boundaries.md),
[collaboration design](../architecture/02-collaboration-and-sync-design.md),
and [operational readiness policy](../architecture/12-deployment-and-operational-readiness.md)
remain authoritative for behaviour outside these representation details.

---

# 2. Scope

Included:

- Branded UUIDv7 identifiers.
- The exact owner, editor, and viewer roles.
- Stable API and collaboration error-code registries.
- A strict API validation-error envelope.
- Strict liveness and readiness responses.
- Pure web, API, and collaboration configuration parsers.

Excluded:

- Database migrations, schema details, or repositories.
- Session or collaboration claim formats.
- Capability derivation.
- Room, asset, export, scene, Yjs document, or Awareness schemas.
- Persistence, authentication, or permission implementation.

---

# 3. Responsibilities and public exports

| Export | Responsibility |
| --- | --- |
| `@vega/contracts/identifiers` | Parse and generate branded UUIDv7 identifiers. |
| `@vega/contracts/roles` | Validate `owner`, `editor`, or `viewer`. |
| `@vega/contracts/errors` | Validate exact stable error registries and the bounded API error shape. |
| `@vega/contracts/health` | Create and validate strict service health results. |
| `@vega/config/web` | Parse public browser configuration only. |
| `@vega/config/api` | Parse API listener, origin, database, and object-storage configuration. |
| `@vega/config/collaboration` | Parse collaboration listener, origin, database, release, and Excalidraw compatibility configuration. |

`@vega/config` intentionally has no root export. That prevents a convenient
barrel from pulling server configuration into the browser graph.

---

# 4. Identifier contract

The identifier module owns distinct branded types for:

- `GuestId`
- `GuestSessionId`
- `RoomId`
- `MembershipId`
- `ShareLinkId`
- `AssetId`
- `ExportId`
- `AuditEventId`

Every identifier:

- Is generated with UUID version 7.
- Is returned in lowercase canonical form.
- Rejects malformed UUIDs and every UUID version other than 7.
- Has a distinct TypeScript brand so one identifier kind is not assignable to
  another without explicit unsafe casting.

PostgreSQL uses its native `uuid` type in the Stage 0B migrations. The brand
exists at the TypeScript boundary; it does not require a different database
column type or a second identifier representation.

---

# 5. Role and error contracts

The role registry is exactly:

```text
owner | editor | viewer
```

Role-to-capability derivation remains the responsibility of `packages/auth`.
Client-provided roles are never authoritative.

API error responses have one top-level `error` object containing a stable code,
bounded user-readable message, and safe request ID. Only
`VALIDATION_FAILED` may include field details. Field entries contain only a
field path, stable code, and bounded message. Unknown envelope fields and
arbitrary diagnostic maps are rejected.

The error-code arrays in
[`errors.ts`](../../packages/contracts/src/errors.ts) exactly implement the
accepted registries. Callers must not parse human-readable message strings.

---

# 6. Health contract and control flow

Service identity is exactly `api` or `collaboration`.

Liveness:

```json
{
  "service": "api",
  "state": "live",
  "releaseId": "local-dev"
}
```

Ready:

```json
{
  "service": "api",
  "state": "ready",
  "releaseId": "local-dev"
}
```

Dependency not-ready:

```json
{
  "service": "api",
  "state": "not_ready",
  "releaseId": "local-dev",
  "dependency": "object_storage",
  "code": "OBJECT_STORAGE_UNAVAILABLE"
}
```

The collaboration shape differs only in service identity. Ready results use
HTTP `200`; not-ready results use HTTP `503`. The strict dependency/code
mapping includes configuration, database, object storage, authentication,
authorization, persistence, schema, collaboration control, and the historical
foundation state. Stage 0B currently emits database, schema, object-storage,
and persistence failures. Later mappings are reserved for their owning stages.

Health schemas reject unknown fields. They cannot carry raw errors, hostnames,
connection strings, credentials, guest identity, scenes, Yjs state, asset
content, or stack traces.

---

# 7. Configuration flow

```text
Raw environment record
→ application-specific pure parser
→ syntax and transport-policy validation
→ typed camel-case configuration
OR
→ ConfigurationError with field paths and stable codes only
```

Local parsing uses the defaults and required fields documented in the
[root README](../../README.md#configuration). API configuration owns its
runtime database URL and object-storage endpoint, region, bucket, credential,
and path-style setting. Collaboration configuration owns its runtime database
URL. Demo and production-shaped web URLs require HTTPS for the API and WSS for
collaboration. Non-local database URLs require TLS configuration; non-local
object storage requires HTTPS. Non-local allowed web origins require exact
HTTPS origins. Wildcards, embedded credentials where disallowed, paths,
queries, fragments, placeholders, and malformed bucket names are rejected.

The web package consumes only `@vega/config/web` and Vite-prefixed public
fields. It cannot import either server parser.

---

# 8. Failure and security behaviour

- Invalid required server configuration fails startup.
- Invalid public web configuration renders a bounded alert state.
- Error objects retain no rejected configuration value.
- Server secrets have no browser configuration field or web import path.
- Health results contain allowlisted data only.
- Collaboration access fails before a room document can be created.
- Guest email and other private identity data are absent from these contracts,
  examples, logs, and test evidence.

---

# 9. Testing requirements

Focused tests must prove:

- UUIDv7 generation, lowercase canonicalisation, version rejection, and brand
  separation.
- Exact roles and stable error registries.
- Strict error and health schemas.
- Local configuration defaults.
- Non-local HTTPS/WSS requirements.
- Invalid ports, origins, and Excalidraw versions.
- Redacted configuration failures.
- API and collaboration health status codes and exact response fields.
- Fail-closed collaboration upgrades.

The Stage 0B infrastructure integration test is a focused proof of this
contract. It does not claim the general service-integration or Playwright
foundation assigned to `FND-004`.

---

# 10. Definition of done

This reference is complete when every listed public export builds, strict
typechecking and focused tests pass, runtime shells consume the public exports,
configuration failures remain redacted, health and collaboration smoke checks
pass, and this document matches the installed dependency and executable
behaviour.

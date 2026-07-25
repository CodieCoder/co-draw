# Deployment and Operational Readiness

## Real-Time Collaborative Infinite Canvas

**Document path:** `docs/architecture/12-deployment-and-operational-readiness.md`
**Document status:** Accepted
**Product phase:** Two-day MVP / Hackathon
**Last updated:** 25 July 2026
**Primary owners:** Engineering and Architecture

---

# 1. Purpose

This document defines the minimum deployable topology, runtime configuration, startup order, health checks, operational diagnostics, backup and recovery, failure response, and demonstration procedure for the real-time collaborative infinite canvas.

It consolidates accepted deployment and operational requirements from:

- [Product Requirements](../product/01-product-requirements.md)
- [MVP Scope and Acceptance Criteria](../product/02-mvp-scope-and-acceptance-criteria.md)
- [System Architecture](./01-system-architecture.md)
- [Collaboration and Synchronisation Design](./02-collaboration-and-sync-design.md)
- [Data Model and Persistence](./03-data-model-and-persistence.md)
- [API and Service Boundaries](./04-api-and-service-boundaries.md)
- [Frontend Architecture](./06-frontend-architecture.md)
- [Asset and Media Architecture](./08-asset-and-media-architecture.md)
- [Offline Sync and Recovery](./09-offline-sync-and-recovery.md)
- [Security, Permission, and Privacy Architecture](./10-security-permission-and-privacy-architecture.md)
- [Testing and Quality Strategy](./11-testing-and-quality-strategy.md)

The accepted application APIs, persistence schemas, collaboration state, and security rules remain authoritative. This document defines how the existing logical runtimes are configured, started, verified, observed, and recovered; it does not create another application API, scene model, or data schema.

---

# 2. Scope

## 2.1 Mandatory operational scope

The MVP must support:

- Repeatable local startup.
- One vendor-neutral hackathon or demo deployment.
- The web, API, and collaboration runtimes.
- PostgreSQL and private object storage.
- Ordered database migrations.
- Fail-fast configuration validation.
- Liveness and readiness checks.
- Redacted structured logging and client diagnostics.
- Proportionate database and object-storage recovery.
- A repeatable demo preflight and fallback procedure.
- P0, QA-Intel, and protected offline-recovery verification.

## 2.2 Conditional P1 operational scope

Physics, mini-map, radar, recycle bin, archive, and general export are enabled only when implemented and tested.

Operational support for an enabled P1 capability is mandatory for that capability's completion claim, but disabled or absent P1 capabilities do not block the MVP release.

Recovery-only JSON for a rejected offline draft remains mandatory release scope. It is not general P1 room export.

## 2.3 Explicit non-goals

The two-day MVP does not require:

- Kubernetes.
- Distributed application scaling.
- Multiple API or collaboration replicas.
- Microservice expansion beyond the accepted web, API, and collaboration runtimes.
- Multi-region deployment.
- Automated failover.
- A service mesh.
- A message broker.
- A dedicated observability platform.
- Formal high-availability, RPO, RTO, or SLO guarantees.
- A separate observability architecture document.

The five deployable units are logical responsibilities, not an invitation to add enterprise infrastructure.

---

# 3. Operational principles

1. Excalidraw remains the sole canvas engine and canonical visual scene in every environment.
2. PostgreSQL remains authoritative for application, permission, asset-metadata, and collaboration-persistence records.
3. Private object storage owns image and audio bytes.
4. Yjs and Hocuspocus own collaborative synchronisation.
5. IndexedDB owns device-local cache and recovery artifacts, not server authority.
6. Required configuration is validated before a runtime becomes ready.
7. Migrations complete before application runtimes accept dependent traffic.
8. Liveness does not depend on external services; readiness does.
9. Protected actions fail closed while safe local work is preserved where possible.
10. Logs and diagnostics are useful only when they remain redacted.
11. An operational failure must never be represented as a successfully empty room, saved scene, ready asset, or synchronised draft.
12. The demo environment proves the accepted release gate rather than presenting incomplete P1 work as MVP.

---

# 4. Minimum deployable units

| Unit | Runtime form | Responsibilities | Required dependencies |
| --- | --- | --- | --- |
| Web application | Static or edge-hosted React/Vite bundle | Excalidraw UI, Yjs client, IndexedDB, presence, assets, offline and recovery UI, test hooks in non-production only. | Public API and collaboration URLs; browser access to authorised asset paths. |
| HTTP API | Long-lived Node.js NestJS/Fastify process or container | Guest sessions, rooms, memberships, invitations, permissions, assets, audit, collaboration bootstrap, health checks. | PostgreSQL, object storage for mandatory media paths, internal collaboration control where used. |
| Collaboration runtime | Long-lived Node.js Hocuspocus/WebSocket process or container | Authenticated room connections, Yjs sync, awareness, read-only viewers, document persistence, health checks. | PostgreSQL and shared authentication or permission policy. |
| PostgreSQL | Local container or managed database | Application data, permissions, asset metadata, audit state, and encoded collaboration persistence. | Durable volume or managed persistence. |
| Private object storage | Local S3-compatible service or managed private bucket | Image and audio binaries and conditional generated exports. | Private bucket policy and authorised API or signed-access path. |

The API and collaboration runtime may share packages and a database. They remain separate processes because HTTP request/response traffic and long-lived WebSocket collaboration have different lifecycle requirements.

---

# 5. Runtime topology

```text
Browser
    ├── HTTPS ───────────────→ Web application
    ├── HTTPS / JSON ────────→ HTTP API
    └── Secure WebSocket ────→ Collaboration runtime
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
              PostgreSQL                    Private object storage
```

The web bundle does not connect directly to PostgreSQL.

The browser never receives database, object-storage, internal-service, or session-signing credentials.

If direct asset upload is selected, the browser receives only short-lived, room-authorised upload material. If API-proxied upload is selected, object-storage credentials remain entirely server-side.

---

# 6. Local-development deployment

The intended local command remains:

```text
pnpm dev
```

The monorepo task runner should start:

- Web application.
- HTTP API.
- Collaboration runtime.

Docker Compose may start:

- PostgreSQL.
- S3-compatible private object storage.

The accepted suggested local endpoints remain:

```text
Web:           http://localhost:3000
API:           http://localhost:4000
Collaboration: ws://localhost:4001
```

Local requirements:

- Use non-production credentials.
- Keep secret-bearing local environment files out of version control.
- Add any introduced secret-file pattern to repository ignore rules before using it.
- Use private local object-storage buckets.
- Apply migrations before the API and collaboration runtime report readiness.
- Use isolated test databases and buckets for automated tests.
- Do not claim offline recovery is available until the browser cache has initialised successfully.

Local infrastructure may be disposable. Rejected browser drafts and other user recovery artifacts must still be preserved until explicitly exported or discarded.

---

# 7. Hackathon and demo deployment

The deployment remains vendor-neutral.

Recommended runtime forms:

```text
Web application
→ Static or edge hosting with HTTPS

HTTP API
→ Long-lived Node.js process or container

Collaboration runtime
→ Long-lived Node.js process or container with secure WebSocket support

PostgreSQL
→ Managed PostgreSQL where available

Object storage
→ Managed private S3-compatible bucket
```

Required platform capabilities:

- HTTPS for the web and API.
- Secure WebSocket support with a connection duration suitable for the demo.
- Environment and secret injection.
- Private database connectivity.
- Private object-storage access.
- Persistent PostgreSQL storage.
- Runtime logs.
- A way to run a one-off migration command.

The collaboration runtime must not be placed on a hosting mode that terminates long-lived WebSockets or suspends the process between ordinary requests.

One instance per application runtime is sufficient for the two-day MVP. The architecture does not require load balancing, shared pub/sub, sticky routing, or room sharding.

---

# 8. Environment profiles

The minimum profiles are:

| Profile | Purpose | Test API | Data durability |
| --- | --- | --- | --- |
| Local development | Feature development and manual verification. | Allowed when explicitly enabled. | Local PostgreSQL, object storage, and browser cache may be disposable except protected local drafts. |
| Automated test | Unit, integration, browser, and QA automation. | Enabled for browser and QA tests only. | Isolated per run and cleaned safely after evidence collection. |
| Demo | Release-candidate demonstration. | Disabled for public production-shaped use; a separate non-production QA deployment may enable it. | Managed or explicitly backed-up PostgreSQL and durable private object storage. |
| Production-shaped verification | Confirm release configuration and hook disablement. | Prohibited. | Uses isolated verification data, not production user data. |

Every runtime records a release identifier such as a commit SHA or build version so logs and QA evidence can be correlated with the deployed revision.

---

# 9. Configuration ownership

The future typed `packages/config` package owns concrete environment-variable names, schemas, parsing, and validation. This architecture defines the required categories and their secrecy; it does not create a second configuration catalog.

| Unit | Public or non-secret configuration | Private configuration | Failure behaviour |
| --- | --- | --- | --- |
| Web | API base URL, collaboration URL, public release identifier, supported feature flags, non-production test-hook flag. | None. | Refuse startup or show a clear configuration error when required public URLs are missing or invalid. |
| API | Environment, allowed frontend origins, upload/media limits, log level, release identifier, feature availability. | Database credential, object-storage credential, session-signing or token material, internal collaboration credential. | Fail fast before readiness when required configuration is missing or inconsistent. |
| Collaboration | Environment, allowed origins, log level, release identifier, document and Excalidraw compatibility versions, connection limits. | Database credential, session-validation material, internal control credential where used. | Reject readiness and writable connections until required policy and persistence configuration are valid. |
| PostgreSQL | Database name, connection limits, migration version. | Administrative and application credentials. | Remain unavailable to application traffic until initialised and migrated. |
| Object storage | Endpoint, region, bucket name, selected upload mode, CORS policy when direct browser upload is used. | Access key, secret key, signing credential. | Asset paths remain unavailable; no asset may be marked ready falsely. |

Configuration must distinguish:

- Required from optional.
- Public from secret.
- Local defaults from demo-required values.
- Mandatory MVP flags from conditional P1 flags.
- Build-time from runtime values.

Feature flags never replace permission checks.

---

# 10. Configuration validation

Each runtime validates configuration at startup.

Validation includes:

- Required values are present.
- URLs and origins are syntactically valid.
- Production or demo origins do not use permissive wildcards with credentials.
- Numeric limits are positive and bounded.
- Database and object-storage identifiers are present.
- Collaboration and Excalidraw version settings are supported.
- Conditional feature flags are internally consistent.
- Test hooks cannot be enabled in a production build or production profile.
- No server secret is assigned to a web-exposed configuration field.

Invalid required configuration:

- Prevents readiness.
- Produces a stable redacted error.
- Does not print the secret value.
- Does not silently fall back to an insecure default.

The web bundle may contain only public runtime configuration. A value embedded in browser JavaScript must be treated as public even if its variable name contains the word `secret`.

---

# 11. Secret handling

Secrets include:

- Database credentials.
- Object-storage credentials.
- Raw guest-session tokens.
- Session-signing or token-generation material.
- Raw share tokens.
- Internal API-to-collaboration credentials.
- Signed asset URLs.

Rules:

- Use local ignored files only for local non-production secrets.
- Use the hosting platform's secret mechanism for the demo environment.
- Commit only placeholder examples without usable credentials.
- Limit each runtime to the credentials it requires.
- Do not send server credentials to the browser.
- Do not place tokens in scene data, Yjs, awareness, URLs used for ordinary diagnostics, or test hooks.
- Do not log raw values during startup validation.
- Replace an exposed credential rather than merely deleting it from the latest file revision.

The MVP does not require an enterprise secret manager when the selected platform already provides protected secret injection.

---

# 12. PostgreSQL readiness

PostgreSQL is ready for application use when:

- The server accepts an authenticated connection from the intended runtime identity.
- The target database exists.
- Required migrations have completed in order.
- The schema version is supported by the deployed API and collaboration runtime.
- Mandatory tables and constraints from [Data Model and Persistence](./03-data-model-and-persistence.md#64-mvp-database-scope) exist.
- Application credentials have the required runtime permissions.
- The persistence path can read and write an isolated readiness or verification operation without exposing application data.
- A current backup or managed recovery capability exists for the demo environment.

Readiness checks must not:

- Return connection strings.
- Return database credentials.
- Dump schema or application rows.
- Modify a real room or collaboration document.

The database remains the authority for roles and room state. Startup never reconstructs authority from browser cache.

---

# 13. Object-storage readiness

Object storage is ready for the mandatory media path when:

- The configured bucket exists.
- The bucket is private.
- The API can perform the selected authorised upload and read path.
- A bounded verification object can be created, read, and removed in an isolated readiness prefix or equivalent safe provider check.
- Response content types are preserved.
- Short-lived signed access or API-proxy access works as selected.
- Direct-upload CORS permits only configured frontend origins when direct upload is used.
- Credentials, signed URLs, and raw storage keys remain absent from health responses and ordinary logs.

If API-proxied upload is selected, browser-to-bucket CORS is unnecessary and should not be enabled broadly.

Object-storage unavailability does not invalidate safe shape and text collaboration, but it prevents full demo readiness because image and audio are mandatory P0 capabilities.

---

# 14. Health and readiness checks

## 14.1 API checks

The accepted API operational endpoints remain:

```http
GET /health/live
GET /health/ready
```

API liveness answers whether the process and HTTP event loop can serve a response. It does not query PostgreSQL, object storage, or the collaboration runtime.

API readiness validates:

- Required configuration.
- PostgreSQL connectivity and supported schema.
- Object-storage client and mandatory media-path readiness.
- Internal collaboration-control configuration when the API requires that path for enabled operations.

## 14.2 Collaboration checks

The collaboration runtime exposes matching operational checks on its own HTTP listener:

```http
GET /health/live
GET /health/ready
```

Collaboration liveness answers whether the process and health listener are running.

Collaboration readiness validates:

- Required configuration.
- PostgreSQL connectivity.
- Supported collaboration-document and Excalidraw compatibility versions.
- Document persistence initialisation.
- Authentication and permission-policy initialisation.

It does not create or mutate a real room document.

## 14.3 Web check

Static web readiness verifies:

- The application entry document and required assets are available.
- Public configuration loads.
- Required API and collaboration URLs are syntactically valid.
- The production-shaped build does not expose the test API.

Backend reachability is verified by the smoke test rather than by embedding privileged dependency checks into the static bundle.

## 14.4 Response policy

Health responses expose only:

- Overall live or ready state.
- Service identity.
- Release identifier where safe.
- Stable dependency category or error code when not ready.

They do not expose:

- Guest data.
- Database or bucket contents.
- Hostnames or connection strings where unnecessary.
- Credentials, tokens, signed URLs, or storage keys.
- Raw exception stacks in public responses.

---

# 15. Health-state interpretation

| State | Meaning | Traffic policy |
| --- | --- | --- |
| Live and ready | Process is running and mandatory dependencies are usable. | Accept intended traffic. |
| Live but not ready | Process runs but configuration, migration, persistence, or a mandatory dependency is unavailable. | Keep protected traffic away; operator investigates. |
| Not live | Process cannot serve its health response. | Restart or replace that runtime. |
| Degraded application feature | Runtime remains ready for safe core traffic, but a non-critical or conditional capability is unavailable. | Keep core traffic available and disable or report the affected capability honestly. |

For the demo release gate, image and audio storage is mandatory rather than an optional degradation.

Health checks diagnose service eligibility. They do not replace the end-to-end smoke test or QA-Intel.

---

# 16. Migration policy

Relational migrations follow [Data Model and Persistence](./03-data-model-and-persistence.md#47-migration-strategy).

Rules:

- Migrations are version-controlled.
- A one-off migration command runs before the API and collaboration runtime become ready.
- Migrations are tested against an empty database and a representative populated database.
- Application replicas do not race to run migrations during ordinary startup.
- A runtime refuses readiness when the database schema is older or newer than its supported range.
- Destructive migrations require an explicit backup and recovery plan.
- Rollback does not assume that a database downgrade is safe.

Collaboration-document and Excalidraw migrations remain separate:

- The collaboration schema owns Yjs document migration.
- The Excalidraw adapter owns Excalidraw scene compatibility.
- Migrations are deterministic and validated.
- A failed migration preserves recoverable state and must not publish an empty scene.

---

# 17. Startup ordering

The local and demo startup sequence is:

```text
1. Start or verify PostgreSQL and object storage
2. Load and validate runtime configuration
3. Confirm a current backup before changing an existing demo database
4. Apply relational migrations once
5. Verify database schema and object-storage readiness
6. Start the API
7. Start the collaboration runtime
8. Wait for both runtimes to report ready
9. Publish or start the web application
10. Run smoke checks
11. Run mandatory release and QA-Intel verification
```

The API and collaboration runtime may start in either order after migrations when their readiness dependencies are satisfied. Neither may advertise readiness before its own permission and persistence policy is initialised.

The web application may be deployed earlier by the hosting platform, but the demo is not opened to participants until backend readiness and smoke checks pass.

---

# 18. Update and rollback

Before updating the demo environment:

1. Record the currently deployed release identifier.
2. Confirm the latest PostgreSQL backup or create a pre-change backup.
3. Confirm object-storage access and durability.
4. Review migration compatibility.
5. Deploy and migrate in the documented order.
6. Run readiness and smoke checks.

If the new application revision fails:

- Roll back the application runtime only when the migrated schema remains backward-compatible.
- Otherwise stop the affected write path and follow the database recovery procedure.
- Do not run an improvised destructive down migration.
- Preserve collaboration snapshots and browser recovery artifacts.
- Record the failed revision and evidence.

The MVP accepts a brief maintenance interruption rather than risking divergent or unauthorised state.

---

# 19. Structured logging

Each server runtime emits structured logs.

Useful common fields include:

```text
timestamp
level
service
environment
releaseId
requestId or connectionId
roomId
guestId
serverDerivedRole
operation
result
durationMs
errorCode
```

API-specific context may include route and status code.

Collaboration-specific context may include:

- Connection result and disconnect reason.
- Document load and persistence result.
- Snapshot or update size.
- Schema and migration result.
- Synchronisation timing.

Asset context may include asset ID, kind, lifecycle transition, bounded size metadata, and failure code.

Offline server events may include revalidation result and reported rejected-draft reason when the server receives such an event.

---

# 20. Log redaction

Ordinary logs must not contain:

- Guest email.
- Raw session or share tokens.
- Internal-service credentials.
- Signed upload or download URLs.
- Object-storage credentials.
- Raw storage keys where not required for a protected operator action.
- Database connection strings.
- Raw request bodies containing credentials.
- Binary image or audio bodies.
- Raw Excalidraw scenes.
- Raw Yjs documents or updates.
- Raw awareness payloads.
- Raw rejected-draft or recovery content.

Redaction occurs at the shared logging boundary before serialization.

Error objects are mapped to stable codes and safe context. Public health and API responses do not expose raw stack traces, database errors, or provider credentials.

Guest email may appear only in a deliberately protected application or audit context already authorised by the accepted security architecture. It remains excluded from ordinary operational logs.

---

# 21. Client diagnostics

The web application should provide redacted diagnostics sufficient to investigate:

- Application release identifier.
- Current room ID.
- Connection and synchronisation state.
- Last successful sync time.
- IndexedDB readiness and cache availability.
- Unsynchronised-change indicator.
- Revalidation result.
- Rejected-draft reason and recovery availability.
- Asset lifecycle and failure category.
- Excalidraw adapter or schema error category.
- Browser media failure category.
- Conditional feature failure category.

Client diagnostics must not include:

- Guest email.
- Credentials or tokens.
- Signed URLs.
- Raw scene, Yjs, awareness, recovery, image, or audio content.
- A test-only mutation capability.

For the two-day MVP, browser console capture and QA evidence are sufficient. Automatic remote diagnostic upload is not required.

---

# 22. Operational signals

Proportionate operational signals are:

- API live and ready state.
- Collaboration live and ready state.
- Request and connection error rates observable from logs.
- Collaboration connect, disconnect, load, persistence, and migration results.
- Database and object-storage readiness failures.
- Asset upload and resolution failures.
- Offline revalidation and rejected-draft outcomes.
- Unhandled server and browser errors.
- QA-Intel pass or fail evidence.

A dedicated metrics, tracing, or alerting platform is optional for the hackathon. If the selected hosting platform provides basic log search, process status, and resource graphs, the team may use them without making that platform part of the architecture.

Observability for the MVP is complete through health checks, redacted logs, safe client diagnostics, and QA evidence. No separate observability document is required.

---

# 23. Backup strategy

The two-day MVP uses proportionate backups.

Minimum demo expectations:

- Managed PostgreSQL backups are enabled where the provider supplies them, or a manual logical backup is captured before the final demo deployment and before a risky migration.
- The backup time, environment, and application revision are recorded.
- Private object storage uses provider durability or a documented local durable volume.
- The latest valid collaboration snapshot is included in PostgreSQL recovery.
- Configuration categories are documented, but secret values are not copied into the repository or QA evidence.
- Local development databases may remain disposable.

A database backup without the corresponding private asset objects may restore scene references whose media is unavailable. The recovery process must preserve those scene references and report unavailable assets rather than deleting valid canvas objects.

The MVP does not promise zero data loss or continuous point-in-time recovery.

---

# 24. Recovery strategy

## 24.1 PostgreSQL or collaboration persistence

1. Stop or block new writes to the affected environment.
2. Record the failure and deployed release identifier.
3. Select the latest known-good backup.
4. Restore into an isolated database where practical.
5. Apply only compatible migrations.
6. Validate required tables and constraints.
7. Load a representative collaboration document through the supported adapter path.
8. Verify room membership and permission authority.
9. Verify asset metadata still maps to private objects.
10. Repoint or restart application runtimes only after readiness passes.

A corrupt collaboration snapshot is not returned as an empty successful room. Use a previous known-good snapshot and valid later updates where available, following [Data Model and Persistence](./03-data-model-and-persistence.md#51-recovery-strategy).

## 24.2 Object storage

If metadata exists but a binary is missing:

- Preserve the scene object and stable asset reference.
- Show an unavailable or failed state.
- Record a redacted diagnostic.
- Do not mark the asset ready falsely.

If a binary exists without metadata:

- Keep it private.
- Treat it as orphaned.
- Clean it only after the accepted retention policy allows removal.

## 24.3 Browser offline recovery

IndexedDB recovery is separate from server backup.

- Preserve cached candidate documents and rejected drafts.
- Do not clear site data as a first troubleshooting step.
- Export or otherwise secure a rejected draft before any destructive browser reset.
- Never attach a rejected candidate automatically to a writable room.
- Recovery output remains privacy-filtered.

At least one documented recovery rehearsal must be completed before the final demo. The rehearsal may use isolated representative data rather than the active demo database.

---

# 25. Failure behaviour

| Failure | Required runtime behaviour | Operator response |
| --- | --- | --- |
| Web bundle unavailable | Users cannot load the application; backend data remains unchanged. | Verify hosting status, public configuration, and release artifact; restore the last known-good web build. |
| Invalid web configuration | Show a bounded configuration error; do not send credentials or requests to unintended origins. | Correct public URLs or flags and redeploy the web artifact. |
| API unavailable | New room, permission, and asset-authorisation operations fail with feedback; safe existing collaboration may continue temporarily. | Inspect API liveness, readiness, configuration, database, and storage logs; restart only the API when safe. |
| Collaboration runtime unavailable | Clients enter reconnecting or offline; cached scenes remain visible; eligible local work is preserved. | Inspect collaboration liveness, readiness, persistence, and WebSocket routing; restart the collaboration runtime without clearing client caches. |
| PostgreSQL unavailable | Protected operations and collaboration persistence fail safely; no durable success is claimed. | Stop dependent writes, restore connectivity, then verify schema and readiness before reopening traffic. |
| Object storage unavailable | Shape and text collaboration remains usable; image and audio operations fail or remain pending honestly. | Restore storage access, verify private bucket policy, and retry through the authorised asset path. |
| Migration failure | New runtimes remain not ready; existing data is preserved. | Stop rollout, inspect the migration, and restore or correct through the documented migration process. |
| Permission service unavailable | Protected actions fail closed. | Restore authoritative permission access; never fall back to client role state. |
| IndexedDB unavailable or full | Online work may continue safely; offline readiness and preservation are not claimed. | Preserve any recoverable artifacts, explain the limitation, and avoid destructive cache clearing. |
| Excalidraw or adapter load failure | Show a recoverable error; never present an authentic-looking empty room. | Record redacted diagnostics and retry the compatible scene load. |
| Asset metadata or binary mismatch | Preserve valid scene references and show unavailable media. | Reconcile metadata and storage through the accepted asset recovery policy. |
| Conditional P1 extension failure | Exit or disable the extension; preserve ordinary Excalidraw editing. | Disable the feature flag and keep the mandatory release path available. |

---

# 26. Troubleshooting order

Use this order to avoid destructive or misleading actions:

1. Record the visible error, time, environment, and release identifier.
2. Capture the request ID, connection ID, or stable error code.
3. Check web asset availability and public configuration.
4. Check API and collaboration liveness.
5. Check API and collaboration readiness.
6. Inspect redacted server logs for the correlated identifiers.
7. Check PostgreSQL connectivity and migration version.
8. Check private object-storage access when media is affected.
9. Inspect redacted browser connection, IndexedDB, asset, and recovery state.
10. Preserve rejected drafts and unsynchronised work.
11. Restart only the failed stateless runtime where safe.
12. Use backup recovery only when service restoration cannot preserve authoritative state.

Do not:

- Clear IndexedDB before local work is secured.
- Delete a room or collaboration snapshot to make a load error disappear.
- Make a bucket public to bypass asset authorisation.
- Disable server permission checks to restore collaboration.
- Log or paste credentials into diagnostic artifacts.
- Claim an empty scene, pending asset, or local-only update was recovered remotely.

---

# 27. Demo data and security

The demo uses synthetic identities and content.

Requirements:

- No real guest email or personal data.
- No production sessions, rooms, databases, or buckets.
- Generated share links are treated as bearer credentials and are not published in logs or screenshots unnecessarily.
- The target browser has working microphone support or the approved deterministic test-media setup.
- Required image and audio fixtures are small and known-valid.
- The room is cached in the browser before demonstrating offline reopening.
- Test hooks are enabled only in a separate non-production QA profile when evidence collection requires them.
- The public demo profile keeps test hooks disabled.

Demo convenience does not permit public object storage, client-authoritative roles, or credentials in the browser bundle.

---

# 28. Demo startup procedure

Before presenting:

1. Confirm the intended release identifier.
2. Confirm PostgreSQL backup status.
3. Start or verify PostgreSQL and private object storage.
4. Apply and verify migrations.
5. Start the API and collaboration runtime.
6. Verify API live and ready checks.
7. Verify collaboration live and ready checks.
8. Publish or start the web application.
9. Verify HTTPS, secure WebSocket connectivity, and configured origins in the remote demo.
10. Create fresh synthetic Alice, Bob, and Charlie identities.
11. Create a new room through the product UI.
12. Join Bob as editor and Charlie as viewer.
13. Add and persist a native element.
14. Upload the known-valid image.
15. Record and play the known-valid audio flow.
16. Confirm Charlie cannot publish a scene update.
17. Confirm the room reloads with equivalent scene and media state.
18. Cache the room and confirm IndexedDB readiness.
19. Run the offline and recovery preflight.
20. Record the completed smoke and QA evidence.

Do not reuse a room whose permission, cache, or asset state is uncertain.

---

# 29. Demo verification sequence

The accepted demonstration sequence remains:

```text
Enter as guest
→ Create room
→ Invite editor
→ Collaborate on the Excalidraw scene
→ Add image
→ Add audio
→ Demonstrate viewer restriction
→ Reload and restore the scene
→ Open the cached room offline
→ Make an eligible offline edit
→ Reconnect and reconcile authorised work
→ Make another offline edit
→ Revoke or downgrade that editor from an online client
→ Reconnect without publishing the rejected candidate
→ Show the current authorised room separately
→ Recover the rejected local draft
→ Verify the recovery artifact is privacy-filtered
```

Offline simulation affects only the intended browser context. Other clients and server runtimes remain online so authorised remote activity and permission revocation can be observed.

The demo is complete only when the mandatory automated and QA-Intel evidence described in [Testing and Quality Strategy](./11-testing-and-quality-strategy.md#12-mandatory-qa-intel-suite) is available.

---

# 30. Demo fallback procedure

Fallbacks occur in this order:

## 30.1 Restart the failed application runtime

- Identify the failed web, API, or collaboration unit through health checks and logs.
- Preserve PostgreSQL, object storage, browser caches, and rejected drafts.
- Restart only the failed stateless application unit.
- Re-run readiness and the smoke path.

## 30.2 Use the prevalidated local stack

If the remote host cannot recover in time:

- Start the known local PostgreSQL and private object-storage services.
- Apply the documented migrations.
- Start the web, API, and collaboration runtimes.
- Use separate Chromium contexts on the presenter machine.
- Run the same mandatory demo sequence.
- State clearly that the fallback is a local demonstration.

## 30.3 Present retained QA evidence

If neither live environment is available:

- Present the latest evidence from the same release identifier where available.
- Include traces, screenshots, stable state, browser logs, and pass/fail results.
- State clearly that live service is unavailable.
- Do not describe retained evidence as a successful live demonstration.

No fallback may:

- Reset authoritative data destructively.
- Publish a rejected offline draft.
- Make private assets public.
- Disable permission checks.
- Replace Excalidraw with another renderer.

---

# 31. Security considerations

Before demo readiness:

- Confirm all public origins are explicit.
- Confirm secure cookies or bearer transport follow the accepted session policy.
- Confirm secure WebSocket transport in the remote environment.
- Confirm viewers receive read-only collaboration access.
- Confirm internal control paths require internal authentication and are not public.
- Confirm the object-storage bucket is private.
- Confirm guest email is absent from scene, Yjs, awareness, test hooks, recovery output, exports, and ordinary logs.
- Confirm raw session, share, service, and signed-asset tokens are redacted.
- Confirm recovery and general export boundaries use allowlists.
- Confirm test hooks are absent from the production-shaped build.
- Confirm offline publication waits for current permission validation.

Operational recovery must preserve these controls. Security is not weakened to improve availability.

---

# 32. Operational testing requirements

## 32.1 Configuration tests

Cover:

- Missing required values.
- Invalid URLs and origins.
- Invalid limits.
- Secret assigned to a public web field.
- Unsupported schema version.
- Inconsistent feature flags.
- Test API enabled in a production profile.
- Redacted startup errors.

## 32.2 Migration tests

Cover:

- Empty-database migration.
- Representative populated-database migration.
- Idempotent rerun where supported.
- Unsupported newer or older schema rejection.
- Collaboration-document migration.
- Excalidraw compatibility migration.
- Failed migration preserving recoverable data.

## 32.3 Health tests

Cover:

- Live process with dependencies available.
- Live process with PostgreSQL unavailable.
- Live process with object storage unavailable.
- Collaboration persistence unavailable.
- Invalid required configuration.
- Minimal redacted health responses.
- Recovery from not ready to ready.

## 32.4 Restart and dependency-failure tests

Cover:

- API restart without room loss.
- Collaboration restart with Yjs state reloaded.
- PostgreSQL interruption without false durability claims.
- Object-storage interruption without false asset readiness.
- Web reconnect and IndexedDB preservation.
- Permission revalidation after disconnection.

## 32.5 Backup and recovery test

Complete one documented rehearsal that:

- Restores representative PostgreSQL state.
- Loads a persisted collaboration document.
- Verifies roles remain authoritative.
- Verifies a private asset reference resolves or fails honestly.
- Records the backup time, application revision, result, and limitation.

## 32.6 Release and demo tests

Run:

- Mandatory automated suites.
- Production test-hook absence check.
- Full P0 collaboration and media smoke test.
- Authorised offline reconciliation.
- Permission-revoked local-draft recovery.
- Privacy inspection.
- QA-Intel mandatory suite.

Conditional P1 operational tests run only for enabled capabilities and block only those completion claims.

---

# 33. Known limitations

The MVP deployment accepts:

- One instance of each application runtime.
- Brief downtime during migration or restart.
- Manual or provider-managed backup and restore.
- No automatic failover.
- No formal RPO or RTO.
- No central metrics, tracing, or paging platform requirement.
- No multi-region or distributed scaling.
- Vendor-specific implementation details left to the selected compatible host.
- Local fallback that is demonstrative rather than production-grade.
- Browser-local recovery that may be lost when site data is cleared.
- Object-storage durability that depends on the selected provider or local volume.
- Chromium-first demo support.

These limitations do not permit public assets, secret exposure, client-authoritative permissions, silent data loss, unauthorised offline publication, or removal of the mandatory release evidence.

---

# 34. Definition of done

Deployment and operational readiness is complete when:

- The five minimum logical units can be started in the documented topology.
- Local startup uses the accepted monorepo and Docker Compose model.
- A vendor-neutral demo deployment satisfies HTTPS and secure WebSocket requirements.
- Every runtime validates required configuration and fails safely.
- The browser bundle contains no server secret.
- PostgreSQL is migrated and schema-compatible before application readiness.
- Object storage is private and the mandatory image and audio path is verified.
- API and collaboration liveness and readiness checks behave as documented.
- Structured logs and client diagnostics are useful and redacted.
- Guest email, credentials, tokens, signed URLs, raw scene data, Yjs data, recovery content, and binaries are absent from ordinary logs and health responses.
- A current proportionate backup exists and one recovery rehearsal has been recorded.
- Failure procedures preserve authoritative state and recoverable local drafts.
- The complete P0, QA-Intel, and protected offline-recovery demo preflight passes.
- Test hooks are absent from the production-shaped build.
- Conditional P1 capabilities are enabled only with their applicable test and operational evidence.
- Known limitations are disclosed honestly.

---

# 35. Final operational policy

The MVP deploys as a web application, an HTTP API, a long-lived collaboration runtime, PostgreSQL, and private object storage. Configuration and migrations complete before readiness; permissions remain server-authoritative; failures preserve safe Excalidraw and offline state without claiming false success. Health checks, redacted structured logs, safe client diagnostics, proportionate recovery, and QA evidence provide the required observability for the two-day MVP without introducing unnecessary enterprise infrastructure.

# ADR 0007: Vendor-Neutral Five-Unit Deployment Topology

**Status:** Accepted

**Date:** 2026-07-25

**Decision scope:** Existing accepted architecture

> This ADR records an existing MVP deployment-topology decision from accepted architecture. It does not select a hosting vendor, create new services, define new health contracts, or add enterprise infrastructure.

---

# 1. Context

The application needs static web delivery, authoritative HTTP operations, long-lived WebSocket collaboration, relational persistence, and private binary storage. These responsibilities have different runtime and lifecycle needs, but the two-day MVP does not justify distributed scaling or enterprise orchestration.

The deployment must remain repeatable locally, portable to a compatible demo host, observable enough to diagnose failures, and safe for the mandatory collaboration, media, permission, and offline-recovery paths.

---

# 2. Decision

The MVP deploys as five logical units:

| Unit | Runtime boundary | Primary responsibility |
| --- | --- | --- |
| Web application | Static or edge-hosted React/Vite bundle | Excalidraw UI, Yjs client, IndexedDB, presence, assets, offline and recovery UI. |
| HTTP API | Long-lived NestJS/Fastify Node.js process or container | Sessions, rooms, memberships, permissions, invitations, assets, audit, collaboration bootstrap, and health. |
| Collaboration runtime | Long-lived Hocuspocus/WebSocket Node.js process or container | Authenticated Yjs sync, Awareness, read-only viewers, document persistence, and health. |
| PostgreSQL | Local container or managed database | Application, permission, asset-metadata, audit, and encoded collaboration-persistence records. |
| Private object storage | Local S3-compatible service or managed private bucket | Image, audio, and conditional generated-export binaries. |

These are logical responsibilities, not a requirement for five containers or five vendors. The API and collaboration runtime may share packages and PostgreSQL, but they remain separate processes because request/response HTTP traffic and long-lived WebSocket collaboration have different lifecycles.

Where the API must notify or command the collaboration runtime, the MVP uses a small authenticated internal HTTP control path. It is not publicly routable.

One instance of each application runtime is sufficient. The deployment remains vendor-neutral and requires only:

- HTTPS for the web and API.
- Secure long-lived WebSocket support.
- Environment and secret injection.
- Private PostgreSQL and object-storage connectivity.
- Persistent database storage.
- Runtime logs.
- A one-off migration mechanism.

Local development uses the accepted pnpm/Turborepo task model for application runtimes and Docker Compose where useful for PostgreSQL and S3-compatible object storage.

Required configuration is validated before readiness. Database migrations complete before the API or collaboration runtime accepts dependent traffic.

Operational visibility is proportionate:

- Separate liveness and readiness checks for the API and collaboration runtime.
- Redacted structured server logs.
- Safe client diagnostics.
- Hosting-platform process and resource signals where available.
- Automated and QA-Intel release evidence.

A dedicated metrics, tracing, paging, or observability platform is optional and no separate observability architecture document is required for the MVP.

---

# 3. Consequences

## 3.1 Benefits

- Runtime boundaries match HTTP, WebSocket, relational, and binary-storage lifecycle needs.
- The selected demo host can change without changing application architecture.
- Individual stateless application units can restart without clearing authoritative or local recovery state.
- Health, logs, diagnostics, and QA evidence provide sufficient hackathon observability.
- The system avoids premature distributed coordination.

## 3.2 Costs and trade-offs

- The API and collaboration runtime require authenticated coordination for role, archive, or other accepted control events.
- One runtime instance permits brief downtime and provides no automatic failover.
- Backup and recovery remain manual or provider-managed and have no formal RPO or RTO.
- The team must verify that the selected host supports long-lived WebSockets and private dependencies.

## 3.3 Conditional P1 consequences

Physics, mini-map, radar, recycle bin, archive, and general export are deployed only when implemented and tested. Operational failure of a conditional capability disables or reports that capability without destabilising the mandatory Excalidraw path.

---

# 4. Alternatives already considered

## 4.1 Combined API and collaboration process

Rejected because it conflicts with the selected separate-runtime architecture and couples ordinary HTTP lifecycle to long-lived WebSocket connections.

## 4.2 PostgreSQL notification for MVP control coordination

Not selected because delivery guarantees and operational complexity exceed the small authenticated internal HTTP control path needed by the MVP.

## 4.3 Suspending or request-only hosting for collaboration

Rejected because the collaboration runtime requires long-lived WebSocket connections and must not suspend between ordinary requests.

## 4.4 Kubernetes, microservice expansion, replicas, shared pub/sub, sticky routing, or room sharding

Rejected for the two-day MVP because one instance per application runtime is sufficient and distributed coordination would add risk without a current product requirement.

## 4.5 Mandatory dedicated observability infrastructure

Rejected as unnecessary enterprise complexity. Health checks, redacted logs, safe diagnostics, hosting signals, and QA evidence satisfy the accepted operational need.

---

# 5. Implementation constraints

- The web bundle never connects directly to PostgreSQL and contains no server secret.
- The collaboration host supports secure long-lived WebSockets without ordinary-request suspension.
- Configuration distinguishes public from secret, required from optional, and mandatory MVP from conditional P1 flags.
- Feature flags never replace permission checks.
- PostgreSQL schema compatibility and required migrations gate API and collaboration readiness.
- Private object storage must be ready for the mandatory image and audio path before the demo is considered fully ready.
- Liveness does not depend on external services; readiness validates required dependencies.
- Health responses and logs expose stable categories and identifiers, not raw private state.
- Backups and recovery preserve collaboration snapshots, private asset references, and browser-local rejected drafts.
- Concrete vendor, provider-specific deployment files, exact environment variables, and detailed health response shapes remain outside this ADR.

---

# 6. Failure and security considerations

- Invalid configuration or migration leaves the affected runtime not ready and produces a redacted error.
- API failure blocks new authoritative operations; safe existing collaboration may continue temporarily.
- Collaboration failure moves clients to reconnecting or offline and preserves eligible IndexedDB work.
- PostgreSQL failure prevents protected operations and false durability claims.
- Object-storage failure leaves safe shape and text collaboration available but keeps media non-ready.
- Permission-service failure fails protected actions closed.
- Operational recovery never clears IndexedDB before local work is secured, makes a bucket public, disables permission checks, publishes a rejected draft, or replaces Excalidraw.
- Logs, health responses, and diagnostics exclude guest email, credentials, tokens, signed URLs, raw storage keys, connection strings, raw scenes, Yjs updates, Awareness payloads, recovery content, and binary bodies.

---

# 7. Verification and definition of done

This decision is satisfied when:

- All five logical units start in the documented local and vendor-neutral demo topology.
- The API and collaboration runtime operate as separate long-lived processes.
- Authenticated internal control is unavailable publicly.
- Configuration and migration failures prevent readiness safely.
- API and collaboration liveness and readiness checks behave as accepted.
- Secure web, API, WebSocket, PostgreSQL, and private object-storage paths pass the smoke test.
- Structured logs and client diagnostics are useful and redacted.
- A proportionate backup exists and a representative recovery rehearsal is recorded.
- Restart and dependency-failure tests preserve authoritative state and local drafts.
- The complete P0, mandatory QA-Intel, and protected offline-recovery preflight passes.
- Conditional P1 capabilities are claimed only with their required operational evidence.

---

# 8. Authoritative sources

- [System Architecture](../architecture/01-system-architecture.md)
- [API and Service Boundaries](../architecture/04-api-and-service-boundaries.md)
- [Deployment and Operational Readiness](../architecture/12-deployment-and-operational-readiness.md)

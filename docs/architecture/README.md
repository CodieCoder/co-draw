# Architecture Documentation Index

## Real-Time Collaborative Infinite Canvas

**Document path:** `docs/architecture/README.md`
**Document status:** Accepted
**Product phase:** Two-day MVP / Hackathon
**Last updated:** 25 July 2026
**Primary owners:** Engineering and Architecture

---

# 1. Purpose

This index defines the authoritative architecture reading order, document status, important dependencies, and the acceptance gate for new architecture work.

The architecture implements the accepted product scope:

- P0 collaborative mixed-media canvas.
- Mandatory QA-Intel release validation.
- Offline recovery as the protected differentiator.
- Physics, mini-map, radar, recycle bin, archive, and general export as non-blocking P1 capabilities.

Product scope is authoritative in:

- [Product Requirements](../product/01-product-requirements.md)
- [MVP Scope and Acceptance Criteria](../product/02-mvp-scope-and-acceptance-criteria.md)
- [Canvas Interaction Specification](../product/03-canvas-interaction-specification.md)

---

# 2. Status meanings

| Status     | Meaning                                                                           |
| ---------- | --------------------------------------------------------------------------------- |
| Proposed   | Drafted for review and not yet an accepted source of new architectural decisions. |
| Accepted   | Authoritative for planning and implementation unless superseded explicitly.       |
| Superseded | Retained for history but replaced by a linked accepted document or ADR.           |
| Deprecated | No longer recommended and awaiting removal or archival.                           |

New architecture documents remain `Proposed` until reviewed. Acceptance must be explicit.

---

# 3. Document index

| No. | Document                                                                                               | Purpose                                                                                                                                  | Status   | Important dependencies                   |
| --: | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------- |
|  01 | [System Architecture](./01-system-architecture.md)                                                     | Defines topology, ownership, technology choices, trust boundaries, and implementation slices.                                            | Accepted | Product requirements and MVP scope       |
|  02 | [Collaboration and Synchronisation Design](./02-collaboration-and-sync-design.md)                      | Defines Yjs document structure, Hocuspocus flows, convergence, persistence, offline collaboration, and conditional physics coordination. | Accepted | 01, 05, MVP scope                        |
|  03 | [Data Model and Persistence](./03-data-model-and-persistence.md)                                       | Defines PostgreSQL, object-storage, IndexedDB, lifecycle, consistency, and recovery ownership.                                           | Accepted | 01, 02, product requirements             |
|  04 | [API and Service Boundaries](./04-api-and-service-boundaries.md)                                       | Defines HTTP contracts, application services, permissions, asset routes, errors, and internal controls.                                  | Accepted | 01, 03, MVP scope                        |
|  05 | [Excalidraw Integration Design](./05-excalidraw-integration-design.md)                                 | Defines the adapter boundary and preserves Excalidraw as the sole canvas engine and canonical visual scene.                              | Accepted | 01, 02, canvas interaction specification |
|  06 | [Frontend Architecture](./06-frontend-architecture.md)                                                 | Defines React ownership, routing, stores, feature boundaries, overlays, offline UI, and browser testability.                             | Accepted | 01, 02, 04, 05, 07                       |
|  07 | [Realtime Presence and Awareness](./07-realtime-presence-and-awareness.md)                             | Defines public ephemeral presence, cursors, viewports, selections, privacy, and cleanup.                                                 | Accepted | 02, 06, security requirements            |
|  08 | [Asset and Media Architecture](./08-asset-and-media-architecture.md)                                   | Defines private image and audio lifecycle, binary storage, stable references, resolution, failure handling, and testing.                 | Accepted | 01, 03, 04, 05, 06                       |
|  09 | [Offline Sync and Recovery](./09-offline-sync-and-recovery.md)                                         | Defines the protected offline differentiator, reconnection gate, permission revalidation, reconciliation, and rejected drafts.           | Accepted | 01, 02, 03, 06, 08                       |
|  10 | [Security, Permission, and Privacy Architecture](./10-security-permission-and-privacy-architecture.md) | Defines enforcement order across sessions, rooms, collaboration, awareness, assets, offline recovery, logs, and tests.                   | Accepted | 01–04, 07–09                             |
|  11 | [Testing and Quality Strategy](./11-testing-and-quality-strategy.md)                                   | Defines risk-based TDD, test-level boundaries, mandatory and conditional coverage, stable hooks, QA-Intel evidence, and release quality. | Accepted | Product scope, 01–10                     |
|  12 | [Deployment and Operational Readiness](./12-deployment-and-operational-readiness.md)                   | Defines deployable units, configuration, startup, health, observability, recovery, troubleshooting, and demo operations.                 | Accepted | 01, 03, 04, 08–11                        |

---

# 4. Reading paths

## 4.1 Product or scope work

1. Product Requirements.
2. MVP Scope and Acceptance Criteria.
3. System Architecture.
4. The affected specialised document.

## 4.2 Canvas and collaboration implementation

1. System Architecture.
2. Excalidraw Integration Design.
3. Collaboration and Synchronisation Design.
4. Frontend Architecture.
5. Realtime Presence and Awareness.

## 4.3 Image or audio implementation

1. Asset and Media Architecture.
2. API and Service Boundaries.
3. Data Model and Persistence.
4. Excalidraw Integration Design.
5. Frontend Architecture.

## 4.4 Offline implementation

1. Offline Sync and Recovery.
2. Collaboration and Synchronisation Design.
3. Data Model and Persistence.
4. Frontend Architecture.
5. Security, Permission, and Privacy Architecture.

## 4.5 Security review

1. Security, Permission, and Privacy Architecture.
2. API and Service Boundaries.
3. Collaboration and Synchronisation Design.
4. Realtime Presence and Awareness.
5. Asset and Media Architecture.
6. Offline Sync and Recovery.

## 4.6 Testing and release review

1. MVP Scope and Acceptance Criteria.
2. Testing and Quality Strategy.
3. The affected domain architecture.
4. Security, Permission, and Privacy Architecture.
5. Deployment and Operational Readiness.

## 4.7 Deployment and demo operations

1. Deployment and Operational Readiness.
2. System Architecture.
3. Data Model and Persistence.
4. API and Service Boundaries.
5. Asset and Media Architecture.
6. Offline Sync and Recovery.
7. Security, Permission, and Privacy Architecture.
8. Testing and Quality Strategy.

---

# 5. Ownership hierarchy

When documents overlap, use this precedence:

1. Accepted product scope decides what is mandatory, protected, P1, or P2.
2. Accepted system architecture decides state and service ownership.
3. The accepted domain architecture decides the domain flow.
4. Accepted API, schema, and adapter documents decide concrete interfaces.
5. Proposed documents may clarify but must not silently override accepted decisions.

Any genuine conflict must be reported and resolved in the authoritative document before downstream implementation.

---

# 6. Architecture invariants

Every architecture document must preserve:

- Excalidraw is the only canvas rendering and editing engine.
- The Excalidraw scene is the canonical visual scene.
- The complete scene is not duplicated into React, Zustand, PostgreSQL, or another model.
- Yjs and Hocuspocus own collaborative synchronisation.
- Yjs Awareness owns ephemeral presence.
- PostgreSQL owns application and authorisation data.
- Private object storage owns binary assets.
- IndexedDB owns device-local collaborative cache and recovery artifacts.
- Matter.js is a conditional P1 projection that commits ordinary Excalidraw transforms.
- API and collaboration servers enforce permissions.
- Guest email remains private.

---

# 7. ADR-creation acceptance gate

The second readiness batch is accepted:

- [Testing and Quality Strategy](./11-testing-and-quality-strategy.md) — Accepted.
- [Deployment and Operational Readiness](./12-deployment-and-operational-readiness.md) — Accepted.

The acceptance gate is satisfied. ADRs may now be derived from the accepted architecture without introducing new decisions.

Document 12 includes proportionate health checks, structured logging, diagnostics, failure response, and demo operations. A separate observability document is not planned for the two-day MVP.

A standalone physics architecture document is deferred until P1 physics enters the protected delivery sequence. Existing accepted documents remain authoritative for its current boundary.

---

# 8. ADR policy

Architecture Decision Records use the canonical directory:

```text
docs/adr/
```

ADRs are created only after the relevant architecture documents are accepted. They record decisions already made; they do not introduce new architecture indirectly.

---

# 9. Index maintenance

When an architecture document is added, renamed, accepted, superseded, deprecated, or removed:

1. Update this index in the same change.
2. Preserve document numbering.
3. Update relative links.
4. State the new status explicitly.
5. Identify its important dependencies.
6. Check for scope and ownership contradictions.
7. Record significant new decisions in `docs/adr/` after acceptance.

---

# 10. Definition of done

This index is complete when:

- Every current architecture document appears once.
- Titles, paths, numbers, and statuses match the files.
- Dependencies point to existing documents.
- Mandatory and conditional scope matches accepted product requirements.
- The reading paths direct implementers to the correct authoritative sources.
- The acceptance gate before ADR creation is explicit.
- `docs/adr/` is the only ADR directory named by current guidance.

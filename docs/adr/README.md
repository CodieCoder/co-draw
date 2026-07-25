# Architecture Decision Records

## Real-Time Collaborative Infinite Canvas

**Document path:** `docs/adr/README.md`

**Document status:** Accepted

**Last updated:** 2026-07-25

**Primary owners:** Engineering and Architecture

---

# 1. Purpose

This is the canonical index for Architecture Decision Records (ADRs) in this repository.

The records in this directory preserve significant decisions already established by accepted product and architecture documents. They make those decisions easier to discover without replacing the accepted sources, duplicating detailed contracts, or introducing architecture indirectly.

---

# 2. ADR policy

ADRs follow these rules:

1. An ADR records an existing accepted decision or an explicitly approved new decision.
2. Accepted architecture remains authoritative for detailed interfaces, schemas, flows, and scope.
3. An ADR must identify its authoritative sources and must not silently expand them.
4. Mandatory MVP requirements and conditional P1 consequences remain distinct.
5. Superseded records keep their number and link to the replacing ADR.
6. ADR changes must not introduce a second canvas scene model, client-authoritative permissions, or private-data exposure.

The first batch is marked `Accepted` because every decision was derived from architecture documents already marked `Accepted`.

For an ADR, `Accepted` means the decision is authoritative for planning and implementation until an explicitly linked ADR supersedes it. The linked accepted architecture remains authoritative for detailed contracts and behaviour.

---

# 3. Numbering and filenames

ADR filenames use a four-digit, monotonically increasing number followed by a concise kebab-case title:

```text
NNNN-decision-title.md
```

Numbers are never reused or reassigned. Future records continue with `0008`; existing records are not renumbered when one is superseded or deprecated.

---

# 4. Reading order

Read the [Architecture Documentation Index](../architecture/README.md) and the relevant accepted domain architecture before using an ADR for implementation detail.

Read this first batch in numerical order when orienting to the complete system. For focused work, use the ADR whose decision boundary matches the task, then follow its authoritative source links.

---

# 5. ADR index

| No. | Decision | Status | Date | Primary accepted sources |
| ---: | --- | --- | --- | --- |
| 0001 | [Excalidraw as the Canvas Engine and Canonical Visual Scene](./0001-excalidraw-canvas-engine-and-canonical-visual-scene.md) | Accepted | 2026-07-25 | [System Architecture](../architecture/01-system-architecture.md), [Excalidraw Integration Design](../architecture/05-excalidraw-integration-design.md), [Frontend Architecture](../architecture/06-frontend-architecture.md) |
| 0002 | [Yjs, Hocuspocus, and Awareness for Collaboration](./0002-yjs-hocuspocus-collaboration-and-awareness.md) | Accepted | 2026-07-25 | [System Architecture](../architecture/01-system-architecture.md), [Collaboration and Synchronisation Design](../architecture/02-collaboration-and-sync-design.md), [Realtime Presence and Awareness](../architecture/07-realtime-presence-and-awareness.md) |
| 0003 | [Persistence and Asset Ownership Boundaries](./0003-persistence-and-asset-ownership-boundaries.md) | Accepted | 2026-07-25 | [Data Model and Persistence](../architecture/03-data-model-and-persistence.md), [Asset and Media Architecture](../architecture/08-asset-and-media-architecture.md), [Offline Sync and Recovery](../architecture/09-offline-sync-and-recovery.md) |
| 0004 | [Server-Authoritative Permissions and Private Guest Identity](./0004-server-authoritative-permissions-and-private-guest-identity.md) | Accepted | 2026-07-25 | [API and Service Boundaries](../architecture/04-api-and-service-boundaries.md), [Realtime Presence and Awareness](../architecture/07-realtime-presence-and-awareness.md), [Security, Permission, and Privacy Architecture](../architecture/10-security-permission-and-privacy-architecture.md) |
| 0005 | [Permission-Gated Offline Reconciliation](./0005-permission-gated-offline-reconciliation.md) | Accepted | 2026-07-25 | [MVP Scope and Acceptance Criteria](../product/02-mvp-scope-and-acceptance-criteria.md), [Offline Sync and Recovery](../architecture/09-offline-sync-and-recovery.md), [Security, Permission, and Privacy Architecture](../architecture/10-security-permission-and-privacy-architecture.md) |
| 0006 | [Risk-Based TDD and QA-Intel Release Controls](./0006-risk-based-tdd-and-qa-intel-release-controls.md) | Accepted | 2026-07-25 | [MVP Scope and Acceptance Criteria](../product/02-mvp-scope-and-acceptance-criteria.md), [Testing and Quality Strategy](../architecture/11-testing-and-quality-strategy.md), [Deployment and Operational Readiness](../architecture/12-deployment-and-operational-readiness.md) |
| 0007 | [Vendor-Neutral Five-Unit Deployment Topology](./0007-vendor-neutral-five-unit-deployment-topology.md) | Accepted | 2026-07-25 | [System Architecture](../architecture/01-system-architecture.md), [API and Service Boundaries](../architecture/04-api-and-service-boundaries.md), [Deployment and Operational Readiness](../architecture/12-deployment-and-operational-readiness.md) |

---

# 6. Interface and scope boundary

This ADR batch does not change public APIs, TypeScript types, database schemas, Yjs layouts, runtime configuration, or application behaviour.

The following choices remain intentionally open because the accepted sources do not select them finally:

- Cookie versus explicit bearer transport for guest sessions.
- Direct versus API-proxied asset upload.
- Snapshot-only versus snapshot-plus-incremental Yjs persistence after the first reliable MVP path.
- Concrete hosting vendor.
- Exact globally unique identifier library.

Matter.js remains a conditional P1 projection and does not receive a standalone ADR in this batch.

---

# 7. Index definition of done

This index is complete when:

- Every ADR in `docs/adr/` appears once in numerical order.
- Filenames, titles, dates, and statuses match the records.
- Every link resolves to an existing repository document.
- The records remain traceable to accepted sources.
- Conditional P1 decisions are not presented as MVP release blockers.

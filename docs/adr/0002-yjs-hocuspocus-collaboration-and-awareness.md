# ADR 0002: Yjs, Hocuspocus, and Awareness for Collaboration

**Status:** Accepted

**Date:** 2026-07-25

**Decision scope:** Existing accepted architecture

> This ADR records an existing decision. It does not define a new Yjs layout, WebSocket protocol, persistence schema, or presence interface.

---

# 1. Context

The product requires two or more authorised clients to edit one Excalidraw room concurrently, converge after independent changes, survive reload, and preserve eligible offline work. Collaboration must not publish the complete scene as an opaque replacement for every change or create a second visual scene source of truth.

Presence has different durability and authority requirements from the collaborative document. Cursor, viewport, selection, visibility, and current interaction data must disappear after disconnection and must never decide permissions or durable scene ownership.

---

# 2. Decision

Each room has one Yjs document. Yjs is the collaborative transport and merge layer; Excalidraw remains the canonical visual representation.

The collaborative document stores complete Excalidraw element records at element granularity, shared scene ordering, and the accepted categories of product and document metadata. It does not decompose every element property into an independent application model.

Hocuspocus owns:

- Long-lived WebSocket collaboration connections.
- Authentication and room-access hooks.
- Yjs document hosting, loading, and persistence integration.
- Connection lifecycle and read-only versus writable access.
- Yjs Awareness transport.

Yjs Awareness owns only public ephemeral presence. Awareness may carry validated identity display fields, cursor, viewport, selection, visibility, and current interaction. It is non-authoritative, non-persistent, throttled, and cleaned after disconnect.

The collaboration flow is:

```text
Validated room connection
→ Load one room-scoped Yjs document
→ Adapter reconstructs the Excalidraw scene
→ Local element-level changes enter Yjs transactions
→ Hocuspocus transports and persists updates
→ Remote adapters reconstruct the converged Excalidraw scene

Presence change
→ Publish a validated Awareness update
→ Render a disposable local overlay
→ Remove it when stale or disconnected
```

PostgreSQL persistence ownership is recorded in [ADR 0003](./0003-persistence-and-asset-ownership-boundaries.md). Permission enforcement and offline publication gates are recorded separately in [ADR 0004](./0004-server-authoritative-permissions-and-private-guest-identity.md) and [ADR 0005](./0005-permission-gated-offline-reconciliation.md).

---

# 3. Consequences

## 3.1 Benefits

- Independent elements can merge without replacing unrelated changes.
- Updates remain targeted as room size grows.
- One collaboration path serves online and offline convergence.
- Presence traffic avoids durable scene history and relational audit noise.
- Hocuspocus provides a dedicated lifecycle for long-lived collaboration traffic.

## 3.2 Costs and trade-offs

- The adapter must maintain deterministic ordering and prevent feedback loops.
- Same-element and same-property conflicts still follow deterministic record-level behaviour rather than preserving every intention.
- Yjs guarantees convergence, not semantic correctness for every simultaneous edit.
- Presence rendering requires throttling, validation, stale-state cleanup, and narrow subscriptions.

## 3.3 Conditional P1 consequences

Physics leases may use shared coordination when conditional P1 physics is enabled, but temporary simulation frames do not become a separate collaborative scene. Mini-map and radar may derive from scene and Awareness data without making those projections durable.

---

# 4. Alternatives already considered

## 4.1 Full-scene snapshot publication for every change

Rejected because unrelated concurrent changes can overwrite each other, pointer-driven edits produce large updates, and offline merges become coarse. A complete encoded Yjs state may still be used as a persistence snapshot; that is not the same as publishing an opaque full-scene replacement for every edit.

## 4.2 Decomposing every element into per-property shared structures

Rejected for the MVP because it increases schema and compatibility complexity. Complete Excalidraw records at element granularity preserve targeted collaboration without recreating Excalidraw's internal model.

## 4.3 Durable presence in PostgreSQL, scene data, or product metadata

Rejected because presence is advisory and connection-scoped. Persisting it would create stale collaborators, private-data risk, unnecessary history, and ambiguity about authority.

---

# 5. Implementation constraints

- One room maps to one room-scoped Yjs document and associated Awareness channel.
- Element order must be shared and repaired deterministically without inventing another scene.
- Local and remote transactions must carry distinguishable origins.
- Remote application must not cause a duplicate outbound update.
- React and Zustand may expose narrow derived collaboration status but must not copy the full Yjs document.
- Awareness payloads must be allowlisted, size-bounded, throttled, and initialised from validated connection context.
- Viewers receive document updates and allowed presence through a server-enforced read-only collaboration mode.
- Persistence strategy may begin with debounced complete Yjs state and evolve to snapshots plus incremental updates; this ADR does not select beyond the accepted reliability constraints.
- Detailed Yjs structures and provider interfaces remain in the accepted collaboration architecture.

---

# 6. Failure and security considerations

- Authentication or permission failure prevents document access or writable publication.
- Invalid document content is isolated or reported; it must not crash the room or produce a false empty scene.
- Persistence failure must not be reported as durable success.
- Invalid Awareness fields are rejected or sanitised and never persisted.
- Awareness must not contain guest email, tokens, signed URLs, storage keys, binaries, full scene data, or administrative claims.
- Stale presence disappears after disconnect or bounded expiry.
- Collaboration unavailability moves the client to reconnecting or offline behaviour while preserving eligible local work.

---

# 7. Verification and definition of done

This decision is satisfied when:

- Two isolated authorised clients converge on element additions, changes, deletion policy, and ordering.
- A collaboration-runtime restart reloads equivalent persisted Yjs state.
- A viewer receives scene and allowed Awareness updates but cannot publish durable changes.
- Remote updates apply once and do not create feedback loops.
- Presence is validated, throttled, non-persistent, and cleaned after disconnect.
- Guest email and credentials are absent from the Yjs document, Awareness, test projections, and collaboration logs.
- Offline candidates use the permission gate before writable reconnection.
- Unit, integration, multi-client browser, and applicable QA-Intel checks pass.

---

# 8. Authoritative sources

- [System Architecture](../architecture/01-system-architecture.md)
- [Collaboration and Synchronisation Design](../architecture/02-collaboration-and-sync-design.md)
- [Frontend Architecture](../architecture/06-frontend-architecture.md)
- [Realtime Presence and Awareness](../architecture/07-realtime-presence-and-awareness.md)

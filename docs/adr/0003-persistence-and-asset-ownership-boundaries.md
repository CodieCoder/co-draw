# ADR 0003: Persistence and Asset Ownership Boundaries

**Status:** Accepted

**Date:** 2026-07-25

**Decision scope:** Existing accepted architecture

> This ADR records an existing persistence and asset-ownership decision from accepted architecture. It does not define new tables, Yjs structures, IndexedDB records, storage routes, or upload contracts.

---

# 1. Context

The room contains visual state, collaborative merge state, application and permission data, binary media, and device-local recovery artifacts. These categories have different durability, consistency, privacy, and access requirements.

Assigning the same data to multiple authoritative stores would create conflicting scene models. Putting binaries or temporary access material into shared scene data would also make collaboration updates large and expose private infrastructure details.

---

# 2. Decision

Persistence ownership is divided by state category:

| State category | Authoritative owner | Boundary |
| --- | --- | --- |
| Visual room representation | Excalidraw scene represented through the Yjs document | Canonical visual elements and transforms; never a separately editable relational scene. |
| Current collaborative document | Yjs | Shared elements, ordering, accepted product metadata, and document state. |
| Application and authorisation records | PostgreSQL | Guest sessions, rooms, memberships, roles, share state, asset metadata, audit state, and collaboration-persistence records. |
| Binary image, audio, and conditional export bytes | Private object storage | Room-scoped private bytes outside ordinary PostgreSQL rows and Yjs updates. |
| Device-local collaboration cache and recovery | IndexedDB | Cached Yjs state, advisory room metadata, pending local artifacts, and rejected drafts; never current server authority. |
| Resolved media blobs and object URLs | Browser resolver cache | Disposable, room-scoped derived data released on teardown or permission loss. |

Shared asset references use stable product asset IDs. Image integration maintains the accepted stable mapping between an Excalidraw file identifier and a product asset ID.

Shared scene data and product metadata must not contain:

- Image or audio binary bodies.
- Object-storage credentials.
- Raw storage keys.
- Permanent or temporary signed URLs as durable identifiers.
- Browser object URLs.
- Guest email or session credentials.

The asset flow is:

```text
Server authorises an asset operation
→ PostgreSQL records room-scoped asset metadata and lifecycle
→ Private object storage receives the binary
→ Server validates completion and marks the asset ready
→ Shared scene data references the stable asset ID
→ An authorised client resolves disposable binary data when needed
```

IndexedDB may preserve a new offline binary only when browser persistence is reliable. The binary remains local and non-ready until current access and upload permission are revalidated.

---

# 3. Consequences

## 3.1 Benefits

- Each data category has one explicit authority.
- Collaboration updates remain focused on shared document state rather than binary transfer.
- Assets can be reauthorised without changing durable scene identity.
- PostgreSQL transactions protect application and permission invariants.
- IndexedDB can protect local effort without weakening server authority.

## 3.2 Costs and trade-offs

- Asset metadata and binary storage can become temporarily inconsistent and require honest recovery states.
- Clients need an authorised resolver and room-scoped cache lifecycle.
- Backups must account for PostgreSQL metadata and private object storage together.
- Offline asset support depends on browser quota and may be blocked instead of queued.

## 3.3 Conditional P1 consequences

Recycle-bin retention, room archive, and generated export binaries are conditional P1 concerns. When enabled, they preserve the same ownership and privacy boundaries but do not block the MVP while absent.

---

# 4. Alternatives already considered

## 4.1 A relational table of independently editable live elements

Rejected because it duplicates the Excalidraw/Yjs visual document and creates competing write authorities.

## 4.2 Binary image or audio data in PostgreSQL application rows

Rejected because ordinary relational rows should hold metadata and lifecycle, not large media bytes.

## 4.3 Binary data in ordinary Yjs updates

Rejected because it would inflate collaboration traffic and mix binary access policy with scene convergence.

## 4.4 Signed URLs, storage keys, or browser object URLs as durable asset identity

Rejected because these values are temporary, secret, infrastructure-specific, or process-local. Stable asset IDs survive reauthorisation and cache disposal.

## 4.5 IndexedDB or browser state as server authority

Rejected because device-local metadata, roles, and cached documents can be stale, modified, cleared, or incompatible.

---

# 5. Implementation constraints

- PostgreSQL stores encoded collaboration persistence but does not become a second live-element model.
- The initial reliable persistence path may use debounced complete Yjs snapshots; snapshot-plus-incremental persistence may follow. This ADR does not resolve that accepted implementation choice.
- Direct and API-proxied asset upload remain valid accepted options; this ADR does not select between them.
- Storage keys are generated server-side and must not derive from guest email.
- Asset readiness is authoritative in PostgreSQL; client progress states cannot override it.
- A finished-looking shared image or audio object requires a valid ready asset.
- IndexedDB records and resolver caches remain room-scoped and are cleaned or retained according to the accepted recovery policy.
- Exact tables, record shapes, Yjs structures, endpoint contracts, identifiers, and retention intervals remain defined by their authoritative documents.

---

# 6. Failure and security considerations

- Metadata without a binary remains failed or unavailable; the valid scene reference is preserved.
- A binary without metadata remains private and is cleaned only under the accepted retention policy.
- Object-storage interruption leaves safe shape and text collaboration usable but prevents false asset readiness.
- Signed URL expiry triggers reauthorisation; it does not change durable asset identity.
- IndexedDB quota or persistence failure must remove any claim that local data is safely queued or offline-ready.
- Permission loss aborts or isolates pending room-scoped operations and prevents upload into the room.
- Logs, diagnostics, health responses, tests, scene data, and recovery output exclude credentials, signed URLs, raw storage keys, binaries, guest email, and raw private recovery content.

---

# 7. Verification and definition of done

This decision is satisfied when:

- PostgreSQL, Yjs, private object storage, IndexedDB, and browser caches hold only their assigned state categories.
- No independently editable relational or frontend copy of the complete scene exists.
- Image and audio objects use stable asset identities and survive synchronisation and reload.
- Authorised members resolve ready private assets; unauthorised and cross-room access is rejected.
- Pending, failed, missing, or offline assets never masquerade as ready shared content.
- Cache, quota, database, and object-storage failures preserve valid scene references and report honest state.
- Persistence and asset integration, browser, privacy, and applicable QA-Intel checks pass.

---

# 8. Authoritative sources

- [System Architecture](../architecture/01-system-architecture.md)
- [Data Model and Persistence](../architecture/03-data-model-and-persistence.md)
- [Asset and Media Architecture](../architecture/08-asset-and-media-architecture.md)
- [Offline Sync and Recovery](../architecture/09-offline-sync-and-recovery.md)

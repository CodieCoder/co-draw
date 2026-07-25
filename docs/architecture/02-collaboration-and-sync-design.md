# Collaboration and Synchronisation Design

## Real-Time Collaborative Infinite Canvas

**Document path:** `docs/architecture/02-collaboration-and-sync-design.md`
**Document status:** Accepted
**Product phase:** Two-day MVP / Hackathon
**Last updated:** 25 July 2026
**Primary owners:** Engineering and Architecture

---

# 1. Purpose

This document defines how collaborative room state is represented, synchronised, persisted, recovered, and reconciled.

It covers:

- The canonical collaboration model
- Excalidraw scene representation
- Yjs document structure
- Hocuspocus responsibilities
- Scene update flow
- Awareness and presence
- Persistence
- Conflict resolution
- Offline editing
- Permission enforcement
- Physics interaction leases
- Recycle-bin state
- Recovery after failure
- Testing and observability

The key architectural requirement is:

> The product must support real-time collaboration without creating a second permanent canvas model that can drift from the Excalidraw scene.

---

# 2. Decision summary

The MVP will use:

- Excalidraw as the canonical visual scene format
- Yjs as the collaborative state and merge layer
- Hocuspocus as the collaboration transport and document host
- One Yjs document per room
- Element-level shared state for active Excalidraw elements
- A shared ordered array for scene order
- Separate shared maps for product metadata, deleted objects, and document metadata
- Yjs awareness for presence, cursors, viewports, selections, and transient interaction state
- PostgreSQL-backed Yjs persistence
- IndexedDB-backed client persistence for previously opened rooms
- Explicit server-side room and role validation
- Temporary physics leases stored separately from durable scene state

This design avoids synchronising the entire scene as one opaque snapshot for every change.

---

# 3. Why element-level synchronisation is selected

Two broad synchronisation models were considered.

## 3.1 Full-scene snapshot synchronisation

In this model, each update replaces or republishes the complete Excalidraw scene.

Advantages:

- Simple initial mapping
- Easy scene loading
- Minimal schema design

Disadvantages:

- Concurrent edits can overwrite unrelated changes.
- Scene payloads grow with every element.
- Pointer-driven edits can trigger large updates.
- Ordering conflicts become difficult to isolate.
- Offline merges are coarse.
- One client may replace newer remote state accidentally.

---

## 3.2 Element-level synchronisation

In this model, each Excalidraw element is stored independently in Yjs.

Advantages:

- Changes to separate elements merge independently.
- Updates remain targeted.
- Delete, edit, and order changes can be handled explicitly.
- Offline reconciliation is safer.
- Product metadata can reference stable element IDs.
- Large rooms do not require retransmitting the whole scene for every change.

Disadvantages:

- Requires a stable adapter.
- Scene ordering needs an explicit shared representation.
- Element updates must avoid callback loops.
- Text and same-property conflicts still require clear rules.

---

## 3.3 Final decision

The project will use element-level shared state.

The additional implementation work is justified because collaboration, offline behaviour, and independent element changes are central product requirements.

The implementation should remain intentionally small and should not attempt to recreate Excalidraw internals.

The system synchronises complete Excalidraw element records at element granularity, rather than decomposing every element into individual Yjs properties.

This is an important simplification.

---

# 4. Collaboration boundaries

The system contains four relevant layers.

```text id="0rmx0e"
Excalidraw
    ↓
Excalidraw adapter
    ↓
Yjs room document
    ↓
Hocuspocus transport and persistence
```

## Excalidraw

Owns:

- Scene rendering
- Native interaction
- Local element changes
- Selection
- Text editing
- Native transformations

## Excalidraw adapter

Owns:

- Scene normalisation
- Element comparison
- Local-to-shared change extraction
- Shared-to-local scene reconstruction
- File mapping
- Feedback-loop prevention
- Compatibility with the pinned Excalidraw version

## Yjs room document

Owns:

- Shared active elements
- Shared element order
- Shared product metadata
- Deleted-object records
- Room document metadata
- Temporary shared leases where required

## Hocuspocus

Owns:

- WebSocket connections
- Authentication hooks
- Room access validation
- Document loading
- Document persistence
- Awareness transport
- Connection lifecycle

---

# 5. Room document identity

Each collaborative room maps to one Yjs document.

Document naming format:

```text id="5uy34h"
room:{roomId}
```

Example:

```text id="zg3wsl"
room:01J3Q4F84X8M2A6P7Y9K
```

The room ID must be treated as an identifier, not an authorisation credential.

A client must still present a valid guest session and possess current room access.

---

# 6. Yjs room document structure

The room document uses explicit top-level shared types.

```ts id="4en0u5"
interface RoomYDocSchema {
  elements: Y.Map<StoredExcalidrawElement>;
  elementOrder: Y.Array<string>;
  productObjects: Y.Map<ProductObjectMetadata>;
  deletedObjects: Y.Map<DeletedObjectRecord>;
  documentMetadata: Y.Map<unknown>;
  physicsLeases: Y.Map<PhysicsLease>;
}
```

Recommended keys:

```ts id="9l3qsl"
const ROOM_YJS_KEYS = {
  elements: "elements",
  elementOrder: "elementOrder",
  productObjects: "productObjects",
  deletedObjects: "deletedObjects",
  documentMetadata: "documentMetadata",
  physicsLeases: "physicsLeases",
} as const;
```

All clients and servers must import these names from the shared collaboration-schema package.

---

# 7. Active element storage

## 7.1 Element map

Each active Excalidraw element is stored under its stable Excalidraw element ID.

```text id="jq794j"
elements[elementId] = complete normalised element record
```

Conceptual example:

```ts id="xtrj1e"
interface StoredExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  version: number;
  versionNonce: number;
  isDeleted: boolean;
  updated: number;
  data: Record<string, unknown>;
}
```

The actual record should use public Excalidraw element types where available.

The adapter must preserve all required properties supported by the pinned Excalidraw version.

---

## 7.2 Complete element records

Each map value stores one complete serialisable element record.

The system does not create one Yjs key per Excalidraw property for the MVP.

This provides a practical balance:

- Different elements merge independently.
- The adapter remains manageable.
- Excalidraw-compatible objects can be reconstructed directly.
- Same-element concurrent updates remain deterministic through Yjs transaction order and element version comparison.

---

## 7.3 Element validation

Before an element enters shared state, the adapter must validate:

- ID exists.
- Type is supported.
- Coordinates are finite.
- Dimensions are finite and valid.
- Rotation is finite.
- Required properties exist.
- Unsupported private product data is removed.
- The element is serialisable.

Invalid local elements should not be published.

Invalid remote elements should be quarantined or ignored safely rather than crashing the room.

---

# 8. Shared element order

Excalidraw scene order affects rendering and z-order.

The shared room therefore maintains:

```ts id="mlhs2y"
const elementOrder = ydoc.getArray<string>("elementOrder");
```

The array contains active element IDs in back-to-front scene order.

Example:

```text id="cqzv3f"
[
  "background-element",
  "sticky-note-background",
  "sticky-note-text",
  "foreground-arrow"
]
```

---

## 8.1 Order invariants

The adapter must enforce:

- Each active element ID appears no more than once.
- Deleted element IDs do not remain in active order.
- Unknown IDs are removed during normalisation.
- Missing active IDs are inserted deterministically.
- Relative order from valid remote state is preserved where possible.

---

## 8.2 Z-order changes

Native Excalidraw z-order changes are detected by comparing the new scene order with the shared order.

The changed order is applied in one Yjs transaction.

The product should not publish order updates when the order has not changed.

---

## 8.3 Concurrent order changes

Concurrent z-order changes can produce ambiguous outcomes.

For the MVP:

- Yjs array operations determine the merged sequence.
- Duplicate and missing IDs are repaired through deterministic normalisation.
- The system guarantees convergence, not preservation of every user’s exact simultaneous ordering intent.

---

# 9. Product object metadata

Some product objects consist of one or more Excalidraw elements plus application-owned metadata.

Examples:

- Sticky notes
- Audio cards
- Future specialised objects

Shared map:

```ts id="ud4nm5"
const productObjects = ydoc.getMap<ProductObjectMetadata>("productObjects");
```

Conceptual schema:

```ts id="43g4dp"
interface ProductObjectMetadata {
  id: string;
  kind: "sticky-note" | "audio-card";
  rootElementId: string;
  elementIds: string[];
  assetId?: string;
  schemaVersion: number;
  data: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 9.1 Product object invariants

A product object must:

- Have a stable product object ID.
- Reference existing active or recoverable element IDs.
- Identify one root element.
- Use a supported schema version.
- Avoid storing credentials.
- Avoid storing permanent signed URLs.
- Avoid storing guest email addresses.

---

## 9.2 Orphaned metadata

Metadata is orphaned when none of its referenced elements remain active or recoverable.

Orphaned metadata should be:

- Ignored during rendering
- Reported diagnostically
- Removed during a safe cleanup process

The client should not crash because of orphaned metadata.

---

# 10. Deleted-object storage

Deleted supported content is stored separately from active elements.

```ts id="hjnb6p"
const deletedObjects = ydoc.getMap<DeletedObjectRecord>("deletedObjects");
```

Conceptual schema:

```ts id="6hizbq"
interface DeletedObjectRecord {
  id: string;
  elementIds: string[];
  elements: StoredExcalidrawElement[];
  productObject?: ProductObjectMetadata;
  originalOrder: string[];
  deletedBy: string;
  deletedAt: string;
  schemaVersion: number;
}
```

Deleted records are durable.

They are not rendered in the active Excalidraw scene.

---

# 11. Document metadata

Shared document metadata contains room-document information that belongs with collaborative state.

```ts id="zuiv9f"
interface RoomDocumentMetadata {
  schemaVersion: number;
  excalidrawVersion: string;
  createdAt: string;
  updatedAt: string;
  lastCompactedAt?: string;
}
```

It must not duplicate authoritative relational room metadata such as:

- Owner role
- Archive status
- Guest email
- Membership

Those remain in PostgreSQL and the API domain.

---

# 12. Scene reconstruction

The Excalidraw adapter reconstructs the active scene from:

- `elements`
- `elementOrder`
- Required file mappings
- Supported product metadata

Algorithm:

```text id="tj8df4"
Read shared element order
    ↓
Resolve each ID from element map
    ↓
Discard missing or invalid entries
    ↓
Append valid unordered active elements deterministically
    ↓
Normalise element records
    ↓
Provide scene to Excalidraw
```

The adapter must not mutate remote state merely because it reconstructs the scene.

Repairs to shared state should happen through explicit normalisation transactions.

---

# 13. Local Excalidraw change detection

Excalidraw may invoke its change callback frequently.

The adapter must identify meaningful durable changes.

Possible local changes include:

- Element added
- Element changed
- Element deleted
- Element order changed
- File mapping changed
- Product composition changed

The adapter should ignore or separately handle:

- Local selection changes
- Hover state
- Local viewport movement
- Open panels
- Cursor movement
- Temporary UI state
- Remote-applied scene changes already represented in Yjs

---

# 14. Local-to-shared update algorithm

On an eligible local scene change:

```text id="x5ryhq"
Receive Excalidraw scene callback
    ↓
Check whether callback is remote-applied
    ↓
Normalise active elements
    ↓
Compare with previous local projection
    ↓
Determine added, changed, deleted, and reordered elements
    ↓
Validate current room permission
    ↓
Apply one Yjs transaction
    ↓
Update local projection cache
```

Conceptual transaction:

```ts id="177fnc"
ydoc.transact(() => {
  for (const element of addedOrChangedElements) {
    elementsMap.set(element.id, element);
  }

  for (const elementId of removedElementIds) {
    elementsMap.delete(elementId);
  }

  replaceSharedOrderIfChanged(nextOrder);
}, LOCAL_EXCALIDRAW_ORIGIN);
```

---

# 15. Transaction origins

Yjs transactions should use explicit origins.

Recommended origins:

```ts id="p73krh"
const YJS_ORIGINS = {
  localExcalidraw: "local-excalidraw",
  remoteSync: "remote-sync",
  restoreDeletedObject: "restore-deleted-object",
  physicsSimulation: "physics-simulation",
  offlineReconciliation: "offline-reconciliation",
  documentMigration: "document-migration",
} as const;
```

Transaction origins help:

- Prevent callback loops
- Classify diagnostics
- Support undo policy
- Distinguish physics from ordinary editing
- Improve test assertions

## 15.1 MVP collaborative undo policy

The MVP uses Excalidraw's client-local history for supported visual scene actions.

It does not introduce a room-wide undo stack, shared action log, or user-facing Yjs `UndoManager`. Yjs converges the durable result of an authorised undo or redo; it does not decide which user action should be reversed.

State ownership is:

- Excalidraw owns local undo grouping, redo availability, and keyboard behaviour.
- The Excalidraw adapter distinguishes a local undo or redo result from a remote scene application and publishes only the resulting durable scene difference.
- Yjs owns convergence after that difference is published as an ordinary `local-excalidraw` transaction.
- The API and collaboration server remain authoritative for whether the client may publish.

Required behaviour:

1. A supported local Excalidraw scene action may enter that client's native undo history.
2. Applying a remote Yjs update must not create a user-facing local history entry or a duplicate publication.
3. When an authorised editor invokes undo or redo, the resulting valid scene difference follows the ordinary local-to-shared update path and becomes visible to other clients.
4. Undo never means "reverse the last room transaction" and must not globally reverse an unrelated remote action.
5. Same-element concurrent changes continue to use the accepted whole-element conflict model. The MVP does not promise intention-preserving undo when another client changed the same element after the local action.
6. Product metadata associated with an affected Excalidraw element must remain valid and must be added, changed, or removed in the same Yjs transaction where the scene action requires it.
7. Room archive, membership, permission, invitation, asset-upload, and other application actions do not enter Excalidraw's history.
8. Local history is ephemeral. It is not stored in Yjs, Awareness, PostgreSQL, or the IndexedDB collaborative cache, and availability after reload, browser restart, or rejected-draft recovery is not an MVP guarantee.

Permission and offline rules still apply:

- Viewer mode must not expose a scene undo action that can publish.
- A stale or modified client cannot use undo or redo to bypass collaboration-server write enforcement.
- An offline undo or redo result is an ordinary local candidate. It may enter shared state only after current permission revalidation.
- A rejected offline candidate remains local and recoverable under the accepted rejected-draft policy.

If the adapter cannot apply remote state without corrupting local history, creating a callback loop, or publishing a compensating update, it must preserve the shared Yjs state, report a recoverable local-history limitation, and resynchronise the canvas. It may make the affected local undo entry unavailable; it must not invent a room-wide reversal.

Mandatory verification:

- Alice undoes and redoes a supported local scene action; Bob observes each resulting scene state and both clients retain the final state after reload.
- Bob's unrelated remote element remains unchanged when Alice undoes her own supported action.
- Applying Bob's update does not create a duplicate publication or cause Alice's next undo to reverse Bob's unrelated action.
- A viewer or permission-revoked client cannot publish an undo result.
- Associated product metadata remains valid after supported undo and redo.
- An offline undo candidate follows the permission-revalidation and rejected-draft paths.

---

# 16. Shared-to-local update algorithm

When Yjs shared state changes:

```text id="6vnw8p"
Observe Yjs transaction
    ↓
Ignore changes originating from the already-applied local scene transaction
    ↓
Reconstruct normalised Excalidraw scene
    ↓
Compare with current rendered scene
    ↓
Apply only when meaningfully different
    ↓
Mark update as remote-applied
    ↓
Update Excalidraw through supported API
```

The remote-applied marker prevents the resulting Excalidraw callback from republishing the same state.

---

# 17. Feedback-loop prevention

Without loop prevention, this can occur:

```text id="j4m0h5"
Local scene change
→ Yjs update
→ Excalidraw remote update
→ Excalidraw callback
→ Duplicate Yjs update
```

The adapter must use at least:

- Transaction origins
- Remote-application flag
- Stable scene hashing or element comparison
- Previous projection cache

The application should not rely on timing delays alone.

---

# 18. Awareness and presence

Yjs awareness is used for ephemeral collaborator state.

Suggested payload:

```ts id="tu7cua"
interface CollaboratorAwareness {
  guestId: string;
  username: string;
  colour: string;
  role: "owner" | "editor" | "viewer";

  cursor?: {
    x: number;
    y: number;
  };

  viewport?: {
    scrollX: number;
    scrollY: number;
    zoom: number;
  };

  selectedElementIds?: string[];

  interaction?: {
    type:
      | "drawing"
      | "dragging"
      | "resizing"
      | "rotating"
      | "text-editing"
      | "physics";
    elementIds?: string[];
  };

  updatedAt: number;
}
```

Email is forbidden.

---

# 19. Cursor updates

Cursor position should use world coordinates where practical.

This allows remote cursors to remain correctly positioned under local pan and zoom.

Cursor updates should be:

- Throttled
- Ephemeral
- Excluded from persistence
- Removed after disconnect or timeout

Suggested publication rate:

- Approximately 10–20 updates per second
- Lower when the pointer is idle

Exact values should be tuned through testing.

---

# 20. Viewport awareness

Viewport awareness supports:

- Mini-map
- Collaborator radar
- Optional future follow mode

It should contain only the minimum required data.

```ts id="n7s7p6"
interface SharedViewport {
  scrollX: number;
  scrollY: number;
  zoom: number;
}
```

A collaborator’s viewport is advisory.

It is not durable room state.

---

# 21. Selection awareness

Remote selection may be represented through:

```ts id="gg8yi7"
selectedElementIds: string[];
```

Selection updates should:

- Be throttled where necessary
- Exclude invalid element IDs
- Disappear after disconnect
- Never block local selection
- Remain outside durable scene state

---

# 22. Hocuspocus connection flow

```text id="244npu"
Browser prepares guest session
    ↓
Browser requests room access metadata
    ↓
Browser connects to Hocuspocus
    ↓
Connection supplies room ID and session token
    ↓
Hocuspocus authentication hook validates token
    ↓
Server loads current room and membership
    ↓
Server rejects missing, archived, or forbidden room
    ↓
Server loads Yjs document
    ↓
Client synchronises document
    ↓
Awareness becomes active
```

---

# 23. Collaboration authentication

The collaboration server must validate:

- Guest session is valid.
- Room exists.
- Room is not permanently unavailable.
- Room is not archived for ordinary editing.
- Guest has a current membership or permitted invitation path.
- Requested role is not self-asserted by the browser.

The validated server role should be attached to the connection context.

---

# 24. Viewer update enforcement

Excalidraw view mode prevents ordinary viewer editing in the interface.

That is not sufficient.

The collaboration server must reject unauthorised durable updates.

Possible enforcement approaches include:

## Approach A — Read-only Hocuspocus connection

Viewer connections receive document updates but are prevented from writing.

This is preferred when supported cleanly by the selected Hocuspocus configuration.

## Approach B — Update inspection

The server inspects incoming updates and rejects viewer-originated durable changes.

This is more complex because opaque Yjs updates are difficult to interpret safely.

## Final direction

Use a read-only connection capability or separate authenticated collaboration behaviour for viewers.

Do not rely solely on inspecting arbitrary Yjs binary updates after receipt.

---

# 25. Permission change during connection

When a role changes during an active session:

## Editor becomes viewer

The system should:

1. Update authoritative membership.
2. Notify or invalidate the collaboration connection.
3. Stop accepting durable updates.
4. Reconnect or downgrade the client in read-only mode.
5. Preserve allowed viewing.
6. End active physics leases owned by that client.

## Viewer becomes editor

The system should:

1. Update membership.
2. Notify the client.
3. Reconnect or upgrade the collaboration connection.
4. Enable editing tools.
5. Avoid requiring a full room reload where possible.

For the MVP, controlled reconnect after role change is acceptable.

---

# 26. Persistence strategy

The collaboration server persists Yjs state to PostgreSQL.

The persistence layer should support:

- Incremental Yjs updates
- Periodic snapshots
- Loading after restart
- Safe compaction
- Document versioning

---

# 27. Persistence data model

A practical schema may include:

```text id="x4fr05"
collaboration_documents
collaboration_updates
```

Conceptual tables:

```ts id="komgso"
interface CollaborationDocumentRow {
  roomId: string;
  snapshot: Uint8Array;
  schemaVersion: number;
  updatedAt: Date;
}

interface CollaborationUpdateRow {
  id: string;
  roomId: string;
  sequence: number;
  update: Uint8Array;
  createdAt: Date;
}
```

The exact schema belongs in the database design document.

---

# 28. Snapshot and update flow

Recommended flow:

```text id="pxjiim"
Load latest snapshot
    ↓
Apply later incremental updates
    ↓
Serve reconstructed Yjs document
    ↓
Persist new updates
    ↓
Periodically create compacted snapshot
    ↓
Delete or archive updates included in snapshot
```

For a two-day MVP, a simpler persistence adapter may save the complete encoded Yjs state after a short debounce.

That is acceptable if:

- It survives process restart.
- It does not write on every pointer event.
- It remains reliable for the expected room size.
- The simplification is documented.

---

# 29. Persistence debounce

Scene interactions can produce frequent updates.

Persistence should use:

- Debounce
- Batching
- Transaction grouping
- Explicit flush on room inactivity or shutdown where possible

Suggested initial persistence debounce:

```text id="g3g016"
500–1,500 milliseconds after the latest durable update
```

The exact value should be tested.

The client should not be told that persistence succeeded before the server has accepted the update.

---

# 30. Initial document loading

On room document load:

1. Validate room access.
2. Load latest persisted Yjs state.
3. Apply document migrations.
4. Validate top-level schema.
5. Repair safe structural inconsistencies.
6. Mark document ready.
7. Allow synchronisation.

If the document cannot be loaded safely:

- Do not silently present an empty replacement room.
- Return a recoverable scene-load error.
- Record diagnostics.

---

# 31. Document schema versioning

The room document includes:

```ts id="pq9v6j"
schemaVersion: number;
```

Migrations must be:

- Deterministic
- Idempotent where practical
- Tested
- Applied before ordinary editing
- Recorded through a migration transaction origin

The Excalidraw dependency version should also be recorded separately.

---

# 32. Client-side IndexedDB persistence

The web client should use Yjs IndexedDB persistence for previously opened rooms.

Client storage may include:

- Yjs document updates
- Last normalised scene
- Product metadata
- Last-known room metadata
- Last-known role
- Pending assets
- Rejected local draft metadata

---

# 33. Offline room opening

When opening a previously cached room while offline:

```text id="0wy5lv"
Load local room metadata
    ↓
Load local Yjs document from IndexedDB
    ↓
Reconstruct Excalidraw scene
    ↓
Show Offline state
    ↓
Allow eligible local editing based on last-known role
```

The user must be informed that permission is based on stale local information until reconnection.

---

# 34. Offline editing

Eligible local changes continue to update the local Yjs document.

These changes remain in IndexedDB.

No server authorisation is implied until reconnection.

Allowed offline actions may include:

- Add ordinary elements
- Edit text
- Move
- Resize
- Rotate
- Group
- Ungroup
- Create sticky notes
- Delete locally

Restricted actions may include:

- Permission changes
- Room archive
- Asset authorisation
- Shared physics leases
- Opening uncached rooms

---

# 35. Offline reconnection

Reconnection sequence:

```text id="o33ed0"
Network returns
    ↓
Client enters Reconnecting
    ↓
Guest session is validated
    ↓
Current room membership is validated
    ↓
Collaboration connection is established
    ↓
Local Yjs updates and remote state merge
    ↓
Permission-dependent result is handled
    ↓
Client returns to Connected
```

---

# 36. Offline editor still authorised

When the user remains an editor:

- Local Yjs changes synchronise.
- Remote changes merge.
- Independent elements converge.
- Same-element conflicts resolve deterministically.
- The resulting scene is reconstructed.
- Pending assets resume where supported.

---

# 37. Offline editor loses permission

This case must not allow local changes into the shared room.

Preferred flow:

1. Validate current role before connecting local writable document state.
2. If current role is viewer or denied, do not attach local unsynchronised updates to the shared writable session.
3. Preserve the local Yjs document as a rejected draft.
4. Load the authorised remote scene separately.
5. Offer recovery export.

The client must avoid automatically merging stale writable IndexedDB state before permission validation.

---

# 38. Rejected local draft

A rejected draft should preserve:

- Local Excalidraw elements
- Product metadata
- Creation time
- Original room ID
- Rejection reason
- Last-known role

Recovery options may include:

- Export JSON
- Download scene copy
- Copy selected content into a new room where authorised
- Discard local draft

The protected offline slice must provide at least one local recovery mechanism. A recovery-only JSON download is acceptable, but it does not make general room JSON export part of the mandatory MVP.

---

# 39. Conflict model

The system guarantees eventual convergence, not perfect preservation of every simultaneous intention.

Conflict behaviour is defined by category.

---

# 40. Different elements

When collaborators modify different elements:

- Both changes should be preserved.
- Element-level Yjs entries merge independently.
- Shared order changes are handled separately.

This is the strongest collaboration case.

---

# 41. Same element, different times

Normal later edits replace earlier complete element records according to accepted Yjs transaction ordering and Excalidraw version metadata.

Clients converge on one equivalent record.

---

# 42. Same element, different properties

Because the MVP stores complete element records, simultaneous updates to different properties of the same element may still conflict.

Example:

- Alice changes colour.
- Bob changes position.
- Both edit the same element concurrently.

One complete record may win.

This is a known limitation.

Possible mitigation:

- Compare Excalidraw version fields.
- Merge selected safe independent properties in the adapter.
- Keep interactions short.
- Publish final transformations promptly.

The MVP should not implement a universal property-level merge engine.

---

# 43. Text conflicts

Excalidraw text elements are synchronised as complete element records.

Concurrent character-level text merging is not guaranteed by this architecture.

Expected behaviour:

- Text changes synchronise.
- Clients converge.
- Simultaneous edits to the same text element may result in one committed value winning.
- Independent text elements merge normally.

The interface may use awareness to indicate active text editing and reduce competing edits.

---

# 44. Delete versus edit

Delete wins for the active scene.

When element deletion is observed:

1. Active element is removed from the shared element map.
2. Element ID is removed from shared order.
3. Recoverable record is stored.
4. Later stale edits must not automatically restore the active element.

Restoration must occur through an explicit restore transaction.

---

# 45. Concurrent deletion

If two users delete the same object:

- Only one active deletion result is required.
- Deleted-object metadata should remain valid.
- Duplicate recycle-bin entries should be normalised.

---

# 46. Restore conflicts

If an object is restored while another user modifies recycle-bin state:

- Explicit restore creates a new active state transaction.
- Element IDs may be reused only if safe.
- New IDs may be generated when collision risk exists.
- Product metadata references must be updated atomically.

---

# 47. Order conflicts

Concurrent z-order changes are merged by Yjs array semantics.

After merge, the adapter normalises:

- Duplicate IDs
- Missing IDs
- Deleted IDs
- Unknown IDs

All clients must reach the same repaired order.

---

# 48. Product metadata conflicts

Product metadata entries are keyed by stable product object IDs.

Concurrent changes to separate objects merge independently.

Concurrent changes to the same metadata record resolve deterministically at record granularity.

Sensitive or immutable fields such as `assetId` should not be casually replaced by ordinary visual edits.

---

# 49. Asset synchronisation

Binary asset data is not transmitted through ordinary Yjs scene updates.

The shared scene stores stable identifiers.

Flow:

```text id="sb1ely"
Asset upload authorised
    ↓
Binary stored privately
    ↓
Asset record becomes ready
    ↓
Shared scene references stable asset ID
    ↓
Remote client resolves authorised asset data
```

Asset URLs should be short-lived or generated as needed.

---

# 50. Excalidraw image files

Excalidraw image elements may require file records in the client.

The adapter should maintain a mapping:

```text id="xdh5xv"
Excalidraw file ID
    ↔
Product asset ID
```

On remote load:

1. Read image element file ID.
2. Resolve product asset mapping.
3. Authorise asset access.
4. Fetch or reuse cached binary data.
5. Supply the file to Excalidraw.

The persistent scene must not depend on a temporary signed URL.

---

# 51. Awareness expiry

Awareness state should disappear automatically after disconnect.

The UI should remove:

- Remote cursor
- Remote selection
- Remote viewport
- Interaction indicator
- Radar location

Physics leases require separate explicit expiry rules and must not depend only on awareness disappearance.

---

# 52. Physics lease storage

Physics leases are stored in:

```ts id="u1ecl4"
Y.Map<PhysicsLease>("physicsLeases");
```

Schema:

```ts id="gn3fkv"
interface PhysicsLease {
  elementId: string;
  guestId: string;
  acquiredAt: number;
  expiresAt: number;
  leaseVersion: number;
}
```

Leases are shared coordination records.

They are not part of durable visual scene content.

---

# 53. Physics lease acquisition

A client attempting physics interaction:

1. Checks whether an unexpired lease exists.
2. Starts one Yjs transaction.
3. Claims the lease if absent or expired.
4. Confirms the resulting lease owner.
5. Begins simulation only when ownership is confirmed.

A client must not assume ownership merely because it attempted to write first.

---

# 54. Physics lease renewal

While simulation remains active:

- The owner renews the expiry time periodically.
- Renewal rate must be lower than simulation frame rate.
- The lease duration must tolerate brief network delay.
- Other clients continue treating the owner as authoritative.

Example:

```text id="3g09tg"
Lease duration: 3 seconds
Renewal interval: 1 second
```

Exact values should be tuned.

---

# 55. Physics lease release

A lease is released when:

- The element settles.
- The user exits physics mode.
- The user cancels interaction.
- The client disconnects and the lease expires.
- The user loses edit permission.
- The room is archived.

Explicit release is preferred, but expiry is mandatory.

---

# 56. Physics update flow

```text id="c1a1jq"
Acquire lease
    ↓
Map element to temporary physics body
    ↓
Run local simulation
    ↓
Publish throttled element transforms
    ↓
Remote clients render shared movement
    ↓
Commit final element record
    ↓
Release lease
```

Physics transactions should use the `physics-simulation` origin.

---

# 57. Physics conflicts

Ordinary editing of a leased element should be disabled or rejected while the lease is active.

If another client sends a competing update:

- The lease owner remains authoritative for physics.
- The competing client should receive busy-state feedback.
- Final state converges on the valid physics-owned transform.

The MVP may enforce this primarily through the client and shared lease checks, with server validation added where practical.

---

# 58. Archive behaviour

Archive status remains authoritative in PostgreSQL.

When a room becomes archived:

- Writable collaboration connections must be closed or downgraded.
- New writable connections are rejected.
- Active physics leases are cleared.
- Durable scene remains persisted.
- Awareness may remain only for a read-only archived view if supported.

Yjs document metadata must not override the relational archive state.

---

# 59. Document compaction

Yjs updates may grow over time.

Compaction should:

1. Load current complete document.
2. Encode a fresh snapshot.
3. Persist the snapshot.
4. Record compaction boundary.
5. Remove or archive included incremental updates safely.

Compaction is not required to run frequently during the MVP.

A manual or threshold-based strategy is sufficient.

---

# 60. Reconnection and duplicate clients

The same guest may open the room in multiple tabs.

Each collaboration connection must have a unique client connection ID.

Presence may display multiple connections as:

- One guest with multiple sessions, or
- Separate active sessions

For the MVP, duplicate presence is acceptable if it remains understandable.

Durable permissions remain guest and room based.

---

# 61. Browser refresh

On refresh:

1. Local IndexedDB state becomes available quickly.
2. API validates session and room access.
3. Hocuspocus connects.
4. Yjs synchronises.
5. Excalidraw scene reconstructs.
6. Presence activates.
7. Connection status becomes Connected.

The application should avoid flashing an empty scene before cached or remote state loads where possible.

---

# 62. Collaboration error handling

Stable error codes should include:

```ts id="5x7u8w"
type CollaborationErrorCode =
  | "COLLAB_SESSION_INVALID"
  | "COLLAB_ROOM_NOT_FOUND"
  | "COLLAB_ROOM_ARCHIVED"
  | "COLLAB_PERMISSION_DENIED"
  | "COLLAB_DOCUMENT_LOAD_FAILED"
  | "COLLAB_DOCUMENT_INVALID"
  | "COLLAB_PERSISTENCE_FAILED"
  | "COLLAB_VERSION_UNSUPPORTED"
  | "COLLAB_PHYSICS_LEASE_DENIED";
```

The browser maps these to actionable states.

---

# 63. Observability

## 63.1 Connection logs

Include:

- Connection ID
- Room ID
- Guest ID
- Validated role
- Connection result
- Disconnect reason
- Duration

---

## 63.2 Document logs

Include:

- Room ID
- Load duration
- Snapshot size
- Update size
- Persistence result
- Schema version
- Migration result
- Compaction result

---

## 63.3 Client diagnostics

Include:

- Current room ID
- Connection state
- Last successful sync time
- Pending local update indicator
- IndexedDB readiness
- Excalidraw adapter error
- Rejected draft state
- Physics lease state

Guest email must not appear in ordinary collaboration logs.

---

# 64. Performance requirements

The synchronisation design should support at least 100 ordinary elements.

The system should avoid:

- Republishing the complete scene after every pointer movement
- Persisting cursor awareness
- Persisting local viewport
- Publishing every physics frame
- Reconstructing the scene unnecessarily
- Deep comparing unrelated binary assets
- Reauthorising the same asset on every render
- Writing one database row per pointer event without batching

---

# 65. Update throttling

Suggested initial throttling:

| Update type            | Suggested treatment                   |
| ---------------------- | ------------------------------------- |
| Final element creation | Immediate                             |
| Final text commit      | Immediate                             |
| Active drag            | 10–20 updates per second              |
| Final drag position    | Immediate                             |
| Resize                 | Throttled plus immediate final update |
| Rotate                 | Throttled plus immediate final update |
| Cursor                 | 10–20 updates per second              |
| Viewport               | 5–10 updates per second               |
| Physics                | 10–20 shared updates per second       |
| Persistence            | Debounced or batched                  |

These are initial values, not permanent guarantees.

---

# 66. Testing strategy

## 66.1 Unit tests

Mandatory release coverage:

- Element normalisation
- Scene reconstruction
- Order normalisation
- Product object validation
- Awareness validation
- Conflict helpers
- Feedback-loop prevention helpers
- Local-history origin classification and remote-history suppression
- Offline permission revalidation
- Rejected-draft preservation

Conditional coverage when the corresponding P1 capability is implemented:

- Deleted-object transformation
- Physics lease acquisition and expiry
- General export filtering

---

## 66.2 Integration tests

Mandatory release coverage:

- Two Yjs clients editing separate elements
- Two clients editing the same element
- Order propagation
- Product metadata synchronisation
- Persistence and reload
- Viewer read-only connection
- Local undo and redo propagation without reversing unrelated remote work
- Remote scene application without duplicate publication or local-history capture
- Offline local document recovery
- Authorised offline reconciliation
- Permission-revoked offline rejection and local recovery

Conditional coverage when the corresponding P1 capability is implemented:

- Deletion propagation and recycle-bin recovery
- Archived-room rejection
- Physics lease competition and expiry after disconnect

---

## 66.3 Browser tests

Mandatory release coverage:

- Alice creates a rectangle and Bob sees it.
- Bob moves the rectangle and Alice sees the final position.
- Both reload and see equivalent state.
- Alice undoes and redoes a supported local action without reversing Bob's unrelated element.
- Charlie as viewer cannot modify the room.
- Offline Alice edits and later reconnects.
- Permission-revoked offline draft is preserved.

Conditional coverage when the corresponding P1 capability is implemented:

- Alice throws an eligible element and both clients converge.
- Deleted element can be restored.

---

# 67. QA-Intel inspection support

The test API should expose enough state to verify synchronisation without relying on screenshots.

Recommended additions:

```ts id="6ozx33"
interface CollaborationTestState {
  yjsClientId: number;
  documentName: string;
  documentSchemaVersion: number;
  pendingLocalUpdates: number;
  lastSyncAt?: number;
  persistenceReady: boolean;
  indexedDbReady: boolean;
}
```

The full browser test API may expose:

```ts id="5ue8rf"
interface CanvasTestApi {
  getSceneElements(): unknown[];
  getCustomObjects(): unknown[];
  getDeletedObjects(): unknown[];
  getElementOrder(): string[];
  getCollaborators(): unknown[];
  getConnectionState(): string;
  getCollaborationState(): CollaborationTestState;
  getPhysicsLeases(): unknown[];
}
```

It must remain disabled in production.

---

# 68. First collaboration vertical slice

The first collaboration milestone should implement only:

- One room
- Two editors
- Rectangle creation
- Rectangle movement
- Persistence
- Reload

Required proof:

```gherkin id="efk5bj"
Scenario: Rectangle synchronises and persists
  Given Alice creates a room
  And Bob joins as an editor
  When Alice creates a rectangle
  Then Bob sees the rectangle
  When Bob moves the rectangle
  Then Alice sees the final position
  When both reload the room
  Then both see the rectangle in the final position
```

This proves:

- Excalidraw adapter
- Yjs document
- Hocuspocus connection
- Room authorisation
- Element map
- Element order
- Persistence
- Browser automation

No custom object type should be added before this slice is reliable.

---

# 69. Second collaboration vertical slice

Add:

- Viewer role
- Read-only connection
- Remote cursor
- Remote selection
- Connection-state feedback

Required proof:

```gherkin id="hllysy"
Scenario: Viewer observes but cannot edit
  Given Alice owns the room
  And Charlie joins as a viewer
  When Alice moves an element
  Then Charlie sees the update
  When Charlie attempts to create an element
  Then the shared scene remains unchanged
```

---

# 70. Third collaboration vertical slice

Add:

- Product object metadata
- Sticky note
- Image asset mapping
- Audio card

Required proof:

```gherkin id="khmmyq"
Scenario: Product object metadata remains associated
  Given Alice creates an audio card
  When Bob receives the scene
  Then Bob sees the correct audio card
  And the metadata references the correct elements and asset
  When both reload
  Then the association remains valid
```

---

# 71. Protected offline collaboration slice

Add:

- IndexedDB
- Offline editing
- Permission revalidation
- Rejected draft export

Required proof:

```gherkin id="9txfg1"
Scenario: Revoked offline edit does not enter shared room
  Given Alice edits the cached room offline
  And Alice loses editor access
  When Alice reconnects
  Then the shared room remains unchanged by the rejected edit
  And Alice can recover the local draft
```

---

# 72. Optional P1 physics slice

Add:

- Physics lease
- Throttled physics transforms
- Lease expiry

Required proof:

```gherkin id="leqkk2"
Scenario: One user controls a physics element
  Given Alice and Bob are connected
  When Alice acquires the element lease
  And Alice throws the element
  Then Bob observes the shared movement
  And Bob cannot become a competing owner
  And both converge on the final position
```

---

# 73. Known limitations

The MVP deliberately accepts:

- Same-element simultaneous property edits may overwrite one another.
- Text is not merged character by character.
- Undo and redo are client-local and non-durable; same-element concurrency may limit intention preservation.
- Scene order conflicts preserve convergence rather than every simultaneous intention.
- P1 physics ownership may rely partly on cooperative client behaviour when that feature is enabled.
- Asset availability may lag behind scene metadata briefly.
- Duplicate tabs may appear as separate presence clients.
- Rejected offline drafts may require manual JSON recovery.

These limitations must be documented and tested honestly.

---

# 74. Design definition of done

The collaboration design is implemented successfully when:

- One Yjs document represents one room.
- Active elements are synchronised independently.
- Element order is shared and normalised.
- Product metadata remains associated with the correct elements.
- Remote scene updates do not create feedback loops.
- Viewers receive updates but cannot publish durable changes.
- Scene state survives collaboration-server restart.
- Cached rooms reopen offline.
- Authorised offline changes reconcile.
- Revoked offline changes remain local and recoverable.
- Presence remains ephemeral.
- Guest emails never enter awareness or scene state.
- QA-Intel can verify two-client convergence and persistence.

When P1 physics is implemented, physics leases must expire safely.

---

# 75. Final collaboration policy

The project adopts the following policy:

> Each room is represented by one Yjs document. Excalidraw elements are synchronised as complete records at element granularity, with shared scene order and separate product metadata. Awareness carries only ephemeral presence. Permissions are validated before writable collaboration begins. Offline state may merge only after current access is confirmed. Excalidraw remains the canonical durable visual scene.

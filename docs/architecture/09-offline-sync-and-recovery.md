# Offline Sync and Recovery

## Real-Time Collaborative Infinite Canvas

**Document path:** `docs/architecture/09-offline-sync-and-recovery.md`
**Document status:** Accepted
**Product phase:** Two-day MVP / Hackathon
**Last updated:** 25 July 2026
**Primary owners:** Frontend Engineering, Collaboration Engineering, and Architecture

---

# 1. Purpose

This document defines the protected MVP differentiator for offline room access, local collaborative editing, reconnection, server permission revalidation, conflict handling, and rejected-draft recovery.

It consolidates accepted behaviour from:

- [Product Requirements](../product/01-product-requirements.md)
- [MVP Scope and Acceptance Criteria](../product/02-mvp-scope-and-acceptance-criteria.md)
- [System Architecture](./01-system-architecture.md)
- [Collaboration and Synchronisation Design](./02-collaboration-and-sync-design.md)
- [Data Model and Persistence](./03-data-model-and-persistence.md)
- [Frontend Architecture](./06-frontend-architecture.md)
- [Asset and Media Architecture](./08-asset-and-media-architecture.md)

The Yjs document schema, IndexedDB record shapes, and collaboration protocol in those accepted documents remain authoritative.

---

# 2. Release scope

The MVP release must support:

- Opening a previously cached room without network connectivity.
- Showing that room state is cached and permission information is stale.
- Navigating and performing eligible ordinary Excalidraw edits.
- Persisting those edits locally through Yjs IndexedDB storage.
- Detecting reconnection without relying on `navigator.onLine` alone.
- Validating the current guest session, room, and membership before publishing local work.
- Reconciling authorised work through Yjs.
- Keeping rejected work local and recoverable.
- Loading the current authorised remote room separately after rejection.
- Queuing or blocking offline asset operations honestly.
- QA-Intel evidence for authorised reconciliation and permission-revoked recovery.

The MVP does not promise:

- Opening a room that was never cached on the device.
- Server-authorised room administration while offline.
- Guaranteed preservation after the user clears site data.
- Unlimited IndexedDB storage.
- Perfect semantic merging of simultaneous same-property edits.
- Background sync after the browser process is terminated.
- General room export; only a recovery-specific local download is mandatory.

---

# 3. Definitions

## Cached room

A room that was opened successfully while online and whose compatible room metadata and Yjs collaborative state exist in IndexedDB on the current device.

## Last-known role

The role observed during the most recent authorised online access. It is advisory while offline and never authorises server writes.

## Unsynchronised changes

Local Yjs updates created after the last confirmed server synchronisation.

## Candidate offline document

The local room document containing cached state and any unsynchronised changes. It must not be attached to a writable server connection until current access is validated.

## Rejected draft

A device-local snapshot of work that cannot enter the shared room because current permission, room state, access, or schema compatibility rejects it.

## Authorised room document

The current remote room state loaded after the server validates the guest session and room access.

---

# 4. State ownership

| State                         | Owner                                       | Authority                                           |
| ----------------------------- | ------------------------------------------- | --------------------------------------------------- |
| Durable visual scene          | Excalidraw scene represented in Yjs         | Canonical collaborative canvas state.               |
| Collaborative offline updates | Yjs document persisted by IndexedDB         | Local candidate until server access is revalidated. |
| Cached room metadata          | IndexedDB room cache                        | Advisory and device-local.                          |
| Current room and membership   | PostgreSQL through API/collaboration server | Authoritative on reconnect.                         |
| Current write capability      | Collaboration server                        | Server-authoritative.                               |
| Connection and recovery UI    | Frontend local state                        | Derived; not an authorisation source.               |
| Rejected draft                | IndexedDB rejected-draft store              | Local recovery artifact; never auto-published.      |
| Pending offline asset binary  | IndexedDB upload queue, when supported      | Local and non-ready.                                |
| Presence                      | Yjs Awareness                               | Ephemeral and unavailable while disconnected.       |

React or Zustand must not hold a second editable copy of the complete scene.

---

# 5. Core invariants

1. Excalidraw remains the only canvas editing and rendering engine.
2. Yjs remains the collaborative state model online and offline.
3. Cached metadata and last-known role are never server authority.
4. Unsynchronised local updates must not reach the shared room before current access is validated.
5. A rejected draft must never reconnect automatically to the writable room document.
6. Permission revocation protects shared state without silently discarding local work.
7. An uncached or incompatible room must not appear as a valid empty room.
8. Offline state and unsynchronised state must be visible to the user.
9. Binary uploads must not appear ready before server-authorised completion.
10. Guest email remains outside Yjs state, awareness, recovery downloads, test APIs, and ordinary logs.

---

# 6. Cache prerequisites

A room is eligible for offline reopening only after an online opening has completed:

1. Guest session validation.
2. Room and membership validation.
3. Collaboration bootstrap.
4. Yjs document load.
5. IndexedDB provider initialisation.
6. Excalidraw scene reconstruction.
7. Compatible collaboration and Excalidraw version metadata storage.
8. Confirmation that the local cache represents the intended room.

The UI must not describe a room as offline-ready merely because a route or room name was cached.

---

# 7. Connection-state interpretation

The client combines:

- Browser network signal.
- API reachability.
- Hocuspocus connection state.
- Yjs synchronisation state.
- IndexedDB readiness.
- Last successful server validation.

`navigator.onLine` is only a hint.

User-visible behaviour distinguishes at least:

- Initialising local cache.
- Connected and synchronised.
- Reconnecting.
- Offline with cached room.
- Offline without cached room.
- Access denied.
- Recovery required.

The interface must not claim “saved” when changes exist only on the device. It should distinguish local preservation from confirmed remote synchronisation.

---

# 8. Offline room opening

```text
Room route opens without confirmed connectivity
    ↓
Read cached room metadata
    ↓
Verify room ID and supported schema/version metadata
    ↓
Load the room-scoped Yjs document from IndexedDB
    ↓
Reconstruct the Excalidraw scene
    ↓
Show Offline and stale-permission notice
    ↓
Enable only eligible local actions
```

If the cache is missing, corrupt, or incompatible:

- Do not create a replacement empty scene.
- Explain why the room cannot open offline.
- Preserve recoverable cache data where feasible.
- Retry online validation when connectivity returns.

---

# 9. Eligible and restricted offline actions

## 9.1 Eligible

Subject to the last-known role and compatible local state, the client may allow:

- Pan and zoom.
- Add ordinary Excalidraw elements.
- Edit text.
- Move, resize, and rotate.
- Group and ungroup.
- Create supported sticky-note compositions.
- Delete locally.
- Use ordinary local undo and redo supported by the integration.

These actions update the local Yjs candidate document and IndexedDB.

## 9.2 Restricted

The client disables or defers operations that require current server authority:

- Role or membership changes.
- Share-link creation or revocation.
- Room archive or restore.
- Opening uncached rooms.
- Shared physics lease acquisition.
- Server-authorised general export.
- Asset upload authorisation.

An image or audio binary may be queued locally only under the asset policy. It must remain visibly pending and local.

---

# 10. Local persistence

The Yjs IndexedDB provider persists:

- Cached collaborative updates.
- Unsynchronised local updates.
- Product metadata.
- Compatible room/document version data.

Separate IndexedDB stores own:

- Cached room metadata.
- Pending asset uploads.
- Asset cache entries.
- Rejected-draft metadata and state.

The accepted conceptual records are defined in [Data Model and Persistence](./03-data-model-and-persistence.md#36-client-side-indexeddb-model). This document does not introduce alternate record shapes.

Writes should:

- Remain room-scoped.
- Surface quota or persistence failure.
- Avoid blocking ordinary interaction longer than necessary.
- Record enough status to distinguish local preservation from remote acknowledgement.

---

# 11. Reconnection gate

The client must prevent outbound publication while current access is unknown.

```text
Connectivity appears available
    ↓
Enter Reconnecting
    ↓
Freeze writable server attachment
    ↓
Validate guest session
    ↓
Load current room status and membership
    ↓
Choose authorised or rejected path
```

Validation occurs before the candidate offline document is attached to a writable Hocuspocus session.

The browser must not:

- Trust a locally modified role.
- Merge first and ask permission later.
- Use awareness as proof of access.
- Treat a successful network request unrelated to the room as room authorisation.

---

# 12. Authorised reconciliation

If the current room is writable by the guest:

1. Establish the authenticated collaboration connection.
2. Attach the candidate Yjs document through the supported provider path.
3. Exchange local and remote Yjs updates.
4. Apply the accepted conflict policy.
5. Reconstruct the resulting Excalidraw scene through the adapter.
6. Resume pending assets only after separate upload authorisation.
7. Wait for confirmed synchronisation.
8. Clear the unsynchronised indicator.
9. Keep the local cache as the current room cache.

Yjs guarantees convergence, not preservation of every simultaneous intention.

Conflict behaviour remains:

- Independent elements merge independently.
- Record-level changes use the accepted deterministic Yjs strategy.
- Delete versus edit follows the accepted tombstone policy where P1 recycle recovery exists.
- Excalidraw element order is normalised.
- Invalid product metadata is isolated without replacing a valid scene with an empty scene.

---

# 13. Permission-revoked or denied path

If the current role is viewer, the room is unavailable, or access is denied:

1. Do not attach the candidate offline document to a writable remote provider.
2. Freeze and snapshot the local candidate state.
3. Store a rejected-draft record with the accepted rejection reason.
4. Load the current authorised remote room separately when viewing remains allowed.
5. Enter read-only or access-denied UI as appropriate.
6. Display a persistent recovery notice.
7. Offer the mandatory recovery action.
8. Require explicit confirmation before discard.

The shared room remains unchanged by the rejected local updates.

If the guest is now a viewer, the local role shown by the client must change to viewer after validation. The previous editor role remains only as rejected-draft metadata.

---

# 14. Rejected-draft recovery

A rejected draft preserves:

- Original room ID.
- Local Yjs state.
- Product metadata contained by that state.
- Creation and rejection times.
- Rejection reason.
- Last-known role.
- Recovery status.

At least one recovery mechanism is mandatory:

- Download a recovery-only JSON scene package.

Additional supported options may include:

- Copy selected valid content into a new authorised room.
- Download another supported local scene format.
- Discard after explicit confirmation.

The recovery download must exclude:

- Guest email.
- Session and share tokens.
- Awareness state.
- Signed asset URLs.
- Object-storage credentials.
- Internal connection metadata.

A recovery-only JSON download does not imply that general room JSON export is part of P0.

---

# 15. Schema and version compatibility

Cached metadata records:

- Collaboration schema version.
- Excalidraw version.
- Cache time.

On offline opening:

- Apply only accepted deterministic local migrations.
- If a safe migration does not exist, do not edit the candidate as though compatible.
- Preserve the data and show a schema-incompatible recovery state.

On reconnect:

- Server-supported schema remains authoritative.
- A schema-incompatible local document becomes a rejected draft.
- Migration failure must not produce an empty shared scene.

---

# 16. Offline asset behaviour

Previously resolved blobs may be loaded from a room-scoped cache.

For a new binary:

- Queue only when IndexedDB persistence and quota are available.
- Keep a stable local queue ID separate from any future server asset ID.
- Do not insert a ready shared reference.
- Revalidate upload permission after reconnect.
- Create the authoritative asset record only after successful authorisation.
- Preserve or discard the binary according to the rejected-draft decision if permission is lost.

Quota failure, unsupported persistence, or browser limitations must produce an honest blocked or failed state.

---

# 17. Multi-tab and room isolation

Each room cache and rejected draft is keyed by room.

Room navigation must:

- Disconnect the previous collaboration provider.
- Destroy previous room observers.
- Clear room-scoped UI stores.
- Preserve pending recovery records.
- Avoid attaching the previous room's candidate document to the next room.

Multiple tabs may produce separate awareness connections. They must not cause rejected offline changes from one tab to bypass the reconnection gate in another.

Where practical, tabs should coordinate local cache ownership or at least detect concurrent room activity and avoid destructive cleanup.

---

# 18. Failure behaviour

| Failure                                               | Required behaviour                                                                                          |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| IndexedDB unavailable at first online load            | Continue online if safe, disclose that offline recovery is unavailable, and do not claim offline readiness. |
| IndexedDB write or quota failure                      | Keep the current scene usable, show local-persistence failure, and stop claiming changes are preserved.     |
| Cached room missing                                   | Explain that the room is unavailable offline; never show a false empty room.                                |
| Cache corruption                                      | Preserve recoverable bytes, block unsafe editing, and retry authoritative online load.                      |
| API unavailable during reconnect                      | Remain offline or reconnecting; do not publish candidate updates.                                           |
| Session expired                                       | Preserve the candidate as local recovery data and require a valid session before room access.               |
| Membership revoked                                    | Reject publication, create a recoverable draft, and protect shared state.                                   |
| Room archived under P1                                | Treat the candidate as rejected and open only an authorised read-only room.                                 |
| Collaboration server unavailable after API validation | Remain reconnecting; do not report remote save success.                                                     |
| Yjs merge or adapter reconstruction fails             | Preserve both candidate and remote state, record diagnostics, and avoid showing an empty scene as success.  |
| Schema incompatible                                   | Preserve a rejected draft with `schema-incompatible` reason.                                                |
| Pending asset cannot resume                           | Keep it local and visibly failed or pending; do not mark it ready.                                          |

---

# 19. Security and privacy

Offline support widens the trust boundary to device-local storage.

Rules:

- IndexedDB is a convenience cache, not a secure server database.
- Last-known role is never authorisation.
- Session tokens and share tokens must follow the accepted session-storage policy and must not be copied into recovery downloads.
- Guest email must not be stored in Yjs, awareness, rejected scene payloads, or general diagnostics.
- A user with device access may be able to inspect local room content; the MVP does not claim encrypted-at-rest browser storage.
- Clearing site data may destroy local recovery artifacts.
- Permission revalidation precedes any writable server attachment.
- Rejected drafts never auto-publish.
- Test hooks expose status and counts, not private draft content or secrets.

---

# 20. Performance and storage

The implementation should:

- Use Yjs incremental local persistence rather than serialising the full scene on every pointer movement.
- Debounce derived room-cache metadata updates.
- Avoid repeatedly reconstructing the scene when only connection status changes.
- Bound pending upload size and retry count.
- Expose storage quota failures.
- Clean obsolete caches only after the user no longer needs recovery.
- Retain newly rejected drafts until export or explicit discard.

The MVP does not require background compaction or cross-device offline cache transfer.

---

# 21. Diagnostics

Useful diagnostics include:

- Room ID.
- Connection state.
- IndexedDB readiness.
- Cache availability.
- Collaboration schema version.
- Excalidraw version.
- Unsynchronised update indicator or count.
- Last successful sync time.
- Revalidation result.
- Rejected-draft reason and status.
- Pending asset count.
- Request ID for server validation.

Do not include:

- Guest email.
- Raw tokens.
- Signed URLs.
- Raw scene or rejected-draft content in ordinary logs.

---

# 22. Testing requirements

## 22.1 Unit tests

Cover:

- Cache eligibility.
- Connection-state derivation.
- Eligible and restricted offline action policy.
- Reconnection gate ordering.
- Permission-revalidation branching.
- Rejected-draft creation.
- Recovery privacy filtering.
- Schema-incompatible handling.
- Pending asset queue state.

## 22.2 Integration tests

Cover:

- Yjs IndexedDB reload.
- Authorised candidate and remote-state convergence.
- Role changed from editor to viewer before reconnect.
- Access denied before reconnect.
- Server unavailable during revalidation.
- Schema migration success and rejection.
- Room-scoped cache isolation.
- Rejected draft never attaching to writable collaboration.

## 22.3 Browser and QA-Intel tests

Mandatory scenarios:

1. Open a previously cached room offline and display the cached scene.
2. Refuse to present an uncached room as a valid empty room.
3. Edit an eligible element offline, reconnect as editor, and observe convergence in a second client.
4. Edit offline, revoke permission from another client, reconnect, and prove the shared room is unchanged by the rejected update.
5. Export or otherwise recover the rejected local draft.
6. Confirm the recovery artifact excludes email, tokens, awareness, and signed URLs.
7. Fail IndexedDB or quota and show honest local-persistence status.
8. Queue or block a new offline asset honestly.

QA evidence must include stable application state, traces, browser logs, and relevant network results.

---

# 23. Known limitations

The MVP accepts:

- Offline access only for previously opened rooms on the same device and browser profile.
- Device-local storage that may be cleared by the browser or user.
- No encrypted-at-rest IndexedDB guarantee.
- No background synchronisation guarantee after browser termination.
- Record-level conflict resolution rather than character-level collaborative text merging.
- Recovery-only JSON instead of full general export.
- Manual recovery workflow after permission rejection.
- Offline asset upload may be blocked.
- Multiple tabs may appear as separate collaborators after reconnection.

---

# 24. Suggested implementation sequence

1. Online room cache initialisation.
2. Offline cached-room opening.
3. Local eligible editing and unsynchronised status.
4. Reconnection gate and current permission validation.
5. Authorised Yjs reconciliation.
6. Rejected-draft isolation and recovery.
7. Offline asset policy.
8. Failure, quota, and schema handling.
9. QA-Intel acceptance evidence.

No later step may weaken the permission-before-publication invariant.

---

# 25. Definition of done

The protected offline differentiator is complete when:

- A previously opened compatible room loads from IndexedDB while offline.
- An uncached room is never represented as an authentic empty room.
- Eligible Excalidraw edits persist locally.
- Local-only and remotely synchronised states are visibly distinct.
- Reconnection validates the current session, room, and membership before writable attachment.
- Authorised changes converge with remote state.
- Revoked or denied changes never enter the shared room.
- Rejected work remains local and recoverable.
- The authorised remote room loads separately after rejection.
- Recovery output excludes private and ephemeral data.
- Offline assets are queued or blocked honestly.
- Schema, storage, and network failures preserve recoverable work where feasible.
- Required unit, integration, browser, and QA-Intel scenarios pass.

---

# 26. Final offline policy

IndexedDB and Yjs preserve local collaborative work, but they never grant server authority. Every reconnect validates current access before publishing local updates. Authorised work converges through the normal Yjs path; unauthorised or incompatible work becomes an isolated, recoverable local draft. The system protects both shared-room integrity and the user's local effort without introducing another canvas scene model.

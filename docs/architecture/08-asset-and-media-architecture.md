# Asset and Media Architecture

## Real-Time Collaborative Infinite Canvas

**Document path:** `docs/architecture/08-asset-and-media-architecture.md`
**Document status:** Accepted
**Product phase:** Two-day MVP / Hackathon
**Last updated:** 25 July 2026
**Primary owners:** Frontend Engineering, API Engineering, and Architecture

---

# 1. Purpose

This document defines how image and audio assets are authorised, uploaded, stored, referenced from the collaborative canvas, resolved by other clients, cached, and recovered after failure.

It consolidates the asset rules already accepted in:

- [Product Requirements](../product/01-product-requirements.md)
- [MVP Scope and Acceptance Criteria](../product/02-mvp-scope-and-acceptance-criteria.md)
- [System Architecture](./01-system-architecture.md)
- [Collaboration and Synchronisation Design](./02-collaboration-and-sync-design.md)
- [Data Model and Persistence](./03-data-model-and-persistence.md)
- [API and Service Boundaries](./04-api-and-service-boundaries.md)
- [Excalidraw Integration Design](./05-excalidraw-integration-design.md)
- [Frontend Architecture](./06-frontend-architecture.md)

The endpoint and database definitions in those accepted documents remain authoritative. This document defines the end-to-end control flow and ownership rules; it does not create a second API or schema catalog.

---

# 2. Scope

## 2.1 Mandatory MVP

The mandatory asset scope is:

- Private image upload and retrieval.
- Private browser-recorded audio upload and playback.
- Image and audio references that synchronise through the shared room.
- Persistence after reload.
- Honest pending and failed states.
- Owner and editor upload authorisation.
- Authorised room-member retrieval.
- File-type and size validation.
- QA-Intel evidence for image sharing and audio playback.

## 2.2 Protected offline behaviour

Offline asset behaviour must be honest:

- A new binary may be queued locally only when the implementation can preserve it reliably.
- Otherwise, the operation is blocked with actionable feedback.
- A queued or failed upload must never appear successfully shared.
- Previously resolved binary data may be reused from a local cache.

Detailed offline ownership is defined in [Offline Sync and Recovery](./09-offline-sync-and-recovery.md).

## 2.3 Conditional P1 scope

The following are not MVP release blockers:

- General room exports.
- Recycle-bin asset retention.
- Room-archive asset behaviour.
- Background processing.
- Advanced retry automation.
- CDN delivery or asset transformations.

When implemented, these capabilities must preserve the security and ownership invariants in this document.

---

# 3. State ownership

| State                         | Authoritative owner                            | Notes                                                                            |
| ----------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| Visual image element          | Excalidraw scene                               | Uses an Excalidraw file identifier and ordinary element geometry.                |
| Audio-card visual composition | Excalidraw scene                               | Remains valid Excalidraw content.                                                |
| Product asset reference       | Yjs product metadata or stable adapter mapping | Stores a stable asset ID, never credentials or temporary URLs.                   |
| Asset metadata and lifecycle  | PostgreSQL                                     | Owns room, creator, kind, status, MIME type, size, and derived metadata.         |
| Binary bytes                  | Private object storage                         | Never stored in PostgreSQL or ordinary Yjs updates.                              |
| Access decision               | API and asset service                          | Derived from current session, room, membership, room state, and asset ownership. |
| Resolved blob and object URL  | Browser asset resolver                         | Cached and derived; disposable on teardown.                                      |
| Pending offline binary        | IndexedDB, when supported                      | Device-local and not evidence of successful sharing.                             |
| Microphone stream             | Browser media APIs                             | Ephemeral and released when recording ends or the room unmounts.                 |

No layer may duplicate the full Excalidraw scene to manage assets.

---

# 4. Core invariants

1. The Excalidraw scene remains the canonical visual scene.
2. Binary bytes never travel through ordinary Yjs scene updates.
3. Shared scene data contains stable identifiers, not object-storage credentials.
4. A temporary signed URL is never a durable asset identifier.
5. An asset is shareable only after its metadata is in a valid `ready` state.
6. Asset access is room-scoped and server-authorised on every resolution path.
7. A pending or failed binary must not appear as a successfully shared object.
8. Image and audio objects remain usable Excalidraw compositions even when their binary is temporarily unavailable.
9. Guest email must not appear in storage keys, filenames exposed to collaborators, scene metadata, exports, or ordinary logs.
10. Deleting a canvas object does not immediately destroy a binary that may still be referenced or recoverable.

---

# 5. Asset identity and references

Each persistent binary has a stable product `assetId`.

Images additionally require a stable mapping:

```text
Excalidraw file ID
    ↔
Product asset ID
```

The mapping may live in product metadata or another adapter-owned room record already defined by the accepted collaboration schema.

The durable mapping must not contain:

- Signed read URLs.
- Signed upload URLs.
- Object-storage credentials.
- Raw storage secrets.
- Guest email.
- Browser object URLs.

Audio cards reference the stable product `assetId`. Playback UI may be a DOM overlay, but the card's durable visual representation remains ordinary Excalidraw scene content.

---

# 6. Asset lifecycle

The accepted lifecycle is:

```text
pending
    ↓
uploading
    ↓
ready
```

Failure and retry are:

```text
pending or uploading
    ↓
failed
    ↓
uploading
    ↓
ready
```

`archived` is reserved for conditional P1 retention behaviour.

Rules:

- Only the server-side asset service changes authoritative lifecycle state.
- Completion validates the current asset row and, where practical, confirms the storage object exists.
- Invalid transitions are rejected.
- The client may derive local states such as `queued` or `uploading`, but those states do not override PostgreSQL.
- Shared metadata may reference an asset only when the UI can represent its non-ready state honestly; a finished-looking image or audio card requires `ready`.

---

# 7. Validation policy

The API validates:

- Current guest session.
- Current room access.
- Owner or editor role for upload.
- Asset kind.
- MIME type.
- Configured size limit.
- Reasonable filename length.
- Room ownership of an existing asset.
- Valid lifecycle transition.

The service must not trust:

- File extensions alone.
- Browser-provided dimensions or duration as security evidence.
- A client-provided storage key.
- A client-provided role.
- A client claim that upload completed.

Initial format and size policy remains configuration-driven. The accepted defaults are documented in [API and Service Boundaries](./04-api-and-service-boundaries.md#26-recommended-mvp-asset-limits).

---

# 8. Common upload flow

```text
Editor selects or records a binary
    ↓
Browser performs advisory local validation
    ↓
Browser requests room-scoped upload authorisation
    ↓
API validates current session, room, role, kind, MIME type, and size
    ↓
API creates a pending asset record and generated storage key
    ↓
Browser uploads through the selected direct or API-proxy path
    ↓
Browser requests completion
    ↓
API validates the asset and storage result
    ↓
API marks the asset ready
    ↓
Canvas adapter publishes the stable asset reference
```

The direct-upload and API-proxy variants defined in [API and Service Boundaries](./04-api-and-service-boundaries.md#24-asset-upload-authorisation) are both valid. The implementation selects one path for the MVP and must not expose two inconsistent client behaviours.

---

# 9. Image insertion

The image flow is:

1. Validate the selected file locally for fast feedback.
2. Complete the authoritative upload flow.
3. Resolve the ready binary.
4. register the binary through supported Excalidraw file APIs.
5. Create an Excalidraw image element using the mapped file ID.
6. Publish the element and stable product mapping through the normal collaboration path.
7. Verify that a second authorised client resolves and renders the image.

A local pending placeholder may be displayed during upload.

The placeholder:

- Is local or explicitly marked pending.
- Must not look successfully shared.
- Must be replaced only after authoritative readiness.
- Must remain recoverable or removable after failure.

Remote clients that receive a reference before their binary resolves keep the element and show a bounded loading or unavailable state. They must not delete valid scene data because resolution failed.

---

# 10. Audio recording and playback

## 10.1 Recording

```text
Editor selects audio tool
    ↓
Browser requests microphone permission
    ↓
Recording indicator and elapsed time become visible
    ↓
Editor stops recording
    ↓
Media stream stops
    ↓
Recorded blob enters the common upload flow
    ↓
Ready asset is associated with an audio-card composition
```

If microphone permission is denied or the browser lacks required support:

- Recording does not start.
- No asset record is falsely completed.
- The user receives actionable feedback.
- Ordinary canvas editing remains available.

## 10.2 Playback

Playback requires current room access and a ready asset.

The browser:

1. Resolves the asset through the authorised content path.
2. Reuses a room-scoped cached blob where valid.
3. Creates or reuses a disposable object URL.
4. Plays through local media controls.
5. Revokes object URLs during invalidation or teardown.

Playback position is local and ephemeral. It is not stored in the Excalidraw scene, Yjs document, or awareness unless a later accepted feature explicitly introduces shared playback.

---

# 11. Remote asset resolution

The browser asset resolver follows this flow:

```text
Shared element or product metadata contains asset ID
    ↓
Check room-scoped blob cache
    ↓
If absent, request authorised asset metadata or content
    ↓
API validates current room access and asset ownership
    ↓
Browser receives an authenticated stream or short-lived URL
    ↓
Browser materialises a Blob and disposable object URL
    ↓
Adapter supplies image data to Excalidraw or playback data to audio controls
```

Resolution must be idempotent from the caller's perspective. Concurrent requests for the same asset should share in-flight work where practical.

On room change, logout, permission loss, or resolver disposal:

- Abort unnecessary requests.
- Revoke object URLs.
- Clear room-scoped references.
- Retain only offline cache entries governed by the offline policy.

---

# 12. Offline and reconnection behaviour

Previously cached assets may remain viewable offline.

For a new image or audio operation while offline:

- Queue the binary in IndexedDB only if browser quota and persistence are available.
- Record the local room ID, kind, MIME type, creation time, retry count, and status.
- Keep the object visibly pending and local.
- Revalidate the guest session, room, membership, and upload permission before resuming.
- Create authoritative asset metadata only after server access is available.

If queuing is unsupported or quota fails:

- Keep ordinary canvas work available.
- Do not create a ready shared reference.
- Explain that the upload requires reconnection.
- Allow the user to retry or discard the local pending item.

If permission is lost before upload resumes, the binary remains part of the rejected local recovery context and must not be uploaded to the room.

---

# 13. Retention and cleanup

Mandatory MVP cleanup covers abandoned non-ready uploads.

The service may remove failed or pending objects after the configured retention interval only when:

- No ready asset row references the object.
- No active upload owns the object.
- No protected recovery record requires it.

Conditional P1 recycle-bin or archive retention must preserve referenced binaries until the associated recovery state is permanently removed.

Orphan cases:

- Metadata without binary becomes `failed` or unavailable; the scene object is preserved.
- Binary without metadata remains private and is cleaned after a safe retention interval.
- A temporary signed URL expiring does not change asset readiness; the client resolves a new authorised URL.

---

# 14. Failure behaviour

| Failure                               | Required behaviour                                                                           |
| ------------------------------------- | -------------------------------------------------------------------------------------------- |
| Local validation fails                | Reject before upload and show an actionable reason.                                          |
| Authorisation fails                   | Do not create or resume a room asset; preserve any local binary only as local recovery data. |
| Upload transport fails                | Keep the asset non-ready, show failure, and allow bounded retry.                             |
| Completion validation fails           | Do not mark the asset ready.                                                                 |
| Object storage is unavailable         | Shapes and text remain usable; asset operations fail honestly.                               |
| Metadata exists but binary is missing | Preserve scene references, show unavailable state, and record diagnostics.                   |
| Binary resolves but decode fails      | Preserve the object, show fallback, and avoid retry loops.                                   |
| Signed URL expires                    | Reauthorise and retry once through the resolver.                                             |
| IndexedDB quota is exceeded           | Stop claiming the binary is queued and show recovery guidance.                               |
| Microphone permission is denied       | Do not start recording; keep the canvas usable.                                              |
| Room changes during upload            | Cancel or detach the room-scoped operation without publishing into the new room.             |

Failure in asset or media extensions must not make a valid Excalidraw scene appear empty.

---

# 15. Security and privacy

The asset path treats the browser and filenames as untrusted.

Required controls:

- Private object storage by default.
- Generated storage keys that contain room and asset IDs, not guest email.
- Short-lived signed URLs or authenticated streaming.
- Server-side membership checks for reads and writes.
- Owner or editor checks for upload.
- MIME and size validation at the API boundary.
- Appropriate response `Content-Type`.
- No raw tokens, signed URLs, storage keys, or binary bodies in ordinary logs.
- No permanent asset URL in Excalidraw scene data or Yjs metadata.
- No unsafe HTML generated from filenames or user metadata.
- Test APIs exclude signed URLs, tokens, storage keys, and email.

Possession of a previously issued URL must not grant indefinite access.

---

# 16. Performance and resource management

The MVP should:

- Avoid embedding binaries in Yjs updates.
- Cache resolved blobs by room and stable asset ID.
- Deduplicate concurrent resolution.
- Revoke unused object URLs.
- Stop media streams promptly.
- Avoid decoding the same image or audio repeatedly.
- Keep upload progress out of the canonical scene.
- Bound retries and pending-queue concurrency.

Optimisation remains evidence-driven. CDN delivery, transformation pipelines, and background processors are deferred.

---

# 17. Diagnostics and observability

Asset diagnostics may include:

- Request ID.
- Room ID.
- Asset ID.
- Asset kind.
- Lifecycle transition.
- Size and MIME category.
- Upload or resolution duration.
- Failure code.
- Retry count.

Diagnostics must exclude:

- Guest email.
- Raw session or share tokens.
- Signed URLs.
- Object-storage credentials.
- Binary bodies.

The UI should expose enough status for QA-Intel to distinguish `pending`, `ready`, `failed`, cached, and unavailable states without exposing private infrastructure data.

---

# 18. Testing requirements

## 18.1 Unit tests

Cover:

- Lifecycle transition validation.
- File-kind, MIME, and size policy.
- Storage-key generation without private data.
- Excalidraw file ID to asset ID mapping.
- Resolver cache and invalidation.
- Object URL disposal.
- Pending placeholder behaviour.
- Audio recorder state transitions.

## 18.2 Integration tests

Cover:

- Owner and editor upload authorisation.
- Viewer upload rejection.
- Authorised member retrieval.
- Unauthorised retrieval rejection.
- Pending-to-ready transaction.
- Failed upload and retry.
- Storage object missing during completion.
- Metadata without binary and orphaned binary handling.
- Room-scoped asset isolation.

## 18.3 Browser and QA-Intel tests

Mandatory scenarios:

1. Alice uploads an image; Bob sees it; Bob reloads and still sees it.
2. An unsupported image is rejected without a completed scene object.
3. An unauthorised guest cannot resolve a private asset.
4. Alice records audio; Bob sees the card and can play it.
5. Microphone denial leaves ordinary canvas editing usable.
6. Upload failure remains visibly failed or pending rather than successfully shared.
7. A cached asset remains available during a supported offline reopening.
8. A new offline asset is queued or blocked honestly.

Evidence should include stable test-state inspection, network results, browser logs, and traces. Screenshots alone are insufficient.

---

# 19. Known limitations

The MVP accepts:

- Browser-dependent recording formats.
- No transcoding pipeline.
- No waveform generation requirement.
- No resumable multipart upload requirement.
- No CDN requirement.
- No server-side virus-scanning pipeline unless the deployment environment already provides one.
- Offline asset upload may be blocked instead of queued.
- Temporary asset unavailability may show a fallback while the valid scene object remains.
- General exports and advanced retention remain P1.

These limitations must be disclosed honestly and must not weaken room authorisation or privacy controls.

---

# 20. Suggested implementation sequence

1. Asset metadata and private storage integration.
2. Upload authorisation and completion.
3. Authorised asset resolution.
4. Image file mapping and insertion.
5. Audio recording, upload, card creation, and playback.
6. Failure and retry UI.
7. Offline cache and honest pending behaviour.
8. Automated and QA-Intel validation.

Each step must preserve ordinary Excalidraw editing while incomplete.

---

# 21. Definition of done

The mandatory asset and media architecture is implemented successfully when:

- Images and audio are stored as private binaries outside Yjs and PostgreSQL rows.
- PostgreSQL owns authoritative asset metadata and lifecycle.
- Shared scene data contains stable asset identifiers and no temporary URLs or credentials.
- Owner and editor uploads are authorised by the server.
- Viewers cannot upload.
- Authorised room members can resolve ready assets.
- Unauthorised users cannot resolve room assets.
- Image and audio objects synchronise and survive reload.
- Pending and failed uploads never appear successfully shared.
- Microphone denial and storage failure do not break the canvas.
- Offline upload is queued or blocked honestly.
- Resolver resources and media streams are cleaned up.
- Guest email and secrets are absent from scene data, storage keys, public contracts, tests, and ordinary logs.
- Required unit, integration, browser, and QA-Intel scenarios pass.

---

# 22. Final asset policy

Binary assets are private room-scoped resources. PostgreSQL owns their metadata and lifecycle, private object storage owns their bytes, Yjs and the Excalidraw adapter carry only stable references, and the browser owns disposable resolution caches. No pending, failed, unauthorised, or temporary asset state may masquerade as durable shared content.

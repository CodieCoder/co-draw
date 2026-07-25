# Security, Permission, and Privacy Architecture

## Real-Time Collaborative Infinite Canvas

**Document path:** `docs/architecture/10-security-permission-and-privacy-architecture.md`
**Document status:** Accepted
**Product phase:** Two-day MVP / Hackathon
**Last updated:** 25 July 2026
**Primary owners:** API Engineering, Collaboration Engineering, Frontend Engineering, and Architecture

---

# 1. Purpose

This document defines the security boundaries for guest sessions, room membership, share links, HTTP APIs, collaboration connections, awareness, assets, offline recovery, logging, testing, and conditional P1 capabilities.

It consolidates accepted policy from:

- [Product Requirements](../product/01-product-requirements.md)
- [MVP Scope and Acceptance Criteria](../product/02-mvp-scope-and-acceptance-criteria.md)
- [System Architecture](./01-system-architecture.md)
- [Collaboration and Synchronisation Design](./02-collaboration-and-sync-design.md)
- [Data Model and Persistence](./03-data-model-and-persistence.md)
- [API and Service Boundaries](./04-api-and-service-boundaries.md)
- [Realtime Presence and Awareness](./07-realtime-presence-and-awareness.md)
- [Asset and Media Architecture](./08-asset-and-media-architecture.md)
- [Offline Sync and Recovery](./09-offline-sync-and-recovery.md)

The accepted API contracts and database schemas remain authoritative. This document defines enforcement order and cross-runtime policy.

---

# 2. Scope

## 2.1 Mandatory MVP controls

- Guest-session creation, restoration, expiry, and revocation.
- Private handling of required, unverified guest email.
- Owner, editor, and viewer permissions.
- Server-authoritative API and collaboration access.
- Read-only viewer collaboration.
- Secure share-link handling.
- Private asset upload and retrieval.
- Awareness payload validation.
- Permission revalidation before offline changes publish.
- Secret and token redaction.
- Security-focused automated and QA-Intel tests.

## 2.2 Conditional P1 controls

When the related capability is implemented:

- Archived rooms reject writes.
- Recycle-bin restore is authorised.
- General exports are authorised and privacy-filtered.
- Shared physics leases require an editor or owner.
- Mini-map and radar consume only authorised awareness data.

These controls are mandatory for the feature but do not make the feature an MVP release blocker.

## 2.3 Explicit non-goals

The MVP does not provide:

- Verified email ownership.
- Password accounts.
- Enterprise single sign-on.
- Organisation administration.
- Multi-region security infrastructure.
- End-to-end encrypted room content.
- Encrypted-at-rest IndexedDB guarantees.
- A full malware-analysis pipeline unless supplied by the deployment environment.

---

# 3. Security objectives

The system must:

1. Prevent a client from granting itself room privileges.
2. Prevent viewers from publishing durable scene or product-metadata changes.
3. Prevent unauthorised users from reading room metadata, collaboration state, or private assets.
4. Keep guest email private.
5. Keep session, share, service, and signed-asset tokens secret.
6. Preserve shared-room integrity when offline permission changes.
7. Validate all public inputs at the receiving server boundary.
8. Keep ephemeral awareness separate from durable or authoritative state.
9. Fail closed for protected actions while preserving ordinary safe canvas use where possible.
10. Provide enough redacted diagnostics to investigate failures.

---

# 4. Trust boundaries

| Boundary                                   | Trust level                              | Responsibilities                                                                                                                   |
| ------------------------------------------ | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Browser and local storage                  | Untrusted                                | Presents UI, holds an opaque session credential, renders Excalidraw, and stores advisory offline state.                            |
| HTTP API                                   | Trusted application boundary             | Validates sessions, rooms, roles, capabilities, assets, invitations, and protected mutations.                                      |
| Collaboration server                       | Trusted collaboration boundary           | Authenticates room connections, enforces writable versus read-only access, validates awareness, and persists Yjs state.            |
| PostgreSQL                                 | Private infrastructure                   | Stores guests, session hashes, rooms, memberships, share-token hashes, asset metadata, audit state, and collaboration persistence. |
| Object storage                             | Private infrastructure                   | Stores binary assets and conditional generated exports.                                                                            |
| IndexedDB                                  | Device-local cache                       | Stores Yjs cache, pending assets, and rejected drafts; never grants current server authority.                                      |
| Yjs Awareness                              | Authorised but non-authoritative channel | Transports validated minimum ephemeral presence only.                                                                              |
| Internal API-to-collaboration control path | Trusted service boundary                 | Uses explicit internal authentication and is not publicly routable.                                                                |
| QA and test hooks                          | Test-only boundary                       | Exposes redacted stable state and is disabled in production.                                                                       |

---

# 5. Data classification

## 5.1 Public within an authorised room

- Guest ID where needed for collaboration.
- Username.
- Collaborator colour.
- Server-derived room role.
- Cursor, viewport, selection, visibility, and current interaction.
- Shared Excalidraw elements.
- Product metadata required to render shared objects.
- Stable asset identifiers.

“Public” here means visible to authorised room participants, not publicly accessible on the internet.

## 5.2 Private application data

- Guest email.
- Guest-session records.
- Membership administration history.
- Audit records.
- Storage keys.
- Rejected offline draft content.
- IP or user-agent-derived security metadata.

## 5.3 Secrets

- Raw session tokens.
- Raw share tokens.
- Internal service credentials.
- Object-storage credentials.
- Signed upload and download URLs.
- Database credentials.

## 5.4 Ephemeral data

- Awareness state.
- Playback position.
- Browser object URLs.
- Upload progress.
- Reconnect timers.
- Temporary physics interaction labels.

Ephemeral data must not become durable scene or audit history by accident.

---

# 6. Guest identity and email privacy

The guest provides:

- Username.
- Email.

The email is:

- Required by the accepted product decision.
- Normalised before storage.
- Unverified.
- Not proof that the guest owns the address.
- Not a basis for granting room access.
- Private application data.

Room access depends on the current session and membership, not an email match.

Guest email must never appear in:

- Excalidraw elements or scene metadata.
- Yjs collaborative state.
- Yjs Awareness.
- Cursor or collaborator labels.
- Public room and membership interfaces.
- General room exports.
- Rejected-draft recovery output.
- Test APIs.
- Object-storage keys.
- Ordinary structured logs.

Username is the visible collaborator label and must be validated and safely rendered as text, never as trusted HTML.

---

# 7. Guest sessions

The accepted session model uses an opaque raw token and a server-side token hash.

Required controls:

- Generate tokens with cryptographically secure randomness.
- Store only the hash in PostgreSQL.
- Validate expiry, revocation, and guest-disabled state.
- Rotate or replace the token when session policy requires.
- Never include raw tokens in logs or error responses.
- Clear or invalidate the browser credential on explicit session termination.

The browser storage mechanism must match the selected application transport.

If cookie transport is used:

- Apply `HttpOnly` and `Secure` in production.
- Select an appropriate `SameSite` policy.
- Protect state-changing requests against cross-site request forgery where the cookie policy does not already prevent it.

If explicit bearer transport is used:

- Do not persist the token in scene, Yjs, awareness, URLs, or test output.
- Apply the narrowest practical browser storage lifetime.

The implementation must document the selected transport before application code is considered complete.

---

# 8. Rooms, membership, and capabilities

The authoritative roles are:

```text
owner
editor
viewer
```

Capabilities derive from:

- Current authenticated guest.
- Current active membership.
- Current room state.
- Product configuration.
- Feature availability.

The browser may render server-derived capabilities, but local capability state is not authority.

Minimum rules:

- Owner: edit, invite, manage roles, and upload.
- Editor: edit and upload.
- Viewer: view, pan, zoom, observe authorised presence, and play authorised audio.
- Viewer: no durable scene change, upload, recording, role change, or shared physics action.
- A share link never grants owner.
- The final active owner cannot be removed through supported membership operations.

Conditional P1 archive, restore, recycle, export, and physics permissions follow the accepted matrix in [API and Service Boundaries](./04-api-and-service-boundaries.md#52-authorisation-matrix).

---

# 9. Share-link security

A share link is a bearer invitation capability.

Required controls:

- Generate an unpredictable raw token.
- Store only its hash.
- Limit the granted role to editor or viewer.
- Support expiry, revocation, usage limit, or configured combinations.
- Validate the link before creating membership.
- Never log the raw token.
- Never return the token from list endpoints after creation.
- Avoid leaking the token through analytics, error reports, or third-party requests.
- Use an appropriate referrer policy on invitation pages.

Possessing a room ID without a valid session and membership or invitation is insufficient for access.

Revoking a share link prevents future use. It does not silently revoke memberships already created through that link unless an accepted product change adds that behaviour.

---

# 10. HTTP API enforcement

Every protected API request follows:

```text
Receive request
    ↓
Attach request ID
    ↓
Validate authentication
    ↓
Validate route and body schema
    ↓
Load current room and membership
    ↓
Derive server capabilities
    ↓
Enforce operation-specific permission
    ↓
Execute transaction or service operation
    ↓
Write required audit event
    ↓
Return redacted response
```

Controllers do not own permission policy. The shared permission service and application services do.

The API must reject:

- Client-provided authoritative roles.
- Cross-room asset identifiers.
- Unsupported state transitions.
- Unsafe upload types or sizes.
- Mutations against unavailable or forbidden rooms.
- Conditional P1 archive or restore operations by non-owners.

Errors use stable codes and request IDs without revealing token values, database details, storage keys, or private email.

---

# 11. Collaboration authentication and authorisation

The Hocuspocus connection supplies the room identifier and current guest-session credential through the selected secure transport.

Before document or awareness access, the collaboration server validates:

- Guest session.
- Room existence and current state.
- Current membership.
- Current role.
- Requested access mode.

The validated server role is stored in connection context.

The browser cannot choose its own role.

## 11.1 Editors and owners

Writable connections may publish validated durable Yjs updates and allowed awareness.

## 11.2 Viewers

Viewers receive document updates and publish allowed presence, but cannot publish durable room changes.

Preferred enforcement is a read-only Hocuspocus connection or another provider-supported authenticated read-only mode. Relying only on Excalidraw view mode is insufficient.

The system must not depend on semantic inspection of arbitrary opaque Yjs updates as the primary viewer security control.

---

# 12. Active permission changes

When a membership role changes:

```text
API commits authoritative role
    ↓
Collaboration runtime receives authenticated control notification or revalidates
    ↓
Affected connection is downgraded, upgraded, or disconnected
    ↓
Client refreshes server-derived capabilities
```

Editor to viewer:

- Stop accepting durable updates.
- Reconnect or downgrade to read-only.
- Preserve allowed viewing and presence.
- End conditional shared physics leases.

Viewer to editor:

- Revalidate membership.
- Reconnect or upgrade through the supported provider flow.
- Enable editing only after server confirmation.

A controlled reconnect is acceptable for the MVP.

---

# 13. Offline permission revalidation

Offline state is advisory.

Before local candidate updates can publish:

1. Validate the guest session.
2. Validate current room state.
3. Validate current membership and role.
4. Attach the local Yjs candidate only when current write capability exists.

If access is denied or downgraded:

- Do not attach the candidate to a writable room connection.
- Preserve it as a rejected local draft.
- Load authorised remote state separately.
- Offer privacy-filtered recovery.

This ordering is mandatory and is defined fully in [Offline Sync and Recovery](./09-offline-sync-and-recovery.md).

---

# 14. Awareness privacy and validation

Awareness accepts only the minimum approved ephemeral schema.

Allowed categories include:

- Public guest ID.
- Username.
- Colour.
- Server-derived role.
- Cursor.
- Viewport.
- Selection.
- Visibility.
- Current interaction.

Rejected categories include:

- Email.
- Tokens.
- Signed URLs.
- Storage keys.
- Full scene data.
- Room-administration state.
- Permission claims that override server context.

The collaboration server validates payload shape, types, length, and allowed fields. Invalid awareness must be rejected or sanitised without persisting it.

Awareness expiry does not grant or revoke durable permission and does not replace explicit lease or membership rules.

---

# 15. Asset security

Asset access requires:

- Valid current session.
- Current room access.
- Asset belonging to the room.
- Appropriate role for upload.
- Valid asset lifecycle state.

Controls:

- Private object storage.
- Generated storage keys.
- Short-lived signed URLs or authenticated proxy streaming.
- MIME and size validation.
- No temporary URL in scene or Yjs state.
- No binary body in ordinary logs.
- Room-scoped browser caching.

Possession of an expired or copied URL must not provide indefinite access.

Detailed flow is defined in [Asset and Media Architecture](./08-asset-and-media-architecture.md).

---

# 16. Input and content safety

Public boundaries validate:

- Route identifiers.
- Request bodies.
- Guest username and email format.
- Share-link token format before hashing and lookup.
- Asset kind, MIME type, filename length, and size.
- Awareness payload.
- Collaboration bootstrap inputs.
- Conditional recovery and export parameters.

Rendering rules:

- Treat usernames and filenames as text.
- Do not render user input through unsafe HTML.
- Use supported Excalidraw APIs for scene content.
- Validate product metadata before associating it with scene elements.
- Reject unsupported or invalid scene payloads without displaying a false empty room.

---

# 17. Secrets and configuration

Secrets belong in runtime environment configuration or the deployment platform's secret mechanism.

Do not commit or expose:

- Database credentials.
- Object-storage credentials.
- Internal service tokens.
- Session-signing material.
- Raw test-user tokens.

The web bundle may contain only public runtime configuration.

Internal API-to-collaboration control endpoints:

- Are not publicly routable.
- Require an internal shared secret, signed service token, or private workload identity.
- Validate the target room and operation.
- Carry request IDs.
- Redact credentials from logs.

---

# 18. Logging, diagnostics, and audit

## 18.1 Structured logs

Useful fields include:

- Request or connection ID.
- Room ID.
- Guest ID.
- Server-derived role.
- Route or collaboration operation.
- Result.
- Duration.
- Stable error code.

Do not log:

- Guest email by default.
- Raw session or share tokens.
- Signed asset URLs.
- Object-storage credentials.
- Raw Yjs documents.
- Raw rejected-draft content.
- Binary request bodies.

## 18.2 Audit events

Audit security-relevant application changes already listed in the accepted API architecture, including:

- Room creation.
- Membership creation and role change.
- Share-link creation, use, and revocation.
- Asset lifecycle failures where meaningful.
- Conditional archive and restore.
- Reported rejected offline drafts where the server receives an event.

Ordinary pointer movement, scene edits, cursor movement, and playback do not require relational audit events.

---

# 19. Exports, recovery output, and privacy filtering

Every output path applies an explicit allowlist.

Mandatory recovery output includes only the local scene and product metadata needed for user recovery.

It excludes:

- Guest email.
- Session and share tokens.
- Awareness.
- Signed asset URLs.
- Storage keys and credentials.
- Request and connection diagnostics.

Conditional P1 room exports apply the same exclusion policy.

Privacy filtering belongs in the export or recovery boundary, not in an assumption that private data never reached the input. Tests must inspect output directly.

---

# 20. Abuse controls

The MVP uses proportionate protections:

- Configured rate limits for guest-session creation, share-token attempts, room creation, and upload authorisation.
- Upload size and recording-duration limits.
- Bounded WebSocket connections per session or room where practical.
- Bounded awareness payload size and update rate.
- Bounded retry loops.
- Expiring session, share, signed-asset, and internal service tokens.

Controls should return stable, non-sensitive errors and must not require enterprise infrastructure.

---

# 21. Failure behaviour

| Failure                                              | Required behaviour                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Invalid or expired session                           | Reject protected access and clear or replace invalid client state.                            |
| Invalid share link                                   | Reject membership creation without revealing private room data.                               |
| Viewer sends durable update                          | Reject or prevent publication; preserve shared scene.                                         |
| Role changes during connection                       | Downgrade, upgrade, or reconnect using current server membership.                             |
| Permission service unavailable                       | Fail closed for protected actions.                                                            |
| Audit write fails                                    | Follow the accepted transactional policy for the operation; never invent audit success.       |
| Internal control authentication fails                | Reject the call and record a redacted diagnostic.                                             |
| Awareness payload contains private or invalid fields | Reject or sanitise; never persist.                                                            |
| Asset storage unavailable                            | Reject or fail the asset operation while keeping safe shape and text collaboration available. |
| Offline editor loses permission                      | Preserve local draft, reject publication, and load authorised state separately.               |
| Recovery filter fails                                | Do not produce the output.                                                                    |
| Conditional archived room receives write             | Reject the write and preserve archived state.                                                 |

Security failure must not silently downgrade to client-authoritative behaviour.

---

# 22. Testing requirements

## 22.1 Unit tests

Cover:

- Session token hashing and validation.
- Email normalisation and privacy filtering.
- Role and capability derivation.
- Share-token hashing, expiry, and role limits.
- Awareness allowlist validation.
- Export and recovery allowlists.
- Asset access policy.
- Offline revalidation branching.
- Log redaction.

## 22.2 API and persistence integration tests

Cover:

- Session expiry and revocation.
- Room access by owner, editor, viewer, and non-member.
- Viewer upload rejection.
- Cross-room asset access rejection.
- Share link cannot grant owner.
- Revoked and expired share links.
- Final-owner protection.
- Stable redacted error envelopes.
- Required audit records.

## 22.3 Collaboration integration tests

Cover:

- Authenticated writable connection.
- Authenticated read-only viewer connection.
- Unauthenticated and non-member rejection.
- Client self-asserted role ignored.
- Active role downgrade.
- Invalid awareness field rejection.
- Email absent from Yjs and awareness.
- Rejected offline candidate never entering shared state.

## 22.4 Browser and QA-Intel tests

Mandatory scenarios:

1. Inspect scene, awareness, public room data, test APIs, and recovery output; guest email is absent.
2. Modify local viewer state to claim editor; the server still rejects the durable change.
3. Request a private asset as a non-member; access is denied.
4. Upload an unsafe or unsupported file; no ready asset is created.
5. Revoke editor permission while that user is offline; reconnect does not publish the local draft.
6. Confirm raw tokens and signed URLs are absent from browser-visible diagnostics.

Conditional P1 scenarios:

- Archived room rejects existing and new writes.
- Export excludes private and ephemeral data.
- Viewer cannot acquire shared physics authority.

---

# 23. Security review checklist

Before the MVP is accepted:

- Confirm the selected guest-session transport and browser storage policy.
- Confirm server-derived capabilities are used by API and collaboration runtime.
- Confirm viewer connections cannot publish durable updates.
- Inspect awareness payloads for private fields.
- Inspect Yjs and Excalidraw JSON for email, tokens, and temporary URLs.
- Inspect structured logs for redaction.
- Verify private object-storage access.
- Verify offline permission-before-publication order.
- Verify test APIs are disabled in production.
- Verify internal control routes are not public.
- Record known limitations honestly.

---

# 24. Known limitations

The MVP accepts:

- Unverified email that is not account proof.
- Bearer share links that must be protected by possession, expiry, and revocation.
- Guest sessions rather than registered accounts.
- No browser-cache encryption guarantee.
- No full malware-processing pipeline unless deployment provides one.
- Controlled reconnect after a live role change.
- Test-focused rate limits rather than enterprise abuse infrastructure.

These limitations do not permit public assets, client-authoritative roles, private-email exposure, or unauthorised offline publication.

---

# 25. Definition of done

The mandatory security architecture is implemented successfully when:

- Guest sessions are opaque, expiring, revocable, and stored server-side only as hashes.
- Email remains private across all collaboration, scene, output, test, and logging surfaces.
- Room capabilities derive from current server session, membership, and room state.
- Viewers cannot publish durable collaboration updates.
- Share links cannot grant owner and raw tokens are not stored or logged.
- Assets are private and room-authorised.
- Awareness accepts only approved ephemeral public fields.
- Offline updates publish only after current permission validation.
- Rejected offline work remains recoverable without weakening room integrity.
- Public and internal APIs validate inputs and redact failures.
- Test hooks expose no secrets and are disabled in production.
- Required unit, integration, browser, and QA-Intel security scenarios pass.

When a P1 feature is implemented, its conditional security controls must also pass before that feature is claimed complete.

---

# 26. Final security policy

The browser is untrusted. The API, collaboration server, and asset service each enforce the permissions for the state they own. PostgreSQL holds authoritative identity, room, membership, and asset metadata; Yjs carries authorised collaborative state; awareness carries only validated ephemeral presence; IndexedDB preserves local work without granting authority. Guest email and all bearer credentials remain private across every boundary.

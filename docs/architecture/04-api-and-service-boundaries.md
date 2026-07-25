# API and Service Boundaries

## Real-Time Collaborative Infinite Canvas

**Document path:** `docs/architecture/04-api-and-service-boundaries.md`
**Document status:** Accepted
**Product phase:** Two-day MVP / Hackathon
**Last updated:** 25 July 2026
**Primary owners:** Engineering and Architecture

---

# 1. Purpose

This document defines the HTTP API and application-service boundaries for the real-time collaborative infinite canvas.

It specifies:

- API responsibilities
- Authentication flow
- Guest-session handling
- Room endpoints
- Membership and role endpoints
- Share-link endpoints
- Asset upload and access endpoints
- Archive and restore endpoints
- Recycle-bin operations
- Export endpoints
- Collaboration-access bootstrap
- Request and response conventions
- Error envelopes
- Permission enforcement
- Transaction boundaries
- Idempotency rules
- Validation requirements
- Service and repository boundaries
- Testing requirements

This document covers the HTTP application API.

Live Excalidraw scene synchronisation occurs through the separate Hocuspocus collaboration runtime and is not transported through ordinary REST endpoints.

---

# 2. API architectural role

The HTTP API owns application-level operations that require authoritative validation or persistence.

It is responsible for:

- Creating and restoring guest sessions
- Creating rooms
- Resolving room invitations
- Reading room metadata
- Managing memberships
- Enforcing room roles
- Creating and revoking share links
- Authorising asset uploads
- Authorising asset reads
- Archiving and restoring rooms
- Listing and restoring deleted objects
- Generating safe exports
- Returning collaboration bootstrap information
- Recording audit events

The HTTP API does not own:

- High-frequency element movement
- Cursor presence
- Viewport presence
- Remote selections
- Live physics frames
- Ordinary Excalidraw scene updates

Those belong to the collaboration channel.

---

# 3. Runtime boundary

The API runs as a NestJS application using the Fastify adapter.

Suggested application location:

```text
apps/api
```

The API communicates with:

```text
PostgreSQL
Private object storage
Collaboration runtime
Web client
```

Conceptual topology:

```text
Browser
   │
   │ HTTPS / JSON
   ▼
NestJS API
   ├── Guest services
   ├── Room services
   ├── Membership services
   ├── Share-link services
   ├── Asset services
   ├── Archive services
   ├── Export services
   └── Audit services
        │
        ├── PostgreSQL
        ├── Object storage
        └── Collaboration control channel
```

---

# 4. API design principles

## 4.1 Server authority

The server decides:

- Whether a session is valid
- Whether a room exists
- Whether a room is active
- Whether a guest has access
- Which role a guest has
- Whether an asset operation is allowed
- Whether a room can be archived
- Whether a deleted object can be restored

Client-provided role values are never authoritative.

---

## 4.2 Minimal HTTP surface

The MVP API should expose only endpoints required by product workflows.

Avoid generic CRUD endpoints that allow arbitrary updates to sensitive records.

Prefer domain-specific actions such as:

```text
POST /rooms/:roomId/archive
POST /rooms/:roomId/restore
PATCH /rooms/:roomId/members/:guestId/role
```

instead of unrestricted record mutation.

---

## 4.3 Shared validation

Request and response contracts should be defined in:

```text
packages/contracts
```

The client and server should use the same TypeScript schemas where practical.

Runtime validation is still required on the server.

---

## 4.4 Stable error codes

Clients should respond to stable machine-readable error codes rather than parsing message strings.

---

## 4.5 Explicit permission checks

Every protected service operation should declare its required role.

Permission checks should not be hidden only inside controllers.

---

## 4.6 Transactional domain operations

Operations involving multiple records must execute atomically.

Examples:

- Create room and owner membership
- Join through a share link
- Change a role
- Archive a room
- Restore a room
- Finalise an asset

---

## 4.7 No scene duplication

The API may return room metadata and collaboration bootstrap data.

It should not become a second general-purpose scene mutation API.

Scene state remains in the Yjs collaboration document.

---

# 5. API versioning

Recommended base path:

```text
/api/v1
```

Example:

```text
POST /api/v1/guest-sessions
POST /api/v1/rooms
GET  /api/v1/rooms/:roomId
```

Breaking contract changes require a new API version or an explicit migration strategy.

The API version is separate from:

- Collaboration-document schema version
- Excalidraw version
- Export schema version

---

# 6. Content types

Primary request and response type:

```text
application/json
```

Binary uploads may use:

- Direct object-storage upload
- `multipart/form-data`
- Raw binary upload to a signed endpoint

Binary downloads may use the original MIME type.

JSON responses should use UTF-8.

---

# 7. Authentication model

The MVP uses guest sessions.

A guest session is represented by an opaque token.

Recommended transport:

- Secure HTTP-only cookie when frontend and API deployment permit
- Bearer token as a documented fallback

Preferred cookie properties:

```text
HttpOnly
Secure
SameSite=Lax
Path=/
```

The browser must not send raw session tokens through:

- Query parameters
- Collaboration awareness
- Excalidraw scene data
- Public exports

---

# 8. Guest-session creation

## Endpoint

```http
POST /api/v1/guest-sessions
```

## Request

```ts
interface CreateGuestSessionRequest {
  username: string;
  email: string;
}
```

## Response

```ts
interface CreateGuestSessionResponse {
  guest: {
    id: string;
    username: string;
    colour: string;
  };
  session: {
    expiresAt: string;
  };
}
```

Email is not returned unless the product explicitly needs to display it privately.

The session token should be set through the selected secure transport.

---

## 8.1 Behaviour

The service should:

1. Validate username.
2. Normalise email.
3. Validate email format.
4. Create a guest record.
5. Create a guest session.
6. Hash the session token before storage.
7. Return the public guest profile.
8. Record session creation where required.

The operation must not grant room access automatically.

---

## 8.2 Validation

Suggested constraints:

```text
Username:
- Required
- Trimmed
- 2–40 characters

Email:
- Required
- Trimmed
- Normalised
- Valid email format
- Reasonable maximum length
```

The system does not verify ownership of the email during the MVP.

---

# 9. Current guest session

## Endpoint

```http
GET /api/v1/guest-sessions/current
```

## Response

```ts
interface CurrentGuestSessionResponse {
  guest: {
    id: string;
    username: string;
    colour: string;
  };
  session: {
    expiresAt: string;
  };
}
```

## Errors

```text
SESSION_INVALID
SESSION_EXPIRED
SESSION_REVOKED
```

This endpoint supports client-session restoration.

---

# 10. Guest-session revocation

## Endpoint

```http
DELETE /api/v1/guest-sessions/current
```

## Behaviour

The API should:

1. Resolve the current session.
2. Mark it revoked.
3. Clear the client cookie or token state.
4. Return success even when the session is already invalid where appropriate.

## Response

```http
204 No Content
```

This operation should be idempotent.

---

# 11. Room creation

## Endpoint

```http
POST /api/v1/rooms
```

## Permission

Valid guest session.

## Request

```ts
interface CreateRoomRequest {
  name?: string;
}
```

## Response

```ts
interface CreateRoomResponse {
  room: {
    id: string;
    name: string;
    status: "active";
    role: "owner";
    createdAt: string;
  };
}
```

---

## 11.1 Service behaviour

The room service must atomically:

1. Validate the guest session.
2. Generate a room ID.
3. Generate a default name when none is provided.
4. Create the room.
5. Create owner membership.
6. Create an empty collaboration document.
7. Record the pinned Excalidraw version.
8. Record an audit event.
9. Optionally create a default editor share link.

No room should exist without a valid initial collaboration document.

---

## 11.2 Default room name

A simple default is sufficient:

```text
Untitled Canvas
```

The name may be made unique later.

---

# 12. Read room metadata

## Endpoint

```http
GET /api/v1/rooms/:roomId
```

## Permission

Any active room member.

Archived-room access may remain available to authorised members in read-only mode.

## Response

```ts
interface GetRoomResponse {
  room: {
    id: string;
    name: string;
    status: "active" | "archived";
    createdAt: string;
    updatedAt: string;
    archivedAt?: string;
  };

  membership: {
    guestId: string;
    role: "owner" | "editor" | "viewer";
  };

  capabilities: {
    canView: boolean;
    canEdit: boolean;
    canUploadAssets: boolean;
    canManageMembers: boolean;
    canArchive: boolean;
    canRestore: boolean;
    canExport: boolean;
    canUsePhysics: boolean;
  };
}
```

Capabilities should be derived by the server.

---

# 13. Update room metadata

## Endpoint

```http
PATCH /api/v1/rooms/:roomId
```

## Permission

Owner.

## Request

```ts
interface UpdateRoomRequest {
  name?: string;
}
```

Only explicitly supported fields may be updated.

The client must not be able to update:

- Room ID
- Creator
- Collaboration schema version
- Excalidraw version
- Archive status through this endpoint

Archive state has dedicated actions.

---

# 14. Room collaboration bootstrap

## Endpoint

```http
GET /api/v1/rooms/:roomId/collaboration
```

## Permission

Active member or authorised archived-room viewer.

## Response

```ts
interface CollaborationBootstrapResponse {
  room: {
    id: string;
    status: "active" | "archived";
  };

  guest: {
    id: string;
    username: string;
    colour: string;
  };

  access: {
    role: "owner" | "editor" | "viewer";
    mode: "read-write" | "read-only";
  };

  collaboration: {
    documentName: string;
    websocketUrl: string;
    accessToken: string;
    expiresAt: string;
    schemaVersion: number;
  };
}
```

The collaboration access token should be:

- Short-lived
- Signed
- Room-scoped
- Guest-scoped
- Role-scoped
- Separate from the main guest-session token

---

# 15. Collaboration token claims

Conceptual claims:

```ts
interface CollaborationAccessClaims {
  subject: string;
  guestId: string;
  roomId: string;
  role: "owner" | "editor" | "viewer";
  mode: "read-write" | "read-only";
  issuedAt: number;
  expiresAt: number;
  tokenId: string;
}
```

The collaboration server must still verify current room state and membership.

A token should not remain trusted after:

- Membership revocation
- Room archive
- Session revocation
- Token expiry

---

# 16. List room members

## Endpoint

```http
GET /api/v1/rooms/:roomId/members
```

## Permission

Owner.

Editors may be granted limited participant visibility later.

## Response

```ts
interface ListRoomMembersResponse {
  members: Array<{
    guestId: string;
    username: string;
    colour: string;
    role: "owner" | "editor" | "viewer";
    joinedAt: string;
  }>;
}
```

Email addresses must not be included in the ordinary response.

---

# 17. Change member role

## Endpoint

```http
PATCH /api/v1/rooms/:roomId/members/:guestId/role
```

## Permission

Owner.

## Request

```ts
interface ChangeMemberRoleRequest {
  role: "owner" | "editor" | "viewer";
}
```

## Response

```ts
interface ChangeMemberRoleResponse {
  membership: {
    guestId: string;
    role: "owner" | "editor" | "viewer";
    updatedAt: string;
  };
}
```

---

## 17.1 Role-change rules

The service must:

- Lock the target membership.
- Validate the acting owner.
- Reject archived-room changes unless specifically allowed.
- Prevent removal of the final owner.
- Update the role atomically.
- Record an audit event.
- Invalidate or refresh active collaboration access.

---

# 18. Revoke room membership

## Endpoint

```http
DELETE /api/v1/rooms/:roomId/members/:guestId
```

## Permission

Owner.

## Response

```http
204 No Content
```

The operation must:

- Prevent removal of the final owner.
- Record revocation.
- Terminate or downgrade the affected collaboration connection.
- Clear active physics leases owned by the removed guest.

Revoking an already revoked membership may return success.

---

# 19. Create share link

## Endpoint

```http
POST /api/v1/rooms/:roomId/share-links
```

## Permission

Owner.

## Request

```ts
interface CreateShareLinkRequest {
  defaultRole: "editor" | "viewer";
  expiresAt?: string;
  maxUses?: number;
}
```

## Response

```ts
interface CreateShareLinkResponse {
  shareLink: {
    id: string;
    url: string;
    defaultRole: "editor" | "viewer";
    expiresAt?: string;
    maxUses?: number;
    createdAt: string;
  };
}
```

Only the newly created response should contain the raw token-bearing URL.

The database stores only the token hash.

---

# 20. Resolve share link

Public route:

```http
GET /api/v1/share-links/:token
```

This route may be called before a guest session exists.

## Response

```ts
interface ResolveShareLinkResponse {
  room: {
    id: string;
    name: string;
    status: "active" | "archived";
  };

  invitation: {
    defaultRole: "editor" | "viewer";
    requiresGuestSession: boolean;
  };
}
```

The response must not reveal:

- Owner email
- Member list
- Asset information
- Collaboration token
- Private room metadata

---

# 21. Accept share link

## Endpoint

```http
POST /api/v1/share-links/:token/accept
```

## Permission

Valid guest session.

## Response

```ts
interface AcceptShareLinkResponse {
  room: {
    id: string;
    name: string;
    status: "active" | "archived";
  };

  membership: {
    role: "editor" | "viewer";
  };
}
```

---

## 21.1 Acceptance transaction

The service should atomically:

1. Lock the share-link record.
2. Validate expiry.
3. Validate revocation.
4. Validate usage limit.
5. Validate room status.
6. Create or reactivate membership.
7. Apply the permitted default role.
8. Increment use count.
9. Record audit event.

A share link can never grant owner access.

---

# 22. List share links

## Endpoint

```http
GET /api/v1/rooms/:roomId/share-links
```

## Permission

Owner.

## Response

```ts
interface ListShareLinksResponse {
  shareLinks: Array<{
    id: string;
    defaultRole: "editor" | "viewer";
    createdAt: string;
    expiresAt?: string;
    revokedAt?: string;
    maxUses?: number;
    useCount: number;
  }>;
}
```

Raw tokens and full invitation URLs must not be returned after creation.

---

# 23. Revoke share link

## Endpoint

```http
DELETE /api/v1/rooms/:roomId/share-links/:shareLinkId
```

## Permission

Owner.

## Response

```http
204 No Content
```

The operation should be idempotent.

Revoking a share link does not automatically revoke memberships already created through it unless the product explicitly adds that behaviour.

---

# 24. Asset-upload authorisation

## Endpoint

```http
POST /api/v1/rooms/:roomId/assets
```

## Permission

Owner or editor.

## Request

```ts
interface CreateAssetRequest {
  kind: "image" | "audio";
  mimeType: string;
  sizeBytes?: number;
  originalFilename?: string;
}
```

## Response

Direct-upload variant:

```ts
interface CreateAssetResponse {
  asset: {
    id: string;
    kind: "image" | "audio";
    status: "pending";
  };

  upload: {
    method: "PUT";
    url: string;
    headers?: Record<string, string>;
    expiresAt: string;
  };
}
```

API-proxy variant:

```ts
interface CreateAssetResponse {
  asset: {
    id: string;
    kind: "image" | "audio";
    status: "pending";
  };

  upload: {
    method: "MULTIPART";
    endpoint: string;
  };
}
```

---

# 25. Asset validation

The asset service must validate:

- Room exists.
- Room is active.
- Actor has editor or owner role.
- Kind is supported.
- MIME type is allowed.
- File size is within limits.
- Filename length is reasonable.
- Storage key is generated internally.

Do not trust filename extensions alone.

---

# 26. Recommended MVP asset limits

Example initial limits:

```text
Images:
- PNG
- JPEG
- WebP
- GIF where supported
- Maximum 10 MB

Audio:
- WebM
- Ogg
- MP4 audio where browser support permits
- Maximum 25 MB
- Maximum recording duration defined by product policy
```

These values should be configuration-driven.

---

# 27. API-proxied asset upload

Optional MVP endpoint:

```http
POST /api/v1/rooms/:roomId/assets/:assetId/content
Content-Type: multipart/form-data
```

## Permission

Owner or editor who can upload to the room.

The service must validate that:

- Asset belongs to the room.
- Asset is pending or failed.
- Asset kind and MIME type match.
- Binary size remains within the allowed limit.

A successful upload should transition the asset toward ready state.

---

# 28. Confirm direct upload

## Endpoint

```http
POST /api/v1/rooms/:roomId/assets/:assetId/complete
```

## Permission

Owner or editor.

## Request

```ts
interface CompleteAssetUploadRequest {
  checksumSha256?: string;
  widthPx?: number;
  heightPx?: number;
  durationMs?: number;
}
```

## Response

```ts
interface CompleteAssetUploadResponse {
  asset: {
    id: string;
    kind: "image" | "audio";
    status: "ready";
    mimeType: string;
    sizeBytes?: number;
    widthPx?: number;
    heightPx?: number;
    durationMs?: number;
    readyAt: string;
  };
}
```

The server should verify the object exists before marking it ready where practical.

---

# 29. Read asset metadata

## Endpoint

```http
GET /api/v1/rooms/:roomId/assets/:assetId
```

## Permission

Any authorised room member.

## Response

```ts
interface GetAssetResponse {
  asset: {
    id: string;
    kind: "image" | "audio";
    status: "pending" | "uploading" | "ready" | "failed";
    mimeType: string;
    sizeBytes?: number;
    widthPx?: number;
    heightPx?: number;
    durationMs?: number;
  };
}
```

Storage keys and credentials should not be returned.

---

# 30. Resolve asset content

## Endpoint

```http
GET /api/v1/rooms/:roomId/assets/:assetId/content
```

## Permission

Any authorised room member.

Possible responses:

### Redirect or signed URL response

```ts
interface ResolveAssetContentResponse {
  url: string;
  expiresAt: string;
}
```

### Authenticated streaming response

The API streams the binary with the correct MIME type.

The client must not persist temporary signed URLs in scene data.

---

# 31. Retry failed asset

## Endpoint

```http
POST /api/v1/rooms/:roomId/assets/:assetId/retry
```

## Permission

Owner or editor.

The service may transition:

```text
failed → pending
```

or return a new upload authorisation directly.

---

# 32. Archive asset

An explicit user-facing asset archive endpoint is optional.

Unused binary cleanup should primarily be retention-driven.

Deleting an Excalidraw image or audio card must not immediately delete the binary while it remains recoverable through the recycle bin.

---

# 33. Archive room

## Endpoint

```http
POST /api/v1/rooms/:roomId/archive
```

## Permission

Owner.

## Request

An empty body is acceptable.

Optional confirmation field:

```ts
interface ArchiveRoomRequest {
  confirm: true;
}
```

## Response

```ts
interface ArchiveRoomResponse {
  room: {
    id: string;
    status: "archived";
    archivedAt: string;
  };
}
```

---

## 33.1 Service behaviour

The service must:

1. Lock the room.
2. Validate owner role.
3. Return success if already archived, where idempotent behaviour is selected.
4. Set archive fields.
5. Record audit event.
6. Commit.
7. Notify the collaboration runtime.
8. Stop writable collaboration.
9. Clear active physics leases.
10. Reject future asset uploads.

---

# 34. Restore room

## Endpoint

```http
POST /api/v1/rooms/:roomId/restore
```

## Permission

Owner.

## Response

```ts
interface RestoreRoomResponse {
  room: {
    id: string;
    status: "active";
    restoredAt: string;
  };
}
```

The service must preserve:

- Existing scene
- Memberships
- Assets
- Deleted-object records

Restoring an already active room may be treated as success.

---

# 35. Recycle-bin list

## Endpoint

```http
GET /api/v1/rooms/:roomId/recycle-bin
```

## Permission

Owner.

Editors may be granted restore permission later.

## Response

```ts
interface ListRecycleBinResponse {
  items: Array<{
    id: string;
    kind: string;
    elementIds: string[];
    deletedBy: {
      guestId: string;
      username?: string;
    };
    deletedAt: string;
    hasAsset: boolean;
  }>;
}
```

Because deleted-object payloads live in the Yjs document, the API may obtain this information through:

- Collaboration-runtime query
- Persisted Yjs document inspection
- Optional relational recycle-bin index

For the MVP, direct collaboration-runtime access may be the simplest reliable option.

---

# 36. Restore deleted object

## Endpoint

```http
POST /api/v1/rooms/:roomId/recycle-bin/:deletedObjectId/restore
```

## Permission

Owner.

## Response

```ts
interface RestoreDeletedObjectResponse {
  restoredObject: {
    id: string;
    elementIds: string[];
    restoredAt: string;
  };
}
```

---

## 36.1 Restore execution boundary

The API should not independently rewrite Excalidraw scene rows.

Instead, it should send an authorised command to the collaboration runtime.

Conceptual flow:

```text
Browser
→ API restore endpoint
→ API validates owner permission
→ API sends restore command to collaboration runtime
→ Collaboration runtime applies one Yjs transaction
→ Collaboration runtime persists document
→ API returns result
```

This preserves one scene mutation path.

---

# 37. Permanently remove deleted object

Permanent deletion is optional and should not be included in the first MVP unless required.

Possible future endpoint:

```http
DELETE /api/v1/rooms/:roomId/recycle-bin/:deletedObjectId
```

This action requires careful asset-reference analysis.

---

# 38. PNG export

## Endpoint

```http
POST /api/v1/rooms/:roomId/exports
```

## Permission

Owner or editor where permitted.

## Request

```ts
interface CreateExportRequest {
  format: "png" | "json" | "svg";
  includeBackground?: boolean;
}
```

## Response

Immediate export:

```ts
interface CreateExportResponse {
  status: "ready";
  format: "png" | "json" | "svg";
  downloadUrl?: string;
  expiresAt?: string;
  data?: unknown;
}
```

Asynchronous export:

```ts
interface CreateExportResponse {
  export: {
    id: string;
    status: "pending";
    format: "png" | "json" | "svg";
  };
}
```

---

# 39. Export implementation boundary

For the MVP:

- PNG may be generated in the browser using Excalidraw’s export utilities.
- JSON may be generated through a safe client-side or server-assisted export adapter.
- SVG is optional.
- Server-side export may be deferred.

Even for client-generated exports, the product must apply privacy filtering.

---

# 40. JSON export contract

Suggested format:

```ts
interface RoomJsonExport {
  exportSchemaVersion: number;
  exportedAt: string;

  room: {
    id: string;
    name: string;
  };

  scene: {
    excalidrawVersion: string;
    collaborationSchemaVersion: number;
    elements: unknown[];
    appState: Record<string, unknown>;
    files: Record<string, unknown>;
  };

  productObjects: unknown[];
}
```

The export must exclude:

- Guest emails
- Session information
- Collaboration access tokens
- Signed asset URLs
- Storage credentials
- Internal audit records

---

# 41. Export status

Optional endpoint:

```http
GET /api/v1/rooms/:roomId/exports/:exportId
```

## Response

```ts
interface GetExportResponse {
  export: {
    id: string;
    format: "png" | "json" | "svg";
    status: "pending" | "processing" | "ready" | "failed";
    downloadUrl?: string;
    expiresAt?: string;
    failureCode?: string;
  };
}
```

---

# 42. Collaboration control boundary

Some API operations must notify or command the collaboration runtime.

Examples:

- Role changed
- Membership revoked
- Room archived
- Room restored
- Deleted object restored
- Physics leases cleared
- Collaboration document migrated

The API should use an explicit internal interface.

---

# 43. Collaboration control interface

Conceptual service:

```ts
interface CollaborationControlService {
  notifyMembershipChanged(input: {
    roomId: string;
    guestId: string;
    role?: "owner" | "editor" | "viewer";
    revoked: boolean;
  }): Promise<void>;

  notifyRoomArchived(input: { roomId: string }): Promise<void>;

  notifyRoomRestored(input: { roomId: string }): Promise<void>;

  restoreDeletedObject(input: {
    roomId: string;
    deletedObjectId: string;
    actorGuestId: string;
  }): Promise<{
    elementIds: string[];
  }>;

  clearGuestPhysicsLeases(input: {
    roomId: string;
    guestId: string;
  }): Promise<void>;
}
```

---

# 44. Internal communication options

Possible approaches:

## Option A — Direct internal HTTP API

API sends authenticated requests to the collaboration runtime.

Advantages:

- Simple
- Observable
- Easy to test

Disadvantages:

- Adds internal network dependency

## Option B — Shared PostgreSQL notification

API writes authoritative state and emits a PostgreSQL notification.

Advantages:

- Fewer exposed internal endpoints

Disadvantages:

- More operational complexity
- Harder delivery guarantees

## Option C — Shared in-process service

Only possible if API and collaboration runtime run in the same process.

This conflicts with the selected separate-runtime architecture.

## Recommended MVP choice

Use a small authenticated internal HTTP control API.

---

# 45. Internal collaboration endpoints

Possible internal routes:

```http
POST /internal/v1/rooms/:roomId/archive
POST /internal/v1/rooms/:roomId/restore
POST /internal/v1/rooms/:roomId/members/:guestId/changed
POST /internal/v1/rooms/:roomId/recycle-bin/:itemId/restore
POST /internal/v1/rooms/:roomId/physics-leases/clear
```

These routes must not be publicly accessible.

Authentication may use:

- Internal shared secret
- Signed service token
- Private network identity

---

# 46. Service-layer structure

Recommended modules:

```text
GuestSessionModule
RoomModule
MembershipModule
ShareLinkModule
CollaborationAccessModule
AssetModule
RoomArchiveModule
RecycleBinModule
ExportModule
AuditModule
HealthModule
```

---

# 47. Controller responsibilities

Controllers should:

- Parse request parameters
- Invoke runtime validation
- Resolve actor identity
- Call one application service
- Map service results to response DTOs
- Map domain errors to HTTP responses

Controllers should not:

- Open database transactions directly
- Contain permission policy
- Generate storage keys
- Mutate Yjs documents
- Build ad hoc role logic

---

# 48. Service responsibilities

Services should own:

- Domain rules
- Permission requirements
- Transaction boundaries
- Repository coordination
- Audit calls
- Collaboration-control notifications
- State transitions

---

# 49. Repository responsibilities

Repositories should own:

- Query construction
- Record insertion
- Row locking
- Record updates
- Persistence-specific mapping

Repositories should not decide:

- Whether an actor is allowed to archive a room
- Whether a final owner can be removed
- Whether an asset transition is valid
- Whether a share link should grant a membership

Those are service decisions.

---

# 50. Permission service

Recommended interface:

```ts
interface RoomPermissionService {
  requireMembership(input: {
    roomId: string;
    guestId: string;
  }): Promise<RoomMembership>;

  requireRole(input: {
    roomId: string;
    guestId: string;
    allowedRoles: Array<"owner" | "editor" | "viewer">;
  }): Promise<RoomMembership>;

  getCapabilities(input: {
    roomId: string;
    guestId: string;
  }): Promise<RoomCapabilities>;
}
```

---

# 51. Capability derivation

Suggested capability model:

```ts
interface RoomCapabilities {
  canView: boolean;
  canEdit: boolean;
  canUploadAssets: boolean;
  canManageMembers: boolean;
  canCreateShareLinks: boolean;
  canArchive: boolean;
  canRestore: boolean;
  canRestoreDeletedObjects: boolean;
  canExport: boolean;
  canUsePhysics: boolean;
}
```

Capabilities derive from:

- Role
- Room status
- Product configuration
- Feature flags where used

---

# 52. Authorisation matrix

| Operation              | Owner |   Editor |   Viewer |
| ---------------------- | ----: | -------: | -------: |
| Read active room       |   Yes |      Yes |      Yes |
| Read archived room     |   Yes |      Yes |      Yes |
| Edit scene             |   Yes |      Yes |       No |
| Upload image           |   Yes |      Yes |       No |
| Record audio           |   Yes |      Yes |       No |
| Play audio             |   Yes |      Yes |      Yes |
| Use shared physics     |   Yes |      Yes |       No |
| List members           |   Yes | Optional |       No |
| Change role            |   Yes |       No |       No |
| Revoke member          |   Yes |       No |       No |
| Create share link      |   Yes |       No |       No |
| Revoke share link      |   Yes |       No |       No |
| Archive room           |   Yes |       No |       No |
| Restore room           |   Yes |       No |       No |
| View recycle bin       |   Yes | Optional |       No |
| Restore deleted object |   Yes | Optional |       No |
| Export                 |   Yes |      Yes | Optional |

The MVP should use the stricter interpretation where marked optional.

---

# 53. Error envelope

All non-success JSON errors should use a stable structure.

```ts
interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: Record<string, unknown>;
  };
}
```

Example:

```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You do not have permission to archive this room.",
    "requestId": "req_01K...",
    "details": {
      "requiredRole": "owner"
    }
  }
}
```

The message is user-readable.

The code is client-readable.

---

# 54. HTTP status mapping

Suggested mapping:

| Condition                   | Status |
| --------------------------- | -----: |
| Invalid request             |    400 |
| Invalid or missing session  |    401 |
| Authenticated but forbidden |    403 |
| Room or asset not found     |    404 |
| Conflict with current state |    409 |
| Validation failure          |    422 |
| Rate limit exceeded         |    429 |
| Unexpected internal error   |    500 |
| Dependency unavailable      |    503 |

---

# 55. Stable API error codes

Suggested codes:

```ts
type ApiErrorCode =
  | "VALIDATION_FAILED"
  | "SESSION_INVALID"
  | "SESSION_EXPIRED"
  | "SESSION_REVOKED"
  | "ROOM_NOT_FOUND"
  | "ROOM_ARCHIVED"
  | "ROOM_ALREADY_ACTIVE"
  | "PERMISSION_DENIED"
  | "MEMBERSHIP_NOT_FOUND"
  | "LAST_OWNER_REQUIRED"
  | "SHARE_LINK_INVALID"
  | "SHARE_LINK_EXPIRED"
  | "SHARE_LINK_REVOKED"
  | "SHARE_LINK_USE_LIMIT_REACHED"
  | "ASSET_NOT_FOUND"
  | "ASSET_TYPE_UNSUPPORTED"
  | "ASSET_TOO_LARGE"
  | "ASSET_STATE_INVALID"
  | "ASSET_UPLOAD_FAILED"
  | "ASSET_ACCESS_DENIED"
  | "RECYCLE_ITEM_NOT_FOUND"
  | "RECYCLE_RESTORE_FAILED"
  | "COLLABORATION_UNAVAILABLE"
  | "COLLABORATION_ACCESS_DENIED"
  | "EXPORT_FAILED"
  | "DATABASE_UNAVAILABLE"
  | "INTERNAL_ERROR";
```

---

# 56. Validation error details

Validation failures may include field-level errors.

```ts
interface ValidationErrorDetails {
  fields: Array<{
    field: string;
    code: string;
    message: string;
  }>;
}
```

Example:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Some fields are invalid.",
    "requestId": "req_01K...",
    "details": {
      "fields": [
        {
          "field": "email",
          "code": "INVALID_EMAIL",
          "message": "Enter a valid email address."
        }
      ]
    }
  }
}
```

---

# 57. Request IDs

Every request should receive a unique request ID.

The ID should:

- Be returned in an HTTP header
- Be included in error envelopes
- Be included in structured logs
- Be forwarded to internal collaboration-control calls

Suggested header:

```text
X-Request-ID
```

---

# 58. Idempotency

Not every endpoint requires an idempotency key.

Operations should be divided into:

- Naturally idempotent
- Domain-idempotent
- Idempotency-key protected

---

# 59. Naturally idempotent operations

Examples:

```text
GET room metadata
GET members
GET assets
DELETE current session
DELETE share link
POST archive when already archived
POST restore when already active
```

The service should return the current successful state where appropriate.

---

# 60. Idempotency-key protected operations

Recommended candidates:

- Create room
- Create asset-upload record
- Complete asset upload
- Create export
- Restore deleted object

Header:

```text
Idempotency-Key
```

---

# 61. Idempotency record

Optional database model:

```ts
interface IdempotencyRecord {
  key: string;
  actorGuestId: string;
  operation: string;
  requestHash: string;
  responseStatus: number;
  responseBody: unknown;
  createdAt: string;
  expiresAt: string;
}
```

For the two-day MVP, full persistent idempotency storage may be deferred.

At minimum:

- Asset completion must reject invalid repeated transitions safely.
- Archive and restore must be domain-idempotent.
- Deleted-object restore must not duplicate restored elements on retry.

---

# 62. Concurrency control

Services should use row locks for state-sensitive operations.

Examples:

```text
Change membership role
Revoke membership
Consume limited-use share link
Archive room
Restore room
Complete asset upload
```

A `409 Conflict` should be returned where current state invalidates the attempted operation.

---

# 63. Rate limiting

Basic rate limits should protect:

- Guest-session creation
- Share-link resolution
- Asset-upload authorisation
- Asset access
- Export generation

Rate limiting should identify clients through a safe combination of:

- Session
- IP-derived key
- Route
- Room

Raw IP addresses need not be retained long-term.

---

# 64. CORS and origin policy

The API should allow only configured frontend origins.

For credentialed cookies:

- `Access-Control-Allow-Credentials` must be configured.
- Wildcard origins must not be used.
- Production and local origins must be explicit.

---

# 65. CSRF protection

When using cookie-based authentication, state-changing endpoints require CSRF protection.

Possible approaches:

- SameSite cookie policy
- CSRF token
- Origin and Referer validation
- Double-submit token

The final mechanism should be documented in the security design.

Bearer-token deployments have different CSRF considerations but greater client-side token exposure risk.

---

# 66. Health endpoints

## Liveness

```http
GET /health/live
```

Returns whether the API process is running.

## Readiness

```http
GET /health/ready
```

Checks required dependencies such as:

- PostgreSQL
- Critical configuration
- Object-storage client readiness where required

The collaboration runtime has separate health endpoints.

---

# 67. API documentation

The project may expose OpenAPI documentation in development.

Suggested route:

```text
/api/docs
```

Production exposure is optional.

OpenAPI definitions should derive from the same request and response contracts where practical.

---

# 68. Logging requirements

Structured API logs should include:

```text
requestId
method
route
statusCode
durationMs
guestId
roomId
errorCode
```

Do not log:

- Raw session tokens
- Raw share tokens
- Raw signed asset URLs
- Binary request bodies
- Guest email by default

---

# 69. Audit requirements

Audit events are required for:

- Room creation
- Room archive
- Room restore
- Membership creation
- Role change
- Membership revocation
- Share-link creation
- Share-link revocation
- Share-link use
- Asset lifecycle failures where meaningful
- Export requests
- Rejected offline drafts where reported to the server

Ordinary scene edits do not require relational audit events.

---

# 70. Failure handling

## Database unavailable

Return:

```text
503 Service Unavailable
DATABASE_UNAVAILABLE
```

Do not falsely report successful room or membership creation.

---

## Object storage unavailable

Shape and text operations may continue through collaboration.

Asset endpoints should return:

```text
503 Service Unavailable
ASSET_UPLOAD_FAILED
```

or a more specific storage error.

---

## Collaboration runtime unavailable

Room metadata may still be readable.

Collaboration bootstrap or recycle restore may return:

```text
503 Service Unavailable
COLLABORATION_UNAVAILABLE
```

---

## Audit write failure

For security-sensitive operations, decide whether audit failure should block the operation.

Recommended policy:

- Room creation, role changes, archive, and membership revocation should attempt audit within the same transaction.
- Low-risk diagnostic events may be best-effort.

---

# 71. Testing strategy

## 71.1 Controller tests

Must cover:

- Request validation
- Authentication guard
- Parameter parsing
- Response mapping
- Error-envelope mapping

---

## 71.2 Service unit tests

Must cover:

- Guest-session creation
- Room creation flow
- Role checks
- Final-owner protection
- Share-link validation
- Capability derivation
- Asset state transitions
- Archive idempotency
- Restore idempotency
- Export privacy filtering

---

## 71.3 Repository integration tests

Must cover:

- Room creation transaction
- Membership row locking
- Share-link use counting
- Asset finalisation
- Audit creation
- Concurrent role changes

---

## 71.4 API integration tests

Must cover:

- Create guest session
- Restore current session
- Create room
- Read room
- Resolve share link
- Accept share link
- Create editor membership
- Change role
- Reject viewer upload
- Authorise image upload
- Archive room
- Reject upload to archived room
- Restore room
- Generate collaboration bootstrap

---

## 71.5 Security tests

Must cover:

- Missing session
- Invalid session
- Client-forged role
- Viewer attempting owner action
- Revoked share link
- Expired share link
- Asset from another room
- Raw token absent from logs
- Email absent from public responses

---

# 72. End-to-end API workflows

## Core room flow

```gherkin
Scenario: Guest creates and shares a room
  Given Alice has a valid guest session
  When Alice creates a room
  Then Alice becomes the owner
  When Alice creates an editor share link
  And Bob accepts the link
  Then Bob becomes an editor
  And both users can obtain valid collaboration bootstrap data
```

---

## Viewer restriction flow

```gherkin
Scenario: Viewer cannot upload an image
  Given Charlie has viewer access
  When Charlie requests image-upload authorisation
  Then the API should return permission denied
  And no pending asset should be created
```

---

## Archive protection flow

```gherkin
Scenario: Archived room rejects writable operations
  Given Alice archived the room
  When Bob requests writable collaboration access
  Then the API should return read-only or archived access
  When Bob requests asset-upload authorisation
  Then the API should reject the request
```

---

# 73. Suggested controller layout

```text
apps/api/src/
├── guest-sessions/
│   ├── guest-sessions.controller.ts
│   ├── guest-sessions.service.ts
│   └── guest-sessions.module.ts
├── rooms/
│   ├── rooms.controller.ts
│   ├── rooms.service.ts
│   └── rooms.module.ts
├── memberships/
│   ├── memberships.controller.ts
│   ├── memberships.service.ts
│   └── memberships.module.ts
├── share-links/
│   ├── share-links.controller.ts
│   ├── share-links.service.ts
│   └── share-links.module.ts
├── collaboration-access/
│   ├── collaboration-access.controller.ts
│   ├── collaboration-access.service.ts
│   └── collaboration-access.module.ts
├── assets/
│   ├── assets.controller.ts
│   ├── assets.service.ts
│   └── assets.module.ts
├── recycle-bin/
│   ├── recycle-bin.controller.ts
│   ├── recycle-bin.service.ts
│   └── recycle-bin.module.ts
├── exports/
│   ├── exports.controller.ts
│   ├── exports.service.ts
│   └── exports.module.ts
├── audit/
├── health/
└── common/
```

---

# 74. Shared contract layout

```text
packages/contracts/src/
├── common/
│   ├── api-error.ts
│   ├── identifiers.ts
│   └── pagination.ts
├── guest-sessions/
├── rooms/
├── memberships/
├── share-links/
├── collaboration/
├── assets/
├── recycle-bin/
└── exports/
```

Each contract group may contain:

```text
request schema
response schema
TypeScript type
error codes
```

---

# 75. MVP endpoint scope

The mandatory MVP endpoints are:

```text
POST   /api/v1/guest-sessions
GET    /api/v1/guest-sessions/current
DELETE /api/v1/guest-sessions/current

POST   /api/v1/rooms
GET    /api/v1/rooms/:roomId
GET    /api/v1/rooms/:roomId/collaboration

POST   /api/v1/share-links/:token/accept
GET    /api/v1/share-links/:token

POST   /api/v1/rooms/:roomId/share-links
GET    /api/v1/rooms/:roomId/members
PATCH  /api/v1/rooms/:roomId/members/:guestId/role

POST   /api/v1/rooms/:roomId/assets
POST   /api/v1/rooms/:roomId/assets/:assetId/complete
GET    /api/v1/rooms/:roomId/assets/:assetId
GET    /api/v1/rooms/:roomId/assets/:assetId/content
```

---

# 76. P1 endpoint scope

Add after core reliability:

```text
GET    /api/v1/rooms/:roomId/share-links
DELETE /api/v1/rooms/:roomId/share-links/:shareLinkId
DELETE /api/v1/rooms/:roomId/members/:guestId

POST   /api/v1/rooms/:roomId/assets/:assetId/retry

POST   /api/v1/rooms/:roomId/archive
POST   /api/v1/rooms/:roomId/restore

GET    /api/v1/rooms/:roomId/recycle-bin
POST   /api/v1/rooms/:roomId/recycle-bin/:itemId/restore

POST   /api/v1/rooms/:roomId/exports
GET    /api/v1/rooms/:roomId/exports/:exportId
```

---

# 77. API definition of done

The API boundary is implemented successfully when:

- Guest sessions are created and restored securely.
- Room creation is atomic.
- Room metadata returns server-derived capabilities.
- Share links can grant editor or viewer access.
- Share links cannot grant owner access.
- Membership roles are server-authoritative.
- Final-owner removal is rejected.
- Collaboration bootstrap returns short-lived room-scoped access.
- Viewers cannot obtain writable collaboration access.
- Owners and editors can authorise supported uploads.
- Viewers cannot upload.
- Private assets require room access.
- Errors use stable codes and request IDs.
- Raw tokens and emails do not leak through public contracts.
- API integration and security tests pass.

When optional P1 recovery capabilities are implemented:

- Archived rooms reject writable operations.
- Recycle-bin restore uses the collaboration runtime.

---

# 78. Final API policy

The project adopts the following API policy:

> The HTTP API owns identity, room lifecycle, permissions, invitations, assets, archive, recovery commands, and collaboration bootstrap. Live Excalidraw scene changes remain on the Yjs and Hocuspocus channel. Every protected API operation derives authority from the current server-side session, room state, and membership rather than from client-provided roles or scene data.

# System Architecture

Real-Time Collaborative Infinite Canvas

Document path: docs/architecture/01-system-architecture.md
Document status: Accepted
Product phase: Two-day MVP / Hackathon
Last updated: 25 July 2026
Primary owners: Engineering and Architecture

⸻

## 1. Purpose

This document defines the high-level system architecture for the real-time collaborative infinite canvas.

The product embeds Excalidraw as its primary canvas and interaction engine. The surrounding application provides:

- Guest identity
- Room management
- Shareable invitations
- Permissions
- Real-time scene synchronisation
- Durable persistence
- Offline recovery
- Image and audio asset management
- Physics extensions
- Mini-map and collaborator radar
- Archive and recycle-bin behaviour
- Export
- QA-Intel validation

This document establishes:

- Repository structure
- Application boundaries
- Runtime responsibilities
- Excalidraw integration boundaries
- Data ownership
- Communication paths
- Persistence strategy
- Security boundaries
- Testing boundaries
- Deployment topology
- Failure-handling principles

Detailed collaboration schemas, scene adapters, API contracts, database models, and implementation plans belong in separate documents.

⸻

## 2. Architectural context

The initial architecture considered implementing a custom canvas layer.

The revised architecture uses Excalidraw as the primary canvas foundation.

This changes the system in several important ways:

- Native canvas interactions are delegated to Excalidraw.
- Excalidraw scene elements become the core visual document format.
- The product no longer owns low-level shape rendering or transformation logic.
- Product-specific metadata is stored alongside, but not carelessly embedded into, Excalidraw scene data.
- Physics must map temporary simulation state back into valid Excalidraw element transforms.
- QA testing must inspect both the Excalidraw scene and product-owned state.
- Collaboration must avoid maintaining a conflicting second scene source of truth.

The architecture should extend Excalidraw rather than fork or reproduce it.

⸻

## 3. Architectural goals

The system should support:

- Real-time multi-user collaboration
- Durable Excalidraw scene persistence
- Application-owned rooms
- Owner, editor, and viewer permissions
- Private image and audio assets
- Previously opened room offline access
- Controlled conflict resolution
- Physics interactions
- Mini-map and collaborator radar
- At least 100 ordinary scene elements
- Fast local development
- Independent testing
- Simple deployment
- Future scaling without premature distributed complexity

The architecture must remain practical for a two-day MVP.

⸻

## 4. Architectural principles

### 4.1 Excalidraw is the canvas engine

Excalidraw owns ordinary canvas behaviour, including:

- Rendering
- Pointer interaction
- Selection
- Shape creation
- Text editing
- Image elements
- Element transformations
- Grouping
- Z-order
- Native undo and redo
- Pan and zoom
- Scene export primitives

The product should not rebuild these features unless a documented limitation requires an extension.

⸻

### 4.2 The product owns application concerns

The surrounding application owns:

- Identity
- Rooms
- Membership
- Permissions
- Asset authorisation
- Durable collaboration policy
- Offline policy
- Audio objects
- Physics
- Radar
- Mini-map
- Archive
- Recycle bin
- Product exports
- Testability hooks

⸻

### 4.3 One durable visual scene

The system must not maintain two independent permanent canvas models.

The Excalidraw scene is the canonical durable visual representation.

Temporary projections may exist for:

- Physics simulation
- Mini-map calculations
- DOM overlays
- QA inspection
- Local UI state

These projections must derive from the scene and must not drift into independent permanent state.

⸻

### 4.4 Local-first interaction

Authorised user actions should appear locally before network confirmation where safe.

Examples:

- Creating an element
- Moving an element
- Editing text
- Selecting elements
- Panning
- Zooming

Persistence and network synchronisation should not block ordinary visual feedback.

⸻

### 4.5 Server-authoritative permissions

The browser is not trusted to enforce room access.

Permissions must be enforced at:

- HTTP API boundaries
- Collaboration connection boundaries
- Collaboration update boundaries where feasible
- Asset access boundaries
- Administrative action boundaries

Excalidraw view mode is a user-experience control, not a security mechanism.

⸻

### 4.6 Shared contracts

All applications should use shared validated TypeScript contracts for:

- Guest identity
- Room roles
- Room metadata
- Scene persistence envelopes
- Product metadata
- Asset records
- Collaboration messages
- Awareness state
- Error codes
- Export schemas

⸻

### 4.7 Testability by design

The system must support:

- Unit tests
- Integration tests
- Multi-client Playwright tests
- QA-Intel validation
- Excalidraw scene inspection
- Product-state inspection
- Stable non-production selectors

⸻

## 5. Technology stack

### 5.1 Frontend

- React
- TypeScript
- Vite
- Excalidraw React package
- Zustand
- Yjs
- Hocuspocus Provider
- IndexedDB
- Matter.js
- Playwright

⸻

### 5.2 HTTP API

- NestJS
- Fastify adapter
- TypeScript
- Shared runtime validation
- PostgreSQL
- Object-storage integration

⸻

### 5.3 Collaboration server

- Hocuspocus
- Yjs
- TypeScript
- PostgreSQL-backed persistence adapter
- Shared room-authorisation package

⸻

### 5.4 Repository and tooling

- pnpm
- Turborepo
- TypeScript
- Vitest
- Playwright
- QA-Intel
- Docker Compose for local infrastructure

⸻

## 6. Repository architecture

The project uses one pnpm Turborepo monorepo.

vegaIT-hackerton/
├── apps/
│ ├── web/
│ ├── api/
│ └── collaboration/
│
├── packages/
│ ├── contracts/
│ ├── excalidraw-adapter/
│ ├── collaboration-schema/
│ ├── canvas-extensions/
│ ├── database/
│ ├── auth/
│ ├── config/
│ ├── test-utils/
│ ├── eslint-config/
│ └── typescript-config/
│
├── docs/
│ ├── product/
│ ├── architecture/
│ ├── contracts/
│ ├── engineering/
│ ├── operations/
│ ├── security/
│ └── adr/
│
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md

⸻

## 7. Application boundaries

### 7.1 Web application

Location:

apps/web

Responsibilities:

- Guest identity entry
- Guest-session restoration
- Room creation interface
- Room joining
- Embedded Excalidraw scene
- Product toolbars and overlays
- Scene-change observation
- Collaboration provider integration
- Presence rendering
- Remote cursors
- Sticky notes
- Image placement
- Audio recording and playback
- Mini-map
- Collaborator radar
- Physics mode
- Offline IndexedDB persistence
- Upload queue
- Connection-state feedback
- Recycle-bin interface
- Archive interface
- Export interface
- QA test hooks

The web application must not be trusted to determine final room permissions.

⸻

### 7.2 HTTP API

Location:

apps/api

Responsibilities:

- Guest-session creation
- Guest-session validation
- Room creation
- Room metadata
- Room membership
- Role assignment
- Invitation-link resolution
- Permission changes
- Room archive and restore
- Recycle-bin administrative operations
- Asset upload authorisation
- Asset access authorisation
- Export metadata
- Audit records
- Health endpoints

The API does not own live Excalidraw scene transport.

⸻

### 7.3 Collaboration application

Location:

apps/collaboration

Responsibilities:

- WebSocket lifecycle
- Hocuspocus configuration
- Yjs room documents
- Connection authentication
- Room-role validation
- Shared scene synchronisation
- Product metadata synchronisation
- Awareness state
- Remote cursor transport
- Viewport-awareness transport
- Physics interaction leases
- Document loading
- Document persistence
- Reconnection
- Collaboration health endpoints

The collaboration application must validate every room connection.

A valid room URL alone is insufficient.

⸻

## 8. Shared package boundaries

### 8.1 Contracts package

Location:

packages/contracts

Contains:

- Guest identity schemas
- Room-role schemas
- API request and response schemas
- Error codes
- Asset schemas
- Export schemas
- Connection-state schemas
- Product metadata schemas

Example:

export interface GuestIdentity {
id: string;
email: string;
username: string;
colour: string;
}

The email field must not enter shared awareness data.

⸻

### 8.2 Excalidraw adapter package

Location:

packages/excalidraw-adapter

Purpose:

Provide a stable product-owned boundary around Excalidraw.

Responsibilities:

- Scene serialisation
- Scene deserialisation
- Scene normalisation
- File-data mapping
- Element filtering
- Product metadata association
- Element-ID helpers
- Export adapters
- Excalidraw version compatibility
- Scene validation
- Test projections

This package prevents product code from depending broadly on Excalidraw internals.

Example responsibilities:

interface SceneEnvelope {
version: number;
elements: readonly ExcalidrawElement[];
appState: PersistedAppState;
files: BinaryFiles;
}

The exact types should use supported Excalidraw public exports where available.

⸻

### 8.3 Collaboration schema package

Location:

packages/collaboration-schema

Contains:

- Yjs document layout
- Shared map and array names
- Scene update format
- Awareness schema
- Product metadata schema
- Physics lease schema
- Document version
- Migration helpers

Applications must not invent independent Yjs keys.

⸻

### 8.4 Canvas extensions package

Location:

packages/canvas-extensions

Contains product-specific canvas logic:

- Sticky-note composition
- Audio-card composition
- Mini-map projections
- Radar calculations
- Physics eligibility
- Physics coordinate mapping
- Recycle-bin transformations
- Product object duplication rules
- Custom overlay models

This package should avoid React where logic can remain pure.

It is a major TDD target.

⸻

### 8.5 Database package

Location:

packages/database

Contains:

- Database client
- Schema definitions
- Migrations
- Repository helpers
- Test database setup

It may be used by both API and collaboration applications.

Business rules should remain outside this package.

⸻

### 8.6 Authentication package

Location:

packages/auth

Contains:

- Guest-session tokens
- Room-access claims
- Role checks
- Shared permission helpers
- Identity parsing
- Token validation

The API and collaboration server must use identical role semantics.

⸻

### 8.7 Configuration package

Location:

packages/config

Contains:

- Environment schemas
- Typed configuration
- Shared defaults
- Application-specific config loaders
- Runtime validation

Applications should fail fast when required configuration is missing.

⸻

### 8.8 Test utilities package

Location:

packages/test-utils

Contains:

- Test guest identities
- Room fixtures
- Excalidraw scene fixtures
- Element factories
- Audio and image fixtures
- Yjs test clients
- Test database reset helpers
- Playwright helpers
- QA-Intel helpers

Production packages must not depend on test utilities.

⸻

## 9. High-level topology

                          ┌──────────────────────────┐
                          │         Browser          │
                          │                          │
                          │ React                    │
                          │ Excalidraw               │
                          │ Zustand                  │
                          │ Yjs client               │
                          │ IndexedDB                │
                          │ Matter.js                │
                          └────────────┬─────────────┘
                                       │
                       ┌───────────────┴───────────────┐
                       │                               │
                 HTTPS / JSON                  WebSocket / Yjs
                       │                               │
                       ▼                               ▼
             ┌───────────────────┐           ┌────────────────────┐
             │    NestJS API     │           │ Hocuspocus Server  │
             │                   │           │                    │
             │ Guests            │           │ Scene sync         │
             │ Rooms             │           │ Product metadata   │
             │ Permissions       │           │ Presence           │
             │ Assets            │           │ Physics leases     │
             │ Archive           │           │ Persistence hooks  │
             │ Recycle bin       │           │                    │
             └─────────┬─────────┘           └──────────┬─────────┘
                       │                                │
                       └───────────────┬────────────────┘
                                       │
                                       ▼
                             ┌─────────────────────┐
                             │     PostgreSQL      │
                             │                     │
                             │ Guests              │
                             │ Rooms               │
                             │ Memberships         │
                             │ Scene snapshots     │
                             │ Yjs updates         │
                             │ Assets              │
                             │ Audit records       │
                             └──────────┬──────────┘
                                        │
                                        ▼
                             ┌─────────────────────┐
                             │   Object Storage    │
                             │                     │
                             │ Images              │
                             │ Audio               │
                             │ Exported files      │
                             └─────────────────────┘

⸻

## 10. Data ownership model

The system separates data into five categories.

### 10.1 Excalidraw scene data

Canonical durable visual state.

Includes:

- Excalidraw elements
- Required scene app state
- Binary file references
- Element ordering
- Group identifiers
- Element deletion markers where retained by Excalidraw

This data is collaboratively synchronised and persisted.

⸻

### 10.2 Product scene metadata

Durable product-specific state associated with the room or Excalidraw elements.

Examples:

- Sticky-note composition metadata
- Audio-card metadata
- Asset identifiers
- Physics eligibility
- Recycle-bin records
- Replay metadata
- Schema version

This data must reference stable room or element IDs.

⸻

### 10.3 Relational application metadata

Stored in PostgreSQL.

Examples:

- Guest identity
- Room
- Room membership
- Role
- Share-link metadata
- Archive state
- Asset record
- Audit entry

⸻

### 10.4 Ephemeral awareness state

Distributed through collaboration awareness.

Examples:

- Cursor
- Current selection
- Viewport
- Active collaborator
- Current interaction type
- Physics lease presence

This data is not durable scene content.

⸻

### 10.5 Binary assets

Stored in private object storage.

Examples:

- Images
- Audio
- PNG exports
- SVG exports

PostgreSQL stores asset ownership and status.

⸻

## 11. Excalidraw integration architecture

### 11.1 Embedded component

The web application embeds the Excalidraw React component.

The integration should use supported public APIs for:

- Initial scene data
- Scene updates
- Imperative API access
- View mode
- Export
- File handling
- Collaboration indicators where appropriate

⸻

### 11.2 Scene change observation

Excalidraw scene changes should be observed through supported callbacks.

The product should distinguish:

- Local visual changes
- Persistable scene changes
- Ephemeral app-state changes
- Remote-applied changes
- Product overlay changes

Not every callback invocation should create a network or persistence write.

⸻

### 11.3 Controlled update pipeline

Recommended flow:

User edits Excalidraw scene
↓
Excalidraw emits scene change
↓
Adapter normalises the scene
↓
Change is classified
↓
Collaborative transaction is applied
↓
Remote clients receive the update
↓
Persistence stores the durable update

The implementation must avoid feedback loops where a remote scene update triggers an identical local update repeatedly.

⸻

### 11.4 Scene envelope

The product should persist a versioned scene envelope.

Example:

interface PersistedSceneEnvelope {
schemaVersion: number;
excalidrawVersion: string;
elements: readonly ExcalidrawElement[];
appState: PersistedExcalidrawAppState;
files: PersistedBinaryFileMap;
productMetadata: ProductSceneMetadata;
savedAt: string;
}

Only app-state fields required to restore the room should be persisted.

Local viewport and transient UI state should generally be excluded.

⸻

### 11.5 Excalidraw version pinning

The Excalidraw dependency must use an explicit pinned version.

Scene compatibility must be tested before upgrading.

The adapter package should isolate version-specific behaviour.

⸻

### 11.6 Avoid unsupported internals

The application should avoid:

- Importing deeply from undocumented package paths
- Mutating Excalidraw internal stores directly
- Replacing internal event systems
- Depending on unstable private element properties
- Forking Excalidraw during the MVP

Where unsupported behaviour becomes unavoidable, it must be documented as technical risk.

⸻

## 12. Canonical collaboration model

The system needs one canonical synchronisation model.

The recommended model is:

- Yjs document is the canonical collaborative transport and merge layer.
- Excalidraw scene is the canonical visual representation.
- The adapter maps between Yjs state and Excalidraw scene data.
- Product metadata is stored in defined Yjs structures.
- Excalidraw is updated through supported APIs.

The collaboration design document must define the exact granularity.

Two valid broad approaches exist:

Option A — Scene-level snapshots

The complete normalised scene is synchronised as a versioned payload.

Advantages:

- Simpler initial implementation
- Easier Excalidraw compatibility
- Faster MVP development

Disadvantages:

- Coarser conflicts
- Larger updates
- Less elegant concurrent editing

Option B — Element-level shared structures

Each Excalidraw element is represented in shared Yjs maps or arrays.

Advantages:

- Better independent merging
- More efficient targeted updates
- More collaboration control

Disadvantages:

- More adapter complexity
- Greater risk of scene-order and element-schema bugs
- More work within the hackathon window

The final choice belongs in 02-collaboration-and-sync-design.md.

For the two-day MVP, the architecture should favour the simplest model that reliably demonstrates multi-user convergence.

⸻

## 13. Room lifecycle

### 13.1 Room creation

Browser
→ POST /rooms
→ API validates guest session
→ API creates room
→ API creates owner membership
→ API creates empty scene record
→ API returns room metadata
→ Browser opens room
→ Browser connects to collaboration server

The creator becomes the room owner.

⸻

### 13.2 Room joining

Browser
→ Opens share link
→ Resolves room through API
→ Creates or restores guest identity
→ Receives room role
→ Loads persisted scene
→ Connects to collaboration server
→ Synchronises current document

⸻

### 13.3 Room archive

Owner requests archive
→ API validates owner role
→ Room marked archived
→ New edit connections rejected
→ Existing clients receive archived state
→ Scene and assets remain preserved

⸻

### 13.4 Room restore

Owner requests restore
→ API validates owner role
→ Room marked active
→ Collaboration access resumes
→ Existing scene remains available

⸻

## 14. Guest identity architecture

A guest identity contains:

interface GuestIdentity {
id: string;
email: string;
username: string;
colour: string;
}

Rules:

- Email is required.
- Email is unverified.
- Email remains private.
- Username is visible.
- Colour is visible.
- Guest ID may be used internally.
- Session token is signed and opaque.
- Email must not enter Yjs awareness.
- Email must not enter Excalidraw scene data.
- Email must not appear in room exports.

⸻

### 15. Permission model

type RoomRole = "owner" | "editor" | "viewer";

Owner

Can:

- View
- Edit
- Invite
- Change permissions
- Upload assets
- Use physics
- Restore deleted content
- Archive
- Restore room
- Export

Editor

Can:

- View
- Edit
- Upload assets
- Record audio
- Use physics
- Delete supported content
- Restore content where permitted
- Export where permitted

Viewer

Can:

- View
- Pan
- Zoom
- Observe presence
- Use mini-map
- Use radar
- Play authorised audio

Cannot:

- Modify scene
- Upload
- Record audio
- Trigger shared physics
- Change permissions
- Archive

⸻

## 16. Permission enforcement layers

Permissions must be enforced at multiple boundaries.

16.1 Web interface

Purpose:

- Reduce confusion
- Disable unavailable controls
- Enable Excalidraw view mode

Not a security boundary.

⸻

16.2 API

Required for:

- Room changes
- Permission changes
- Archive
- Restore
- Upload authorisation
- Asset access
- Export authorisation

⸻

16.3 Collaboration server

Required for:

- Room connection
- Scene document access
- Shared metadata access
- Rejected viewer updates
- Archived-room protection

⸻

16.4 Asset layer

Required for:

- Upload
- Download
- Playback
- Signed access generation

Possessing an asset URL must not provide indefinite public access.

⸻

## 17. Shared room document

A room maps to one collaboration document.

Suggested document name:

room:{roomId}

Conceptual structure:

interface SharedRoomDocument {
scene: unknown;
productMetadata: unknown;
deletedObjects: unknown;
physicsLeases: unknown;
documentMetadata: unknown;
}

A more explicit Yjs structure will be defined in the collaboration design.

⸻

## 18. Awareness model

Suggested awareness payload:

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
}

Email is intentionally excluded.

⸻

## 19. Zustand responsibilities

Zustand should manage local product state.

Recommended stores:

useRoomStore
useConnectionStore
usePermissionStore
useAssetStore
useAudioStore
useMiniMapStore
useRadarStore
usePhysicsStore
useRecycleBinStore
useExportStore

Zustand should not become a second permanent scene database.

Excalidraw scene data and Yjs collaboration state remain separate from transient UI state.

⸻

## 20. Custom object architecture

### 20.1 Sticky notes

Sticky notes should use valid Excalidraw elements.

Possible representation:

- Rectangle plus bound text
- Grouped rectangle and text

Product metadata may store:

- Object kind
- Root element ID
- Child element IDs
- Colour preset
- Behaviour flags

⸻

### 20.2 Audio cards

Audio cards require both:

- Excalidraw visual elements
- Product metadata referencing an audio asset

Example:

interface AudioCardMetadata {
id: string;
rootElementId: string;
elementIds: string[];
assetId: string;
durationMs?: number;
title?: string;
status: "uploading" | "ready" | "failed";
}

The audio binary does not belong inside ordinary scene JSON.

⸻

### 20.3 Product object identity

A product object should have:

- Stable product object ID
- Stable associated element IDs
- Object kind
- Schema version
- Optional asset ID

Duplication and restoration must update references safely.

⸻

## 21. Asset architecture

### 21.1 Asset states

type AssetStatus =
| "pending"
| "uploading"
| "ready"
| "failed"
| "archived";

⸻

### 21.2 Upload flow

Browser
→ Requests upload authorisation
→ API validates room role
→ API creates pending asset record
→ Browser uploads to object storage
→ Browser confirms completion
→ API marks asset ready
→ Scene or product metadata references asset ID

For the MVP, API-proxied upload may be used if direct object-storage upload is too costly to configure.

⸻

### 21.3 Image files

Excalidraw image elements may need binary file metadata.

The adapter must map between:

- Excalidraw file identifiers
- Product asset identifiers
- Authorised asset URLs or blobs
- Offline cached file data

Private infrastructure details must not be stored permanently in public scene data.

⸻

### 21.4 Audio files

Audio is always product-owned binary data.

Playback uses an authorised asset-access path.

Scene metadata references a stable asset ID.

⸻

## 22. Offline architecture

Offline support applies to previously opened rooms.

### 22.1 IndexedDB storage

The browser may store:

- Excalidraw scene snapshot
- Yjs updates
- Product metadata
- Room metadata
- Guest session
- Pending asset uploads
- Last-known role
- Local rejected draft

⸻

### 22.2 Offline flow

Connection lost
→ Status becomes Offline
→ Cached Excalidraw scene remains active
→ Eligible local changes continue
→ IndexedDB stores local updates
→ Network returns
→ Permission is revalidated
→ Eligible updates reconcile

⸻

### 22.3 Permission revocation while offline

User edits offline
→ Role changes remotely
→ User reconnects
→ Current role is validated
→ Unauthorised updates rejected
→ Shared room protected
→ Local draft preserved
→ Export or recovery offered

⸻

### 22.4 Offline assets

New binary uploads may:

- Queue locally where browser support is reliable
- Remain visibly pending
- Resume after reconnect

They must not appear as successfully shared before upload completion.

⸻

## 23. Physics architecture

Matter.js runs in the browser.

The server does not simulate every physics frame.

### 23.1 Temporary projection

During physics mode:

- Eligible Excalidraw elements are mapped to Matter.js bodies.
- Matter.js owns temporary simulation transforms.
- Simulation output maps back to Excalidraw coordinates.
- Final valid element state is committed to shared scene data.

⸻

### 23.2 Eligible element mapping

The extension must define deterministic mappings for:

- Rectangle
- Ellipse
- Image
- Audio card

Initially unsupported:

- Text-only elements
- Arrows
- Lines
- Freehand drawings
- Sticky notes
- Locked elements

⸻

### 23.3 Physics lease

Example:

interface PhysicsLease {
elementId: string;
guestId: string;
acquiredAt: number;
expiresAt: number;
}

A lease:

- Prevents competing simulations
- Expires automatically
- Is renewable
- Ends after settling
- Ends after disconnect
- Does not permanently lock an element

⸻

### 23.4 Update frequency

Physics updates should be throttled or batched.

The system should not publish every engine frame.

Possible strategy:

- Local simulation at display-frame rate
- Shared position updates at lower frequency
- Final authoritative scene commit at settlement

⸻

### 23.5 Physics source of truth

Matter.js state is temporary.

Excalidraw element state is durable.

No persistent Matter.js world should be required to reopen a room.

⸻

## 24. Mini-map architecture

The mini-map is a derived product overlay.

Inputs:

- Excalidraw element bounds
- Local viewport
- Collaborator viewport awareness

It should not:

- Become part of the Excalidraw scene
- Persist as scene content
- Modify other clients’ viewports
- Recalculate unnecessarily on every pointer event

⸻

## 25. Collaborator radar architecture

Radar is derived from:

- Local viewport bounds
- Collaborator cursor or viewport centre
- Shared awareness state

Output:

- Direction
- Approximate distance
- Username
- Colour

Radar state is local and ephemeral.

⸻

## 26. Recycle-bin architecture

Deletion should remain compatible with Excalidraw.

The product should record recoverable deletion data for supported objects.

Example:

interface DeletedObjectRecord {
id: string;
roomId: string;
elementIds: string[];
elements: unknown[];
productMetadata?: unknown;
deletedBy: string;
deletedAt: string;
originalOrder?: string[];
}

Delete wins for the active scene.

Restoration creates or reactivates valid scene elements.

⸻

## 27. Export architecture

### 27.1 PNG

Use Excalidraw’s public export API where suitable.

Product overlays such as remote cursors, radar, and connection state should not appear unless explicitly selected.

⸻

### 27.2 JSON

Export should contain:

- Versioned Excalidraw scene
- Supported product metadata
- Safe asset references
- Schema version

Export must exclude:

- Guest emails
- Session tokens
- Signed URLs
- Internal credentials
- Private authorisation claims

⸻

### 27.3 SVG

Optional.

Use supported Excalidraw export APIs where possible.

Product overlays may be omitted with clear disclosure.

⸻

## 28. Replay architecture

Replay is optional.

If implemented, it should record meaningful product events rather than every raw scene callback.

Possible events:

- Element created
- Element moved
- Element transformed
- Text updated
- Element deleted
- Element restored
- Physics throw committed
- Room archived

Replay should not persist every remote cursor update.

⸻

## 29. Testing architecture

### 29.1 Unit tests

Primary targets:

- Guest validation
- Permission helpers
- Excalidraw scene normalisation
- Product metadata mapping
- Sticky-note composition
- Audio-card metadata
- Asset state transitions
- Mini-map calculations
- Radar calculations
- Physics eligibility
- Physics coordinate mapping
- Physics lease logic
- Recycle-bin transformations
- Export filtering

⸻

### 29.2 Integration tests

Primary targets:

- Room creation
- Owner membership
- API role enforcement
- Collaboration authentication
- Scene persistence
- Product metadata persistence
- Two-client convergence
- Asset lifecycle
- Archived-room rejection
- Offline permission revalidation

⸻

### 29.3 End-to-end tests

Primary targets:

- Guest entry
- Room creation
- Invite and join
- Excalidraw scene collaboration
- Viewer restrictions
- Image upload
- Audio recording
- Offline reconnect
- Physics throw
- Delete and restore
- Archive and restore
- Export

⸻

### 29.4 QA-Intel

QA-Intel acts as an independent behavioural validation layer.

It should:

- Use multiple browser contexts
- Execute Gherkin-derived Playwright scenarios
- Capture screenshots
- Capture traces
- Inspect browser logs
- Inspect network failures
- Query the test-only scene API
- Produce pass or fail evidence
- Suggest likely failure causes

QA-Intel does not replace unit and integration tests.

⸻

## 30. Testability interface

The web application should expose a non-production inspection API.

Example:

interface CanvasTestApi {
getSceneElements(): Array<{
id: string;
type: string;
x: number;
y: number;
width?: number;
height?: number;
angle?: number;
groupIds?: string[];
}>;
getCustomObjects(): unknown[];
getSelectedElementIds(): string[];
getViewport(): {
scrollX: number;
scrollY: number;
zoom: number;
};
getConnectionState(): string;
getCollaborators(): Array<{
guestId: string;
username: string;
colour: string;
}>;
getRoomRole(): "owner" | "editor" | "viewer";
getPhysicsState(): unknown;
}

Requirements:

- Disabled in production
- Read-only where possible
- Serialisable
- No guest email
- No tokens
- No permission bypass

⸻

## 31. Observability

### 31.1 API logs

Include:

- Request ID
- Route
- Status
- Guest ID
- Room ID
- Error code

Avoid guest email.

⸻

### 31.2 Collaboration logs

Include:

- Connection ID
- Room ID
- Guest ID
- Role
- Authentication outcome
- Document load result
- Persistence result
- Connect and disconnect

⸻

### 31.3 Client diagnostics

Capture:

- Excalidraw load failures
- Scene adapter failures
- Connection state
- Reconnect attempts
- Upload failures
- Audio errors
- Physics errors
- Unhandled exceptions

⸻

## 32. Error codes

Example stable codes:

type ErrorCode =
| "ROOM_NOT_FOUND"
| "ROOM_ARCHIVED"
| "PERMISSION_DENIED"
| "SESSION_INVALID"
| "SCENE_LOAD_FAILED"
| "SCENE_PERSISTENCE_FAILED"
| "ASSET_UPLOAD_FAILED"
| "ASSET_ACCESS_DENIED"
| "COLLABORATION_UNAVAILABLE"
| "LOCAL_DRAFT_REJECTED"
| "PHYSICS_LEASE_DENIED";

The client maps technical codes to actionable messages.

⸻

## 33. Security boundaries

Browser

Untrusted.

Must not:

- Decide final role
- Generate privileged claims
- Expose private asset credentials
- Store emails in awareness
- Bypass archive state
- Directly access PostgreSQL

⸻

API

Trusted for:

- Guest session
- Room metadata
- Membership
- Permissions
- Asset authorisation
- Archive
- Restore
- Audit records

⸻

Collaboration server

Trusted for:

- Document access
- Role validation
- Scene synchronisation
- Product metadata synchronisation
- Awareness transport
- Persistence hooks

⸻

PostgreSQL

Private infrastructure.

Stores:

- Room metadata
- Membership
- Asset metadata
- Scene persistence data
- Audit records

⸻

Object storage

Private by default.

Stores:

- Images
- Audio
- Generated exports

Access is authorised through the application.

⸻

## 34. Deployment model

Minimum deployment units:

Web application
API application
Collaboration application
PostgreSQL
Object storage

Possible deployment:

Web
→ Static or edge hosting
API
→ Node.js container
Collaboration
→ Long-lived Node.js WebSocket container
Database
→ Managed PostgreSQL
Assets
→ S3-compatible private object storage

⸻

## 35. Local-development model

Recommended command:

pnpm dev

Turborepo should start:

- Web application
- API application
- Collaboration application

Docker Compose may start:

- PostgreSQL
- S3-compatible object storage

Recommended local endpoints:

Web: http://localhost:3000
API: http://localhost:4000
Collaboration: ws://localhost:4001

⸻

## 36. Failure scenarios

### 36.1 API unavailable

Expected behaviour:

- Existing collaboration may continue temporarily.
- New room creation fails.
- Permission changes fail.
- Upload authorisation fails.
- User receives feedback.

⸻

### 36.2 Collaboration server unavailable

Expected behaviour:

- Status becomes Reconnecting or Offline.
- Cached Excalidraw scene remains visible.
- Eligible local work is preserved.
- Automatic reconnect is attempted.

⸻

### 36.3 PostgreSQL unavailable

Expected behaviour:

- API operations fail safely.
- Persistence failures are reported.
- The application must not claim durable success falsely.

⸻

### 36.4 Object storage unavailable

Expected behaviour:

- Ordinary shapes and text remain usable.
- New uploads fail or queue.
- Existing cached assets may remain visible.
- Assets are not marked ready incorrectly.

⸻

### 36.5 Excalidraw integration failure

Expected behaviour:

- A recoverable error state is shown.
- Invalid product metadata should not necessarily crash valid scene elements.
- Diagnostics are recorded.
- The room must not silently appear empty if loading failed.

⸻

### 36.6 Physics extension failure

Expected behaviour:

- Physics mode is disabled or exited.
- Final valid scene coordinates remain.
- Ordinary Excalidraw editing remains available.
- Interaction leases expire.

⸻

## 37. Performance considerations

The MVP targets at least 100 ordinary scene elements.

The architecture should avoid:

- Full scene persistence on every pointer movement
- Full scene replacement for every awareness update
- Unthrottled physics network updates
- Persistent cursor history
- Repeated binary embedding in collaboration updates
- Excessive mini-map recomputation
- React state duplication of the full Excalidraw scene

Optimisation should be evidence-driven.

⸻

## 38. Scaling considerations

The MVP does not require distributed scaling.

Future scaling may introduce:

- Multiple API replicas
- Multiple collaboration replicas
- Shared pub/sub
- Sticky WebSocket routing
- Scene snapshot compaction
- Yjs update compaction
- Asset CDN
- Background export workers
- Replay event storage
- Room sharding

These should not be implemented prematurely.

⸻

## 39. Explicit non-goals

The architecture does not include:

- A custom replacement for Excalidraw
- A fork of Excalidraw
- A custom shape-rendering engine
- Microservices
- Kubernetes
- Multi-region replication
- Registered accounts
- Verified email
- Billing
- Enterprise organisations
- Server-side simulation of every physics frame
- Permanent cursor history
- Full design-tool file compatibility
- Unlimited asset processing

⸻

## 40. ADRs required

The following architectural decisions should eventually receive ADRs:

1. Use Excalidraw as the canvas engine.
2. Pin and wrap Excalidraw behind an adapter.
3. Use Yjs for collaborative state.
4. Use Hocuspocus for collaboration transport.
5. Use Zustand for local product UI state.
6. Use Matter.js for temporary client-side physics.
7. Use IndexedDB for offline room persistence.
8. Use PostgreSQL for application metadata and collaboration persistence.
9. Use private object storage for assets.
10. Use a pnpm Turborepo monorepo.
11. Separate the HTTP API and collaboration runtimes.
12. Use NestJS with Fastify for the API.
13. Use risk-based TDD.
14. Use QA-Intel as the independent acceptance layer.
15. Maintain one canonical durable visual scene.

⸻

## 41. Recommended implementation order

Slice 1 — Excalidraw foundation

Embed Excalidraw
→ Create rectangle
→ Observe scene update
→ Persist scene
→ Reload scene

⸻

Slice 2 — Shared room

Create room
→ Join room
→ Synchronise scene
→ Reload both clients

⸻

Slice 3 — Identity and permissions

Guest identity
→ Owner membership
→ Editor access
→ Viewer access
→ Viewer update rejection

⸻

Slice 4 — Product objects

Sticky note
→ Image
→ Audio card
→ Remote rendering
→ Reload

⸻

Slice 5 — Protected offline differentiator

Open cached room
→ Disconnect
→ Edit
→ Reconnect
→ Revalidate permission
→ Reconcile

⸻

Slice 6 — Optional P1 differentiators

Mini-map
→ Radar
→ Physics lease
→ Throw
→ Collision

⸻

Slice 7 — Optional P1 recovery and export

Delete
→ Recycle bin
→ Restore
→ Archive
→ Restore room
→ Export

Each slice includes:

- Acceptance scenario
- Failing test where applicable
- Implementation
- Integration verification
- QA-Intel validation

⸻

## 42. Architecture definition of done

The mandatory MVP architecture is considered implemented successfully when:

- Excalidraw is the primary canvas.
- No competing permanent scene model exists.
- Scene changes synchronise between two clients.
- Scene data persists after reload.
- Guest identity remains private.
- Room roles are server-enforced.
- Viewers cannot modify shared scene state.
- Product metadata remains associated with valid Excalidraw elements.
- Images and audio use private asset storage.
- Previously opened rooms load from the IndexedDB-backed collaborative cache while offline.
- Eligible offline scene changes reconcile only after current room and membership permissions are revalidated.
- Rejected offline work remains local and recoverable.
- QA-Intel can inspect and validate the running system.
- The system can be started locally through documented commands.

When optional P1 capabilities are implemented:

- Physics commits ordinary Excalidraw transforms and never becomes a second durable scene model.
- Mini-map and radar remain derived local overlays.
- Deleted supported content can be restored.
- Archived rooms reject editing.
- General exports exclude private identity and transient presence data.

⸻

## 43. Final architecture policy

The project adopts the following architecture policy:

Excalidraw is the durable visual canvas and interaction engine. Yjs and Hocuspocus provide collaboration. The application owns identity, rooms, permissions, assets, offline policy, and product extensions. Every extension must map back into valid Excalidraw scene state without creating a competing permanent canvas model.

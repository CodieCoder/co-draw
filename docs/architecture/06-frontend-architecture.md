# Frontend Architecture

## Real-Time Collaborative Infinite Canvas

**Document path:** `docs/architecture/06-frontend-architecture.md`
**Document status:** Accepted
**Product phase:** Two-day MVP / Hackathon
**Last updated:** 25 July 2026
**Primary owners:** Frontend Engineering and Architecture

---

# 1. Purpose

This document defines the frontend architecture for the real-time collaborative infinite canvas.

It specifies:

- React application structure
- Routing
- Feature boundaries
- State ownership
- Server-state handling
- Collaboration-state handling
- Excalidraw integration
- Product overlays
- Asset workflows
- Offline behaviour
- Permission-driven user interface
- Responsive behaviour
- Error handling
- Performance
- Accessibility
- Testing
- Dependency rules

The frontend must provide a responsive collaborative experience without creating conflicting representations of the Excalidraw scene.

---

# 2. Frontend technology stack

The frontend uses:

- React
- TypeScript
- Vite
- Excalidraw
- TanStack Query
- Zustand
- Yjs
- Hocuspocus Provider
- IndexedDB
- Matter.js
- React Router or TanStack Router
- Vitest
- React Testing Library
- Playwright
- QA-Intel

The routing library should be selected once and used consistently.

For the MVP, React Router is sufficient unless the repository already standardises on TanStack Router.

---

# 3. Frontend architectural principles

## 3.1 Excalidraw owns canvas interaction state

Excalidraw owns:

- Active drawing tool
- Local selection
- Shape creation
- Text editing
- Element transformations
- Native undo and redo
- Pan
- Zoom
- Native canvas menus

The frontend must not mirror all Excalidraw state into Zustand.

---

## 3.2 TanStack Query owns HTTP server state

TanStack Query owns remote application data fetched through the HTTP API.

Examples:

- Current guest session
- Room metadata
- Memberships
- Share links
- Asset metadata
- Recycle-bin summaries
- Export records

---

## 3.3 Yjs owns shared collaborative document state

Yjs owns:

- Shared Excalidraw elements
- Shared element order
- Product object metadata
- Deleted-object records
- Physics leases
- Awareness

The full Yjs document should not be copied into Zustand.

---

## 3.4 Zustand owns local product state

Zustand owns local application state that is:

- Shared by multiple React components
- Not naturally owned by Excalidraw
- Not server state
- Not durable collaborative state

Examples:

- Connection status
- Product panel visibility
- Active extension mode
- Asset upload queue state
- Local physics mode state
- Rejected-draft notification state

---

## 3.5 React local state remains local

State used by one component or one small component subtree should stay in React component state.

Examples:

- Form input
- Dialog-open state
- Hover state
- Temporary validation message
- Local menu position

---

## 3.6 One-way dependency flow

The preferred flow is:

```text id="mtw26a"
Route
  ↓
Feature container
  ↓
Feature services and hooks
  ↓
Shared packages and infrastructure adapters
```

Low-level packages must not import feature-specific UI components.

---

# 4. Frontend application boundary

Location:

```text id="z8p37b"
apps/web
```

Responsibilities:

- Guest onboarding
- Room creation
- Invitation resolution
- Room access
- Excalidraw rendering
- Collaboration connection
- Presence
- Permission-aware controls
- Asset upload and playback
- Audio recording
- Sticky-note creation
- Mini-map
- Collaborator radar
- Physics mode
- Offline room access
- Archive and recycle-bin interfaces
- Export
- Error and recovery states
- Browser-based testing hooks

---

# 5. Suggested application structure

```text id="prpw0v"
apps/web/src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   ├── providers.tsx
│   ├── query-client.ts
│   ├── environment.ts
│   └── error-boundary.tsx
│
├── routes/
│   ├── home/
│   ├── guest/
│   ├── room/
│   ├── invitation/
│   └── not-found/
│
├── features/
│   ├── guest-session/
│   ├── room/
│   ├── collaboration/
│   ├── canvas/
│   ├── permissions/
│   ├── presence/
│   ├── assets/
│   ├── images/
│   ├── audio/
│   ├── sticky-notes/
│   ├── physics/
│   ├── mini-map/
│   ├── radar/
│   ├── recycle-bin/
│   ├── archive/
│   ├── export/
│   └── offline/
│
├── components/
│   ├── ui/
│   ├── feedback/
│   ├── layout/
│   └── accessibility/
│
├── hooks/
├── stores/
├── services/
├── test-api/
├── styles/
└── main.tsx
```

---

# 6. Feature-folder rule

A feature folder may contain:

```text id="co676c"
components/
hooks/
services/
queries/
mutations/
store/
types/
tests/
index.ts
```

Example:

```text id="ehx8ed"
features/assets/
├── components/
│   ├── AssetUploadButton.tsx
│   ├── AssetUploadProgress.tsx
│   └── MissingAssetPlaceholder.tsx
├── hooks/
│   ├── useCreateAsset.ts
│   └── useResolveAsset.ts
├── services/
│   └── asset-client.ts
├── types/
├── tests/
└── index.ts
```

Features should expose a narrow public API through `index.ts`.

---

# 7. Dependency rules

## Routes may import

- Features
- Shared components
- Application providers
- Shared hooks

## Features may import

- Shared UI components
- Shared service clients
- Shared contracts
- Infrastructure packages
- Other features only through public exports

## Shared UI components may not import

- Room-specific services
- Collaboration providers
- Excalidraw adapter
- Feature stores

## Stores may import

- Shared types
- Pure helper functions

Stores should not import React components.

---

# 8. Routing model

Suggested routes:

```text id="3a8x1o"
/
 /guest
 /invite/:shareToken
 /rooms/:roomId
 /rooms/:roomId/archive
 /rooms/:roomId/recovery
```

The archive and recovery interfaces may also be overlays inside the main room route.

---

# 9. Home route

Route:

```text id="e39dwz"
/
```

Responsibilities:

- Detect current guest session
- Show create-room action
- Accept room-link navigation
- Redirect to guest onboarding where required
- Optionally show recently opened local rooms

The MVP does not require a full room dashboard.

---

# 10. Guest route

Route:

```text id="cn651d"
/guest
```

Responsibilities:

- Collect username
- Collect email
- Validate inputs
- Create guest session
- Resume the original destination

Input values should not be added to global state unless required.

---

# 11. Invitation route

Route:

```text id="hp62lr"
/invite/:shareToken
```

Responsibilities:

1. Resolve share link.
2. Show room name and intended role.
3. Request guest session if missing.
4. Accept invitation.
5. Navigate to the room.

Raw share tokens should not be placed in analytics events or ordinary logs.

---

# 12. Room route

Route:

```text id="77dhrr"
/rooms/:roomId
```

The room route owns the high-level room lifecycle.

It coordinates:

- Room metadata query
- Collaboration bootstrap query
- IndexedDB readiness
- Collaboration provider
- Excalidraw adapter
- Asset resolver
- Product overlays
- Connection-state interface
- Permission interface
- Recovery states

---

# 13. Room-route loading state

The room should distinguish:

```text id="nmzf4s"
Loading session
Loading room
Loading cached document
Connecting
Synchronising
Ready
Offline
Access denied
Archived
Recovery required
Fatal error
```

A single generic spinner is insufficient for all room states.

---

# 14. Provider composition

Suggested application providers:

```tsx id="g7dy7r"
<AppErrorBoundary>
  <QueryClientProvider>
    <RouterProvider />
  </QueryClientProvider>
</AppErrorBoundary>
```

Suggested room providers:

```tsx id="ez6lhc"
<RoomContextProvider>
  <PermissionProvider>
    <CollaborationProvider>
      <AssetResolverProvider>
        <CanvasWorkspace />
      </AssetResolverProvider>
    </CollaborationProvider>
  </PermissionProvider>
</RoomContextProvider>
```

Avoid deeply nested providers where simple hooks or service objects are sufficient.

---

# 15. HTTP client

The frontend should use one shared HTTP client.

Responsibilities:

- Base URL
- Credential handling
- Request IDs
- JSON parsing
- Error-envelope parsing
- Timeout policy
- Abort signals
- Stable error conversion

Conceptual interface:

```ts id="8pdvhi"
interface ApiClient {
  get<TResponse>(path: string, options?: RequestOptions): Promise<TResponse>;

  post<TRequest, TResponse>(
    path: string,
    body: TRequest,
    options?: RequestOptions,
  ): Promise<TResponse>;

  patch<TRequest, TResponse>(
    path: string,
    body: TRequest,
    options?: RequestOptions,
  ): Promise<TResponse>;

  delete<TResponse>(path: string, options?: RequestOptions): Promise<TResponse>;
}
```

Feature components should not call `fetch` directly.

---

# 16. TanStack Query responsibilities

TanStack Query manages:

- Current session query
- Room metadata query
- Collaboration bootstrap query
- Member list query
- Share-link list query
- Asset metadata query
- Recycle-bin query
- Export-status query

It also manages mutations for:

- Create session
- Create room
- Accept invitation
- Change role
- Archive room
- Restore room
- Create asset
- Complete upload
- Restore deleted object
- Create export

---

# 17. Query key policy

Query keys should be centralised.

Example:

```ts id="l5bh4s"
export const queryKeys = {
  currentGuest: ["guest-session", "current"] as const,

  room: (roomId: string) => ["rooms", roomId] as const,

  collaborationBootstrap: (roomId: string) =>
    ["rooms", roomId, "collaboration"] as const,

  roomMembers: (roomId: string) => ["rooms", roomId, "members"] as const,

  roomAssets: (roomId: string) => ["rooms", roomId, "assets"] as const,

  recycleBin: (roomId: string) => ["rooms", roomId, "recycle-bin"] as const,
};
```

Avoid inline query-key strings across the application.

---

# 18. Query invalidation policy

Examples:

## Role change

Invalidate:

```text id="xs28d0"
room metadata
member list
collaboration bootstrap
```

## Room archive

Invalidate:

```text id="9tb0jh"
room metadata
collaboration bootstrap
asset actions
```

## Asset completion

Invalidate:

```text id="hl9m68"
asset metadata
```

Do not invalidate the entire query cache unnecessarily.

---

# 19. Mutation feedback

Mutations should expose:

- Pending state
- Success state
- User-readable error
- Retry where safe

Optimistic updates should be used carefully.

Suitable:

- Local room-name display after owner edit

Unsuitable:

- Role changes
- Archive
- Asset-ready state
- Share-link acceptance

Security-sensitive state should wait for server confirmation.

---

# 20. Zustand store architecture

Recommended stores:

```text id="c759k8"
useConnectionStore
useCanvasUiStore
useAssetUploadStore
useAudioRecorderStore
usePhysicsStore
useMiniMapStore
useRadarStore
useOfflineStore
useRecoveryStore
```

Avoid one global application store.

---

# 21. Connection store

Conceptual state:

```ts id="c86blv"
interface ConnectionState {
  status:
    | "idle"
    | "connecting"
    | "synchronising"
    | "connected"
    | "reconnecting"
    | "offline"
    | "read-only"
    | "failed";

  lastConnectedAt?: number;
  lastSyncedAt?: number;
  reconnectAttempt: number;
  failureCode?: string;
}
```

Actions should be explicit.

---

# 22. Canvas UI store

Conceptual state:

```ts id="sx5zkc"
interface CanvasUiState {
  activeExtension:
    | "none"
    | "sticky-note"
    | "audio"
    | "physics"
    | "radar"
    | "mini-map";

  leftPanel?: "members" | "assets";
  rightPanel?: "recycle-bin" | "export";
  isMobileToolbarOpen: boolean;
}
```

Native Excalidraw selected-tool state should not be duplicated here.

---

# 23. Asset-upload store

Stores temporary client upload state:

```ts id="a3jtn8"
interface AssetUploadItem {
  localId: string;
  roomId: string;
  assetId?: string;
  kind: "image" | "audio";
  progress: number;
  status:
    | "queued"
    | "authorising"
    | "uploading"
    | "finalising"
    | "ready"
    | "failed";
  errorCode?: string;
}
```

Durable asset metadata still belongs to the server.

---

# 24. Audio-recorder store

Conceptual state:

```ts id="jj1lmo"
interface AudioRecorderState {
  status:
    | "idle"
    | "requesting-permission"
    | "recording"
    | "stopping"
    | "uploading"
    | "failed";

  startedAt?: number;
  durationMs: number;
  localBlob?: Blob;
  errorCode?: string;
}
```

Microphone streams must be released after recording or cancellation.

---

# 25. Physics store

Stores local simulation state:

```ts id="evv0d6"
interface PhysicsState {
  enabled: boolean;
  activeElementIds: string[];
  ownedLeaseIds: string[];
  simulationStatus: "idle" | "acquiring" | "running" | "settling" | "failed";
}
```

Durable element transforms remain in the shared scene.

Shared leases remain in Yjs.

---

# 26. Offline store

Conceptual state:

```ts id="bq7jcu"
interface OfflineState {
  indexedDbReady: boolean;
  cachedRoomAvailable: boolean;
  hasUnsynchronisedChanges: boolean;
  pendingAssetCount: number;
  lastOnlineAt?: number;
}
```

This store represents local status only.

It does not decide current permission.

---

# 27. Recovery store

Conceptual state:

```ts id="flncu6"
interface RecoveryState {
  rejectedDraftId?: string;
  reason?:
    | "permission-revoked"
    | "room-archived"
    | "access-denied"
    | "schema-incompatible";

  exportAvailable: boolean;
}
```

---

# 28. Collaboration feature boundary

Suggested structure:

```text id="fsq9di"
features/collaboration/
├── CollaborationProvider.tsx
├── collaboration-client.ts
├── collaboration-events.ts
├── useCollaboration.ts
├── useAwareness.ts
├── useCollaborators.ts
├── useConnectionStatus.ts
└── tests/
```

The collaboration feature wraps:

- Yjs document
- Hocuspocus Provider
- IndexedDB provider
- Awareness
- Connection lifecycle

---

# 29. Collaboration client interface

Conceptual interface:

```ts id="u5uefu"
interface CollaborationClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  destroy(): void;

  getDocument(): Y.Doc;
  getAwareness(): Awareness;

  getStatus(): CollaborationStatus;

  subscribeStatus(listener: (status: CollaborationStatus) => void): () => void;
}
```

React components should not manipulate Hocuspocus directly.

---

# 30. Collaboration-provider lifecycle

The provider should:

1. Receive validated bootstrap data.
2. Create a room-scoped Yjs document.
3. Initialise IndexedDB persistence.
4. Validate current access before merging writable local state.
5. Create Hocuspocus Provider.
6. Register status handlers.
7. Register awareness state.
8. Connect.
9. Expose the ready document.
10. Clean up on room change or unmount.

---

# 31. Room changes

When navigating from one room to another, the frontend must:

- Stop the current physics simulation
- Release active media streams
- Disconnect collaboration
- Destroy room-scoped Yjs observers
- Destroy the Excalidraw adapter
- Clear room-scoped local stores
- Preserve pending recovery records
- Load the next room independently

Room-scoped state must not leak across rooms.

---

# 32. Excalidraw feature boundary

Suggested structure:

```text id="3g3tp6"
features/canvas/
├── CanvasWorkspace.tsx
├── ExcalidrawCanvas.tsx
├── CanvasOverlayLayer.tsx
├── CanvasToolbar.tsx
├── CanvasStatusBar.tsx
├── useCanvasController.ts
├── useCanvasPermissions.ts
├── useCanvasViewport.ts
└── tests/
```

The `ExcalidrawCanvas` component should remain thin.

---

# 33. Canvas controller

The canvas controller coordinates:

- Excalidraw imperative API
- Excalidraw adapter
- Yjs scene state
- Asset resolver
- Permission mode
- Extension commands
- Test hooks

Conceptual interface:

```ts id="03jj46"
interface CanvasController {
  initialize(api: ExcalidrawImperativeAPI): Promise<void>;

  destroy(): void;

  createStickyNote(position?: CanvasPoint): Promise<void>;

  createAudioCard(input: CreateAudioCardInput): Promise<void>;

  insertImage(assetId: string, position?: CanvasPoint): Promise<void>;

  applyPhysicsTransform(update: PhysicsTransform): Promise<void>;

  exportScene(format: "png" | "json" | "svg"): Promise<ExportResult>;
}
```

---

# 34. Canvas component hierarchy

Suggested hierarchy:

```text id="rmrv7w"
CanvasWorkspace
├── CanvasHeader
├── CanvasToolbar
├── ExcalidrawCanvas
├── CanvasOverlayLayer
│   ├── PresenceOverlay
│   ├── RemoteCursorLayer
│   ├── AudioControlLayer
│   ├── MiniMap
│   ├── CollaboratorRadar
│   ├── ConnectionBanner
│   └── PermissionBanner
├── SidePanels
└── MobileActionSheet
```

Product overlays should not prevent native canvas interaction except where intentionally interactive.

---

# 35. Overlay layering

Recommended conceptual z-order:

```text id="xyjox2"
Base application layout
Excalidraw canvas
Canvas-bound product overlays
Presence overlays
Mini-map and radar
Toolbars and panels
Dialogs
Global notifications
```

Use a documented z-index scale rather than arbitrary values.

---

# 36. Overlay pointer-event policy

Non-interactive overlays should use:

```css id="6cmx07"
pointer-events: none;
```

Interactive children may restore:

```css id="hp8so1"
pointer-events: auto;
```

This prevents overlays from blocking canvas gestures accidentally.

---

# 37. Permission-driven UI

The frontend derives capabilities from the API response.

Example:

```ts id="gkvs22"
interface RoomCapabilities {
  canView: boolean;
  canEdit: boolean;
  canUploadAssets: boolean;
  canManageMembers: boolean;
  canArchive: boolean;
  canRestore: boolean;
  canExport: boolean;
  canUsePhysics: boolean;
}
```

The UI uses these capabilities to:

- Hide irrelevant actions
- Disable temporarily unavailable actions
- Set Excalidraw view mode
- Explain read-only status

The UI is not the final security boundary.

---

# 38. Viewer mode

For viewers:

- Excalidraw uses view mode.
- Editing controls are hidden or disabled.
- Pan and zoom remain enabled.
- Audio playback remains enabled.
- Presence remains visible.
- Mini-map and radar remain available.
- Physics controls are unavailable.
- Upload controls are unavailable.

---

# 39. Role change while connected

When role data changes:

1. Invalidate room metadata.
2. Invalidate collaboration bootstrap.
3. Update capability interface.
4. Disconnect writable collaboration if necessary.
5. Reconnect in the correct mode.
6. Set Excalidraw view mode appropriately.
7. Preserve authorised local view.

The frontend should not assume its original role remains current indefinitely.

---

# 40. Archived-room interface

When a room is archived:

- Show archived status clearly.
- Set Excalidraw to read-only.
- Disable uploads.
- Disable physics.
- Disable scene editing.
- Preserve viewing and authorised export where permitted.
- Show restore action to owners.

---

# 41. Presence feature

Suggested structure:

```text id="k75wtb"
features/presence/
├── PresenceList.tsx
├── RemoteCursorLayer.tsx
├── RemoteSelectionLayer.tsx
├── usePresencePublisher.ts
├── usePresenceSubscribers.ts
└── presence-colours.ts
```

Presence should consume awareness through a feature-level hook.

---

# 42. Local awareness publishing

The frontend may publish:

- Guest ID
- Username
- Colour
- Role
- Cursor
- Viewport
- Selection
- Interaction type

Publishing should be throttled.

Email must never be published.

---

# 43. Cursor coordinate conversion

Remote cursor rendering requires conversion between:

- Canvas world coordinates
- Local viewport coordinates

This logic should be centralised and tested.

Do not scatter pan and zoom calculations across components.

---

# 44. Asset architecture

Suggested structure:

```text id="q1nubi"
features/assets/
├── asset-api.ts
├── asset-cache.ts
├── AssetResolverProvider.tsx
├── useAsset.ts
├── useAssetUpload.ts
├── usePendingUploads.ts
└── components/
```

---

# 45. Asset resolver

Conceptual interface:

```ts id="g30z9g"
interface AssetResolver {
  resolveBlob(assetId: string): Promise<Blob>;

  resolveObjectUrl(assetId: string): Promise<string>;

  invalidate(assetId: string): void;

  dispose(): void;
}
```

Object URLs must be revoked when no longer needed.

---

# 46. Asset caching

The client may cache:

- Resolved blobs
- Object URLs
- Image dimensions
- Audio metadata

Caching should be room-scoped where possible.

Signed URLs should not be treated as durable identifiers.

---

# 47. Image insertion flow

```text id="gfskbt"
User selects image
  ↓
Validate locally
  ↓
Create asset authorisation
  ↓
Upload binary
  ↓
Complete asset
  ↓
Register Excalidraw file
  ↓
Create image element
  ↓
Publish shared scene update
```

A pending placeholder may be shown during upload.

---

# 48. Image upload failure

On failure:

- Keep a visible local placeholder where useful.
- Mark upload as failed.
- Offer retry.
- Do not publish the object as ready.
- Do not expose a broken permanent asset reference.

---

# 49. Audio recording flow

```text id="80mo8v"
User starts recording
  ↓
Request microphone permission
  ↓
Record locally
  ↓
Stop recording
  ↓
Create asset authorisation
  ↓
Upload audio
  ↓
Complete asset
  ↓
Create audio card
  ↓
Publish shared metadata
```

The audio card should not become ready before the asset is ready.

---

# 50. Audio overlay controls

Excalidraw renders the visual card.

The application overlay provides:

- Play
- Pause
- Progress
- Duration
- Retry state

Controls must stay aligned with the card under:

- Pan
- Zoom
- Resize
- Rotation where supported

---

# 51. Sticky-note creation flow

```text id="6qgk0w"
User selects sticky-note action
  ↓
Choose canvas position
  ↓
Create background element
  ↓
Create bound or grouped text
  ↓
Create product metadata
  ↓
Commit one shared transaction
```

Partial sticky-note creation must not remain after failure.

---

# 52. Physics feature boundary

Suggested structure:

```text id="16f45h"
features/physics/
├── physics-engine.ts
├── physics-body-mapper.ts
├── physics-controller.ts
├── physics-lease-client.ts
├── usePhysicsMode.ts
└── tests/
```

Matter.js should not be imported throughout the frontend.

Only the physics feature should depend on it directly.

---

# 53. Mini-map feature

The mini-map derives from:

- Scene element bounds
- Local viewport
- Remote collaborator viewports

It should use memoised derived data.

It should not trigger full React rerenders for every cursor update.

---

# 54. Radar feature

Radar derives:

- Direction
- Relative distance
- Collaborator identity

It should read awareness through a selector rather than subscribing to unrelated room state.

---

# 55. Offline feature boundary

Suggested structure:

```text id="prn5gb"
features/offline/
├── indexeddb-provider.ts
├── room-cache.ts
├── rejected-drafts.ts
├── upload-queue.ts
├── useOfflineStatus.ts
└── components/
```

---

# 56. Online-state detection

Use multiple signals:

- Browser `navigator.onLine`
- Hocuspocus connection status
- Recent successful API request
- Collaboration sync state

`navigator.onLine` alone is not authoritative.

---

# 57. Offline editing interface

When offline:

- Show persistent offline status.
- Explain whether the room is cached.
- Show unsynchronised-change state.
- Allow eligible local editing.
- Disable operations requiring server authority.
- Queue supported uploads.
- Avoid claiming the room is saved remotely.

---

# 58. Rejected offline draft interface

When local edits are rejected after permission revalidation:

- Show a non-dismissible recovery notice until addressed.
- Load the authorised room separately.
- Preserve the local draft.
- Offer JSON export.
- Offer discard with confirmation.
- Avoid silently applying rejected changes.

---

# 59. Error boundaries

Use separate error boundaries for:

- Whole application
- Room route
- Canvas workspace
- Optional extension overlays

A mini-map failure should not crash Excalidraw.

A physics failure should not crash the room.

An unrecoverable Excalidraw failure may require a room-level error state.

---

# 60. Error categories

The frontend should classify:

```text id="pcb9kb"
Authentication error
Permission error
Room unavailable
Collaboration error
Asset error
Offline error
Schema incompatibility
Canvas error
Extension error
Unexpected error
```

Each category needs a specific recovery action.

---

# 61. Notifications

Use notifications for transient events:

- Upload completed
- Export ready
- Role changed
- Room restored

Use persistent banners for state:

- Offline
- Reconnecting
- Read-only
- Archived
- Rejected local draft

Do not represent persistent states only as disappearing toasts.

---

# 62. Responsive design

The frontend must support:

- Desktop
- Tablet
- Mobile

The canvas remains the primary surface.

Controls should adapt rather than overlay excessive fixed panels.

---

# 63. Desktop layout

Recommended desktop layout:

```text id="0d6eup"
Top room bar
Left or floating tool controls
Full canvas
Optional side panel
Bottom status controls
```

---

# 64. Mobile layout

Recommended mobile layout:

```text id="axve8a"
Compact top bar
Full-screen canvas
Bottom action bar
Modal or sheet-based tools
Collapsible collaborator view
```

Avoid permanent left and right panels on narrow screens.

---

# 65. Touch interaction

The product must preserve native Excalidraw touch behaviour.

Product overlays should not interfere with:

- Pinch zoom
- Touch pan
- Selection
- Text editing

Interactive overlay targets should meet accessible touch-size expectations.

---

# 66. Accessibility

Required considerations:

- Keyboard-accessible application controls
- Visible focus states
- Labelled icon buttons
- Accessible dialogs
- Screen-reader status messages
- Non-colour-only connection states
- Non-colour-only role states
- Reduced-motion support where practical

The canvas itself has inherent accessibility limitations, but application controls must remain accessible.

---

# 67. Keyboard architecture

Native Excalidraw keyboard shortcuts should be preserved.

Product shortcuts must:

- Avoid conflicts
- Be documented
- Respect text-input focus
- Respect modal focus
- Respect viewer mode

Suggested product shortcuts should be limited during the MVP.

---

# 68. Styling architecture

Use one consistent styling approach.

Possible choices:

- CSS Modules
- Tailwind CSS
- Vanilla Extract
- Existing UI-library styling

The project should not mix several styling systems without reason.

Canvas overlays require predictable positioning and stacking.

---

# 69. Design tokens

Centralise:

- Spacing
- Typography
- Radius
- Shadow
- Z-index
- Breakpoints
- Status colours
- Collaborator-colour rules

Example token groups:

```text id="f7o6ve"
surface
text
border
action
danger
warning
success
offline
read-only
```

---

# 70. Performance strategy

The frontend must remain smooth with at least 100 ordinary canvas elements.

Primary rules:

- Do not store the full scene in React state.
- Do not store the full scene in Zustand.
- Avoid React rerender for every pointer event.
- Throttle awareness updates.
- Throttle shared transform updates.
- Memoise derived overlay geometry.
- Cache asset resolution.
- Avoid unnecessary Excalidraw scene replacement.
- Keep high-frequency physics work outside React rendering.

---

# 71. React subscription strategy

Components should subscribe only to the state they use.

Good:

```ts id="5swkwe"
const status = useConnectionStore((state) => state.status);
```

Avoid:

```ts id="2va6v6"
const entireStore = useConnectionStore();
```

when only one field is needed.

---

# 72. Collaboration-event strategy

High-frequency Yjs and awareness events should update:

- Imperative overlays
- External stores with narrow selectors
- Animation-frame loops

They should not cause the entire room route to rerender.

---

# 73. Lazy loading

Optional or heavy features may be lazy-loaded:

- Matter.js physics
- Export interface
- Recycle-bin panel
- Replay
- Advanced asset preview

Excalidraw remains core and should load with the room.

---

# 74. Bundle boundaries

Recommended lazy boundaries:

```text id="busmuw"
Physics feature
Replay feature
SVG export
Large audio tools
Administrative panels
```

Avoid over-fragmenting the bundle during the MVP.

---

# 75. Environment configuration

Frontend configuration should be validated at startup.

Example:

```ts id="4mw5b8"
interface WebEnvironment {
  apiBaseUrl: string;
  collaborationBaseUrl: string;
  enableTestApi: boolean;
  enablePhysics: boolean;
  enableReplay: boolean;
}
```

Secrets must never be placed in frontend environment variables.

---

# 76. Feature flags

Feature flags may control:

- Physics
- Replay
- SVG export
- Recycle bin
- Advanced radar

Flags should not replace permission checks.

A disabled feature should not initialise its heavy dependencies.

---

# 77. Testability API

A development and test-only API should be exposed through a stable global name.

Example:

```ts id="ajf32t"
declare global {
  interface Window {
    __CANVAS_TEST_API__?: CanvasTestApi;
  }
}
```

---

# 78. Canvas test API

Conceptual interface:

```ts id="t0zc5g"
interface CanvasTestApi {
  getRoom(): {
    roomId: string;
    role: "owner" | "editor" | "viewer";
    status: "active" | "archived";
  };

  getSceneElements(): Array<{
    id: string;
    type: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    angle?: number;
  }>;

  getElementOrder(): string[];

  getProductObjects(): unknown[];

  getDeletedObjects(): unknown[];

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
    role: string;
  }>;

  getAssetUploads(): unknown[];

  getPhysicsState(): unknown;

  getOfflineState(): unknown;
}
```

---

# 79. Test API restrictions

The test API must:

- Be disabled in production
- Exclude guest email
- Exclude session tokens
- Exclude signed asset URLs
- Exclude service credentials
- Avoid permission bypass
- Prefer read-only inspection

Test-only commands may be provided only when browser interaction would otherwise be impossible to automate reliably.

---

# 80. Unit testing

Unit tests should cover:

- Query-key helpers
- Capability mapping
- Store actions
- Coordinate transforms
- Overlay positioning
- Asset state transitions
- Audio recorder transitions
- Offline state transitions
- Error mapping
- Responsive helper logic

---

# 81. Component testing

Use React Testing Library for:

- Guest form
- Invitation acceptance
- Permission controls
- Connection banner
- Archived-room banner
- Asset upload progress
- Audio controls
- Recycle-bin panel
- Recovery notice
- Error states

Tests should interact through accessible roles and labels.

---

# 82. Integration testing

Frontend integration tests should cover:

- Room route loading
- Query and provider coordination
- Collaboration bootstrap
- Viewer mode
- Role-change response
- Asset insertion flow
- Offline initialisation
- Archived-room transition
- Rejected draft handling

Infrastructure may be mocked only where the test does not need real collaboration behaviour.

---

# 83. Browser end-to-end testing

Playwright should cover:

- Guest creation
- Room creation
- Invitation acceptance
- Two-user collaboration
- Viewer restrictions
- Image upload
- Audio recording with test media
- Offline reconnect
- Physics interaction
- Delete and restore
- Archive and restore
- Responsive mobile layout
- Export

---

# 84. QA-Intel validation

QA-Intel should use:

- Separate browser contexts
- Stable UI selectors
- The test API
- Screenshots
- Trace files
- Console-log capture
- Network-error capture

It should independently validate product acceptance criteria.

---

# 85. Selector policy

Prefer:

- Accessible roles
- Labels
- Visible text
- Stable `data-testid` only where necessary

Test IDs should describe product behaviour.

Good:

```text id="me6qv4"
room-connection-status
asset-upload-progress
recovery-export-button
```

Avoid IDs tied to CSS or internal component hierarchy.

---

# 86. Frontend security rules

The frontend must not:

- Treat hidden buttons as authorisation
- Trust role query parameters
- Store raw session tokens in scene data
- Store guest email in awareness
- Persist signed asset URLs
- Log raw invitation tokens
- Insert unvalidated HTML
- Render unsafe filenames as HTML
- Expose the test API in production

---

# 87. Room teardown

Room teardown must clean:

- Hocuspocus Provider
- Yjs observers
- Awareness listeners
- Excalidraw adapter
- Matter.js engine
- Timers
- Media streams
- Object URLs
- Room-scoped subscriptions
- Temporary overlay nodes

Memory leaks are especially likely during room navigation and reconnection.

---

# 88. Suggested implementation order

## Slice 1 — Application shell

Implement:

- Router
- Query client
- Guest session
- Create-room flow
- Room route

---

## Slice 2 — Canvas shell

Implement:

- Excalidraw component
- Adapter initialisation
- Loading state
- Permission mode
- Basic status bar

---

## Slice 3 — Collaboration

Implement:

- Yjs document
- Hocuspocus Provider
- IndexedDB
- Connection store
- Presence

---

## Slice 4 — Product tools

Implement:

- Sticky note
- Image upload
- Audio recording
- Product overlays

---

## Slice 5 — Protected offline recovery

Implement:

- Offline indicator
- Cached-room loading
- Eligible offline editing
- Permission revalidation
- Rejected-draft recovery

---

## Slice 6 — Optional P1 capabilities

Implement:

- Mini-map
- Radar
- Physics
- Recycle bin
- Archive
- Export

---

# 89. MVP frontend scope

Mandatory frontend features:

- Guest onboarding
- Room creation
- Invitation joining
- Excalidraw canvas
- Two-user collaboration
- Owner, editor, and viewer UI
- Connection status
- Presence
- Text, shapes, images, sticky notes, and audio
- Responsive layout
- Offline cache for opened rooms
- Eligible offline editing and reconciliation
- Permission revalidation on reconnect
- Recoverable rejected local drafts
- Testability API
- QA-Intel release validation

---

# 90. P1 frontend scope

Add after the mandatory path is reliable:

- Mini-map
- Collaborator radar
- Physics throwing and collision
- Recycle-bin panel
- Archive interface
- Enhanced export
- Attraction and repulsion
- Replay

---

# 91. Frontend definition of done

The frontend architecture is implemented successfully when:

- Routes have clear feature ownership.
- TanStack Query owns HTTP server state.
- Yjs owns shared document state.
- Zustand owns only local product state.
- Excalidraw state is not duplicated globally.
- All Excalidraw mutations pass through the adapter or controller boundary.
- Viewer mode is clear and functional.
- Connection and offline states are persistent and understandable.
- Product overlays do not block normal canvas interaction.
- Images and audio resolve through authorised assets.
- Room teardown releases resources.
- The layout works on desktop, tablet, and mobile.
- Browser tests can inspect stable product state.
- QA-Intel can validate multi-user behaviour independently.

---

# 92. Final frontend policy

The project adopts the following frontend policy:

> The React application coordinates room workflows, server data, collaboration, and product extensions without duplicating Excalidraw’s internal state. TanStack Query owns HTTP server state, Yjs owns shared collaborative state, Zustand owns local cross-component product state, and React local state owns isolated interface concerns. Excalidraw remains the sole canvas interaction engine behind the application’s adapter and controller boundaries.

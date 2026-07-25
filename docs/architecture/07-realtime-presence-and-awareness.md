# Real-Time Presence and Awareness

## Real-Time Collaborative Infinite Canvas

**Document path:** `docs/architecture/07-realtime-presence-and-awareness.md`
**Document status:** Accepted
**Product phase:** Two-day MVP / Hackathon
**Last updated:** 25 July 2026
**Primary owners:** Frontend Engineering, Collaboration Engineering, and Architecture

---

# 1. Purpose

This document defines the real-time presence and awareness model for the collaborative infinite canvas.

It specifies:

- Awareness state structure
- Collaborator identity
- Cursor transport
- Viewport transport
- Selection awareness
- Interaction awareness
- Collaborator lifecycle
- Join and leave behaviour
- Throttling
- Stale-state cleanup
- Privacy restrictions
- Rendering rules
- Collaborator radar inputs
- Mini-map inputs
- Multi-tab behaviour
- Reconnection behaviour
- Performance requirements
- Testing requirements

Presence is intentionally separate from durable collaborative scene state.

---

# 2. Core policy

The system adopts the following rule:

> Presence is ephemeral, advisory, non-authoritative, and must never be persisted as room content.

Presence communicates what collaborators are currently doing.

It does not decide:

- Room permissions
- Scene ownership
- Membership
- Asset access
- Object persistence
- Archive state
- Final physics ownership

Those decisions remain in authoritative application or collaboration state.

---

# 3. Technology boundary

Presence uses:

- Yjs Awareness
- Hocuspocus Provider awareness transport
- Frontend awareness hooks
- Canvas overlay rendering
- Optional derived Zustand state for narrow local UI needs

Presence must not use:

- PostgreSQL persistence
- Excalidraw element metadata
- Product object metadata
- Room audit records for every movement
- HTTP requests for every cursor or viewport update

---

# 4. Awareness versus durable state

## Awareness state

Examples:

- Cursor position
- Viewport
- Current selection
- Current interaction
- Active editing indicator
- Connection session identity
- Display name
- Collaborator colour

## Durable state

Examples:

- Excalidraw elements
- Product object metadata
- Room roles
- Asset records
- Recycle-bin records
- Room archive state
- Final element transforms
- Physics leases where shared coordination is required

Awareness disappears when the client disconnects.

Durable state remains.

---

# 5. Awareness document relationship

Each room has one Yjs document and one awareness channel associated with that document connection.

Conceptual model:

```text
Room
├── Yjs document
│   ├── Elements
│   ├── Element order
│   ├── Product metadata
│   ├── Deleted objects
│   └── Physics leases
└── Awareness
    ├── Collaborators
    ├── Cursors
    ├── Viewports
    ├── Selections
    └── Active interactions
```

Awareness state is indexed by Yjs client ID.

---

# 6. Awareness payload

Recommended payload:

```ts
interface CollaboratorAwareness {
  identity: {
    guestId: string;
    connectionId: string;
    username: string;
    colour: string;
    role: "owner" | "editor" | "viewer";
  };

  cursor?: {
    x: number;
    y: number;
    visible: boolean;
  };

  viewport?: {
    scrollX: number;
    scrollY: number;
    zoom: number;
    width: number;
    height: number;
  };

  selection?: {
    elementIds: string[];
  };

  interaction?: {
    type:
      | "idle"
      | "drawing"
      | "dragging"
      | "resizing"
      | "rotating"
      | "text-editing"
      | "recording-audio"
      | "uploading-image"
      | "physics";

    elementIds?: string[];
    startedAt?: number;
  };

  client?: {
    platform?: "desktop" | "tablet" | "mobile";
    visible: boolean;
  };

  updatedAt: number;
}
```

The final implementation may omit optional fields not needed by the MVP.

---

# 7. Required awareness fields

At minimum, every connected collaborator publishes:

```ts
interface MinimumAwarenessState {
  identity: {
    guestId: string;
    connectionId: string;
    username: string;
    colour: string;
    role: "owner" | "editor" | "viewer";
  };

  updatedAt: number;
}
```

Cursor, viewport, selection, and interaction fields are optional.

---

# 8. Identity rules

Awareness identity is display-oriented.

It must include only information needed to render collaboration presence.

Allowed:

- Guest ID
- Connection ID
- Username
- Collaborator colour
- Current role

Forbidden:

- Email address
- Session token
- Share-link token
- IP address
- Device fingerprint
- Storage credentials
- Signed asset URL
- Internal audit metadata

---

# 9. Identity authority

The browser must not publish an arbitrary role or guest ID and have it trusted.

The awareness identity should be initialised from validated collaboration bootstrap data.

The collaboration server should associate the connection with:

- Validated guest ID
- Validated room ID
- Validated role
- Connection ID

Where practical, the server should overwrite or reject identity fields that conflict with authenticated connection context.

---

# 10. Connection ID

Each active browser connection receives a unique connection ID.

Example:

```text
conn_01K4...
```

The connection ID distinguishes:

- Multiple tabs
- Multiple devices
- Reconnections
- Duplicate active sessions

The guest ID identifies the guest.

The connection ID identifies one live presence connection.

---

# 11. Collaborator colour

Each guest receives a stable display colour during the guest session.

The colour should be:

- Visually distinct
- Readable on light and dark backgrounds
- Suitable for cursor and selection rendering
- Consistent across the current session

The browser should not allow arbitrary unsafe CSS values.

Colours should come from a controlled palette.

---

# 12. Colour collisions

Two collaborators may receive similar colours.

The interface should not rely on colour alone.

Remote presence should also use:

- Username
- Avatar initials where useful
- Cursor label
- Selection outline pattern or opacity
- Presence list text

---

# 13. Cursor coordinate system

Cursor positions should be published in canvas world coordinates.

```ts
interface AwarenessCursor {
  x: number;
  y: number;
  visible: boolean;
}
```

World coordinates are preferred because they remain stable when collaborators use different:

- Zoom levels
- Viewport positions
- Screen sizes
- Device types

---

# 14. Local pointer conversion

Before publishing, convert browser pointer coordinates into Excalidraw scene coordinates.

Conceptual conversion:

```text
Screen pointer
    ↓
Canvas container offset
    ↓
Local viewport transform
    ↓
Scene world coordinate
```

This conversion should use supported Excalidraw utilities or a central adapter helper.

Do not duplicate coordinate formulas throughout the application.

---

# 15. Remote cursor conversion

To render a remote world-space cursor:

```text
Remote world coordinate
    ↓
Local viewport transform
    ↓
Local screen position
```

Remote cursor rendering must respond to:

- Local pan
- Local zoom
- Canvas resize
- Mobile orientation changes

The remote collaborator does not need to republish their cursor because the local user changed zoom.

---

# 16. Cursor visibility

The cursor should be marked invisible when:

- Pointer leaves the canvas
- Browser tab becomes hidden
- Window loses focus for a configured period
- User opens a blocking modal
- Touch interaction has ended
- Client disconnects

Example:

```ts
cursor: {
  x,
  y,
  visible: false
}
```

The client may also clear the cursor field.

---

# 17. Touch-device cursor behaviour

Touch devices do not have a persistent pointer.

Recommended behaviour:

- Publish touch position during active canvas gestures.
- Hide the cursor shortly after touch end.
- Do not show a permanently stationary cursor for mobile users.
- Continue publishing viewport and selection where useful.

---

# 18. Cursor update throttling

Pointer events may occur far more frequently than useful network updates.

Cursor updates must be throttled.

Suggested initial rate:

```text
10–20 updates per second
```

Recommended strategy:

- Capture the latest pointer position.
- Publish at a fixed maximum rate.
- Publish an immediate final visibility change.
- Stop updates while the pointer is stationary.

Do not publish on every raw pointer event.

---

# 19. Cursor interpolation

Remote cursor rendering may interpolate between received positions.

Benefits:

- Smoother movement
- Lower network rate
- Better perceived responsiveness

Interpolation must not:

- Continue indefinitely after updates stop
- Move beyond the latest known position
- imply authoritative object movement

Suggested approach:

- Interpolate over a short window
- Snap to the latest position after delay
- Fade or hide stale cursors

---

# 20. Cursor labels

Remote cursors should display:

- Collaborator username
- Collaborator colour

Labels should:

- Avoid covering the pointer target excessively
- Remain readable at different zoom levels
- Clamp to viewport edges where needed
- Disappear or reduce after inactivity

---

# 21. Viewport awareness

Viewport state supports:

- Mini-map
- Collaborator radar
- Optional “jump to collaborator”
- Future follow mode
- Presence overview

Recommended payload:

```ts
interface AwarenessViewport {
  scrollX: number;
  scrollY: number;
  zoom: number;
  width: number;
  height: number;
}
```

Width and height represent the visible canvas viewport in screen pixels or another consistently documented unit.

---

# 22. Viewport publication

Viewport should publish when:

- User pans
- User zooms
- Canvas container resizes
- Device orientation changes
- Room becomes visible again

Viewport updates should be throttled.

Suggested rate:

```text
5–10 updates per second during active movement
```

An immediate final update should be sent after the interaction settles.

---

# 23. Viewport privacy

Viewport awareness reveals where a collaborator is looking inside the shared room.

This is acceptable within the room because it is needed for collaboration features.

Viewport information must not be:

- Persisted
- Included in public exports
- Included in public room previews
- Shared outside authorised room connections

---

# 24. Viewport bounds

Derived viewport bounds may be represented as:

```ts
interface SceneViewportBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
```

These bounds should be derived locally from:

- Scroll position
- Zoom
- Viewport dimensions

They do not need to be published if the raw viewport state is sufficient.

---

# 25. Selection awareness

Selection awareness communicates which elements a collaborator currently has selected.

Recommended payload:

```ts
interface AwarenessSelection {
  elementIds: string[];
}
```

Selection is:

- Ephemeral
- Advisory
- Non-locking
- Not persisted

---

# 26. Selection publication

Publish selection when:

- Selection changes
- Selection clears
- Selected object is deleted
- Client switches room
- Client becomes hidden
- Role changes to a state where selection should clear

Selection changes are event-driven and normally do not require high-frequency throttling.

---

# 27. Selection validation

Before publishing:

- Remove duplicate IDs.
- Remove invalid IDs.
- Limit the maximum number of IDs.
- Exclude deleted or unknown objects where possible.

Suggested safety limit:

```text
Maximum 200 selected element IDs
```

The exact value may be adjusted.

---

# 28. Remote selection rendering

Remote selection may be rendered through:

- Excalidraw-supported collaborator selection features
- Product overlay rectangles
- Element outlines
- Bounding boxes

Rendering should use:

- Collaborator colour
- Username label where useful
- Reduced opacity
- Non-blocking pointer events

Remote selection rendering must not alter actual Excalidraw selection.

---

# 29. Selection conflicts

Multiple collaborators may select the same object.

The interface should allow multiple remote outlines or a combined indicator.

Selection does not grant exclusive ownership.

Exclusive operations, such as physics simulation, use separate coordination mechanisms.

---

# 30. Interaction awareness

Interaction awareness communicates active behaviour without persisting it.

Supported initial interaction types:

```ts
type InteractionType =
  | "idle"
  | "drawing"
  | "dragging"
  | "resizing"
  | "rotating"
  | "text-editing"
  | "recording-audio"
  | "uploading-image"
  | "physics";
```

---

# 31. Interaction element references

Interactions may include affected element IDs.

Example:

```ts
interaction: {
  type: "text-editing",
  elementIds: ["text-element-id"],
  startedAt: Date.now()
}
```

This supports UI indicators such as:

```text
Ada is editing this text
```

The indicator is advisory.

It does not create an edit lock unless a separate lock or lease exists.

---

# 32. Text-editing awareness

Concurrent editing of the same Excalidraw text element may result in one complete text record winning.

Awareness should reduce accidental conflicts by showing that another collaborator is currently editing the text.

Recommended behaviour:

- Display collaborator name near the text element.
- Warn before entering the same text element where practical.
- Do not completely block editing unless explicitly required.
- Clear the indicator when editing ends or becomes stale.

---

# 33. Dragging awareness

During a drag:

- The durable element position is synchronised through Yjs.
- Awareness may indicate that the collaborator is actively dragging.
- Remote cursor and selected element IDs may reinforce the interaction.

The system should not duplicate full element transforms inside awareness.

---

# 34. Physics awareness

Physics interaction may publish:

```ts
interaction: {
  type: "physics",
  elementIds: ["element-id"],
  startedAt: timestamp
}
```

This helps the UI explain why an element is moving.

Actual ownership is determined by the shared physics lease, not awareness.

---

# 35. Audio-recording awareness

The product may show:

```text
Nonso is recording audio
```

This is optional for the MVP.

Do not publish:

- Audio content
- Recording blob
- Microphone device information
- Raw recording duration at high frequency

---

# 36. Browser visibility

When the document becomes hidden:

- Mark client visibility false.
- Hide cursor.
- Optionally preserve last viewport.
- Clear active transient interaction.
- Reduce awareness update frequency.
- Do not immediately remove the client if the connection remains alive.

Example:

```ts
client: {
  visible: false;
}
```

---

# 37. Presence list

The room interface may display active collaborators.

Each presence entry may include:

- Username
- Colour
- Role
- Visible or background status
- Number of connections where grouped

Do not show:

- Email
- Session age
- IP information
- Hidden technical identifiers

---

# 38. Grouping duplicate connections

A guest may have multiple active connections.

Possible rendering strategies:

## Strategy A — Show every connection

Advantages:

- Accurate to awareness state
- Simple

Disadvantages:

- Duplicate names may confuse users

## Strategy B — Group by guest ID

Advantages:

- Cleaner collaborator list
- Better user-level representation

Disadvantages:

- Requires connection aggregation

## Recommended interface

Group presence-list entries by guest ID.

Show a subtle multi-session indicator when one guest has multiple live connections.

For cursor rendering, each connection may still have its own cursor.

---

# 39. Multi-tab editing

The same guest may edit from multiple tabs.

The system should:

- Treat each connection independently.
- Use one shared guest identity.
- Use distinct connection IDs.
- Avoid assuming only one cursor exists per guest.
- Allow Yjs to merge durable updates normally.

Physics leases should be connection-aware or guest-aware according to the final lease implementation.

---

# 40. Collaborator join lifecycle

Join sequence:

```text
Collaboration connection authenticated
    ↓
Initial awareness state set
    ↓
Awareness update broadcast
    ↓
Existing clients add collaborator
    ↓
Presence list and overlays render
```

A collaborator should not appear before the connection has authenticated successfully.

---

# 41. Collaborator leave lifecycle

Leave sequence:

```text
Connection closes or expires
    ↓
Awareness client state removed
    ↓
Remote clients receive removal
    ↓
Cursor removed
    ↓
Selection removed
    ↓
Interaction removed
    ↓
Presence list updated
```

Presence cleanup should not depend on a custom “leave” message from the browser.

Unexpected disconnects must also clear presence.

---

# 42. Reconnection lifecycle

During reconnect:

- Local client may retain its own last presence state.
- Remote clients may temporarily see the old connection disappear.
- A new connection ID may be created.
- Awareness state is republished after authentication.
- Duplicate stale state should be removed by awareness cleanup.

The UI should tolerate brief collaborator disappearance and return.

---

# 43. Connection-state interface

Presence rendering depends on connection status.

Recommended states:

```ts
type CollaborationConnectionStatus =
  | "idle"
  | "connecting"
  | "synchronising"
  | "connected"
  | "reconnecting"
  | "offline"
  | "read-only"
  | "failed";
```

When offline:

- Remote presence should be considered unavailable.
- Stale remote cursors should be removed.
- Local offline editing may continue.
- The interface must not present cached collaborators as currently online.

---

# 44. Stale awareness detection

Although Yjs awareness removes disconnected clients, the UI should also guard against stale transient fields.

Each awareness payload includes:

```ts
updatedAt: number;
```

Suggested stale thresholds:

```text
Cursor stale: 3–5 seconds
Interaction stale: 5–10 seconds
Viewport stale: 10–30 seconds
Connection presence: removed by awareness lifecycle
```

Exact values should be configurable.

---

# 45. Stale cursor behaviour

When a cursor becomes stale:

1. Stop interpolation.
2. Fade the cursor.
3. Hide it after the configured threshold.
4. Keep the collaborator in the presence list if the connection remains active.

A stale cursor does not imply the collaborator disconnected.

---

# 46. Stale interaction behaviour

If an interaction field is not refreshed or explicitly cleared:

- Treat it as idle after the timeout.
- Remove element interaction labels.
- Do not keep “editing” indicators indefinitely.
- Do not clear durable physics leases based only on awareness timeout.

---

# 47. Awareness update batching

Multiple state changes may occur together.

Example:

- Cursor moves
- Viewport pans
- Interaction becomes dragging

The publisher should batch these into one awareness update where practical.

Avoid calling `setLocalStateField` repeatedly in the same event cycle when one consolidated update is possible.

---

# 48. Awareness publisher interface

Conceptual interface:

```ts
interface AwarenessPublisher {
  initializeIdentity(identity: CollaboratorAwareness["identity"]): void;

  updateCursor(cursor?: CollaboratorAwareness["cursor"]): void;

  updateViewport(viewport?: CollaboratorAwareness["viewport"]): void;

  updateSelection(selection?: CollaboratorAwareness["selection"]): void;

  updateInteraction(interaction?: CollaboratorAwareness["interaction"]): void;

  updateVisibility(visible: boolean): void;

  clearTransientState(): void;

  destroy(): void;
}
```

React components should use feature hooks rather than manipulating awareness directly.

---

# 49. Awareness subscriber interface

Conceptual interface:

```ts
interface AwarenessSubscriber {
  getCollaborators(): RemoteCollaborator[];

  subscribe(
    listener: (collaborators: RemoteCollaborator[]) => void,
  ): () => void;

  destroy(): void;
}
```

The subscriber should normalise raw Yjs awareness entries.

---

# 50. Awareness normalisation

Remote state should be validated before use.

Normalisation includes:

- Validate identity shape.
- Validate role.
- Validate finite coordinates.
- Validate zoom range.
- Remove duplicate element IDs.
- Clamp string lengths.
- Reject unsupported interaction types.
- Ignore private or unknown fields.
- Ignore the local client where appropriate.

Invalid awareness should not crash the room.

---

# 51. Awareness size limits

Awareness payloads must remain small.

Recommended constraints:

- Username maximum: 40 characters
- Connection ID maximum: 100 characters
- Selection IDs: maximum 200
- Interaction element IDs: maximum 20
- No binary values
- No large JSON objects
- No scene snapshots
- No asset metadata collections

Large state belongs elsewhere.

---

# 52. Mini-map inputs

The mini-map may consume:

- Local viewport
- Remote viewports
- Active scene bounds
- Collaborator colours
- Collaborator usernames

The mini-map should not consume:

- Guest email
- Cursor history
- Session tokens
- Full awareness payloads unnecessarily

---

# 53. Collaborator radar inputs

Radar derives each collaborator’s direction relative to the local viewport.

Inputs:

```ts
interface RadarInput {
  guestId: string;
  connectionId: string;
  username: string;
  colour: string;
  viewport: AwarenessViewport;
}
```

Cursor position may be used as a fallback if viewport is unavailable.

---

# 54. Radar position calculation

Conceptual flow:

```text
Remote viewport centre
    ↓
Local viewport centre
    ↓
Relative vector
    ↓
Direction and distance
    ↓
Radar indicator position
```

The radar should use scene coordinates.

---

# 55. Radar distance

Distance may be displayed as:

- Relative near, medium, far
- Canvas-unit estimate
- No numeric value

The MVP should prefer simple relative distance.

Exact canvas-unit numbers may be confusing because the infinite canvas has no real-world scale.

---

# 56. Radar visibility

Show radar indicators primarily for collaborators outside the local viewport.

A collaborator already visible on the current canvas may be represented by:

- Cursor
- Selection
- Viewport rectangle on mini-map

Avoid redundant indicators.

---

# 57. Jump to collaborator

Optional action:

```text
Select collaborator
    ↓
Read latest remote viewport
    ↓
Move local viewport to collaborator
```

This action should:

- Be user initiated
- Not affect the remote collaborator
- Not persist
- Respect reduced-motion settings
- Fail gracefully when viewport data is stale

Automatic follow mode is outside the mandatory MVP.

---

# 58. Rendering architecture

Recommended structure:

```text
CanvasOverlayLayer
├── RemoteCursorLayer
├── RemoteSelectionLayer
├── InteractionIndicatorLayer
├── MiniMap
└── CollaboratorRadar
```

These components consume normalised presence selectors.

---

# 59. Imperative versus React rendering

High-frequency cursor movement may be rendered through:

- React with carefully scoped subscriptions and memoisation
- Imperative DOM transforms
- RequestAnimationFrame-managed overlay objects

The implementation must avoid rerendering the entire room for every awareness update.

Recommended approach:

- React creates one component per remote connection.
- Each cursor component updates its transform independently.
- Animation uses requestAnimationFrame.
- Presence-list updates remain ordinary React state.

---

# 60. Cursor overlay styling

Remote cursor overlays should:

- Use fixed-size screen-space visuals.
- Not scale excessively with canvas zoom.
- Ignore pointer events.
- Remain above canvas content.
- Remain below dialogs and application menus.
- Use a documented z-index.

---

# 61. Selection overlay styling

Remote selection outlines should:

- Remain visible against common backgrounds.
- Use collaborator colour.
- Avoid blocking local handles.
- Use reduced opacity.
- Avoid excessive animation.
- Support multiple selected elements.

---

# 62. Interaction indicator styling

Indicators should be concise.

Examples:

```text
Ada is editing
Mike is moving this
Sara is using physics
```

Avoid persistent large labels over the canvas.

Indicators should disappear when stale or completed.

---

# 63. Reduced motion

When the user prefers reduced motion:

- Disable or reduce cursor interpolation.
- Avoid pulsing presence indicators.
- Avoid animated radar movement where unnecessary.
- Use immediate viewport jump rather than long animation where appropriate.

---

# 64. View-only presence

Viewers still publish:

- Identity
- Cursor
- Viewport
- Selection where meaningful

Viewers must not publish misleading edit interactions such as:

- Drawing
- Dragging
- Physics

The frontend should derive allowed interaction types from current role.

---

# 65. Archived-room presence

For archived rooms:

- Presence may continue in read-only mode.
- Cursor and viewport awareness may remain.
- Edit interaction types must be disabled.
- Physics awareness must be disabled.
- Archive status must be visually clear.

---

# 66. Role changes

When a role changes:

1. Update local capability state.
2. Reconnect when required.
3. Republish awareness identity with the validated new role.
4. Clear disallowed active interactions.
5. Clear local selection if required.
6. Remove edit-only controls.

Remote clients should treat role changes as display information only.

Authorisation remains server-side.

---

# 67. Privacy restrictions

Awareness must never contain:

```text
Email address
Session token
Share-link token
Collaboration access token
Signed asset URL
Audio blob
Image blob
IP address
Browser fingerprint
Private analytics identifier
Audit event data
```

This must be enforced through:

- Shared TypeScript types
- Runtime validation
- Tests
- Development diagnostics

---

# 68. Logging restrictions

Do not log every cursor update.

Permitted diagnostics:

- Awareness connection count
- Awareness payload validation failures
- Join and leave events
- Aggregate update rate
- Payload size
- Stale-state count

Avoid logging:

- Exact cursor history
- Full viewport history
- Every selection change
- Raw awareness payloads in production

---

# 69. Metrics

Useful aggregate metrics:

```text
Active awareness connections
Average collaborators per room
Awareness updates per second
Average awareness payload size
Invalid payload count
Stale cursor cleanup count
Reconnect frequency
```

Metrics should avoid private identity details.

---

# 70. Network degradation

Under poor network conditions:

- Cursor movement may appear less smooth.
- Viewport data may lag.
- Selection may briefly be stale.
- Durable scene convergence remains more important than awareness freshness.

The client may reduce awareness publication rate when:

- Round-trip time is high
- Reconnects are frequent
- Browser is under load
- Page is hidden

---

# 71. Backpressure

If awareness updates accumulate:

- Drop intermediate cursor positions.
- Keep only the latest cursor.
- Keep only the latest viewport.
- Keep the latest selection.
- Preserve important final state transitions such as cursor hidden or interaction idle.

Awareness should favour freshness over complete history.

---

# 72. Cleanup on room exit

When leaving a room:

1. Clear local transient awareness.
2. Destroy awareness event listeners.
3. Disconnect provider.
4. Cancel cursor animation frames.
5. Clear remote overlay state.
6. Clear room-specific presence selectors.
7. Remove radar and mini-map collaborator data.

Presence state must not leak into the next room.

---

# 73. Cleanup on application error

If the canvas crashes but the provider remains connected:

- Clear active interaction.
- Hide local cursor.
- Mark client visibility appropriately.
- Attempt safe provider cleanup.
- Avoid leaving misleading “editing” awareness behind.

---

# 74. Unit tests

Unit tests must cover:

- Awareness payload validation
- Cursor coordinate conversion
- Viewport bounds calculation
- Selection normalisation
- Interaction timeout
- Stale cursor detection
- Duplicate connection grouping
- Radar vector calculation
- Role-based interaction filtering
- Privacy-field rejection

---

# 75. Integration tests

Integration tests must cover:

- Two awareness clients
- Join propagation
- Leave propagation
- Cursor updates
- Viewport updates
- Selection updates
- Hidden-tab visibility
- Reconnection
- Duplicate tabs
- Invalid awareness payload
- Stale interaction cleanup

---

# 76. Browser tests

Playwright should verify:

```gherkin
Scenario: Remote cursor appears
  Given Alice and Bob are connected to the same room
  When Alice moves the pointer across the canvas
  Then Bob sees Alice's cursor and username
```

```gherkin
Scenario: Remote cursor disappears after leaving
  Given Alice and Bob are connected
  When Alice closes the room
  Then Bob no longer sees Alice's cursor
  And Alice is removed from the active collaborator list
```

```gherkin
Scenario: Selection awareness does not change local selection
  Given Alice selects a rectangle
  Then Bob sees Alice's remote selection
  And Bob's own Excalidraw selection remains unchanged
```

```gherkin
Scenario: Email is not exposed
  Given Alice and Bob are connected
  Then Bob's awareness state for Alice does not contain Alice's email
```

---

# 77. QA-Intel validation

QA-Intel should independently inspect:

- Collaborator count
- Cursor visibility
- Username labels
- Remote selection IDs
- Connection cleanup
- Stale presence cleanup
- Viewer awareness behaviour
- Privacy-field absence

The test API should expose normalised presence, not raw tokens or private data.

---

# 78. Presence test API

Suggested test-only interface:

```ts
interface PresenceTestApi {
  getLocalPresence(): {
    guestId: string;
    connectionId: string;
    username: string;
    role: string;
    cursorVisible: boolean;
  };

  getRemoteCollaborators(): Array<{
    guestId: string;
    connectionId: string;
    username: string;
    role: string;
    cursor?: {
      x: number;
      y: number;
      visible: boolean;
    };
    viewport?: {
      scrollX: number;
      scrollY: number;
      zoom: number;
    };
    selectedElementIds: string[];
    interactionType: string;
  }>;

  getPresenceConnectionCount(): number;
}
```

---

# 79. Test API privacy

The presence test API must not expose:

- Email
- Tokens
- Signed URLs
- IP-derived values
- Hidden storage metadata

It must be disabled in production.

---

# 80. MVP presence scope

Mandatory:

- Collaborator identity
- Connection list
- Remote cursors
- Viewport awareness
- Selection awareness
- Join and leave cleanup
- Viewer-compatible presence
- Privacy validation
- Throttling
- Connection-state feedback

---

# 81. P1 presence scope

Add after the mandatory path works:

- Interaction labels
- Duplicate-tab grouping
- Cursor interpolation
- Mini-map viewport rectangles
- Radar
- Jump to collaborator
- Background-tab indicator
- Network-adaptive throttling

---

# 82. Known limitations

The MVP accepts:

- Presence may briefly disappear during reconnect.
- Cursor motion may lag under poor network conditions.
- Multiple tabs may show multiple cursors.
- Interaction indicators are advisory.
- Selection awareness does not lock objects.
- Viewport data may become stale.
- Mobile cursor presence is temporary.
- Presence history is not available after disconnect.

---

# 83. Presence definition of done

The presence system is complete when:

- Every authenticated connection publishes a valid public identity.
- Remote cursors use world coordinates.
- Cursor updates are throttled.
- Viewports are shared without persistence.
- Remote selections do not affect local selection.
- Join and leave events update the interface.
- Stale cursors and interactions disappear.
- Viewers participate in presence without edit awareness.
- Duplicate connections do not break the collaborator interface.
- Private fields never enter awareness.
- Presence rendering does not rerender the entire room on every pointer update.
- Multi-client browser tests pass.

When optional P1 radar or mini-map is implemented, it must consume the same normalised viewport inputs without making awareness durable or authoritative.

---

# 84. Final presence policy

The project adopts the following presence policy:

> Real-time presence is transported through Yjs Awareness and contains only the minimum public, ephemeral state needed for collaboration: identity, cursor, viewport, selection, visibility, and current interaction. Presence is non-authoritative, non-persistent, aggressively throttled, safely cleaned after disconnect, and strictly separated from private identity, durable scene content, and permission enforcement.

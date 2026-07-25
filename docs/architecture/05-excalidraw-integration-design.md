# Excalidraw Integration Design

## Real-Time Collaborative Infinite Canvas

**Document path:** `docs/architecture/05-excalidraw-integration-design.md`
**Document status:** Accepted
**Product phase:** Two-day MVP / Hackathon
**Last updated:** 25 July 2026
**Primary owners:** Engineering and Architecture

---

# 1. Purpose

This document defines how Excalidraw is integrated into the application.

It specifies:

- Integration architecture
- Adapter responsibilities
- Scene lifecycle
- Initialisation
- Scene loading
- Scene updates
- Collaboration integration
- Product-object composition
- Image handling
- Audio-card integration
- Callback-loop prevention
- Version pinning
- Upgrade strategy
- Performance requirements
- Testability

The objective is to treat **Excalidraw as the drawing engine**, while the application owns collaboration, permissions, persistence, assets, physics, replay, and product-specific features.

---

# 2. Design philosophy

The project intentionally avoids forking Excalidraw.

Instead:

```text
Application
      │
      ▼
Excalidraw Adapter
      │
      ▼
Excalidraw
```

Every product feature should first ask:

> "Can native Excalidraw already do this?"

If yes:

- Use native behaviour.

If no:

- Extend using the adapter.

Never modify Excalidraw internals unless absolutely unavoidable.

---

# 3. Responsibilities

## Excalidraw owns

- Drawing tools
- Rendering
- Selection
- Text editing
- Zoom
- Pan
- Rotation
- Resize
- Grouping
- Native keyboard shortcuts
- Clipboard support
- Export helpers
- File handling APIs

---

## Product owns

- Rooms
- Collaboration
- Roles
- Persistence
- Assets
- Replay
- Radar
- Mini-map
- Physics
- Audio cards
- Sticky-note metadata
- Archive
- Recycle bin
- Offline
- Analytics
- Audit logging

---

## Adapter owns

- Scene conversion
- Scene loading
- Scene updates
- Product metadata
- Image mapping
- Remote update application
- Callback-loop prevention
- Compatibility layer
- Version migration

---

# 4. High-level architecture

```text
Browser
    │
    ▼
Canvas Page
    │
    ▼
CanvasController
    │
    ▼
ExcalidrawAdapter
    │
 ┌──┴────────────┐
 │               │
 ▼               ▼
Excalidraw     Collaboration
```

The adapter is the only component that directly manipulates Excalidraw.

No other module should call Excalidraw APIs directly.

---

# 5. Adapter public interface

Recommended interface:

```ts
interface ExcalidrawAdapter {
  initialize(api: ExcalidrawImperativeAPI): void;

  loadScene(scene: RoomScene): Promise<void>;

  getScene(): RoomScene;

  applyRemoteScene(scene: RoomScene): Promise<void>;

  exportScene(): Promise<RoomScene>;

  destroy(): void;
}
```

All interaction with Excalidraw passes through this abstraction.

---

# 6. Canvas lifecycle

Lifecycle:

```text
Room page opens
      ↓
Load room metadata
      ↓
Load collaboration
      ↓
Receive initial scene
      ↓
Create Excalidraw
      ↓
Initialize adapter
      ↓
Load scene
      ↓
Enable collaboration
      ↓
Ready
```

The user should never briefly see an empty canvas before the initial scene loads if cached or remote data is available.

---

# 7. Initialization sequence

1. Mount Excalidraw component.
2. Capture imperative API reference.
3. Create adapter.
4. Register callbacks.
5. Load initial scene.
6. Apply product metadata.
7. Connect collaboration.
8. Enable user interaction.

Initialization must be idempotent.

---

# 8. Excalidraw version policy

The project pins a specific Excalidraw version.

Reasons:

- Stable APIs
- Stable scene format
- Stable callback behaviour
- Easier QA
- Predictable upgrades

Do not use floating dependency versions.

Example:

```json
{
  "@excalidraw/excalidraw": "x.y.z"
}
```

Upgrade only after compatibility testing.

---

# 9. Imperative API usage

The adapter owns the Excalidraw imperative API reference.

No feature module should keep its own reference.

Typical operations:

- Load scene
- Read scene
- Scroll
- Zoom
- Update files
- Trigger export

---

# 10. Scene model

Internally the adapter works with:

```ts
interface RoomScene {
  elements: ExcalidrawElement[];
  appState: Partial<AppState>;
  files: BinaryFiles;
  productObjects: ProductObjectMetadata[];
}
```

The adapter converts between:

- Yjs state
- Product metadata
- Excalidraw scene

---

# 11. Initial scene loading

When the room opens:

```text
Load Yjs scene
      ↓
Validate
      ↓
Normalize
      ↓
Resolve assets
      ↓
Build Excalidraw scene
      ↓
Load into canvas
```

Validation occurs before rendering.

---

# 12. Empty room

A newly created room contains:

- No elements
- Default app state
- Empty file map
- Empty product object list

The adapter should not create placeholder shapes.

---

# 13. Scene normalization

Before rendering:

- Remove duplicate IDs
- Remove invalid elements
- Repair ordering
- Repair file references
- Validate metadata
- Ignore unsupported objects

Normalization must be deterministic.

---

# 14. Scene export

The adapter exports:

- Elements
- Files
- Product metadata

It must not export:

- Sessions
- Emails
- Collaboration tokens
- Awareness
- Physics leases

---

# 15. onChange handling

Excalidraw emits frequent change callbacks.

The adapter must distinguish:

- Real document changes
- Temporary UI changes

Ignore:

- Hover
- Selection-only changes
- Cursor movement
- Open dialogs
- Toolbar state

Publish only durable scene changes.

---

# 16. Update pipeline

```text
Excalidraw
     ↓
onChange
     ↓
Normalize
     ↓
Diff previous scene
     ↓
Generate updates
     ↓
Publish to Yjs
```

No full-scene publish should occur when only one element changed.

---

# 17. Remote updates

Remote flow:

```text
Yjs update
      ↓
Adapter
      ↓
Normalize
      ↓
Apply scene
      ↓
Suppress callback
```

Remote updates must not trigger duplicate outbound collaboration events.

---

# 18. Callback-loop prevention

Without protection:

```text
Local edit
↓
Publish
↓
Receive remotely
↓
Load scene
↓
onChange
↓
Publish again
```

The adapter must use:

- Transaction origin
- Remote-update flag
- Scene comparison
- Previous scene cache

Timing delays alone are insufficient.

---

# 19. Scene diffing

The adapter compares:

- Element additions
- Element removals
- Element changes
- Order changes
- File changes

Diffing should occur before publishing.

---

# 20. Product objects

Some features are larger than one Excalidraw element.

Examples:

- Sticky notes
- Audio cards

The adapter composes:

```text
Product Object
      │
 ┌────┴────┐
 │         │
Metadata  Elements
```

Metadata stays outside Excalidraw elements.

---

# 21. Sticky notes

Sticky notes consist of:

- Background shape
- Text
- Metadata

Metadata includes:

- Product ID
- Schema version
- Behaviour flags

The adapter rebuilds this relationship when loading.

---

# 22. Audio cards

Audio cards consist of:

- Card element
- Icon
- Metadata
- Asset reference

Metadata references:

```text
assetId
```

Never binary audio.

---

# 23. Images

Image flow:

```text
Asset ID
      ↓
Resolve asset
      ↓
Binary
      ↓
Excalidraw file
      ↓
Image element
```

Images must not depend on permanent signed URLs.

---

# 24. Binary file handling

The adapter maintains:

```ts
BinaryFiles;
```

Responsibilities:

- Register images
- Remove unused files
- Replace stale references
- Keep IDs stable

---

# 25. Missing assets

If an asset cannot be loaded:

Display:

- Placeholder
- Retry option
- Error indicator

Do not crash the room.

---

# 26. Unsupported elements

Unknown future Excalidraw element types should:

- Be ignored safely
- Be preserved where possible
- Not break rendering

---

# 27. Scene ordering

The adapter rebuilds rendering order using shared order.

Ordering repairs include:

- Missing IDs
- Duplicate IDs
- Deleted IDs

---

# 28. AppState policy

The adapter owns only durable appState values.

Examples:

Allowed:

- Theme
- Background colour

Not shared:

- Open dialogs
- Selected tool
- Local cursor

---

# 29. Zoom policy

Zoom is local.

Remote collaborators never change your zoom automatically.

Exceptions:

Future follow mode.

---

# 30. Viewport policy

Viewport belongs to awareness.

Not persistent scene state.

---

# 31. Selection policy

Selections remain local.

Remote selections are rendered using awareness overlays.

Selections are never persisted.

---

# 32. Clipboard

Native Excalidraw clipboard behaviour should remain.

Product metadata should be reconstructed after paste when required.

---

# 33. Undo and redo

Use native Excalidraw undo and redo for supported client-local scene actions.

The authoritative collaboration behaviour is defined in [MVP collaborative undo policy](./02-collaboration-and-sync-design.md#151-mvp-collaborative-undo-policy).

The adapter must:

- Avoid creating a user-facing local history entry when applying remote scene state.
- Avoid publishing a remote application back to Yjs.
- Treat the valid result of a local undo or redo as an ordinary authorised scene difference.
- Preserve associated product metadata when the scene action affects a product object.
- Keep application actions such as role changes, archive, and asset upload outside Excalidraw history.

Room-wide or intention-preserving collaborative undo is outside the MVP scope. If supported public Excalidraw APIs cannot preserve local history safely during remote application, the adapter must prefer resynchronisation and loss of the affected local undo entry over a duplicate or destructive shared write.

---

# 34. Export integration

Exports originate from adapter data.

Pipeline:

```text
Scene
↓
Adapter
↓
Privacy filter
↓
Export
```

---

# 35. Privacy filtering

Before export remove:

- Emails
- Tokens
- Awareness
- Session data
- Physics leases

---

# 36. Physics integration

Physics does not modify Excalidraw internals.

Flow:

```text
Scene
↓
Matter.js
↓
Transform updates
↓
Adapter
↓
Excalidraw
```

The adapter receives only transforms.

---

# 37. Replay integration

Replay consumes adapter scene snapshots.

The adapter remains the only scene application layer.

Replay never bypasses the adapter.

---

# 38. Mini-map integration

Mini-map reads:

- Current viewport
- Scene bounds

It does not inspect Excalidraw internals directly.

---

# 39. Radar integration

Radar consumes:

- Awareness
- Viewports

Not persistent scene data.

---

# 40. Offline mode

Cached scene:

```text
IndexedDB
↓
Adapter
↓
Canvas
```

After reconnect:

```text
Yjs merge
↓
Adapter
↓
Canvas
```

---

# 41. Performance goals

The adapter should:

- Avoid unnecessary scene rebuilds
- Avoid repeated asset loading
- Avoid callback loops
- Avoid deep cloning entire scenes unnecessarily
- Publish incremental updates

Target:

- Smooth interaction with at least 100 active objects.

---

# 42. Memory management

Dispose:

- Event listeners
- File caches
- API references
- Timers

when leaving a room.

---

# 43. Error handling

The adapter should gracefully recover from:

- Invalid scene
- Missing asset
- Corrupted metadata
- Unsupported schema
- Excalidraw API failure

The room should remain usable whenever possible.

---

# 44. Upgrade strategy

Every Excalidraw upgrade requires:

1. Adapter compatibility review
2. Scene migration review
3. Manual interaction testing
4. Automated regression tests
5. Export verification
6. Collaboration verification

Do not upgrade immediately after a new Excalidraw release.

---

# 45. Adapter test API

Development-only:

```ts
interface ExcalidrawAdapterTestApi {
  getScene(): RoomScene;
  getElements(): ExcalidrawElement[];
  getProductObjects(): ProductObjectMetadata[];
  isApplyingRemoteUpdate(): boolean;
  getSceneVersion(): number;
}
```

Removed from production builds.

---

# 46. Unit tests

Cover:

- Scene loading
- Scene export
- Image mapping
- Sticky-note composition
- Audio-card composition
- Callback suppression
- Undo-origin classification and remote-history suppression
- Normalization
- Diff generation
- File registration

---

# 47. Integration tests

Cover:

- Initial load
- Collaboration updates
- Local undo and redo propagation
- Remote updates excluded from unrelated local undo
- Asset loading
- Export
- Offline restore
- Missing assets
- Scene migration
- Replay
- Physics transforms

---

# 48. Browser tests

Verify:

- Room opens correctly
- Shapes appear
- Images load
- Audio cards load
- Collaboration works
- Remote edits appear once
- Callback loops never occur
- Supported local undo and redo converge without reversing unrelated remote work
- Exports succeed
- Offline recovery succeeds

---

# 49. QA-Intel validation

QA-Intel should verify:

- Adapter loads equivalent scenes
- Remote updates converge
- No duplicate publication
- Product metadata remains attached
- Asset references remain valid
- Scene exports exclude private data

---

# 50. Definition of Done

The Excalidraw integration is complete when:

- Excalidraw is the only drawing engine.
- All scene mutations pass through the adapter.
- Collaboration uses incremental updates.
- Remote updates never create callback loops.
- Remote updates do not become unrelated local undo entries.
- Supported local undo and redo results follow the authorised collaboration path.
- Sticky notes and audio cards retain metadata.
- Assets resolve correctly.
- Scene exports are privacy-safe.
- Offline scenes reload successfully.
- Adapter tests and browser tests pass.
- Upgrading Excalidraw requires changes only inside the adapter layer wherever possible.

---

# 51. Final integration policy

The project adopts the following integration policy:

> Excalidraw is treated as a replaceable drawing engine behind a stable adapter. Every interaction with the canvas passes through the adapter, which is responsible for scene translation, collaboration integration, asset resolution, product-object composition, callback suppression, and compatibility. Product features extend Excalidraw without modifying its internals whenever possible.

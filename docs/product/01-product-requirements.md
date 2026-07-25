# Product Requirements Document

Real-Time Collaborative Infinite Canvas

Document path: docs/product/01-product-requirements.md
Document status: Accepted
Product phase: Two-day MVP / Hackathon
Last updated: 25 July 2026
Primary owners: Product and Engineering

⸻

## 1. Document purpose

This document defines the product requirements for a browser-based, real-time collaborative infinite canvas built on top of Excalidraw.

The product enables multiple users to enter a shared room, create and manipulate content on an effectively infinite two-dimensional surface, and collaborate in real time.

The application extends Excalidraw rather than rebuilding a canvas engine from scratch.

Excalidraw provides the foundational canvas experience, including:

- Infinite canvas navigation
- Selection
- Drawing
- Shapes
- Text
- Images
- Element transformation
- Grouping
- Z-order
- Undo and redo
- Scene serialisation
- Core pointer and keyboard interactions

The product adds application-level capabilities around Excalidraw, including:

- Room creation
- Guest identity
- Shareable invitations
- Room permissions
- Durable persistence
- Offline room access
- Audio recordings
- Physics interactions
- Collaborator radar
- Product-specific mini-map behaviour
- Room archive and recycle bin
- Export workflows
- Session replay
- Independent QA validation

This document defines expected product behaviour. Detailed technical implementation is defined in the architecture and engineering documents.

⸻

## 2. Product vision

Create a playful and technically impressive collaborative workspace where people can think, draw, organise media, and interact with canvas objects together in real time.

The product should feel immediately familiar because it uses Excalidraw’s interaction model, while offering capabilities that go beyond a normal whiteboard:

- Objects can be thrown and collide.
- Collaborators can be located across a large canvas.
- Previously opened rooms remain usable offline.
- Images and audio can exist alongside drawings.
- Sessions can be exported and potentially replayed.

The goal is not to reproduce Excalidraw.

The goal is to use Excalidraw as a reliable foundation and concentrate development effort on the distinctive product experience.

⸻

## 3. Problem statement

Most collaborative drawing and whiteboard applications provide standard tools such as shapes, text, freehand drawing, and comments.

They often lack:

- Playful object interactions
- Physics-based movement
- Strong spatial awareness across large canvases
- Useful offline behaviour
- Mixed-media objects such as audio recordings
- Transparent session history
- A focused independent validation workflow

Building all basic canvas behaviours from scratch would consume most of the hackathon period and create unnecessary implementation risk.

Using Excalidraw allows the project to start from a mature canvas experience and focus on the features that differentiate the product.

⸻

## 4. Product goals

The release must allow users to:

1. Enter the application as guests using a username and email address.
2. Create a collaborative room.
3. Invite another user through a shareable link.
4. Join a room without creating a full registered account.
5. Work together on the same Excalidraw scene in real time.
6. Pan and zoom smoothly across a large canvas.
7. Create and manipulate at least 100 canvas elements without unacceptable interaction degradation.
8. Create text, shapes, drawings, images, sticky-note-style content, and audio recordings.
9. See other active collaborators and their cursors.
10. Preserve room content across reloads.
11. Continue editing a previously opened room during a temporary loss of connectivity.
12. Reconcile eligible changes after reconnection.
13. Preserve a recoverable local draft when current server permissions reject offline work.
14. Validate critical workflows through automated tests and QA-Intel.

After the mandatory collaboration path and protected offline differentiator are stable, the product should pursue:

- Physics interactions.
- Mini-map or radar-based collaborator location.
- Recycle-bin and room-archive recovery.
- Room export.

⸻

## 5. Non-goals

The MVP does not aim to provide:

- A complete replacement for Excalidraw.
- Full parity with Figma, Miro, FigJam, or professional design tools.
- Registered user accounts.
- Password-based authentication.
- Verified email ownership.
- Organisation or workspace management.
- Billing or subscriptions.
- Enterprise access control.
- Native mobile applications.
- Perfect offline support for rooms never opened before.
- Server-authoritative simulation of every physics frame.
- Unlimited asset storage.
- Full Excalidraw feature customisation.
- A complete version-control system.
- Production-grade multi-region scaling.
- Pixel-perfect editing of external design formats.
- Permanent replay of every cursor movement.

⸻

## 6. Success criteria

The MVP is successful when the team can demonstrate the following flow:

1. A guest enters a username and email address.
2. The guest creates a room.
3. A second guest joins using a shared link.
4. Both guests see the same Excalidraw scene.
5. One guest creates or edits an element.
6. The other guest sees the change in real time.
7. The scene contains multiple object types.
8. An image is uploaded and displayed.
9. An audio recording is created and playable.
10. One guest temporarily goes offline and edits the cached room.
11. Eligible changes synchronise after reconnection.
12. Permission is revalidated before offline changes enter shared state.
13. Rejected offline work remains recoverable locally.
14. The room remains available after reload.
15. A viewer cannot perform an editor-only action.
16. QA-Intel independently validates the core and offline-recovery workflows.

⸻

## 7. Product scope and priorities

Requirements use the following priorities.

P0 — Mandatory MVP

The product is incomplete without these capabilities:

- Guest identity
- Room creation
- Shareable room links
- Real-time collaboration
- Infinite canvas
- Smooth pan and zoom
- Responsive interface
- Text
- Shapes
- Images
- Sticky-note-style content
- Audio recordings
- Room persistence
- Basic owner, editor, and viewer permissions
- Connection-state feedback
- Excalidraw integration
- Critical automated tests
- QA-Intel acceptance validation

Protected differentiator — Mandatory release scope

The release must also provide the selected offline-recovery differentiator:

- Previously opened room offline access
- Eligible offline editing
- Offline change reconciliation
- Permission revalidation on reconnect
- Recoverable rejected local drafts

P1 — High-score functionality

These capabilities should be implemented after the P0 collaboration path is stable:

- Physics interaction
- Object throwing
- Object collision
- Mini-map
- Collaborator radar
- Room archive
- Recycle bin
- JSON export
- PNG export

P2 — Bonus functionality

These features are optional:

- Attraction
- Repulsion
- SVG export
- Time-travel replay
- Advanced replay controls
- Advanced physics settings
- Follow-collaborator mode
- More sophisticated offline asset recovery

⸻

## 8. Excalidraw product foundation

### 8.1 Excalidraw as the primary canvas

The application must embed the Excalidraw React component as the primary canvas surface.

Excalidraw should remain responsible for its standard editing experience wherever practical.

The product should not rebuild existing Excalidraw functionality unless a product requirement cannot reasonably be achieved through integration or extension.

⸻

### 8.2 Native capability preference

Where Excalidraw already supports a requirement, the application should prefer the native Excalidraw capability.

Examples include:

- Rectangle creation
- Ellipse creation
- Diamond creation
- Arrow creation
- Line creation
- Freehand drawing
- Text creation
- Image placement
- Selection
- Multi-selection
- Resize
- Rotation
- Grouping
- Z-order
- Copy and paste
- Undo and redo
- Pan
- Zoom
- Scene export
- Scene serialisation

Product-specific code should wrap, configure, observe, or extend these capabilities rather than duplicating them.

⸻

### 8.3 Excalidraw scene compatibility

The application must preserve valid Excalidraw scene data.

Custom product metadata must not corrupt or invalidate ordinary Excalidraw elements.

Where product-specific data cannot safely live inside an Excalidraw element, it should be stored separately and associated through stable identifiers.

Examples include:

- Audio asset metadata
- Room-specific permissions
- Physics settings
- Replay metadata
- Deleted-object records
- Private asset access information

⸻

### 8.4 Excalidraw upgrades

The integration should avoid unnecessary dependence on undocumented Excalidraw internals.

Where possible, the application should rely on:

- Public component properties
- Public event callbacks
- Supported scene APIs
- Supported export APIs
- Supported collaboration hooks
- Stable element identifiers

An Excalidraw version must be pinned for the MVP.

Upgrades must be deliberate and tested.

⸻

## 9. User roles

### 9.1 Owner

The room creator becomes the owner.

The owner can:

- View the room.
- Edit the scene.
- Invite collaborators.
- Assign editor or viewer access.
- Change collaborator permissions.
- Upload assets.
- Delete supported content.
- Restore deleted content.
- Archive the room.
- Restore an archived room.
- Export the room.
- Use physics features.
- Access room-management controls.

Each room must always have at least one owner unless the room is permanently deleted by a future administrative process.

⸻

### 9.2 Editor

An editor can:

- View the room.
- Edit the Excalidraw scene.
- Create and transform elements.
- Upload images.
- Create audio recordings.
- Delete and restore content where allowed.
- Use enabled physics features.
- Export where permitted.

An editor cannot:

- Change room ownership.
- Change room permissions unless explicitly granted later.
- Archive the room.
- Permanently delete the room.

⸻

### 9.3 Viewer

A viewer can:

- Open the room.
- Navigate the canvas.
- Pan and zoom.
- Observe live changes.
- See collaborator presence.
- Use the mini-map.
- Use the collaborator radar.
- Play accessible audio objects.
- Export only where room policy permits.

A viewer cannot:

- Create elements.
- Modify elements.
- Delete elements.
- Upload assets.
- Record audio.
- Trigger shared physics state.
- Change permissions.
- Archive or restore a room.

The interface should disable or hide unavailable editing actions, but server-side enforcement remains mandatory.

⸻

## 10. Guest identity

### 10.1 Guest entry

The MVP uses guest access rather than registered accounts.

A guest must provide:

- Username
- Email address

The application should create or restore a guest session after valid details are provided.

⸻

### 10.2 Guest identity model

interface GuestIdentity {
id: string;
email: string;
username: string;
colour: string;
}

⸻

### 10.3 Identity rules

The username:

- Is required.
- Is the visible collaborator name.
- Should contain between 2 and 40 visible characters.
- Must be sanitised before display.

The email address:

- Is required.
- Must pass basic format validation.
- Must be normalised before storage.
- Is treated as unverified.
- Is not proof of identity ownership.
- Must not be shown to other collaborators.
- Must not appear in cursor labels.
- Must not appear in presence payloads.
- Must not appear in public exports.
- May support audit records and later account conversion.

The collaborator colour:

- Is assigned automatically.
- Should remain stable during the guest session.
- Should be visually distinguishable from other active collaborators where practical.

⸻

### 10.4 Session persistence

A guest session may be stored locally so the user does not need to provide identity details on every visit from the same browser.

A stored guest session does not override server-side room access decisions.

⸻

## 11. Room management

### 11.1 Room creation

A guest must be able to create a room.

When a room is created:

- A unique room identifier is generated.
- The creator becomes the owner.
- An empty Excalidraw scene is created.
- A shareable room link becomes available.
- The room is persisted.
- The room opens immediately.

A room may have a generated default name.

Renaming is optional for the MVP.

⸻

### 11.2 Shareable room links

The owner must be able to copy a room invitation link.

The link must identify the room but must not expose:

- Private guest information
- Permanent privileged credentials
- Private asset credentials
- Raw database identifiers where avoidable

Opening the link should lead the guest through identity entry when no valid guest session exists.

⸻

### 11.3 Room joining

A guest joining a room must:

1. Open the shareable link.
2. Provide identity details when required.
3. Receive the allowed room role.
4. Load the persisted Excalidraw scene.
5. Connect to the real-time collaboration channel.
6. See active collaborators.
7. See the current connection state.

⸻

### 11.4 Room persistence

A room’s durable state must survive:

- Browser refresh
- Browser restart
- Temporary client disconnection
- Application server restart where infrastructure permits

Durable state includes:

- Active Excalidraw elements
- Excalidraw scene settings required to restore the room
- Binary file references
- Custom object metadata
- Room membership
- Room permissions
- Archive state, when P1 archive is implemented
- Deleted-object records, when P1 recycle-bin recovery is implemented

Ephemeral presence does not need to survive reloads.

⸻

### 11.5 Room archive (P1)

When the P1 archive capability is implemented, an owner must be able to archive a room.

Archiving:

- Removes the room from the normal active-room list.
- Preserves the scene.
- Preserves assets.
- Preserves room metadata.
- Prevents ordinary editing.
- Does not permanently delete data.

The owner must be able to restore an archived room.

⸻

## 12. Real-time collaboration

### 12.1 Shared scene

All authorised collaborators in a room must operate on one shared Excalidraw scene.

Changes should propagate in real time, including:

- Element creation
- Element deletion
- Element movement
- Element resize
- Element rotation
- Text edits
- Style changes
- Group changes
- Z-order changes
- Image placement

⸻

### 12.2 Local-first feedback

An authorised local action should appear immediately on the initiating client.

The user should not wait for a server round trip before seeing ordinary edits.

⸻

### 12.3 Convergence

After network delivery and conflict resolution, authorised collaborators must converge on an equivalent durable scene.

Temporary intermediate rendering may differ while an action is in progress.

⸻

### 12.4 Presence

The application should display active collaborators.

Presence may include:

- Guest ID
- Username
- Colour
- Cursor location
- Current selection
- Current viewport
- Current interaction state

Email addresses must never be included.

⸻

### 12.5 Remote cursors

Remote collaborators should be represented by:

- A cursor indicator
- The collaborator’s username
- The collaborator’s colour

Cursor updates should be frequent enough to feel responsive without flooding the connection.

⸻

### 12.6 Remote selections

Where supported without destabilising the Excalidraw integration, the product should indicate which elements another collaborator has selected.

Remote selection styling must not prevent local interaction.

⸻

### 12.7 Connection feedback

The current collaboration state must be visible.

Required states:

- Connected
- Reconnecting
- Offline
- Access denied
- Room archived

A user should not have to infer connectivity solely from whether remote updates are arriving.

⸻

## 13. Infinite canvas

The application must provide an effectively infinite two-dimensional workspace using Excalidraw’s canvas.

Users must be able to:

- Pan in every direction.
- Zoom in and out.
- Place content at positive and negative coordinates.
- Return to distant content.
- Work with at least 100 elements.

Pan and zoom are local viewport operations and must not alter another collaborator’s viewport.

⸻

## 14. Canvas content types

### 14.1 Shapes and drawing

The application must support Excalidraw’s core drawing capabilities required for the MVP.

At minimum:

- Rectangle
- Ellipse
- Line
- Arrow
- Freehand drawing

Additional native Excalidraw shapes may remain enabled.

⸻

### 14.2 Text

Users must be able to:

- Create text.
- Edit text.
- Move text.
- Resize where supported.
- Style text using available Excalidraw controls.
- Collaboratively observe text changes.

Text editing conflict behaviour should preserve user work as far as the selected collaboration approach permits.

⸻

### 14.3 Sticky notes

The product must provide sticky-note-style content.

For the MVP, sticky notes may be implemented as:

- A styled Excalidraw rectangle with text, or
- A grouped shape-and-text composition, or
- A product-defined composition using supported Excalidraw elements

Sticky notes must support:

- Creation
- Text editing
- Movement
- Resize
- Colour variation
- Collaboration
- Deletion and restoration

A separate custom rendering engine is not required.

⸻

### 14.4 Images

Users with edit permission must be able to:

- Select a supported image file.
- Upload it.
- Place it on the canvas.
- Resize it.
- Rotate it where supported.
- Move it.
- See it from another connected client.
- See it after reload.

Supported MVP formats should include common browser-readable image types such as:

- PNG
- JPEG
- WebP

The product should reject unsupported or excessive files with actionable feedback.

Images must remain private to authorised room participants.

⸻

### 14.5 Audio recordings

Users with edit permission must be able to:

1. Start an audio recording.
2. See that recording is active.
3. See elapsed recording time.
4. Stop the recording.
5. Upload the recording.
6. Place an audio card on the canvas.
7. Play and pause the recording.
8. Move the audio card.
9. Delete or restore the audio card.

An audio object may be represented through:

- A styled group of Excalidraw elements associated with external metadata, or
- An Excalidraw-compatible embeddable or custom overlay where technically suitable

The underlying audio binary must be stored outside the ordinary Excalidraw element JSON.

The scene should store or reference a stable audio asset identifier rather than a permanent public URL.

⸻

## 15. Standard Excalidraw interactions

The product should preserve familiar Excalidraw behaviour for:

- Selection
- Multi-selection
- Dragging
- Resize
- Rotation
- Grouping
- Ungrouping
- Copy
- Paste
- Duplicate
- Delete
- Undo
- Redo
- Z-order
- Pan
- Zoom
- Keyboard shortcuts
- Context menus

Product extensions should not unexpectedly override these interactions.

Any deliberate changes must be documented in the canvas interaction specification.

⸻

## 16. Mini-map

The application should provide a compact overview of the occupied canvas area.

The mini-map should display:

- Approximate occupied scene bounds
- Current local viewport
- Active collaborator positions where available

The mini-map may use simplified element bounds rather than exact visual previews.

Users should be able to use it to navigate to distant canvas regions.

The mini-map must not reveal private metadata.

⸻

## 17. Collaborator radar

The collaborator radar should help users locate collaborators outside the current viewport.

For each relevant off-screen collaborator, the radar may display:

- Direction
- Username
- Colour
- Approximate distance

Selecting a radar indicator should move or animate the local viewport towards that collaborator.

Radar navigation affects only the local viewport.

⸻

## 18. Physics interactions

### 18.1 Product objective

Physics should make the canvas feel playful and distinct from a standard whiteboard.

When the P1 physics capability is implemented, it must be controlled and must not destabilise normal Excalidraw editing.

⸻

### 18.2 Throwing

An authorised user should be able to:

1. Enter or enable physics interaction.
2. Drag an eligible element.
3. Release it with velocity.
4. Observe the element continue moving.
5. See the final position shared with collaborators.

⸻

### 18.3 Collision

Eligible elements should be able to collide.

For the MVP, likely eligible elements include:

- Rectangles
- Ellipses
- Images
- Audio cards

Sticky notes may remain static or non-colliding to protect readability.

Text-only elements may be excluded.

⸻

### 18.4 Attraction and repulsion

Attraction and repulsion are P2 bonus behaviours.

They must not block delivery of throwing and collision.

⸻

### 18.5 Physics ownership

Only one collaborator should control or simulate a particular element during an active physics interaction.

Ownership must:

- Be temporary.
- Expire automatically.
- Be recoverable after disconnection.
- Avoid permanently locking an element.

Other users should observe the result without competing to publish the same motion.

⸻

### 18.6 Scene compatibility

Physics must update valid Excalidraw element coordinates and transformations.

Physics must not create a separate permanent scene that can drift from the Excalidraw scene.

Excalidraw remains the durable visual representation.

⸻

## 19. Offline support

### 19.1 Offline scope

Offline access is limited to rooms that have already been opened and cached on the current device.

A user cannot be expected to open an uncached room while fully offline.

⸻

### 19.2 Offline capabilities

While offline, an authorised user should be able to:

- Open a previously cached room.
- Navigate the canvas.
- Create eligible elements.
- Edit eligible elements.
- Move and transform elements.
- Delete elements locally.
- Continue using ordinary Excalidraw interactions.
- Queue supported changes for reconciliation.

Permission-changing and room-administration actions may be unavailable.

⸻

### 19.3 Reconnection

When connectivity returns:

- The application should reconnect automatically.
- Eligible local changes should be reconciled.
- Remote changes should be received.
- The user should see the updated connection state.
- The system should avoid silently losing local work.

⸻

### 19.4 Permission revocation

A guest may lose edit permission while offline.

When the guest reconnects:

- The server must enforce the current permission.
- Rejected changes must not be applied to the shared room.
- The local draft should be preserved where possible.
- The user should receive an explanation.
- The user should receive a JSON export or recovery option where feasible.

⸻

### 19.5 Offline assets

Image and audio uploads that cannot complete offline should enter a queued or failed state.

The product must not represent a pending asset as successfully shared.

⸻

## 20. Conflict behaviour

### 20.1 General principle

The system should preserve valid user work while ensuring all authorised clients eventually converge.

⸻

### 20.2 Independent element changes

Changes to separate elements should merge independently.

⸻

### 20.3 Independent properties

Where possible, changes to independent properties of the same element should merge without one unnecessarily overwriting the other.

⸻

### 20.4 Same-property changes

Concurrent changes to the same property must resolve deterministically according to the selected collaboration mechanism.

The product should not claim to preserve both values when that is technically impossible.

⸻

### 20.5 Delete versus edit

Delete wins for the active scene.

If one user deletes an element while another edits it:

- The element disappears from the active scene.
- The deleted version and relevant metadata should be preserved in the recycle bin or history where practical.
- Restoration should recover the most appropriate preserved state.

⸻

## 21. Recycle bin

Deleted product-managed content should be recoverable.

The recycle bin should preserve:

- Element identity
- Element data
- Relevant custom metadata
- Deletion timestamp
- Deleting collaborator
- Asset associations

Restoring an element should:

- Return it to the active scene.
- Preserve or safely recreate its identity.
- Restore valid placement.
- Restore associated audio or image references where still available.

Permanent deletion is outside the mandatory MVP.

⸻

## 22. Export

### 22.1 PNG

The application should support PNG export using Excalidraw’s supported export capabilities where possible.

The export should contain active scene content.

⸻

### 22.2 JSON

The application should support JSON export.

The export should include enough information to recover or inspect:

- Excalidraw scene elements
- Required scene settings
- File references
- Product-specific object metadata
- Schema version

The export must exclude:

- Guest email addresses
- Session tokens
- Signed asset URLs
- Private permission claims
- Internal credentials

⸻

### 22.3 SVG

SVG export is a P2 bonus.

Native Excalidraw export should be preferred where suitable.

⸻

## 23. Time-travel replay

Replay is a P2 bonus feature.

The replay experience should allow a viewer to observe meaningful room changes in chronological order.

Potential replay events include:

- Element creation
- Element movement
- Element resize
- Text changes
- Element deletion
- Element restoration
- Physics throws

Replay does not need to preserve every pointer movement or intermediate physics frame.

Replay should not modify the current durable room unless the user explicitly exits replay into a supported restore operation.

⸻

## 24. Responsive design

### 24.1 Desktop

Desktop is the primary authoring experience.

All P0 editing tools should be available.

⸻

### 24.2 Tablet

Tablet users should be able to:

- Navigate the canvas.
- Select elements.
- Perform common edits.
- Participate in collaboration.
- Access major tools through a responsive interface.

⸻

### 24.3 Mobile

Mobile support must provide at least:

- Room entry
- Scene viewing
- Pan
- Zoom
- Collaborator awareness
- Basic supported editing where practical

The product does not need to reproduce the full desktop authoring experience on a small screen.

⸻

## 25. Performance requirements

The application must remain usable with at least 100 ordinary Excalidraw elements.

Expected behaviour:

- Pan and zoom remain responsive.
- Selection remains usable.
- Remote updates do not freeze the interface.
- Cursor presence does not cause excessive scene rerenders.
- Physics publishing is throttled.
- Mini-map calculation does not block ordinary interaction.
- Large binary assets do not become embedded directly into frequent collaboration updates unnecessarily.

Performance should be measured in representative browsers rather than assumed from unit tests.

⸻

## 26. Accessibility

The product should preserve Excalidraw’s existing accessibility behaviour where possible.

Application-owned controls must provide:

- Keyboard accessibility
- Visible focus
- Accessible labels
- Sufficient contrast
- Touch-friendly target sizes
- Clear connection feedback
- Clear permission-denied feedback
- Reduced-motion consideration for viewport animations and physics

Critical actions should not depend solely on colour.

⸻

## 27. Privacy and security requirements

The product must:

- Treat the browser as untrusted.
- Enforce room permissions on the server.
- Validate collaboration access.
- Keep guest emails private.
- Store assets privately.
- Avoid permanent public asset URLs.
- Validate uploaded file types.
- Apply reasonable upload-size limits.
- Avoid rendering unsafe user-provided HTML.
- Avoid leaking credentials in Excalidraw scene JSON.
- Avoid logging guest emails in ordinary application logs.
- Reject editing access to archived rooms.
- Preserve rejected offline work without applying it to unauthorised shared state.

⸻

## 28. Testing and quality strategy

### 28.1 TDD policy

The project follows risk-based test-driven development.

Strict TDD is expected for high-risk product logic such as:

- Guest identity validation
- Room permissions
- Room lifecycle
- Scene persistence boundaries
- Custom metadata mapping
- Asset lifecycle
- Offline policy
- Conflict handling
- Recycle-bin operations
- Physics ownership

The expected cycle is:

Red → Green → Refactor

⸻

### 28.2 Excalidraw testing boundary

The project should not attempt to retest all Excalidraw internals.

Tests should focus on product guarantees around the integration.

For example, test:

- The embedded scene loads.
- Scene changes persist.
- Two clients observe equivalent results.
- Viewer edits are rejected.
- Audio metadata remains attached to the correct scene object.
- Physics updates produce valid Excalidraw element changes.
- Export excludes private data.

Do not write tests merely to prove that a native Excalidraw shape tool works internally.

⸻

### 28.3 QA-Intel

QA-Intel is the independent behavioural validation layer.

It should validate critical scenarios such as:

- Guest entry
- Room creation
- Share-link joining
- Two-user collaboration
- Remote scene updates
- Viewer restrictions
- Image upload
- Audio recording
- Offline reconnection
- Recycle-bin restoration
- Room archive
- Physics interaction

QA-Intel should use Playwright, multiple browser contexts, screenshots, traces, browser logs, and stable application test hooks.

A P0 feature is not complete until:

- Applicable focused tests pass.
- Applicable integration tests pass.
- Its critical user behaviour has been validated through the agreed acceptance workflow.

⸻

## 29. Product testability requirements

Because Excalidraw renders primarily through canvas and SVG layers, the product should provide non-production inspection hooks for reliable testing.

A test interface may expose:

interface CanvasTestApi {
getSceneElements(): unknown[];
getCustomObjects(): unknown[];
getSelectedElementIds(): string[];
getViewport(): {
scrollX: number;
scrollY: number;
zoom: number;
};
getConnectionState(): string;
getCollaborators(): unknown[];
getRoomRole(): "owner" | "editor" | "viewer";
}

The interface must:

- Be unavailable in production.
- Be read-only where possible.
- Return serialisable data.
- Exclude guest emails.
- Avoid bypassing permission checks.
- Remain stable enough for QA-Intel scenarios.

⸻

## 30. Analytics and diagnostics

Formal product analytics are not required for the hackathon.

The application should still expose enough diagnostics to understand failures, including:

- Room creation failures
- Collaboration connection failures
- Asset upload failures
- Offline reconciliation failures
- Permission rejections
- Excalidraw integration errors
- Physics lease failures

Diagnostic output must avoid private guest data.

⸻

## 31. Major product risks

### 31.1 Over-customising Excalidraw

Risk:

Custom changes may depend on unstable internal behaviour.

Mitigation:

Use public integration APIs and keep product metadata outside native elements when appropriate.

⸻

### 31.2 Conflicting collaboration models

Risk:

Using multiple sources of truth for the same scene can create divergence.

Mitigation:

Define one canonical shared scene model and one controlled synchronisation path.

⸻

### 31.3 Audio object complexity

Risk:

Excalidraw does not natively provide the exact audio-card product experience.

Mitigation:

Represent audio visually with supported scene elements while keeping binary and playback metadata in the product layer.

⸻

### 31.4 Physics versus editing

Risk:

Continuous physics updates may conflict with ordinary Excalidraw transformations.

Mitigation:

Use explicit physics mode, temporary ownership, throttled updates, and final scene commits.

⸻

### 31.5 Canvas end-to-end testing

Risk:

Canvas-rendered state is difficult to validate through selectors alone.

Mitigation:

Provide stable test hooks and use QA-Intel with Playwright evidence.

⸻

### 31.6 Two-day time constraint

Risk:

Too many P1 and P2 features may reduce P0 reliability.

Mitigation:

Deliver vertical slices in strict priority order and stop expanding scope until collaboration and persistence are demonstrated.

⸻

## 32. Recommended delivery sequence

Milestone 1 — Excalidraw foundation

Load embedded Excalidraw
→ Create native element
→ Read scene changes
→ Restore scene after reload

Milestone 2 — Shared room

Create room
→ Join room
→ Synchronise element
→ Persist scene

Milestone 3 — Identity and permissions

Guest enters username and email
→ Owner created
→ Editor joins
→ Viewer joins
→ Viewer edit rejected

Milestone 4 — Required media

Create sticky note
→ Upload image
→ Record audio
→ See media from second client
→ Reload successfully

Milestone 5 — Protected offline differentiator

Open cached room
→ Disconnect
→ Edit
→ Reconnect
→ Revalidate permission
→ Reconcile authorised work
→ Preserve rejected work as a recoverable local draft

Milestone 6 — Optional P1 differentiators

Mini-map
→ Radar
→ Throw
→ Collision

Milestone 7 — Optional P1 recovery and export

Delete
→ Restore
→ Archive
→ Restore room
→ Export JSON/PNG

Each milestone must include its applicable tests and acceptance validation.

⸻

## 33. Definition of MVP complete

The MVP is complete only when:

- Excalidraw is the functioning primary canvas.
- A guest can enter using username and email.
- A guest can create a room.
- Another guest can join through a shareable link.
- Two authorised clients can collaborate on one scene.
- Scene changes remain after reload.
- The canvas supports the required object types.
- Images are private and persistent.
- Audio can be recorded, placed, and played.
- Owner, editor, and viewer permissions are enforced.
- The canvas remains usable with at least 100 elements.
- Connection state is visible.
- A previously opened room can reopen from its local collaborative cache while offline.
- Eligible ordinary scene edits are preserved locally and reconcile after permission revalidation.
- Rejected offline work remains local and recoverable rather than entering unauthorised shared state.
- Critical tests pass.
- QA-Intel validates the primary collaboration, viewer-restriction, and offline-recovery scenarios.

⸻

## 34. Product decision summary

The product adopts the following decisions:

- Excalidraw is the primary canvas engine.
- Existing Excalidraw behaviour is reused rather than rebuilt.
- Product-specific features are implemented as extensions around the Excalidraw scene.
- Guest identity requires username and email.
- Email remains private and unverified.
- Rooms support owner, editor, and viewer roles.
- Deleted content is soft-deleted.
- Archived rooms preserve their assets and scenes.
- Offline support applies to previously opened rooms.
- Server permissions override stale offline assumptions.
- Offline recovery is the protected differentiator for the MVP release.
- Physics runs as a controlled extension to scene transformations.
- Physics, mini-map, radar, recycle bin, room archive, and general export are non-blocking P1 capabilities.
- QA-Intel provides independent acceptance validation.
- Risk-based TDD is the default engineering method.
- P0 reliability takes priority over P1 and P2 scope.

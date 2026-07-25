# Canvas Interaction Specification

Real-Time Collaborative Infinite Canvas

Document path: docs/product/03-canvas-interaction-specification.md
Document status: Accepted
Product phase: Two-day MVP / Hackathon
Last updated: 25 July 2026
Primary owners: Product, Design, Engineering, and QA

⸻

## 1. Purpose

This document defines how users interact with the collaborative canvas.

The application uses Excalidraw as its primary canvas and interaction engine. Therefore, this specification follows two rules:

1. Native Excalidraw interactions should remain unchanged wherever practical.
2. Product-specific behaviour must be explicitly documented where it extends, restricts, or overlays Excalidraw.

This document covers:

- Canvas navigation
- Tool selection
- Element creation
- Selection and transformation
- Sticky notes
- Images
- Audio recordings
- Collaboration presence
- Permissions
- Mini-map
- Collaborator radar
- Physics
- Offline behaviour
- Archive and recycle-bin behaviour
- Keyboard and touch interactions
- Error and connection feedback
- Interaction states
- Testability requirements

This document defines observable user behaviour rather than low-level implementation.

⸻

## 2. Interaction principles

The canvas experience should feel:

- Familiar
- Immediate
- Predictable
- Collaborative
- Playful
- Recoverable
- Responsive

The following principles apply throughout the product.

### 2.1 Preserve Excalidraw familiarity

Users familiar with Excalidraw should not need to relearn ordinary canvas behaviour.

Native behaviours should be preserved for:

- Selection
- Drawing
- Text
- Shapes
- Resize
- Rotation
- Grouping
- Z-order
- Undo and redo
- Copy and paste
- Pan and zoom

⸻

### 2.2 Local actions feel immediate

Authorised interactions should appear locally without waiting for a network round trip.

Examples:

- Creating an element
- Moving an element
- Editing text
- Changing selection
- Panning
- Zooming

⸻

### 2.3 Shared state converges

Collaborators may temporarily see different intermediate states during an active interaction.

After updates settle, authorised clients should converge on equivalent scene state.

⸻

### 2.4 Navigation remains local

Pan, zoom, open panels, selected tools, and local focus do not alter another collaborator’s viewport or interface.

⸻

### 2.5 Permissions are visible and enforced

A viewer should not be presented with a misleading editing experience.

The interface should reflect the current role, while the server remains authoritative.

⸻

### 2.6 Product extensions must fail safely

A failure in audio, radar, mini-map, physics, or another extension should not make the ordinary Excalidraw scene unusable where recovery is possible.

⸻

### 2.7 Destructive actions should be recoverable

Deleted product-managed elements should enter a recycle bin where supported.

Archive actions must preserve room content.

⸻

## 3. Interaction ownership

The product has three interaction layers.

### 3.1 Excalidraw-owned interactions

Excalidraw remains responsible for:

- Native tool selection
- Element drawing
- Text creation and editing
- Native image placement
- Selection
- Multi-selection
- Resize
- Rotation
- Grouping
- Ungrouping
- Z-order
- Copy and paste
- Duplicate
- Undo and redo
- Native context menus
- Standard pan and zoom
- Native keyboard shortcuts

⸻

### 3.2 Product-owned interactions

The application remains responsible for:

- Guest entry
- Room controls
- Invitation links
- Permission controls
- Audio recording
- Product sticky-note creation where customised
- Physics mode
- Mini-map
- Collaborator radar
- Connection state
- Archive
- Recycle bin
- Product export controls
- Offline recovery
- Asset upload status
- QA and test hooks

⸻

### 3.3 Shared integration interactions

Some behaviours require cooperation between Excalidraw and the product layer.

These include:

- Scene persistence
- Real-time collaboration
- Custom object metadata
- Audio-card placement
- Sticky-note composition
- Physics transforms
- Remote selection rendering
- Viewer restrictions
- Offline reconciliation
- Scene export

These interactions must have one clearly defined source of truth.

⸻

## 4. Canvas modes

The application may expose the following modes.

Mode Owner Purpose
Selection Excalidraw Select and transform elements
Hand/Pan Excalidraw Move the local viewport
Rectangle Excalidraw Create rectangles
Ellipse Excalidraw Create ellipses
Diamond Excalidraw Create diamonds where enabled
Line Excalidraw Create lines
Arrow Excalidraw Create arrows
Draw Excalidraw Create freehand strokes
Text Excalidraw Create text
Image Excalidraw + product Upload and place images
Sticky note Product + Excalidraw Create styled note composition
Audio Product Record and place audio cards
Physics Product Throw and simulate eligible elements
View-only Product Navigate without scene modification

Only one primary creation or special interaction mode should be active at a time.

⸻

## 5. Canvas navigation

### 5.1 Pan

Pan behaviour should use Excalidraw’s native interaction model.

Supported desktop interactions may include:

- Space plus pointer drag
- Middle-mouse drag
- Native hand tool
- Trackpad scrolling where supported
- Touch drag where supported

Pan:

- Changes only the local viewport.
- Does not modify element coordinates.
- Does not move another collaborator’s viewport.
- Supports movement in every direction.
- Supports positive and negative world coordinates.

⸻

### 5.2 Zoom

Zoom should use Excalidraw’s native zoom behaviour.

Supported inputs may include:

- Mouse wheel with the relevant modifier
- Trackpad pinch
- Excalidraw zoom controls
- Keyboard shortcuts
- Touch pinch

Zoom:

- Is local.
- Should remain smooth.
- Must not update shared scene state.
- Must preserve ordinary Excalidraw coordinate behaviour.

⸻

### 5.3 Reset or fit view

Where exposed, the user may:

- Reset zoom.
- Fit scene content into view.
- Zoom to a selected element.
- Navigate through the mini-map.
- Navigate to a collaborator through radar.

These actions affect only the local viewport.

⸻

### 5.4 Viewport persistence

Viewport persistence across reload is optional.

Scene content must persist even if the viewport resets.

⸻

## 6. Native element creation

The application should preserve Excalidraw’s native creation behaviour.

### 6.1 Shapes

Users with edit permission may create supported shapes through the standard toolbar.

Required MVP tools:

- Rectangle
- Ellipse
- Line
- Arrow

Additional Excalidraw tools may remain enabled.

⸻

### 6.2 Freehand drawing

Users may create freehand strokes using the native drawing tool.

During drawing:

- The local user should see immediate feedback.
- Remote clients may receive a completed or progressively updated element according to the collaboration implementation.
- The final durable stroke must be valid Excalidraw scene data.

⸻

### 6.3 Text

Users may create text through the native text tool.

Expected behaviour:

1. Select the text tool.
2. Click or drag at the intended position.
3. Enter text.
4. Commit through native Excalidraw behaviour.
5. Synchronise the resulting scene change.

The product should not replace Excalidraw’s text editor without a documented reason.

⸻

### 6.4 Native image tool

Where the native image tool is exposed:

1. The user selects an image.
2. The product validates permission and file constraints.
3. Upload state is shown.
4. The image is placed in the Excalidraw scene.
5. The scene references the appropriate binary or asset data.
6. The image becomes available to collaborators.

An image must not appear successfully shared before its required asset data is available.

⸻

## 7. Selection

### 7.1 Single selection

Clicking or tapping a selectable element should use Excalidraw’s native selection behaviour.

A selected element may display:

- Bounding box
- Resize handles
- Rotation handle
- Contextual properties
- Group indication

⸻

### 7.2 Multi-selection

Multi-selection should use Excalidraw’s supported interactions.

Possible methods include:

- Shift-click
- Marquee selection
- Native select-all shortcut
- Selecting a group

The product should not introduce a competing multi-selection model.

⸻

### 7.3 Marquee selection

Dragging on empty canvas while using the selection tool should create a native Excalidraw selection region.

The product should preserve Excalidraw’s own inclusion behaviour.

⸻

### 7.4 Deselect

Selection may be cleared through:

- Clicking empty canvas
- Pressing Escape
- Activating another appropriate mode
- Native Excalidraw behaviour

⸻

### 7.5 Remote selection

Where enabled, a collaborator’s remote selection may be shown through:

- Coloured outline
- Username label
- Collaborator colour

Remote selection must:

- Remain visually secondary.
- Not block local selection.
- Not expose private information.
- Disappear when presence expires.

⸻

## 8. Element transformation

### 8.1 Move

Moving a selected element should use native Excalidraw drag behaviour.

During an ordinary drag:

- Local movement appears immediately.
- Shared updates may be throttled.
- Final position is committed.
- Remote collaborators converge on the final position.

⸻

### 8.2 Resize

Resize should use native Excalidraw handles.

The product should preserve:

- Aspect-ratio behaviour
- Multi-selection resize
- Minimum valid dimensions
- Native modifier-key behaviour

⸻

### 8.3 Rotate

Rotation should use native Excalidraw interaction.

The resulting angle must synchronise and persist.

⸻

### 8.4 Duplicate

Duplication should use Excalidraw’s native supported action.

The duplicate must:

- Receive a distinct element ID.
- Preserve supported visual properties.
- Retain valid custom metadata only where duplication is appropriate.
- Avoid incorrectly sharing one audio identity between two independently editable cards unless explicitly intended.

⸻

### 8.5 Copy and paste

Native copy and paste should remain available for ordinary Excalidraw elements.

For product-managed custom objects:

- Associated metadata must be duplicated safely.
- Private credentials must not be copied into scene data.
- Asset references may be reused where allowed.
- Pasted objects must receive valid new scene identities.

⸻

## 9. Grouping

### 9.1 Native grouping

Users should use Excalidraw’s native group behaviour.

Grouped elements should:

- Move together.
- Resize according to native behaviour.
- Persist their group relationship.
- Synchronise to collaborators.

⸻

### 9.2 Ungrouping

Ungrouping should use native Excalidraw behaviour.

After ungrouping:

- Elements remain visually positioned.
- Elements become independently selectable.
- Product metadata associations remain valid.

⸻

### 9.3 Product object compositions

Some product objects may consist of multiple Excalidraw elements.

Examples:

- Sticky note background plus text
- Audio card background, icon, title, and duration
- Physics indicator overlays

Such compositions may use:

- Excalidraw groups
- Product metadata linking several element IDs
- A stable root element ID

The relationship must survive:

- Movement
- Duplication
- Deletion
- Restoration
- Reload
- Collaboration

⸻

## 10. Z-order

Z-order should use Excalidraw’s native ordering controls.

Supported actions may include:

- Bring forward
- Send backward
- Bring to front
- Send to back

Z-order:

- Is shared room state.
- Must converge across clients.
- Must persist after reload.
- Must not be independently reinterpreted by product overlays.

Product-owned overlays such as cursors and radar indicators may render above the scene without becoming scene elements.

⸻

## 11. Sticky notes

### 11.1 Creation

The product may expose a dedicated sticky-note tool.

Creation flow:

1. User selects Sticky Note.
2. User clicks or drags on the canvas.
3. A styled note background is created.
4. Associated text is created or immediately focused.
5. The note becomes part of the shared scene.

The note may be implemented as:

- A styled rectangle with bound text
- A grouped rectangle and text element
- Another valid Excalidraw composition

⸻

### 11.2 Editing

Users should edit sticky-note text through the most native Excalidraw text interaction available.

Expected behaviour:

- Double-click or Enter may begin editing.
- Clicking outside commits.
- Escape follows native cancellation or exit behaviour.
- Collaborators receive the resulting text change.

⸻

### 11.3 Colour

Sticky notes should support a limited preset palette.

Changing colour should:

- Update the note background.
- Preserve readable text contrast.
- Synchronise.
- Persist.

⸻

### 11.4 Resize

Resizing a sticky note should preserve a usable relationship between the background and text.

The implementation should avoid:

- Detached text
- Incorrect grouping
- Invalid text bounds
- Broken metadata references

⸻

### 11.5 Physics default

Sticky notes should be non-colliding by default.

This protects readability and reduces physics complexity.

They may remain static while other eligible elements move around them.

⸻

## 12. Images

### 12.1 Image selection

When an editor selects an image:

- Permission is checked.
- File type is validated.
- File size is validated.
- An upload state is created.

⸻

### 12.2 Upload states

The interface should distinguish:

- Selecting
- Uploading
- Ready
- Failed
- Queued offline

A failed image should not appear identical to a ready image.

⸻

### 12.3 Placement

After successful validation and sufficient asset preparation:

- The image appears as a valid Excalidraw image element.
- The user can position it.
- The user can resize it.
- The user may rotate it where native behaviour permits.

⸻

### 12.4 Remote rendering

A remote collaborator should see:

- A loading state where necessary
- The image when ready
- An actionable fallback if asset retrieval fails

⸻

### 12.5 Privacy

The scene must not contain a permanent unrestricted public asset URL.

Asset access must be authorised independently of ordinary scene JSON.

⸻

## 13. Audio recordings

### 13.1 Audio tool activation

Selecting Audio should open an audio recording control without replacing the Excalidraw scene.

The canvas may remain visible behind a panel, popover, or floating control.

⸻

### 13.2 Permission request

If microphone permission has not been granted:

- The browser permission request is triggered.
- The interface explains why access is needed.
- A denial does not break the canvas.

⸻

### 13.3 Recording state

During recording, the user should see:

- Recording indicator
- Elapsed time
- Stop action
- Cancel action where practical

The product should avoid accidental hidden recording.

⸻

### 13.4 Recording completion

After stopping:

- The audio blob is prepared.
- Upload or processing status is shown.
- The user may place the audio card automatically or through a placement cursor.
- The canvas remains usable.

⸻

### 13.5 Audio card

An audio card should visually communicate:

- That it contains audio
- Play or pause state
- Duration where available
- Optional title
- Upload failure where applicable

It may be implemented as a product-managed composition associated with Excalidraw elements.

⸻

### 13.6 Playback

Playback should:

- Start only after user action.
- Provide pause or stop.
- Not automatically play for remote collaborators.
- Not modify shared scene state merely because one user plays audio.
- Remain local unless shared playback is explicitly added later.

⸻

### 13.7 Movement and transform

The audio card should support:

- Selection
- Movement
- Supported resize behaviour
- Deletion
- Restoration
- Collaboration
- Persistence

Playback controls may use a DOM overlay aligned with the underlying Excalidraw composition.

⸻

### 13.8 Duplication

When duplicating an audio card:

- A new visual scene identity is created.
- The existing immutable audio asset may be referenced again.
- The duplicate must retain valid metadata.
- Deleting one card must not necessarily delete the shared asset while another card references it.

⸻

## 14. Collaboration presence

### 14.1 Collaborator list

The room interface should display active collaborators.

Each participant may show:

- Username
- Colour
- Role
- Connection presence

Email must not be shown.

⸻

### 14.2 Remote cursors

Remote cursors should:

- Follow collaborator pointer movement.
- Use collaborator colour.
- Display username.
- Be rendered above the scene.
- Avoid becoming Excalidraw elements.
- Disappear after disconnect or timeout.

⸻

### 14.3 Cursor throttling

Pointer movement should be throttled or sampled.

The user experience should remain smooth without persisting cursor movement as durable room state.

⸻

### 14.4 Viewport awareness

A collaborator may share approximate viewport information for:

- Mini-map
- Radar
- Follow-collaborator features

Viewport awareness is ephemeral and must not alter another user’s canvas.

⸻

## 15. Permission-specific interaction

### 15.1 Owner mode

Owners receive:

- Normal editing tools
- Room-management controls
- Permission controls
- Archive controls
- Recycle-bin access
- Export access
- Physics access where enabled

⸻

### 15.2 Editor mode

Editors receive:

- Normal scene editing tools
- Image upload
- Audio recording
- Physics access where enabled
- Export where permitted

Editors do not receive owner-only room controls.

⸻

### 15.3 Viewer mode

Viewer mode should:

- Preserve canvas rendering.
- Allow pan and zoom.
- Allow audio playback where authorised.
- Allow mini-map and radar.
- Prevent scene editing.
- Prevent asset upload.
- Prevent audio recording.
- Prevent shared physics interaction.

The interface may:

- Hide editing tools
- Disable editing tools
- Use Excalidraw view mode
- Combine these approaches

Server enforcement remains mandatory.

⸻

### 15.4 Permission change during session

When a user’s role changes:

Editor to viewer

- Editing tools become unavailable.
- Active editing should end safely.
- Future modifications are rejected.
- The scene remains visible.

Viewer to editor

- Editing tools become available.
- The current scene remains loaded.
- A full page reload should not be required where avoidable.

⸻

### 15.5 Permission revocation during interaction

If edit permission is revoked while an interaction is active:

- The local interaction should end.
- Unauthorised final changes must not be accepted.
- The user should receive clear feedback.
- Recoverable local draft state should be preserved where applicable.

⸻

## 16. Mini-map

### 16.1 Display

The mini-map should be a product overlay outside the Excalidraw scene data.

It may show:

- Approximate scene bounds
- Simplified element bounds
- Local viewport
- Collaborator viewport positions

It does not need to render exact element visuals.

⸻

### 16.2 Open and close

The mini-map may be:

- Always visible on desktop
- Collapsible
- Opened through a toolbar action
- Hidden on small screens behind a panel

Its placement must not block essential Excalidraw controls.

⸻

### 16.3 Navigation

Selecting or dragging within the mini-map should update the local viewport.

It must not:

- Move scene elements
- Change collaborators’ viewports
- Add scene elements
- Persist as a scene action

⸻

### 16.4 Privacy

The mini-map may display usernames and colours.

It must not display email addresses or private asset information.

⸻

## 17. Collaborator radar

### 17.1 Off-screen detection

A collaborator is considered off-screen when their shared cursor or viewport centre lies outside the local visible canvas region.

⸻

### 17.2 Radar indicator

A radar indicator may show:

- Directional arrow
- Username
- Colour
- Approximate distance
- Presence state

The indicator should remain visually distinct from Excalidraw elements.

⸻

### 17.3 Radar navigation

Selecting a collaborator indicator should:

- Move or animate the local viewport towards the collaborator.
- Respect reduced-motion preferences.
- Leave the collaborator’s viewport unchanged.
- Avoid modifying scene history.

⸻

### 17.4 Missing location

If a collaborator has not shared a usable viewport or cursor location:

- The collaborator may remain visible in the participant list.
- No directional radar indicator is required.

⸻

## 18. Physics mode

### 18.1 Activation

Physics should be opt-in through a clearly labelled mode or control.

Activating physics should not permanently alter native Excalidraw editing behaviour.

⸻

### 18.2 Eligible elements

Initial eligible elements may include:

- Rectangles
- Ellipses
- Images
- Audio cards

Initially excluded elements may include:

- Text-only elements
- Arrows
- Lines
- Freehand drawings
- Sticky notes
- Locked elements

Eligibility should be deterministic.

⸻

### 18.3 Entering physics mode

When physics mode is active:

- Eligible elements may receive a visual indication.
- Ordinary Excalidraw creation tools may be temporarily inactive.
- Selection may still be used where necessary.
- The user can exit physics mode explicitly.

⸻

### 18.4 Throw interaction

A throw consists of:

1. Pointer down on an eligible element.
2. Temporary interaction ownership acquired.
3. Element dragged.
4. Release velocity calculated.
5. Local simulation begins.
6. Movement updates are shared at a controlled rate.
7. Final Excalidraw coordinates are committed.
8. Ownership is released.

⸻

### 18.5 Collision

Eligible elements may collide according to simplified geometry.

Collision behaviour should prioritise:

- Demonstrable movement
- Stable final coordinates
- Avoiding scene corruption
- Avoiding excessive network traffic

Perfect physical realism is not required.

⸻

### 18.6 Physics and Excalidraw source of truth

Physics must not maintain a separate permanent scene.

During simulation:

- Matter.js or another engine may hold temporary bodies.
- Body transforms map back to Excalidraw element coordinates.
- Final durable state is stored through the normal scene collaboration path.

⸻

### 18.7 Interaction lease

Only one collaborator may actively simulate a given element.

The lease should contain enough information to identify:

- Element
- Controlling collaborator
- Acquisition time
- Expiry time

A lease:

- Expires automatically.
- Is renewed while valid interaction continues.
- Ends after the object settles or the user exits.
- Ends after disconnect.
- Must not permanently lock the element.

⸻

### 18.8 Competing interaction

When another collaborator tries to control a leased element:

- The competing interaction should not become authoritative.
- The user may receive a subtle locked or busy indication.
- Ordinary viewing remains available.

⸻

### 18.9 Physics exit

When leaving physics mode:

- Active simulations should settle, pause, or commit according to the chosen policy.
- Valid final positions should remain.
- Excalidraw’s ordinary selection mode should resume.
- No element should remain permanently owned.

⸻

### 18.10 Reduced motion

When reduced motion is preferred:

- Physics may run with shorter animations.
- The product may show final positions with reduced intermediate movement.
- Essential state changes must remain understandable.

⸻

## 19. Offline interactions

### 19.1 Entering offline state

When connectivity is lost:

- Connection status changes to Offline.
- The cached scene remains visible.
- The interface avoids falsely showing Connected.
- Product controls requiring the server may be disabled.

⸻

### 19.2 Offline editing

For a previously opened room and a user with last-known edit permission:

Allowed offline actions may include:

- Create ordinary Excalidraw elements
- Edit text
- Move elements
- Resize
- Rotate
- Group
- Ungroup
- Delete locally
- Create sticky notes

⸻

### 19.3 Restricted offline actions

The following may be unavailable or limited:

- Permission changes
- Room archive
- Room restore
- Opening uncached rooms
- Completing new image uploads
- Completing audio uploads
- Server-authorised exports
- Starting shared physics interactions

⸻

### 19.4 Offline asset creation

If the browser can preserve a selected image or recording locally:

- The asset may enter a queued state.
- The associated object must visibly indicate that it is not yet shared.
- Upload should resume after reconnection.

If local preservation is unreliable:

- The product should prevent completion.
- The user should receive an honest explanation.

⸻

### 19.5 Reconnection

When connectivity returns:

1. The product shows Reconnecting.
2. Current permission is validated.
3. Eligible shared updates reconcile.
4. Remote updates are received.
5. Asset queues resume where supported.
6. The status returns to Connected.

⸻

### 19.6 Rejected offline draft

If the user no longer has edit permission:

- Local changes must not enter the shared scene.
- The user should see a permission explanation.
- A recoverable local draft should be preserved where feasible.
- A JSON export or copy option should be offered.

⸻

## 20. Delete and recycle bin

### 20.1 Delete

Deleting an element should use ordinary Excalidraw interaction where possible.

The product observes deletion and creates a recoverable record for supported content.

⸻

### 20.2 Delete result

After deletion:

- The element leaves the active scene.
- Remote clients receive the deletion.
- The product records deletion metadata.
- Related custom metadata is preserved where required.
- Asset deletion is not automatically permanent.

⸻

### 20.3 Restore

Restore is initiated from the product recycle-bin interface.

Restoration should:

- Recreate or reactivate valid Excalidraw elements.
- Restore custom metadata.
- Restore appropriate z-order where possible.
- Keep associated assets connected.
- Synchronise to active collaborators.

⸻

### 20.4 Concurrent delete and edit

Delete wins for the active scene.

Concurrent edits may be retained in recoverable history or deleted metadata where technically feasible.

⸻

## 21. Room archive

### 21.1 Archive control

Only the owner should see the active archive action.

The action should require deliberate confirmation.

⸻

### 21.2 Archived state

An archived room should:

- Display an Archived status.
- Disable ordinary editing.
- Preserve the Excalidraw scene.
- Preserve assets.
- Preserve room membership.
- Reject unauthorised updates.

⸻

### 21.3 Restore room

The owner may restore the room.

After restoration:

- The room returns to active state.
- Editing becomes available according to role.
- Existing scene data loads normally.
- Collaborators may reconnect.

⸻

## 22. Export interactions

### 22.1 PNG export

PNG export should use Excalidraw’s supported export path where suitable.

The user should be able to:

1. Open export controls.
2. Select PNG.
3. Generate the output.
4. Receive a clear success or failure state.

⸻

### 22.2 JSON export

JSON export should include:

- Supported Excalidraw scene data
- Supported product metadata
- Schema version
- Asset references where safe

It must exclude private identity and security data.

⸻

### 22.3 SVG export

SVG is optional.

Unsupported custom overlays should either:

- Be omitted with explanation
- Be represented through supported SVG content
- Be rejected honestly

⸻

## 23. Undo and redo

### 23.1 Native behaviour

The application should preserve Excalidraw’s native undo and redo experience.

⸻

### 23.2 Collaboration policy

The exact collaborative undo model must be defined by the collaboration architecture.

The user experience should avoid undoing unrelated remote work unexpectedly.

Preferred behaviour:

- Undo affects the local user’s supported recent actions.
- Remote changes are not globally reverted merely because another user presses Undo.
- Product-specific custom metadata follows the associated scene action.

⸻

### 23.3 Product action history

Room archive, permission changes, asset uploads, and other product actions do not need to enter Excalidraw’s native undo stack.

They require their own explicit product behaviour.

⸻

## 24. Keyboard interactions

Native Excalidraw shortcuts should remain available.

The product must avoid conflicting shortcuts.

Expected shortcuts may include:

Shortcut Behaviour
Escape Exit editing, clear selection, or close active transient state
Delete / Backspace Delete selected element where permitted
Ctrl/Cmd + C Copy
Ctrl/Cmd + V Paste
Ctrl/Cmd + D Duplicate where supported
Ctrl/Cmd + G Group
Ctrl/Cmd + Shift + G Ungroup
Ctrl/Cmd + A Select all according to native behaviour
Ctrl/Cmd + Z Undo
Ctrl/Cmd + Shift + Z Redo
Space + drag Pan
Enter Edit selected text where native behaviour supports it

Product-specific shortcuts should be added only when they do not conflict with Excalidraw.

Possible future shortcuts:

- Toggle mini-map
- Open collaborator radar
- Toggle physics mode
- Open audio recorder

⸻

## 25. Pointer and trackpad interactions

### 25.1 Mouse

The mouse should support native Excalidraw behaviour for:

- Select
- Draw
- Drag
- Resize
- Rotate
- Pan
- Zoom
- Context menu

Product overlays must not unexpectedly capture pointer events intended for the canvas.

⸻

### 25.2 Trackpad

Trackpad behaviour should preserve:

- Pan
- Pinch zoom
- Pointer movement
- Selection

Radar or mini-map gestures should be limited to their own visible control areas.

⸻

## 26. Touch interactions

Touch support should preserve Excalidraw’s supported mobile and tablet behaviour.

Expected capabilities:

- Tap to select
- Drag to move where supported
- Pinch to zoom
- Touch pan
- Basic drawing
- Basic text editing

Product controls must use touch-friendly targets.

When P1 physics is implemented, touch-device throwing may be simplified or disabled if it cannot be delivered safely.

⸻

## 27. Responsive layout

### 27.1 Desktop

Desktop should show:

- Full canvas
- Primary Excalidraw tools
- Collaboration presence
- Connection state
- Room controls
- Optional mini-map
- Optional radar
- Product extension controls

⸻

### 27.2 Tablet

Tablet may:

- Collapse room controls
- Use floating product controls
- Hide non-essential collaborator details
- Keep core Excalidraw tools accessible

⸻

### 27.3 Mobile

Mobile should prioritise:

- Viewing
- Pan and zoom
- Presence
- Audio playback
- Basic editing where supported

Advanced physics and detailed room management may be hidden or simplified.

⸻

## 28. Connection-state interactions

### 28.1 Connected

When connected:

- Editing is available according to role.
- Presence is active.
- Scene updates synchronise.
- Status is visible but unobtrusive.

⸻

### 28.2 Reconnecting

When reconnecting:

- A visible status is shown.
- Local scene remains available.
- Repeated destructive warnings should be avoided.
- Editing follows the offline policy.

⸻

### 28.3 Offline

When offline:

- Offline status is visible.
- Cached content remains available.
- Unsupported server actions are disabled.
- Queued work is communicated honestly.

⸻

### 28.4 Access denied

When access is denied:

- Editing stops.
- The reason is displayed.
- The scene may remain visible if viewing is allowed.
- Local rejected drafts remain recoverable where applicable.

⸻

### 28.5 Archived

When archived:

- Archived state is visible.
- Editing is unavailable.
- Owner restore controls may be available.
- The room is not presented as deleted.

⸻

## 29. Loading states

The product should show appropriate states for:

- Room loading
- Scene loading
- Collaboration connecting
- Image upload
- Audio upload
- Asset retrieval
- Room restore
- Export generation

Loading indicators should not block unrelated canvas interaction unless necessary.

⸻

## 30. Error interactions

### 30.1 Upload failure

The user should see:

- Which asset failed
- Whether retry is possible
- Whether the object remains local
- Whether collaborators can see it

⸻

### 30.2 Microphone failure

The user should receive:

- Permission explanation
- Browser-setting guidance where practical
- A safe return to the canvas

⸻

### 30.3 Collaboration failure

The user should see:

- Reconnecting or Offline
- Whether local edits are being preserved
- Whether action is needed

⸻

### 30.4 Invalid room

The user should see:

- Room not found or unavailable
- A route back to the application
- No fake empty replacement room

⸻

### 30.5 Extension failure

If physics, mini-map, radar, or audio overlay fails:

- The extension may be disabled.
- The Excalidraw scene should remain usable.
- A diagnostic event should be recorded.
- The user should receive appropriate feedback.

⸻

## 31. Accessibility interactions

Application-owned controls must provide:

- Keyboard navigation
- Visible focus
- Accessible names
- Appropriate roles
- Sufficient contrast
- Non-colour status indicators
- Large touch targets
- Reduced-motion support

Remote cursors should not be the only indication that collaborators are present.

Physics movement should not be essential to understanding room state.

⸻

## 32. Interaction state model

A user may move through the following high-level states:

Loading room
↓
Connecting
↓
Connected
↓
View or edit scene
├── Selecting
├── Drawing
├── Text editing
├── Transforming
├── Uploading image
├── Recording audio
├── Physics interaction
├── Viewing mini-map
├── Navigating radar
└── Managing room

Connection transitions may occur from any active state:

Connected
↓
Reconnecting
↓
Offline
↓
Reconnecting
↓
Connected

Permission transitions may also occur:

Editor
↓
Permission revoked
↓
End active edit
↓
Viewer or access denied

⸻

## 33. Element interaction states

An ordinary Excalidraw element may pass through:

Idle
→ Hovered
→ Selected
→ Transforming
→ Selected
→ Idle

A text element may pass through:

Idle
→ Selected
→ Editing
→ Committed
→ Selected

A physics element may pass through:

Idle
→ Physics eligible
→ Lease requested
→ Controlled
→ Simulating
→ Settling
→ Committed
→ Lease released

An asset-backed object may pass through:

Local placeholder
→ Uploading
→ Ready
→ Shared

or:

Local placeholder
→ Uploading
→ Failed
→ Retry or remove

⸻

## 34. Product overlay rules

Product overlays include:

- Remote cursors
- Mini-map
- Radar
- Audio playback controls
- Connection status
- Upload progress
- Physics indicators
- Room controls

Overlays must:

- Not become Excalidraw scene elements.
- Not unintentionally intercept canvas events.
- Track scene objects correctly when attached.
- Scale or reposition appropriately with the viewport.
- Avoid exposing private data.
- Remain testable through stable DOM selectors.

⸻

## 35. Testability requirements

Because many canvas interactions are not directly represented as ordinary DOM nodes, the application must provide test-specific inspection interfaces.

### 35.1 Root test attributes

The canvas container should expose stable attributes such as:

<div
  data-testid="canvas-root"
  data-room-role="editor"
  data-connection-state="connected"
  data-physics-mode="inactive"
></div>

⸻

### 35.2 Product control selectors

Product-owned controls should expose stable selectors for:

- Create room
- Copy invite link
- Connection status
- Audio start
- Audio stop
- Mini-map
- Radar
- Physics mode
- Archive
- Restore
- Recycle bin
- Export

⸻

### 35.3 Canvas inspection API

A non-production test API should expose:

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
getCustomObjects(): Array<{
id: string;
kind: "sticky-note" | "audio-card" | "other";
elementIds: string[];
assetId?: string;
status?: string;
}>;
getSelectedElementIds(): string[];
getViewport(): {
scrollX: number;
scrollY: number;
zoom: number;
};
getCollaborators(): Array<{
guestId: string;
username: string;
colour: string;
}>;
getConnectionState(): string;
getRoomRole(): "owner" | "editor" | "viewer";
getPhysicsState(): {
active: boolean;
leases: Array<{
elementId: string;
ownerGuestId: string;
expiresAt: number;
}>;
};
}

⸻

### 35.4 Test API restrictions

The test API must:

- Be disabled in production.
- Exclude emails.
- Exclude session tokens.
- Be read-only where possible.
- Avoid mutating scene state directly.
- Return serialisable values.
- Remain stable for QA-Intel.

⸻

## 36. QA-Intel interaction coverage

QA-Intel must validate these release-blocking interaction paths:

1. Create room and join.
2. Create native Excalidraw element.
3. Synchronise the element.
4. Move the element remotely.
5. Reload and restore the scene.
6. Viewer cannot edit.
7. Upload image.
8. Record and play audio.
9. Edit offline and reconnect.
10. Reject an offline edit after permission revocation and preserve a recoverable local draft.

When the corresponding P1 capability is claimed as complete, QA-Intel should additionally validate:

1. Throw a physics-enabled element.
2. Navigate through mini-map or radar.
3. Restore deleted content.
4. Archive and protect the room.
5. Export without private data.

QA-Intel should use:

- Separate browser contexts
- Stable product selectors
- Canvas inspection API
- Screenshots
- Traces
- Console logs
- Network evidence

Visual screenshots alone are insufficient for scene-state assertions.

⸻

## 37. Interaction performance requirements

The interaction layer should remain usable with at least 100 representative elements.

The product should avoid:

- Re-rendering all overlays for every pointer event
- Persisting cursor movement
- Sending every physics frame unthrottled
- Recomputing mini-map bounds unnecessarily
- Recreating the full Excalidraw scene for small product-state changes
- Embedding large binary assets in frequent scene updates

The exact performance thresholds should be defined in the engineering performance plan.

⸻

## 38. Known MVP limitations

The MVP may intentionally accept the following limitations:

- Mobile authoring may be reduced.
- Physics may support only a subset of element types.
- Audio controls may use DOM overlays rather than native scene elements.
- Remote selections may be simplified.
- Offline asset uploads may require reconnection before placement completes.
- Collaborative undo may be limited.
- Mini-map visuals may use bounding boxes rather than exact previews.
- Radar distance may be approximate.
- Replay may not be implemented.
- Attraction and repulsion may not be implemented.

These limitations must not be described as completed functionality.

⸻

## 39. Interaction definition of done

The interaction specification is implemented successfully when:

- Native Excalidraw interactions remain familiar.
- Product extensions do not break ordinary canvas use.
- Owners and editors can create and transform supported content.
- Viewers can navigate but cannot edit.
- Sticky notes remain coherent compositions.
- Images upload, synchronise, and persist.
- Audio cards can be recorded, placed, moved, and played.
- Presence and remote cursors remain private and responsive.
- Offline state is visible and honest.
- Authorised offline edits reconcile only after current permission is revalidated.
- Rejected offline edits remain local and recoverable.
- QA-Intel can inspect and validate critical interactions reliably.

When optional P1 capabilities are implemented:

- Mini-map and radar affect only the local viewport.
- Physics produces valid shared Excalidraw positions without creating another scene model.
- Deleted supported content can be restored.
- Archived rooms remain protected.
- Exports exclude private data.

⸻

## 40. Final interaction policy

The project adopts the following interaction policy:

Excalidraw owns ordinary canvas editing. The application owns rooms, identity, permissions, assets, collaboration policy, offline recovery, and innovative extensions. Product-specific behaviour must integrate with Excalidraw without creating a competing interaction model or a second permanent scene source of truth.

# MVP Scope and Acceptance Criteria

## Real-Time Collaborative Infinite Canvas

**Document path:** `docs/product/02-mvp-scope-and-acceptance-criteria.md`
**Document status:** Accepted
**Product phase:** Two-day MVP / Hackathon
**Last updated:** 25 July 2026
**Primary owners:** Product, Engineering, and QA

---

# 1. Purpose

This document defines the delivery scope and acceptance criteria for the real-time collaborative infinite canvas.

It translates the product requirements into testable outcomes.

The application uses Excalidraw as its primary canvas and interaction engine. Therefore, acceptance criteria focus on:

- Correct Excalidraw integration
- Product-level room behaviour
- Real-time collaboration
- Permissions
- Persistence
- Offline behaviour
- Custom media objects
- Physics extensions
- Product-specific navigation
- Independent behavioural validation

The document does not require the project to retest all internal Excalidraw functionality.

It requires the project to prove that Excalidraw works correctly within the product’s room, collaboration, persistence, permission, asset, and extension architecture.

---

# 2. Priority definitions

## P0 — Mandatory MVP

A P0 requirement must be completed for the MVP to be considered functional.

P0 includes:

- Excalidraw integration
- Guest identity
- Room creation
- Shareable room links
- Real-time collaboration
- Scene persistence
- Core canvas interactions
- Required content types
- Image upload
- Audio recording
- Owner, editor, and viewer roles
- Responsive interface
- Connection-state feedback
- Critical automated tests
- QA-Intel validation of the mandatory release workflows

---

## Protected differentiator — Mandatory release scope

The MVP release must include offline recovery for a previously opened room after the P0 collaboration path is stable.

This protected differentiator includes:

- Loading a previously opened room from the local collaborative cache
- Preserving eligible ordinary scene edits while offline
- Reconciling authorised changes after reconnection
- Revalidating current room and membership permissions before publishing
- Keeping rejected work local and recoverable
- Treating unavailable offline asset upload honestly

---

## P1 — High-score functionality

A P1 requirement should be implemented after the P0 collaboration path is stable.

P1 includes:

- Physics throwing
- Collision
- Mini-map
- Collaborator radar
- Recycle bin
- Room archive and restore
- JSON export
- PNG export

---

## P2 — Bonus functionality

A P2 requirement is optional.

P2 includes:

- Attraction
- Repulsion
- Time-travel replay
- SVG export
- Advanced collaborator-follow mode
- Advanced offline asset recovery
- Advanced physics controls

---

# 3. Scope-control rules

The team must follow these rules during implementation:

1. P0 collaboration and persistence take priority over all visual polish.
2. Existing Excalidraw functionality should be reused rather than rebuilt.
3. P1 work must not destabilise P0 behaviour.
4. P2 work must not begin while a P0 acceptance scenario is failing.
5. Every feature must have a clear completion condition.
6. Critical product logic should follow TDD.
7. Critical user workflows must be independently validated through QA-Intel where applicable.
8. Features that cannot be completed safely should be reduced in scope rather than partially presented as complete.

---

# 4. Definition of ready

A feature is ready for implementation when:

- Its intended behaviour is documented.
- Its priority is known.
- Its permission requirements are known.
- Its Excalidraw integration boundary is understood.
- Its persistence requirements are known.
- Its applicable test level is identified.
- Any custom metadata requirements are defined.
- Its acceptance scenario is written.

---

# 5. Definition of done

A feature is complete when:

- The implementation satisfies its acceptance criteria.
- Applicable unit tests pass.
- Applicable integration tests pass.
- Applicable end-to-end tests pass.
- The feature does not break existing P0 behaviour.
- Permission checks are enforced at the correct server boundary.
- Private guest data is not exposed.
- The feature remains valid after scene reload where persistence applies.
- QA-Intel has validated the applicable critical workflow.
- Any known limitation is documented honestly.

A P0 feature is not complete merely because it appears to work in one browser during manual testing.

---

# 6. Acceptance-test conventions

The acceptance scenarios use Gherkin-style language.

Keywords:

- **Given** establishes initial state.
- **When** describes an action.
- **Then** defines an observable result.
- **And** adds related conditions.

Where a scenario requires two collaborators, separate browser contexts should be used.

Suggested test identities:

```text
Alice — room owner
Bob — editor
Charlie — viewer
```

Email addresses used in test environments must be synthetic.

---

# 7. Application entry

## P0-ENTRY-001 — Application loads

```gherkin
Feature: Application entry

  Scenario: Guest opens the application
    Given the application services are available
    When a guest opens the application
    Then the application should load successfully
    And the guest should see an identity entry screen or a restored guest session
    And no room should be created automatically
```

---

## P0-ENTRY-002 — Existing session is restored

```gherkin
Scenario: Returning guest has a valid local session
  Given a guest previously created a valid guest session
  And the session has not expired
  When the guest opens the application
  Then the guest identity should be restored
  And the guest should not be required to re-enter identity details
```

---

## P0-ENTRY-003 — Invalid session is rejected

```gherkin
Scenario: Returning guest has an invalid session
  Given the browser contains an invalid or expired guest session
  When the application validates the session
  Then the invalid session should not grant room access
  And the guest should be asked to enter identity details again
  And the application should remain usable
```

---

# 8. Guest identity

## P0-IDENTITY-001 — Valid identity creation

```gherkin
Feature: Guest identity

  Scenario: Guest submits valid identity details
    Given the guest has no active session
    When the guest enters a valid username
    And the guest enters a valid email address
    And the guest submits the form
    Then a guest identity should be created
    And the identity should receive a unique ID
    And the identity should receive a collaborator colour
    And the guest session should be stored locally
```

---

## P0-IDENTITY-002 — Username is required

```gherkin
Scenario: Guest submits an empty username
  Given the guest is on the identity screen
  When the guest submits a valid email without a username
  Then the identity should not be created
  And a username validation message should be displayed
```

---

## P0-IDENTITY-003 — Email is required

```gherkin
Scenario: Guest submits an empty email
  Given the guest is on the identity screen
  When the guest submits a valid username without an email
  Then the identity should not be created
  And an email validation message should be displayed
```

---

## P0-IDENTITY-004 — Invalid email is rejected

```gherkin
Scenario: Guest submits an invalid email
  Given the guest is on the identity screen
  When the guest enters a valid username
  And the guest enters an invalid email format
  And the guest submits the form
  Then the identity should not be created
  And an actionable email validation message should be displayed
```

---

## P0-IDENTITY-005 — Username length is validated

```gherkin
Scenario: Guest submits an unsupported username length
  Given the guest is on the identity screen
  When the guest enters a username outside the supported length
  And the guest enters a valid email
  And the guest submits the form
  Then the identity should not be created
  And the supported username length should be communicated
```

---

## P0-IDENTITY-006 — Email remains private

```gherkin
Scenario: Collaborators inspect visible presence information
  Given Alice and Bob are connected to the same room
  When Bob sees Alice's collaborator presence
  Then Bob should see Alice's username
  And Bob should see Alice's collaborator colour
  And Bob may see Alice's cursor
  But Bob should not see Alice's email address
```

---

# 9. Excalidraw integration

## P0-EXCALIDRAW-001 — Embedded canvas loads

```gherkin
Feature: Excalidraw integration

  Scenario: Editor opens an active room
    Given Alice has access to an active room
    When Alice opens the room
    Then the Excalidraw canvas should render
    And the canvas should be interactive
    And the scene should load without an unrecoverable error
```

---

## P0-EXCALIDRAW-002 — Scene changes are observable

```gherkin
Scenario: Editor creates a native Excalidraw element
  Given Alice is an editor in an active room
  When Alice creates a rectangle using the Excalidraw toolbar
  Then the scene should contain one new rectangle
  And the product should observe the scene change
  And the rectangle should have a stable element ID
```

---

## P0-EXCALIDRAW-003 — Scene can be restored

```gherkin
Scenario: Editor reloads a room containing elements
  Given Alice created elements in a room
  And the scene was persisted
  When Alice reloads the room
  Then the same active elements should appear
  And their important properties should remain equivalent
```

---

## P0-EXCALIDRAW-004 — Product metadata does not corrupt the scene

```gherkin
Scenario: Room contains product-specific metadata
  Given a room contains Excalidraw elements
  And the room contains custom product metadata
  When the scene is loaded into Excalidraw
  Then the valid Excalidraw elements should render successfully
  And custom metadata should remain associated with the correct elements
  And no invalid element should crash the scene
```

---

## P0-EXCALIDRAW-005 — Version is pinned

```gherkin
Scenario: Project dependencies are installed
  Given the repository dependency files are available
  When the Excalidraw package version is inspected
  Then the project should use an explicit supported version
  And the project should not depend on an uncontrolled latest version
```

---

# 10. Room creation

## P0-ROOM-001 — Owner creates a room

```gherkin
Feature: Room creation

  Scenario: Guest creates a new room
    Given Alice has a valid guest session
    When Alice creates a room
    Then a unique room should be created
    And Alice should become the owner
    And an empty Excalidraw scene should be associated with the room
    And Alice should be taken into the room
```

---

## P0-ROOM-002 — Room has a shareable link

```gherkin
Scenario: Owner copies the room invitation link
  Given Alice owns an active room
  When Alice requests the shareable link
  Then a room invitation link should be available
  And the link should identify the room
  And the link should not expose Alice's email
  And the link should not contain a permanent privileged credential
```

---

## P0-ROOM-003 — Room persists after refresh

```gherkin
Scenario: Owner refreshes a newly created room
  Given Alice created a room
  When Alice refreshes the browser
  Then the room should still exist
  And Alice should retain owner access
  And the room scene should load
```

---

# 11. Room joining

## P0-JOIN-001 — Guest joins by link

```gherkin
Feature: Room joining

  Scenario: Guest joins an active room using a valid link
    Given Alice owns an active room
    And Bob has a valid guest identity
    When Bob opens the room invitation link
    Then Bob should enter the correct room
    And Bob should receive the configured role
    And Bob should see the current Excalidraw scene
```

---

## P0-JOIN-002 — Guest without identity is prompted

```gherkin
Scenario: New guest opens a room link
  Given Bob has no guest session
  When Bob opens a valid room invitation link
  Then Bob should be asked to provide a username and email
  And the intended room should remain associated with the entry flow
  And Bob should enter the room after valid identity submission
```

---

## P0-JOIN-003 — Invalid room link is handled

```gherkin
Scenario: Guest opens an unknown room link
  Given the requested room does not exist
  When Bob opens the link
  Then the application should show a room-not-found state
  And the application should not create a replacement room automatically
  And Bob should be able to return to a safe application screen
```

---

## P1-ARCHIVE-004 — Archived room cannot be edited

This scenario is required when the optional P1 room-archive capability is implemented.

```gherkin
Scenario: Editor opens an archived room link
  Given Alice archived the room
  And Bob previously had editor access
  When Bob opens the room link
  Then Bob should see that the room is archived
  And Bob should not receive active editing access
```

---

# 12. Permissions

## P0-PERMISSION-001 — Owner can edit

```gherkin
Feature: Room permissions

  Scenario: Owner creates an element
    Given Alice owns an active room
    When Alice creates a rectangle
    Then the rectangle should be added to the shared scene
```

---

## P0-PERMISSION-002 — Editor can edit

```gherkin
Scenario: Editor creates an element
  Given Bob has editor access to an active room
  When Bob creates an ellipse
  Then the ellipse should be added to the shared scene
  And Alice should receive the change
```

---

## P0-PERMISSION-003 — Viewer cannot edit through the interface

```gherkin
Scenario: Viewer opens a room
  Given Charlie has viewer access
  When Charlie opens the room
  Then editing tools should be disabled or unavailable
  And Charlie should still be able to pan and zoom
```

---

## P0-PERMISSION-004 — Viewer update is rejected by the server

```gherkin
Scenario: Viewer attempts to submit a scene modification
  Given Charlie has viewer access
  When Charlie attempts to send an element modification
  Then the server should reject the modification
  And the shared room scene should remain unchanged
  And Charlie should receive permission feedback
```

---

## P0-PERMISSION-005 — Owner changes editor to viewer

```gherkin
Scenario: Owner revokes editor permission
  Given Bob currently has editor access
  When Alice changes Bob's role to viewer
  Then Bob should lose editing capability
  And future modifications from Bob should be rejected
  And Bob should retain allowed viewing capability
```

---

## P0-PERMISSION-006 — Email is not used as public membership display

```gherkin
Scenario: Owner reviews room participants
  Given multiple guests are in the room
  When Alice views participant presence
  Then participant usernames should be displayed
  And participant roles may be displayed
  But participant email addresses should not be shown in ordinary room presence
```

---

# 13. Real-time scene collaboration

## P0-COLLAB-001 — Element creation synchronises

```gherkin
Feature: Real-time scene collaboration

  Scenario: Owner creates an element
    Given Alice and Bob are connected to the same room
    And both have edit permission
    When Alice creates a rectangle
    Then Alice should see the rectangle immediately
    And Bob should see an equivalent rectangle without reloading
```

---

## P0-COLLAB-002 — Element movement synchronises

```gherkin
Scenario: Editor moves an element
  Given Alice and Bob can see the same rectangle
  When Bob moves the rectangle
  Then Bob should see immediate local movement
  And Alice should see the rectangle at the final shared position
```

---

## P0-COLLAB-003 — Resize synchronises

```gherkin
Scenario: Editor resizes an element
  Given Alice and Bob can see the same ellipse
  When Alice resizes the ellipse
  Then Bob should see the updated dimensions
```

---

## P0-COLLAB-004 — Rotation synchronises

```gherkin
Scenario: Editor rotates an element
  Given Alice and Bob can see the same supported element
  When Bob rotates the element
  Then Alice should see the final equivalent rotation
```

---

## P0-COLLAB-005 — Style change synchronises

```gherkin
Scenario: Editor changes element style
  Given Alice and Bob can see the same rectangle
  When Alice changes a supported style property
  Then Bob should see the updated style
```

---

## P0-COLLAB-006 — Deletion synchronises

```gherkin
Scenario: Editor deletes an element
  Given Alice and Bob can see the same element
  When Bob deletes the element
  Then the element should disappear from the active scene for both users
  And the deleted element should be eligible for recovery where recycle-bin support is enabled
```

---

## P0-COLLAB-007 — Simultaneous independent changes converge

```gherkin
Scenario: Two editors change different elements
  Given Alice and Bob are connected to the same room
  And the room contains element A and element B
  When Alice moves element A
  And Bob edits element B at approximately the same time
  Then both changes should appear in the shared scene
  And both clients should converge on equivalent active elements
```

---

## P0-COLLAB-008 — Scene remains equivalent after reload

```gherkin
Scenario: Collaborators reload after editing
  Given Alice and Bob completed shared scene changes
  And the changes were persisted
  When both collaborators reload the room
  Then both should see equivalent active scene content
```

---

# 14. Presence and cursors

## P0-PRESENCE-001 — Active collaborator is visible

```gherkin
Feature: Collaborator presence

  Scenario: Second collaborator joins
    Given Alice is already in a room
    When Bob joins the same room
    Then Alice should see Bob as an active collaborator
    And Bob should see Alice as an active collaborator
```

---

## P0-PRESENCE-002 — Remote cursor is visible

```gherkin
Scenario: Collaborator moves the pointer
  Given Alice and Bob are connected to the same room
  When Bob moves the pointer over the canvas
  Then Alice should see Bob's remote cursor
  And the cursor should display Bob's username or an equivalent label
  And the cursor should use Bob's collaborator colour
```

---

## P0-PRESENCE-003 — Cursor leaves after disconnect

```gherkin
Scenario: Collaborator disconnects
  Given Alice can see Bob's remote cursor
  When Bob disconnects from the room
  Then Bob's cursor should disappear after the presence timeout
  And Bob should no longer appear as actively connected
```

---

## P0-PRESENCE-004 — Email is excluded from awareness

```gherkin
Scenario: Presence payload is inspected
  Given Alice is connected to the room
  When Alice's awareness state is read
  Then it may contain Alice's guest ID
  And it may contain Alice's username
  And it may contain Alice's colour
  But it should not contain Alice's email address
```

---

# 15. Infinite canvas and navigation

## P0-CANVAS-001 — Pan in all directions

```gherkin
Feature: Infinite canvas navigation

  Scenario: User pans across the canvas
    Given Alice is viewing an active room
    When Alice pans left, right, upward, and downward
    Then the viewport should move in each direction
    And existing scene elements should retain their world positions
```

---

## P0-CANVAS-002 — Zoom

```gherkin
Scenario: User zooms the canvas
  Given Alice is viewing an active room
  When Alice zooms in
  And Alice zooms out
  Then the viewport zoom should change smoothly
  And the scene should remain usable
```

---

## P0-CANVAS-003 — Negative coordinates

```gherkin
Scenario: User creates an element outside the initial origin area
  Given Alice has panned into a negative-coordinate region
  When Alice creates an element
  Then the element should remain visible in that region
  And it should persist after reload
```

---

## P0-CANVAS-004 — Viewport is local

```gherkin
Scenario: One collaborator changes viewport
  Given Alice and Bob are connected to the same room
  When Alice pans and zooms
  Then Bob's local viewport should not be changed
```

---

## P0-CANVAS-005 — One hundred elements remain usable

```gherkin
Scenario: Room contains at least one hundred ordinary elements
  Given the room contains at least one hundred representative Excalidraw elements
  When Alice pans, zooms, selects, and moves an element
  Then the canvas should remain practically usable
  And the application should not freeze
  And ordinary collaboration should continue
```

---

# 16. Core Excalidraw content

## P0-CONTENT-001 — Rectangle

```gherkin
Feature: Core scene content

  Scenario: Editor creates a rectangle
    Given Alice has edit access
    When Alice uses the rectangle tool
    Then a rectangle should be added to the scene
    And the rectangle should be selectable
    And the rectangle should be movable
```

---

## P0-CONTENT-002 — Ellipse

```gherkin
Scenario: Editor creates an ellipse
  Given Alice has edit access
  When Alice uses the ellipse tool
  Then an ellipse should be added to the scene
```

---

## P0-CONTENT-003 — Line

```gherkin
Scenario: Editor creates a line
  Given Alice has edit access
  When Alice uses the line tool
  Then a line should be added to the scene
```

---

## P0-CONTENT-004 — Arrow

```gherkin
Scenario: Editor creates an arrow
  Given Alice has edit access
  When Alice uses the arrow tool
  Then an arrow should be added to the scene
```

---

## P0-CONTENT-005 — Freehand drawing

```gherkin
Scenario: Editor draws a freehand stroke
  Given Alice has edit access
  When Alice uses the drawing tool
  Then a freehand element should be added to the scene
  And Bob should receive the completed element
```

---

## P0-CONTENT-006 — Text

```gherkin
Scenario: Editor creates and edits text
  Given Alice has edit access
  When Alice creates a text element
  And Alice enters text content
  Then the text should appear in the scene
  And Bob should receive the text content
```

---

# 17. Sticky notes

## P0-STICKY-001 — Sticky note creation

```gherkin
Feature: Sticky notes

  Scenario: Editor creates a sticky note
    Given Alice has edit access
    When Alice selects the sticky-note tool
    And Alice places a sticky note on the canvas
    Then a sticky-note-style object should appear
    And it should contain an editable text area or associated text element
```

---

## P0-STICKY-002 — Sticky note editing

```gherkin
Scenario: Editor edits sticky-note text
  Given Alice and Bob can see the same sticky note
  When Alice edits the sticky-note text
  Then Bob should see the updated content
```

---

## P0-STICKY-003 — Sticky note remains valid after reload

```gherkin
Scenario: Room containing a sticky note is reloaded
  Given the room contains a persisted sticky note
  When Bob reloads the room
  Then the sticky note should appear
  And its text should remain associated with the correct visual object
```

---

## P0-STICKY-004 — Sticky note supports colour variation

```gherkin
Scenario: Editor changes sticky-note colour
  Given Alice created a sticky note
  When Alice selects a supported sticky-note colour
  Then the visual style should update
  And the colour should persist
```

---

# 18. Image objects

## P0-IMAGE-001 — Valid image upload

```gherkin
Feature: Image objects

  Scenario: Editor uploads a valid image
    Given Alice has edit permission
    And Alice selects a supported image file
    When Alice completes the image upload flow
    Then the image should appear on the canvas
    And the image should be associated with a private asset record
```

---

## P0-IMAGE-002 — Image synchronises

```gherkin
Scenario: Uploaded image is shared
  Given Alice and Bob are connected to the same room
  When Alice uploads and places an image
  Then Bob should see the image without reloading
```

---

## P0-IMAGE-003 — Image persists

```gherkin
Scenario: Collaborator reloads a room containing an image
  Given the room contains a successfully uploaded image
  When Bob reloads the room
  Then the image should still appear
  And the image should remain associated with the correct scene element
```

---

## P0-IMAGE-004 — Unsupported image is rejected

```gherkin
Scenario: Editor selects an unsupported file
  Given Alice has edit permission
  When Alice selects a file that is not an allowed image type
  Then the upload should be rejected
  And an actionable error should be displayed
  And no completed image element should be added
```

---

## P0-IMAGE-005 — Failed upload does not appear complete

```gherkin
Scenario: Image upload fails
  Given Alice starts an image upload
  When the upload fails
  Then the asset should not be marked ready
  And the canvas should not present the image as successfully shared
  And Alice should receive retry or failure feedback
```

---

## P0-IMAGE-006 — Asset is private

```gherkin
Scenario: Unauthorised guest requests an image asset
  Given an image belongs to a private room
  And an unauthorised guest does not have room access
  When the unauthorised guest requests the asset
  Then access should be denied
```

---

# 19. Audio recordings

## P0-AUDIO-001 — Microphone permission

```gherkin
Feature: Audio recordings

  Scenario: Editor begins recording
    Given Alice has edit permission
    And the browser supports audio recording
    When Alice selects the audio tool
    Then the application should request microphone permission where required
```

---

## P0-AUDIO-002 — Successful recording

```gherkin
Scenario: Editor records audio
  Given Alice granted microphone permission
  When Alice starts recording
  Then a recording indicator should be visible
  And elapsed recording time should be visible
  When Alice stops recording
  Then the recording should enter an upload or processing state
```

---

## P0-AUDIO-003 — Audio card placement

```gherkin
Scenario: Audio upload completes
  Given Alice completed a valid recording
  When the audio asset becomes ready
  Then an audio card should appear on the canvas
  And the audio card should reference the correct private asset
```

---

## P0-AUDIO-004 — Audio playback

```gherkin
Scenario: Collaborator plays an audio card
  Given Bob has room access
  And the room contains a ready audio card
  When Bob starts playback
  Then the associated recording should play
  And Bob should be able to pause or stop playback
```

---

## P0-AUDIO-005 — Audio synchronises and persists

```gherkin
Scenario: Audio card is shared and reloaded
  Given Alice placed an audio card
  When Bob receives the shared room update
  Then Bob should see the audio card
  When Bob reloads the room
  Then the audio card should remain
  And it should still reference the playable audio asset
```

---

## P0-AUDIO-006 — Microphone denial

```gherkin
Scenario: Editor denies microphone permission
  Given Alice selects the audio tool
  When Alice denies microphone permission
  Then no recording should start
  And Alice should receive actionable permission guidance
  And the canvas should remain usable
```

---

# 20. Standard scene manipulation

## P0-MANIPULATION-001 — Selection

```gherkin
Feature: Scene manipulation

  Scenario: Editor selects an element
    Given the room contains an element
    When Alice selects the element
    Then Excalidraw selection controls should appear
```

---

## P0-MANIPULATION-002 — Multi-selection

```gherkin
Scenario: Editor selects multiple elements
  Given the room contains multiple elements
  When Alice performs a supported multi-selection action
  Then the intended elements should be selected together
```

---

## P0-MANIPULATION-003 — Resize

```gherkin
Scenario: Editor resizes an element
  Given Alice selected a resizable element
  When Alice uses a resize handle
  Then the element dimensions should change
  And the updated dimensions should persist
```

---

## P0-MANIPULATION-004 — Rotation

```gherkin
Scenario: Editor rotates a supported element
  Given Alice selected a rotatable element
  When Alice uses the rotation control
  Then the element rotation should change
  And the updated rotation should persist
```

---

## P0-MANIPULATION-005 — Duplicate

```gherkin
Scenario: Editor duplicates an element
  Given Alice selected an element
  When Alice invokes the supported duplicate action
  Then a new equivalent element should be created
  And the duplicate should have a distinct element ID
```

---

## P0-MANIPULATION-006 — Group

```gherkin
Scenario: Editor groups elements
  Given Alice selected at least two groupable elements
  When Alice invokes the Excalidraw group action
  Then the elements should behave as a group
  And the group relationship should persist
```

---

## P0-MANIPULATION-007 — Ungroup

```gherkin
Scenario: Editor ungroups a group
  Given Alice selected a grouped set of elements
  When Alice invokes the ungroup action
  Then the elements should become independently selectable
  And their visual placement should remain equivalent
```

---

## P0-MANIPULATION-008 — Z-order

```gherkin
Scenario: Editor changes element order
  Given two elements overlap
  When Alice changes their z-order
  Then the overlap should update
  And Bob should see the same order
  And the order should persist after reload
```

---

## P0-MANIPULATION-009 — Undo and redo

```gherkin
Scenario: Editor undoes and redoes a supported action
  Given Alice completed an undoable scene action
  When Alice invokes undo
  Then the local scene should reflect the undone state according to the collaboration policy
  When Alice invokes redo
  Then the action should be restored where supported
```

The exact collaborative undo policy must be documented before implementation.

---

# 21. Responsive behaviour

## P0-RESPONSIVE-001 — Desktop authoring

```gherkin
Feature: Responsive interface

  Scenario: User opens the application on a supported desktop viewport
    Given the application is loaded on a desktop-sized viewport
    Then the primary Excalidraw canvas should be usable
    And required P0 tools should be accessible
    And product controls should not obscure the primary interaction area
```

---

## P0-RESPONSIVE-002 — Tablet usability

```gherkin
Scenario: User opens the application on a tablet-sized viewport
  Given the application is loaded on a tablet-sized viewport
  Then the canvas should remain navigable
  And essential room controls should remain accessible
  And major editing tools should remain available where supported
```

---

## P0-RESPONSIVE-003 — Mobile viewing

```gherkin
Scenario: Viewer opens the room on a mobile-sized viewport
  Given Charlie has viewer access
  When Charlie opens the room on a mobile-sized viewport
  Then Charlie should be able to view the scene
  And Charlie should be able to pan
  And Charlie should be able to zoom
  And the interface should not require desktop-only dimensions
```

---

# 22. Connection state

## P0-CONNECTION-001 — Connected state

```gherkin
Feature: Connection feedback

  Scenario: Collaboration connection succeeds
    Given Alice opens an active room
    When the collaboration connection is established
    Then a connected state should be available to the user
```

---

## P0-CONNECTION-002 — Reconnecting state

```gherkin
Scenario: Connection is temporarily interrupted
  Given Alice was connected to a room
  When the collaboration connection is interrupted
  Then the application should show a reconnecting state
  And the canvas should not crash
```

---

## P0-CONNECTION-003 — Offline state

```gherkin
Scenario: Browser becomes offline
  Given Alice has opened the room before
  When the browser loses network connectivity
  Then the application should show an offline state
  And the cached scene should remain visible
```

---

## P0-CONNECTION-004 — Access-denied state

```gherkin
Scenario: Guest no longer has room access
  Given Alice's room access has been revoked
  When Alice reconnects
  Then the application should show an access-denied state
  And unauthorised shared updates should not be accepted
```

---

# 23. Offline support

## MVP-D-OFFLINE-001 — Previously opened room loads offline

```gherkin
Feature: Offline room access

  Scenario: Guest opens a cached room without connectivity
    Given Alice previously opened the room successfully
    And the room data was cached
    And the browser is offline
    When Alice opens the room
    Then the cached scene should load
    And the application should show an offline state
```

---

## MVP-D-OFFLINE-002 — Uncached room is unavailable offline

```gherkin
Scenario: Guest opens an uncached room without connectivity
  Given Alice never opened the requested room on the device
  And the browser is offline
  When Alice opens the room link
  Then the application should explain that the room is unavailable offline
  And the application should not display an empty replacement scene as the real room
```

---

## MVP-D-OFFLINE-003 — Offline scene changes are preserved locally

```gherkin
Scenario: Editor modifies a cached room offline
  Given Alice has a cached room
  And Alice had editor permission when last connected
  And the browser is offline
  When Alice creates or modifies an eligible element
  Then the local scene should update
  And the local change should be preserved on the device
```

---

## MVP-D-OFFLINE-004 — Offline changes reconcile

```gherkin
Scenario: Editor reconnects after offline editing
  Given Alice changed a cached room while offline
  And Alice still has editor permission
  When network connectivity returns
  Then the application should reconnect automatically
  And eligible local changes should reconcile with the shared room
  And remote changes should be received
```

---

## MVP-D-OFFLINE-005 — Permission revocation preserves local draft

```gherkin
Scenario: Editor loses permission while offline
  Given Alice edited a cached room while offline
  And Alice's role was changed to viewer before reconnection
  When Alice reconnects
  Then the server should reject unauthorised shared edits
  And the shared room should remain protected
  And Alice's local draft should be preserved where feasible
  And Alice should receive a recovery or JSON export option
```

---

## MVP-D-OFFLINE-006 — Offline upload is queued or blocked honestly

```gherkin
Scenario: Editor attempts an asset upload offline
  Given Alice is offline
  When Alice attempts to add an image or audio asset
  Then the application should queue the upload where supported
  Or the application should clearly explain that the upload cannot complete
  And the asset should not appear as successfully shared
```

---

# 24. Mini-map

## P1-MINIMAP-001 — Scene overview

```gherkin
Feature: Mini-map

  Scenario: Room contains elements across distant regions
    Given the room contains elements in multiple distant canvas regions
    When Alice opens the mini-map
    Then the mini-map should show the approximate occupied canvas bounds
    And Alice's current viewport should be indicated
```

---

## P1-MINIMAP-002 — Mini-map navigation

```gherkin
Scenario: User navigates using the mini-map
  Given a distant occupied region is visible in the mini-map
  When Alice selects that region
  Then Alice's local viewport should move to the corresponding canvas region
  And Bob's viewport should remain unchanged
```

---

## P1-MINIMAP-003 — Collaborator positions

```gherkin
Scenario: Collaborators are in distant regions
  Given Alice and Bob are viewing different canvas regions
  When Alice views the mini-map
  Then Bob's approximate position may be indicated
  And Bob's private email should not be displayed
```

---

# 25. Collaborator radar

## P1-RADAR-001 — Off-screen collaborator indicator

```gherkin
Feature: Collaborator radar

  Scenario: Collaborator is outside the viewport
    Given Bob is connected to the room
    And Bob's viewport is outside Alice's visible region
    When Alice views the canvas
    Then Alice should see a radar indicator for Bob
    And the indicator should communicate Bob's approximate direction
```

---

## P1-RADAR-002 — Radar navigation

```gherkin
Scenario: User selects an off-screen collaborator indicator
  Given Bob appears in Alice's radar
  When Alice selects Bob's radar indicator
  Then Alice's viewport should move towards Bob's approximate location
  And Bob's viewport should not change
```

---

# 26. Physics

## P1-PHYSICS-001 — Physics mode activation

```gherkin
Feature: Physics interactions

  Scenario: Editor activates physics mode
    Given Alice has edit permission
    When Alice activates physics mode
    Then eligible scene elements should become available for physics interaction
    And ordinary unsupported elements should remain stable
```

---

## P1-PHYSICS-002 — Throw an element

```gherkin
Scenario: Editor throws an eligible element
  Given Alice activated physics mode
  And a physics-eligible element is visible
  When Alice drags and releases the element with velocity
  Then the element should continue moving briefly
  And the final valid Excalidraw position should be committed
```

---

## P1-PHYSICS-003 — Physics result synchronises

```gherkin
Scenario: Collaborator observes a thrown element
  Given Alice and Bob are connected to the same room
  And Alice owns the active physics interaction
  When Alice throws an eligible element
  Then Bob should observe the element's shared movement or updated positions
  And both clients should converge on the final position
```

---

## P1-PHYSICS-004 — Eligible elements collide

```gherkin
Scenario: Moving element reaches another eligible element
  Given physics mode is active
  And two collision-enabled elements are positioned in the movement path
  When one element moves into the other
  Then a collision response should occur
  And the resulting positions should remain valid Excalidraw element positions
```

---

## P1-PHYSICS-005 — Sticky note remains non-colliding

```gherkin
Scenario: Moving object reaches a non-colliding sticky note
  Given sticky notes are configured as non-colliding
  When a moving physics element reaches the sticky note
  Then the sticky note should remain stable
  And the physics system should not corrupt the sticky-note composition
```

---

## P1-PHYSICS-006 — Single interaction owner

```gherkin
Scenario: Two users attempt to control the same physics element
  Given Alice currently owns the interaction lease
  When Bob attempts to control the same element
  Then Bob should not become a competing simulation owner
  And Alice's valid lease should remain authoritative until release or expiry
```

---

## P1-PHYSICS-007 — Lease expires after disconnect

```gherkin
Scenario: Physics owner disconnects
  Given Alice owns the physics interaction lease
  When Alice disconnects unexpectedly
  Then the lease should expire automatically
  And the element should become interactable again
```

---

# 27. Recycle bin

## P1-RECYCLE-001 — Deleted element is preserved

```gherkin
Feature: Recycle bin

  Scenario: Editor deletes a supported element
    Given Alice has edit permission
    And the room contains an active element
    When Alice deletes the element
    Then the element should leave the active scene
    And a recoverable deleted record should be preserved
```

---

## P1-RECYCLE-002 — Deleted custom metadata is preserved

```gherkin
Scenario: Editor deletes an audio card
  Given the room contains an audio card with custom metadata
  When Alice deletes the audio card
  Then the active scene should no longer display it
  And its recoverable metadata should remain associated with the deleted record
```

---

## P1-RECYCLE-003 — Restore deleted element

```gherkin
Scenario: Owner restores a deleted element
  Given an element exists in the recycle bin
  When Alice restores the element
  Then the element should return to the active scene
  And its important visual properties should be restored
  And associated assets should remain connected where available
```

---

## P1-RECYCLE-004 — Delete wins over concurrent edit

```gherkin
Scenario: One collaborator deletes while another edits
  Given Alice and Bob can see the same element
  When Alice deletes the element
  And Bob edits the element concurrently
  Then the element should not remain active
  And the recoverable deleted state should preserve relevant data where feasible
```

---

# 28. Room archive

## P1-ARCHIVE-001 — Owner archives room

```gherkin
Feature: Room archive

  Scenario: Owner archives an active room
    Given Alice owns an active room
    When Alice archives the room
    Then the room should be marked archived
    And ordinary editing should become unavailable
    And the scene and assets should remain preserved
```

---

## P1-ARCHIVE-002 — Editor cannot archive room

```gherkin
Scenario: Editor attempts to archive
  Given Bob has editor access
  When Bob attempts to archive the room
  Then the request should be rejected
  And the room should remain active
```

---

## P1-ARCHIVE-003 — Owner restores room

```gherkin
Scenario: Owner restores an archived room
  Given Alice owns an archived room
  When Alice restores the room
  Then the room should become active
  And authorised collaborators should be able to reconnect
  And the previous scene should remain available
```

---

# 29. Export

## P1-EXPORT-001 — PNG export

```gherkin
Feature: Room export

  Scenario: Authorised user exports the active scene as PNG
    Given the room contains active Excalidraw elements
    When Alice requests PNG export
    Then a PNG representation should be generated
    And active scene content should be included
```

---

## P1-EXPORT-002 — JSON export

```gherkin
Scenario: Authorised user exports room data as JSON
  Given the room contains Excalidraw elements and product metadata
  When Alice requests JSON export
  Then the export should contain the supported scene data
  And the export should include a schema version
  And the export should include supported custom metadata
```

---

## P1-EXPORT-003 — Export excludes private data

```gherkin
Scenario: JSON export is inspected
  Given Alice exported the room as JSON
  When the export contents are inspected
  Then guest email addresses should not be present
  And session tokens should not be present
  And private signed asset URLs should not be present
  And internal credentials should not be present
```

---

# 30. Replay

## P2-REPLAY-001 — Replay session history

```gherkin
Feature: Time-travel replay

  Scenario: User starts replay
    Given the room contains recorded replay events
    When Alice enters replay mode
    Then the application should present supported scene changes in chronological order
    And the durable active room should not be modified by playback
```

---

## P2-REPLAY-002 — Physics replay uses meaningful states

```gherkin
Scenario: Replay contains a physics throw
  Given a physics interaction was recorded
  When the replay reaches the interaction
  Then the replay should show a meaningful representation of the throw
  And it should not require every original simulation frame
```

---

# 31. Attraction and repulsion

## P2-PHYSICS-ATTRACTION-001 — Attraction

```gherkin
Scenario: Attraction is applied to eligible elements
  Given physics attraction is enabled
  When Alice activates attraction between eligible elements
  Then the elements should move towards each other
  And final valid Excalidraw positions should be committed
```

---

## P2-PHYSICS-REPULSION-001 — Repulsion

```gherkin
Scenario: Repulsion is applied to eligible elements
  Given physics repulsion is enabled
  When Alice activates repulsion between eligible elements
  Then the elements should move apart
  And final valid Excalidraw positions should be committed
```

---

# 32. SVG export

## P2-EXPORT-SVG-001 — SVG export

```gherkin
Scenario: Authorised user exports active scene as SVG
  Given the scene contains supported Excalidraw elements
  When Alice requests SVG export
  Then an SVG representation should be generated
  And unsupported custom overlays should be handled honestly
```

---

# 33. Error handling

## P0-ERROR-001 — Collaboration failure

```gherkin
Feature: Error handling

  Scenario: Collaboration service becomes unavailable
    Given Alice is using an active room
    When the collaboration connection fails
    Then the application should show a reconnecting or offline state
    And the canvas should remain usable where local state permits
```

---

## P0-ERROR-002 — Persistence failure

```gherkin
Scenario: Scene persistence fails
  Given Alice made a valid scene change
  When the persistence operation fails
  Then the application should not falsely claim durable success
  And the failure should be logged
  And the local scene should remain recoverable where feasible
```

---

## P0-ERROR-003 — Product extension failure

```gherkin
Scenario: Custom product extension fails
  Given the Excalidraw scene is active
  When a custom extension such as audio, radar, or physics encounters an error
  Then the ordinary Excalidraw canvas should remain usable where possible
  And the user should receive actionable feedback
```

---

## P0-ERROR-004 — Invalid scene data

```gherkin
Scenario: Persisted room contains invalid custom metadata
  Given the room's Excalidraw elements remain valid
  And some custom metadata is malformed
  When the room loads
  Then the application should avoid crashing the complete canvas
  And invalid custom metadata should be ignored, quarantined, or reported safely
```

---

# 34. Accessibility

## P0-ACCESSIBILITY-001 — Product controls are keyboard accessible

```gherkin
Feature: Accessibility

  Scenario: Keyboard user navigates application-owned controls
    Given Alice is using a keyboard
    When Alice moves through room controls
    Then interactive controls should receive visible focus
    And controls should have accessible labels
```

---

## P0-ACCESSIBILITY-002 — Connection state is not colour-only

```gherkin
Scenario: User receives connection feedback
  Given the connection state changes
  When the state is displayed
  Then the state should be communicated through text or an accessible label
  And colour should not be the only indicator
```

---

## P1-ACCESSIBILITY-003 — Reduced motion

```gherkin
Scenario: User prefers reduced motion
  Given the operating system requests reduced motion
  When the application performs radar navigation or physics effects
  Then non-essential animation should be reduced where practical
```

---

# 35. Privacy and security

## P0-SECURITY-001 — Private email exclusion

```gherkin
Feature: Privacy and security

  Scenario: Public room state is inspected
    Given multiple guests use the same room
    When scene data, presence data, and exports are inspected
    Then guest emails should not appear in public collaboration state
```

---

## P0-SECURITY-002 — Client role is not authoritative

```gherkin
Scenario: Client changes its local role value
  Given Charlie has viewer permission
  When Charlie modifies the browser's local state to claim editor access
  Then the server should continue treating Charlie as a viewer
  And unauthorised modifications should be rejected
```

---

## P0-SECURITY-003 — Unsafe upload is rejected

```gherkin
Scenario: Editor attempts an unsupported upload
  Given Alice has edit permission
  When Alice submits an unsupported or invalid file
  Then the file should be rejected
  And no ready asset should be created
```

---

## P1-ARCHIVE-005 — Archived room update is rejected

This security scenario is required when the optional P1 room-archive capability is implemented.

```gherkin
Scenario: Client sends an update to an archived room
  Given the room is archived
  When an existing or modified client sends a scene update
  Then the update should be rejected
  And the archived scene should remain protected
```

---

# 36. TDD acceptance gates

The core and protected offline requirements below are release-blocking. Tests for P1 and P2 capabilities are required when those capabilities are implemented, but they do not block the MVP release while the capability remains out of scope.

## 36.1 Strict TDD targets

The following areas require a failing test before implementation where practical:

- Guest identity validation
- Permission checks
- Room lifecycle
- Scene serialisation adapters
- Custom object metadata
- Asset-state transitions
- Offline access rules
- Conflict-policy helpers
- Recycle-bin transformations
- Physics lease logic
- Export privacy filtering

---

## 36.2 Integration-test targets

Integration tests must cover:

- Room creation and persistence
- Owner membership creation
- Viewer enforcement
- Scene persistence
- Two-client collaboration
- Product metadata persistence
- Asset authorisation
- Archived-room rejection
- Offline reconciliation boundaries
- Physics ownership boundaries

---

## 36.3 Do not duplicate Excalidraw's internal suite

The project should not spend MVP time proving internal Excalidraw behaviour such as:

- Whether Excalidraw can draw a rectangle in isolation
- Whether its native resize handles work internally
- Whether its internal undo stack exists
- Whether its own export utility handles ordinary supported elements

The project should test that those capabilities work correctly within this application’s integration and product workflows.

---

# 37. QA-Intel acceptance suite

QA-Intel should independently validate a focused set of high-value workflows.

QA-001 through QA-005 are mandatory release evidence. QA-006 and QA-007 are conditional evidence for the corresponding P1 capabilities.

## QA-001 — Create, join, synchronise, and persist

```gherkin
Feature: Core collaborative room

  Scenario: Rectangle synchronises and persists
    Given Alice creates a room
    And Bob joins as an editor
    When Alice creates a rectangle
    Then Bob should see the rectangle
    When Bob moves the rectangle
    Then Alice should see its final position
    When both users reload the room
    Then both users should still see the rectangle in the final position
```

---

## QA-002 — Viewer permission enforcement

```gherkin
Scenario: Viewer cannot modify the scene
  Given Alice owns a room
  And Charlie joins as a viewer
  When Charlie attempts to create an element
  Then no shared element should be created
  And Charlie should receive permission feedback
  And Alice's scene should remain unchanged
```

---

## QA-003 — Image sharing

```gherkin
Scenario: Image uploads, synchronises, and persists
  Given Alice and Bob are connected as editors
  When Alice uploads a supported image
  Then Bob should see the image
  When Bob reloads the room
  Then the image should remain visible
```

---

## QA-004 — Audio object

```gherkin
Scenario: Audio card is created and played
  Given Alice has microphone permission
  When Alice records and places an audio card
  Then Bob should see the audio card
  And Bob should be able to play the recording
```

---

## QA-005 — Offline reconciliation

```gherkin
Scenario: Cached offline edit synchronises after reconnection
  Given Alice previously opened the room
  And Alice disconnects
  When Alice creates an eligible element offline
  And Alice reconnects with editor permission
  Then Bob should receive the new element
```

---

## QA-006 — Physics interaction

```gherkin
Scenario: Thrown element reaches the same final state
  Given Alice and Bob are connected as editors
  And physics mode is enabled
  When Alice throws an eligible rectangle
  Then Bob should observe the interaction
  And both clients should converge on the same final rectangle position
```

---

## QA-007 — Archive protection

```gherkin
Scenario: Archived room rejects editing
  Given Alice archives the room
  When Bob attempts to modify the scene
  Then the update should be rejected
  And the archived scene should remain unchanged
```

---

# 38. QA-Intel evidence requirements

For critical scenarios, QA-Intel should collect:

- Pass or fail result
- Browser screenshots
- Playwright trace
- Console errors
- Network failures
- Relevant application diagnostic state
- Stable scene inspection output
- Likely failure explanation
- Suggested next investigation step

Canvas assertions should use stable test hooks rather than screenshots alone.

---

# 39. Testability hooks

The application should expose a non-production inspection interface.

Example:

```ts
interface CanvasTestApi {
  getSceneElements(): Array<{
    id: string;
    type: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    angle?: number;
  }>;

  getCustomObjects(): unknown[];

  getSelectedElementIds(): string[];

  getViewport(): {
    scrollX: number;
    scrollY: number;
    zoom: number;
  };

  getConnectionState():
    | "connected"
    | "reconnecting"
    | "offline"
    | "denied"
    | "archived";

  getCollaborators(): Array<{
    guestId: string;
    username: string;
    colour: string;
  }>;

  getRoomRole(): "owner" | "editor" | "viewer";
}
```

Requirements:

- Must not be enabled in production.
- Must not expose guest email.
- Must not expose tokens.
- Should be read-only.
- Must return serialisable values.
- Must not bypass server permissions.
- Should use stable property names.

---

# 40. Performance acceptance

## P0-PERFORMANCE-001 — Representative scene

```gherkin
Feature: Performance

  Scenario: User interacts with a room containing one hundred elements
    Given the room contains at least one hundred representative elements
    And at least two collaborators are connected
    When Alice pans, zooms, selects, and moves an element
    Then the application should remain responsive enough for demonstration
    And the browser should not freeze
    And collaboration should continue
```

---

## P1-PERFORMANCE-002 — Physics update throttling

```gherkin
Scenario: Physics element is moving
  Given an eligible element is under physics simulation
  When movement updates are published
  Then updates should be throttled or batched
  And the collaboration channel should remain usable
```

---

## P1-PERFORMANCE-003 — Presence does not persist as scene history

```gherkin
Scenario: Collaborators move cursors continuously
  Given multiple collaborators are active
  When cursor positions update
  Then presence traffic should not create durable Excalidraw elements
  And ordinary cursor movement should not unnecessarily expand persisted scene history
```

---

# 41. Browser support acceptance

The MVP should be tested in at least:

- Current Chromium-based desktop browser
- Current Firefox desktop browser where time permits
- Current Safari desktop browser where time permits

The primary supported hackathon path may target Chromium first, but known limitations in other browsers must be disclosed.

Browser-specific media limitations must not be presented as universal support.

---

# 42. MVP release gate

The MVP may be presented as complete only when all of the following are true:

## Product

- Guest identity works.
- Room creation works.
- Share-link joining works.
- Excalidraw loads as the primary canvas.
- Two editors can collaborate.
- Scene state persists.
- Required content types are demonstrated.
- Image upload works.
- Audio recording works.
- Viewer permissions are enforced.
- The interface is usable on the target desktop viewport.
- Connection feedback is visible.
- A previously opened room opens from its local cache while offline.
- Eligible offline scene edits reconcile after reconnection.
- Rejected offline work remains recoverable locally.

## Engineering

- Critical TDD tests pass.
- Integration tests pass.
- The main collaboration E2E test passes.
- No known P0 data-loss defect remains.
- No known P0 permission bypass remains.
- Guest emails are absent from public collaboration state.
- The pinned Excalidraw version is documented.
- Reconnection revalidates the current room state and membership before publishing offline changes.

## QA

- QA-Intel validates the core room workflow.
- QA-Intel validates viewer restriction.
- QA-Intel validates authorised offline reconciliation.
- QA-Intel validates recovery after an offline permission rejection.
- Test evidence is available.
- Known failures are recorded honestly.

## Demonstration

The team can perform this sequence reliably:

```text
Enter as guest
→ Create room
→ Invite editor
→ Collaborate on Excalidraw scene
→ Add image
→ Add audio
→ Demonstrate permission restriction
→ Reload and restore scene
→ Edit the cached room offline
→ Reconnect and reconcile authorised work
→ Show that rejected offline work remains recoverable
```

---

# 43. P1 release gate

P1 may be considered complete when:

- One physics throw works reliably.
- Collision works for the selected eligible objects.
- Mini-map or collaborator radar is functional.
- Recycle-bin restore works.
- Room archive and restore work.
- JSON or PNG export works.
- QA-Intel validates every P1 capability claimed as complete.

---

# 44. Scope-reduction order

If delivery time becomes constrained, remove or reduce work in this order:

1. Advanced visual polish
2. SVG export
3. Replay
4. Attraction
5. Repulsion
6. Advanced physics controls
7. Advanced radar animation
8. Advanced mini-map detail
9. Offline asset upload recovery
10. Recycle-bin UI sophistication

Do not remove:

- Guest identity
- Room creation
- Share-link joining
- Real-time collaboration
- Persistence
- Permission enforcement
- Required object types
- Connection feedback
- Critical testing
- QA-Intel release validation
- Previously opened room offline recovery
- Permission revalidation before offline reconciliation
- Recoverable rejected local drafts

---

# 45. Final acceptance statement

The MVP is accepted when the product demonstrates a reliable, persistent, permission-aware, collaborative Excalidraw room and extends it with the required mixed-media experience.

The product must prove more than a local Excalidraw embed.

It must demonstrate:

- Application-owned rooms
- Private guest identity handling
- Real-time multi-user scene convergence
- Durable room state
- Server-enforced permissions
- Image and audio support
- Honest offline behaviour
- Independent validation through QA-Intel

All optional innovation must remain subordinate to this core.

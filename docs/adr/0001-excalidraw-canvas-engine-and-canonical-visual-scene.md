# ADR 0001: Excalidraw as the Canvas Engine and Canonical Visual Scene

**Status:** Accepted

**Date:** 2026-07-25

**Decision scope:** Existing accepted architecture

> This ADR records an existing decision. It does not introduce a new renderer, scene model, product capability, or Excalidraw integration contract.

---

# 1. Context

The product requires an infinite canvas with mature drawing, selection, text, transformation, grouping, navigation, image, undo, and export behaviour. The architecture initially considered a custom canvas layer, but accepted Excalidraw as the product's drawing and interaction foundation.

The application still owns rooms, identity, permissions, collaboration policy, assets, offline recovery, and product extensions. Without a strict boundary, those concerns could produce a second permanent scene representation that drifts from Excalidraw or couple feature code to unstable Excalidraw internals.

---

# 2. Decision

Excalidraw is the sole canvas rendering and editing engine. The Excalidraw scene is the canonical visual representation of the room.

All product interaction with Excalidraw passes through the application-owned adapter or controller boundary. That boundary:

- Uses supported public Excalidraw APIs.
- Owns scene loading, normalisation, diffing, remote application, asset mapping, callback suppression, and compatibility.
- Pins the Excalidraw dependency to an explicit version.
- Isolates version-specific behaviour and upgrade work.
- Maps product extensions back into valid Excalidraw elements and transforms.

The normal scene flow is:

```text
Local user action
→ Excalidraw updates the visual scene
→ Adapter classifies and diffs the durable change
→ Collaboration publishes the relevant shared update

Remote collaborative update
→ Adapter reconstructs and validates the visual scene
→ Excalidraw applies the remote result
→ Adapter suppresses duplicate publication
```

React component state and Zustand may own local interface concerns, but neither may own a complete editable scene copy. PostgreSQL may persist encoded collaboration state, but it must not become a separately editable table of live visual elements. Test and diagnostic projections must derive from the canonical scene and remain read-only and disposable.

Matter.js physics, mini-map calculations, radar calculations, DOM overlays, and test inspection are temporary projections. Matter.js remains conditional P1; when enabled, its final result is committed as ordinary Excalidraw element transforms and its simulation state is discarded.

---

# 3. Consequences

## 3.1 Benefits

- The product reuses mature canvas interaction rather than rebuilding it.
- One visual format governs rendering, persistence reconstruction, collaboration, and export.
- The adapter contains integration risk and makes dependency upgrades reviewable.
- Product extensions cannot silently become competing canvas engines.

## 3.2 Costs and trade-offs

- The adapter must handle Excalidraw compatibility, callback-loop prevention, and deterministic normalisation.
- Product features must work within supported Excalidraw composition and overlay boundaries.
- Excalidraw upgrades require deliberate regression and migration review.
- Unsupported integration needs must be documented as risks rather than solved through an untracked fork.

## 3.3 Conditional P1 consequences

Physics, mini-map, radar, recycle-bin views, archive views, and general export remain conditional P1 capabilities. Their implementation must preserve the canonical-scene boundary, but their absence does not block the MVP release.

---

# 4. Alternatives already considered

## 4.1 Custom canvas or renderer

Rejected because it would recreate low-level drawing and interaction behaviour, exceed the two-day MVP boundary, and conflict with the accepted Excalidraw foundation.

## 4.2 Forking Excalidraw or relying on private internals

Rejected for the MVP because it creates upgrade risk, bypasses supported integration paths, and makes product behaviour depend on unstable implementation details.

## 4.3 A second permanent scene in React, Zustand, PostgreSQL, or tests

Rejected because two independently editable visual representations can diverge and make ownership, persistence, and collaboration ambiguous.

## 4.4 Scattered direct Excalidraw access or floating dependency versions

Rejected because feature modules would become coupled to version-specific behaviour and upgrades could change scene or callback semantics without a controlled compatibility boundary.

---

# 5. Implementation constraints

- No custom renderer, Excalidraw replacement, or complete duplicate scene model may be introduced.
- Only the adapter or controller boundary may manipulate the Excalidraw imperative API.
- Durable shared changes must be distinguished from local selection, viewport, toolbar, dialog, cursor, and other transient app state.
- Remote application must use transaction origins, explicit suppression state, and scene comparison; timing delays alone are insufficient.
- Excalidraw version upgrades require adapter, representative scene, collaboration, asset, export, and manual interaction verification.
- Product metadata must reference stable room, element, or asset identities and must not turn into an independent visual database.
- Public APIs, persistence schemas, and detailed adapter interfaces remain defined by the accepted architecture documents.

---

# 6. Failure and security considerations

- Invalid or incompatible scene data must produce a recoverable load failure; it must not be replaced silently with an authentic-looking empty room.
- Failure in an optional overlay or extension must leave ordinary Excalidraw editing available where safe.
- Remote-update failure must not create a publication loop or duplicate history.
- Scene, export, recovery, and test projections must exclude guest email, credentials, tokens, Awareness, temporary signed URLs, and private infrastructure details.
- A missing asset preserves the valid scene object and shows an unavailable state rather than deleting or replacing the room.

---

# 7. Verification and definition of done

This decision is satisfied when:

- Excalidraw is the only canvas renderer and editor.
- The dependency is pinned and all direct integration is contained by the adapter or controller.
- No complete scene is copied into React state, Zustand, PostgreSQL tables, or a test-only model.
- Local and remote updates apply once without callback loops.
- Scene reconstruction, assets, product metadata, and privacy filtering survive reload.
- Temporary projections are derived, disposable, and unable to become durable authority.
- Any enabled physics result becomes ordinary Excalidraw transforms.
- Adapter unit, integration, browser, and applicable QA-Intel checks pass.

---

# 8. Authoritative sources

- [Canvas Interaction Specification](../product/03-canvas-interaction-specification.md)
- [System Architecture](../architecture/01-system-architecture.md)
- [Excalidraw Integration Design](../architecture/05-excalidraw-integration-design.md)
- [Frontend Architecture](../architecture/06-frontend-architecture.md)

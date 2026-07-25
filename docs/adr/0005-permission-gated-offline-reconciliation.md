# ADR 0005: Permission-Gated Offline Reconciliation

**Status:** Accepted

**Date:** 2026-07-25

**Decision scope:** Existing accepted architecture

> This ADR records an existing protected offline-recovery decision from accepted architecture. It does not define new IndexedDB records, Yjs structures, recovery formats, APIs, or general export scope.

---

# 1. Context

Offline recovery for a previously opened room is the protected MVP differentiator. The product must preserve eligible local Excalidraw work while disconnected without allowing stale membership or role information to publish unauthorised updates after reconnection.

A local candidate document can contain valuable work even when the user no longer has write permission or the server no longer supports its schema. Protecting the shared room must not silently destroy that local effort.

---

# 2. Decision

Yjs and IndexedDB preserve the local collaborative candidate, but they never grant server authority.

Offline reopening is available only for a previously opened room whose compatible room metadata and collaborative state exist in the current browser profile. The UI distinguishes cached local preservation from confirmed remote synchronisation and treats the last-known role as advisory.

Every reconnection follows this gate before writable publication:

```text
Connectivity appears available
→ Keep the local candidate detached from writable collaboration
→ Validate the current guest session
→ Validate the current room state
→ Validate current membership and role
→ Choose the authorised or rejected path
```

For an authorised owner or editor:

```text
Establish authenticated writable collaboration
→ Attach the candidate through the supported Yjs provider path
→ Exchange local and remote updates
→ Apply accepted conflict and normalisation policy
→ Reconstruct the Excalidraw scene
→ Confirm synchronisation
→ Clear the local-only indicator
```

For a viewer, denied user, unavailable room, or incompatible document:

```text
Do not attach the candidate to writable collaboration
→ Freeze and snapshot the candidate
→ Store an isolated rejected draft in IndexedDB
→ Load current authorised remote state separately when allowed
→ Enter read-only or access-denied UI
→ Keep a persistent recovery notice
→ Require explicit confirmation before discard
```

At least one privacy-filtered recovery-only JSON download is mandatory. It contains only the valid local scene and product metadata needed for recovery. It is not the conditional P1 general room-export capability.

New offline image or audio binaries are queued only when the browser can preserve them reliably. Otherwise, the operation is blocked with actionable feedback. No local binary appears ready or shared before current upload authorisation and server completion.

---

# 3. Consequences

## 3.1 Benefits

- Current server permission protects the shared room after disconnection.
- Eligible authorised work converges through the normal Yjs path.
- Permission revocation does not silently destroy local user effort.
- The user can distinguish device-local preservation from remote durability.
- Recovery remains possible without introducing a second canvas scene model.

## 3.2 Costs and trade-offs

- Reconnection needs an explicit state machine and separate candidate and authorised documents on rejection.
- Recovery artifacts require IndexedDB lifecycle, privacy filtering, and user-facing management.
- Offline access is limited by browser storage, schema compatibility, and the current device/profile.
- Record-level conflict convergence cannot preserve every simultaneous intention.

## 3.3 Scope consequences

Authorised reconciliation and permission-revoked recovery are mandatory release evidence. Physics leases, archive behaviour, recycle-bin recovery, advanced offline asset handling, and general export remain conditional P1 or later scope.

---

# 4. Alternatives already considered

## 4.1 Attach or merge first, then validate permission

Rejected because unauthorised local updates could enter the shared room before the server denies access.

## 4.2 Treat the last-known local role as current authority

Rejected because cached role and room metadata can be stale or modified while disconnected.

## 4.3 Discard denied or incompatible local work

Rejected because permission integrity does not require silent data loss. The candidate can remain isolated and recoverable without changing the room.

## 4.4 Automatically reconnect a rejected draft later

Rejected because a rejected candidate must not bypass the validation decision through a later provider lifecycle or another tab.

## 4.5 Present a missing, corrupt, or incompatible cache as an empty room

Rejected because an authentic-looking empty room would create a false recovery result and risk overwriting valid remote state.

## 4.6 Make rejected-draft recovery depend on general room export

Rejected because recovery-only JSON is mandatory protected scope, while general JSON and PNG export remain conditional P1.

---

# 5. Implementation constraints

- `navigator.onLine` is a hint only; connection state combines API reachability, Hocuspocus state, Yjs synchronisation, IndexedDB readiness, and recent validation.
- Unsynchronised changes cannot reach a writable provider while current access is unknown.
- The authorised remote document and rejected local candidate remain separate after denial.
- Rejected drafts remain room-scoped, are never auto-published, and persist until recovered or explicitly discarded.
- Recovery output uses an allowlist and excludes private and ephemeral data.
- An uncached room cannot be opened offline as an empty replacement.
- Schema incompatibility preserves recoverable state and prevents publication.
- Offline administrative actions and shared physics lease acquisition remain disabled because they require current server authority.
- Detailed IndexedDB records, Yjs schema, conflict rules, and UI interfaces remain defined in the accepted source documents.

---

# 6. Failure and security considerations

- Revalidation failure keeps the candidate detached and reports that remote synchronisation is not confirmed.
- Permission downgrade or revocation preserves the candidate locally and leaves the shared room unchanged.
- IndexedDB quota, corruption, or unavailable persistence removes any claim that local work is safely stored.
- Schema migration failure preserves the candidate and never returns a false empty scene.
- Recovery output excludes guest email, session and share tokens, Awareness, signed URLs, storage keys, credentials, and internal diagnostics.
- New offline assets remain pending and local or are blocked honestly; permission loss prevents upload to the room.
- Browser troubleshooting preserves rejected drafts before any destructive cache reset.

---

# 7. Verification and definition of done

This decision is satisfied when:

- A previously opened compatible room loads from IndexedDB while offline.
- An uncached or incompatible room never appears as a valid empty room.
- Eligible local Excalidraw edits persist with a visible local-only state.
- Current session, room, membership, and role are validated before writable attachment.
- Authorised candidate updates converge with a separate online client.
- A revoked or denied candidate never enters shared state.
- Current authorised remote state loads separately after rejection.
- The rejected draft remains recoverable and requires explicit discard.
- Recovery output passes direct privacy inspection.
- Offline asset, cache, quota, network, and schema failures report honest state.
- Mandatory integration, multi-client browser, and QA-Intel offline scenarios pass.

---

# 8. Authoritative sources

- [MVP Scope and Acceptance Criteria](../product/02-mvp-scope-and-acceptance-criteria.md)
- [Collaboration and Synchronisation Design](../architecture/02-collaboration-and-sync-design.md)
- [Data Model and Persistence](../architecture/03-data-model-and-persistence.md)
- [Offline Sync and Recovery](../architecture/09-offline-sync-and-recovery.md)
- [Security, Permission, and Privacy Architecture](../architecture/10-security-permission-and-privacy-architecture.md)
- [Testing and Quality Strategy](../architecture/11-testing-and-quality-strategy.md)

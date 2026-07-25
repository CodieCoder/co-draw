# ADR 0004: Server-Authoritative Permissions and Private Guest Identity

**Status:** Accepted

**Date:** 2026-07-25

**Decision scope:** Existing accepted architecture

> This ADR records an existing trust, permission, and privacy decision from accepted architecture. It does not select a new guest-session transport, permission model, API contract, or collaboration protocol.

---

# 1. Context

The browser renders the room, retains a guest credential, caches offline state, and exposes permission-aware controls. Those capabilities do not make it a trusted authority. A modified client can claim another role, bypass view-mode controls, publish invalid Awareness, or attempt to access another room's assets.

Guest entry requires username and email. The email is unverified private application data, not proof of identity or room access. The public collaboration experience needs a username, colour, guest ID, and server-derived role, but it does not need the email or bearer credentials.

---

# 2. Decision

Permissions are enforced by the server boundary that owns the protected operation.

The HTTP API validates the current guest session, room state, membership, server-derived role, and operation-specific capability before performing protected application, membership, invitation, asset, archive, recovery, or export work.

The collaboration runtime validates the current session, room, membership, role, and requested access mode before document or Awareness access. The validated role is stored in server connection context:

- Owners and editors may receive writable collaboration when current policy permits it.
- Viewers receive document updates and allowed presence through a provider-supported read-only mode.
- Excalidraw view mode and disabled controls remain user-experience protections, not security boundaries.
- Semantic inspection of arbitrary opaque Yjs updates is not the primary viewer-enforcement mechanism.

Asset reads and writes are authorised against the current session, room access, asset ownership, room state, and required role on every resolution path.

The permission flow is:

```text
Client request or collaboration connection
→ Validate current credential
→ Load current room and membership
→ Derive server capabilities
→ Enforce the operation or connection mode
→ Perform the authorised action
→ Return only redacted public state
```

Active role changes update PostgreSQL first, then cause the collaboration runtime to downgrade, upgrade, or reconnect affected clients. A controlled reconnect is acceptable for the MVP.

Guest email is required, normalised, unverified, and private. It must never enter:

- Excalidraw scene or product metadata.
- Yjs collaborative state or Awareness.
- Cursor, collaborator, room, or ordinary membership interfaces.
- Public or general room exports.
- Rejected-draft recovery output.
- Test APIs or ordinary QA evidence.
- Object-storage keys or collaborator-visible filenames.
- Ordinary structured logs or client diagnostics.

Raw session, share, internal-service, and signed-asset credentials remain secret and follow the same exclusion principle.

---

# 3. Consequences

## 3.1 Benefits

- A modified browser cannot grant itself durable write access.
- API, collaboration, and asset permissions remain consistent with current PostgreSQL state.
- Viewers can observe the room and publish allowed presence without obtaining a writable document path.
- Private identity is separated from the public collaboration persona.
- Role changes and offline reconnection fail closed.

## 3.2 Costs and trade-offs

- Permission logic must be shared or kept behaviourally consistent across API and collaboration runtimes.
- Active role changes require authenticated cross-runtime notification, revalidation, or controlled reconnect.
- Every asset resolution incurs a current room-access decision.
- Redaction and allowlist filtering must be tested across multiple output and diagnostic boundaries.

## 3.3 Conditional P1 consequences

Archive, recycle-bin restore, general export, and shared physics controls require their accepted server-side checks when those P1 capabilities are enabled. They do not become MVP release blockers while absent.

---

# 4. Alternatives already considered

## 4.1 UI-only enforcement through disabled controls or Excalidraw view mode

Rejected because browser state is modifiable and cannot protect APIs, collaboration updates, or assets.

## 4.2 Trusting client-provided roles, capabilities, guest IDs, or Awareness claims

Rejected because the browser is untrusted. Identity and role shown in Awareness must derive from validated connection context and remain display-only.

## 4.3 Semantic inspection of arbitrary Yjs updates as the primary viewer control

Rejected because opaque collaborative updates are not a reliable primary authorisation boundary. Provider-supported read-only access or an equivalent authenticated connection mode is preferred.

## 4.4 Public email-based collaborator identity or email-based room access

Rejected because email is unverified private data and is not an access credential. Username is the visible collaborator label; current session and membership grant access.

---

# 5. Implementation constraints

- Controllers do not treat client role fields as authority; permission policy belongs in shared permission and application-service boundaries.
- The API and collaboration runtime derive capabilities from the current session, room, and membership.
- Collaboration bootstrap material is short-lived and room-scoped where the accepted contract requires it.
- Protected internal API-to-collaboration control uses explicit internal authentication and is not publicly routable.
- Awareness schemas contain only approved public ephemeral fields and cannot override connection context.
- Test and diagnostic interfaces are redacted, read-only where possible, and unavailable in production.
- Raw session and share tokens are never stored in plaintext server records or ordinary logs.
- Cookie versus explicit bearer guest-session transport remains intentionally unresolved by this ADR. The selected transport must follow the accepted cookie, CSRF, bearer-storage, expiry, revocation, and redaction rules.
- Detailed roles, capability matrices, routes, token claims, and storage contracts remain in the authoritative documents.

---

# 6. Failure and security considerations

- Invalid, expired, revoked, or disabled sessions fail protected access.
- Permission-service or authoritative-data failure fails closed; the system never falls back to client role state.
- Viewer durable updates are prevented or rejected without changing the shared room.
- Invalid Awareness is rejected or sanitised and never persisted.
- Asset-storage failure preserves safe scene work but does not grant public or unauthorised access.
- A failed privacy filter produces no export or recovery artifact.
- Public errors and health responses use stable redacted codes and do not expose email, raw tokens, signed URLs, storage keys, database details, or internal credentials.

---

# 7. Verification and definition of done

This decision is satisfied when:

- Owner, editor, viewer, and non-member behaviour is enforced by the relevant server boundary.
- A client-modified role cannot produce a durable viewer update or privileged API action.
- Active downgrades stop writable collaboration through the supported provider path.
- Private room assets reject viewer uploads, non-member reads, and cross-room access.
- Guest email is absent from scene data, Yjs, Awareness, public interfaces, exports, recovery output, test APIs, storage keys, and ordinary logs.
- Raw credentials and signed URLs are absent from public output and diagnostics.
- Security unit, API, persistence, collaboration, browser, and mandatory QA-Intel checks pass.

---

# 8. Authoritative sources

- [System Architecture](../architecture/01-system-architecture.md)
- [API and Service Boundaries](../architecture/04-api-and-service-boundaries.md)
- [Realtime Presence and Awareness](../architecture/07-realtime-presence-and-awareness.md)
- [Security, Permission, and Privacy Architecture](../architecture/10-security-permission-and-privacy-architecture.md)

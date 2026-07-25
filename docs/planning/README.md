# Planning Documentation Index

## Real-Time Collaborative Infinite Canvas

**Document path:** `docs/planning/README.md`

**Document status:** Accepted

**Product phase:** Two-day MVP / Hackathon

**Last updated:** 25 July 2026

**Primary owners:** Product, Engineering, and QA

---

# 1. Purpose

This is the canonical index for implementation planning.

Planning documents translate accepted product scope, architecture, ADRs, and acceptance criteria into dependency-ordered work. They do not create product requirements, architecture, public contracts, or release exceptions.

---

# 2. Scope

The planning baseline covers:

- Mandatory P0 implementation.
- Offline recovery as the protected release differentiator.
- Test and QA-Intel evidence required for release.
- Scope-control, failure, security, and delivery-risk rules.
- Decision deadlines for choices intentionally left open by accepted architecture.

P1 and P2 capabilities remain parked until the mandatory release gate passes. A plan may identify their activation gate but must not present them as active MVP work.

---

# 3. Planning document index

| No. | Document | Purpose | Status |
| ---: | --- | --- | --- |
| 01 | [MVP Implementation Plan](./01-mvp-implementation-plan.md) | Defines the dependency sequence, work packages, acceptance traceability, decision gates, testing, risks, scope controls, and MVP completion gate. | Proposed |

The implementation plan remains `Proposed` until reviewed and explicitly accepted. Its proposed status does not weaken the accepted product or architecture sources on which it is based.

---

# 4. Authority

Planning authority is subordinate to:

1. [Product Documentation Index](../product/README.md).
2. [Architecture Documentation Index](../architecture/README.md).
3. [Architecture Decision Records](../adr/README.md).
4. [Repository instructions](../../AGENTS.md).

The accepted product documents decide what is mandatory. Accepted architecture decides ownership and control flow. ADRs preserve significant decisions. The plan decides only the order and evidence by which that accepted work is delivered.

If a planning item conflicts with an accepted source, the accepted source governs and the plan must be corrected before implementation continues.

---

# 5. Reading order

Before using the implementation plan:

1. Read the [Documentation Index](../README.md).
2. Read the [Product Requirements](../product/01-product-requirements.md).
3. Read the [MVP Scope and Acceptance Criteria](../product/02-mvp-scope-and-acceptance-criteria.md).
4. Read the [System Architecture](../architecture/01-system-architecture.md).
5. Read the applicable domain architecture and ADRs.
6. Read the [MVP Implementation Plan](./01-mvp-implementation-plan.md).

Implementers must continue to read the affected domain document before changing a package, application, contract, persistence boundary, security control, or test surface.

---

# 6. Planning status vocabulary

Work-item execution uses:

| Status | Meaning |
| --- | --- |
| `Not started` | Ready status has not yet been established or implementation has not begun. |
| `Ready` | Dependencies, acceptance criteria, ownership, and tests are known. |
| `In progress` | Implementation or verification is active. |
| `Blocked` | A named dependency or decision prevents safe progress. |
| `Passed` | Implementation and required evidence satisfy the item gate. |
| `Deferred` | Explicitly outside the active mandatory sequence. |
| `Removed` | Deliberately removed under accepted scope-control rules. |

These execution labels do not replace document statuses such as `Proposed` or `Accepted`.

---

# 7. Change control and failure behaviour

When a plan requires a decision that accepted sources intentionally leave open:

1. Resolve it no later than the decision deadline stated in the plan.
2. Record the selected implementation choice in the appropriate contract, configuration, or documentation.
3. Create an ADR only when the choice changes or adds a significant architectural decision.
4. Update affected accepted documents before implementation if the choice contradicts their current boundary.

If a mandatory slice fails its exit gate:

- Do not claim it complete.
- Do not begin dependent P1 or P2 work.
- Preserve evidence and identify the failing boundary.
- Reduce optional scope before weakening permission, privacy, persistence, offline, or testing requirements.

---

# 8. Security and privacy

Planning artifacts, fixtures, and evidence must use synthetic identities.

Plans must not contain:

- Real guest email addresses.
- Raw session, share, service, or signed-asset tokens.
- Credentials, connection strings, or private storage keys.
- Raw scene, Yjs, rejected-draft, image, or audio content.

No schedule pressure permits client-authoritative permissions, public asset storage, private-email exposure, unauthorised offline publication, or production test hooks.

---

# 9. Validation requirements

Planning changes must verify:

- Every mandatory work package traces to accepted requirements.
- Dependencies follow accepted state and service ownership.
- P1 and P2 work remains outside the mandatory release gate.
- Failure and security behaviour are explicit.
- Test levels and evidence are identified.
- Relative links resolve.
- No open choice is silently presented as accepted.
- `git diff --check` passes.

Code tests are not required for planning-only changes.

---

# 10. Definition of done

This index is complete when:

- Every current planning document appears once.
- Document paths, titles, purposes, and statuses match.
- The authority boundary prevents plans from changing accepted scope or architecture.
- The reading order leads implementers to the applicable accepted sources.
- Planning status, decision, security, failure, and validation rules are explicit.
- Optional work cannot bypass the mandatory release sequence.

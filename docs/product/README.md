# Product Documentation Index

## Real-Time Collaborative Infinite Canvas

**Document path:** `docs/product/README.md`

**Document status:** Accepted

**Product phase:** Two-day MVP / Hackathon

**Last updated:** 25 July 2026

**Primary owners:** Product, Design, Engineering, and QA

---

# 1. Purpose

This is the canonical index for current product documentation.

It defines the product reading order, the responsibility of each document, and the rules for resolving product-scope questions before planning, implementation, or release validation.

This index records existing accepted scope. It does not add a feature or change a priority.

---

# 2. Product document index

| No. | Document | Purpose | Status |
| ---: | --- | --- | --- |
| 01 | [Product Requirements](./01-product-requirements.md) | Defines product vision, goals, roles, functional scope, priority, risks, delivery sequence, and MVP completion. | Accepted |
| 02 | [MVP Scope and Acceptance Criteria](./02-mvp-scope-and-acceptance-criteria.md) | Defines testable P0, protected offline, P1, and P2 outcomes plus release gates and scope-reduction rules. | Accepted |
| 03 | [Canvas Interaction Specification](./03-canvas-interaction-specification.md) | Defines user-visible canvas interaction, responsive behaviour, product controls, and supported extension behaviour. | Accepted |

---

# 3. Reading order

Read the documents in numerical order for complete product orientation.

For focused work:

- Scope or priority: read documents 01 and 02.
- Acceptance tests or release claims: read document 02 and the affected section of document 03.
- Canvas behaviour: read document 03, then the relevant architecture reading path.
- Architecture or implementation: read all three product documents before making a change that could alter product behaviour.

Continue with the [Architecture Documentation Index](../architecture/README.md) and the applicable [ADR](../adr/README.md).

After reading the accepted sources, use the proposed [MVP Implementation Plan](../planning/01-mvp-implementation-plan.md) for dependency order and delivery evidence.

---

# 4. Product authority

The documents have complementary responsibilities:

1. Product Requirements defines product intent and priority.
2. MVP Scope and Acceptance Criteria is decisive for testable completion and release claims.
3. Canvas Interaction Specification defines interaction behaviour within the accepted scope.

The interaction specification must not turn P1 or P2 behaviour into a P0 release requirement. Architecture, plans, contracts, and code must not silently add, remove, or reprioritise product scope.

If accepted product documents appear to conflict:

1. Do not infer a new requirement.
2. Identify whether the issue concerns intent, release priority, acceptance, or interaction.
3. Resolve the conflict in the responsible product document.
4. Update affected architecture, ADRs, plans, tests, and indexes in the same change where required.

---

# 5. Scope boundary

Mandatory MVP scope is:

- P0 collaborative mixed-media canvas functionality.
- Critical automated tests and QA-Intel validation.
- Offline recovery as the protected mandatory differentiator.

Physics, mini-map, radar, recycle bin, room archive, and general export remain non-blocking P1 capabilities. Attraction, repulsion, replay, and SVG export remain P2.

Optional work must not delay or destabilise P0 collaboration, persistence, permission enforcement, required media, or protected offline recovery.

---

# 6. Historical inputs

The [Original Project Brief](../00-Project%20description.md) and files under [`resources/`](../../resources/README.md) are retained for provenance only.

They are not current product requirements. When they differ from documents in this index, the accepted documents in this directory govern.

---

# 7. Security and privacy

Every product requirement, example, acceptance scenario, and demo flow must preserve these rules:

- Guest email is required but private and unverified.
- Public collaborator identity uses only permitted public fields.
- Permissions are enforced by the API and collaboration server.
- Recovery and export outputs exclude private identity, credentials, awareness, and storage details.
- Synthetic identities and email addresses are used for tests and documentation.

Detailed controls are defined in [Security, Permission, and Privacy Architecture](../architecture/10-security-permission-and-privacy-architecture.md).

---

# 8. Validation requirements

When product documentation changes:

- Confirm P0, protected offline, P1, and P2 classification remains consistent.
- Confirm acceptance criteria remain observable and testable.
- Confirm interaction behaviour does not contradict Excalidraw ownership.
- Confirm architecture and ADR links remain accurate.
- Search for private-data exposure.
- Review scope-reduction and release-gate consequences.
- Run Markdown link and whitespace checks.

---

# 9. Definition of done

This index is complete when:

- Every current product document appears once in numerical order.
- Titles, paths, purposes, and statuses match the files.
- Product authority and conflict handling are explicit.
- Mandatory and optional scope remain distinct.
- Historical source material is clearly non-authoritative.
- Reading paths lead product, engineering, and QA work to the correct accepted sources.

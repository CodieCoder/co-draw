# Documentation Index

## Real-Time Collaborative Infinite Canvas

**Document path:** `docs/README.md`

**Document status:** Accepted

**Product phase:** Two-day MVP / Hackathon

**Last updated:** 26 July 2026

**Primary owners:** Product, Engineering, Architecture, and QA

---

# 1. Purpose

This is the canonical entry point for current project documentation.

It identifies:

- The authoritative documentation hierarchy.
- The current product, architecture, and ADR indexes.
- The required reading path before planning or implementation.
- The boundary between accepted documentation and historical source material.
- The change-control and validation rules for documentation.

This index records existing accepted authority. It does not introduce product scope, architecture, contracts, or implementation behaviour.

---

# 2. Scope

This index covers documentation used to plan, implement, test, operate, and review the application.

The current implementation-ready baseline consists of:

- Accepted product requirements and acceptance criteria.
- Accepted system and domain architecture.
- Accepted Architecture Decision Records.
- Repository instructions in [`AGENTS.md`](../AGENTS.md).

The proposed [MVP Implementation Plan](./planning/01-mvp-implementation-plan.md)
sequences the accepted work and evidence. The proposed
[foundation contract reference](./contracts/01-foundation-contracts.md),
[local persistence and readiness reference](./contracts/02-local-persistence-and-readiness.md),
and [general testing foundation](./contracts/03-general-testing-foundation.md)
document executable Stage 0 representations. They derive from the accepted
baseline and must not introduce scope or architecture indirectly.

---

# 3. Authority and precedence

Documentation has complementary areas of authority:

1. Accepted product documentation decides product intent, priority, mandatory release scope, interaction expectations, and acceptance criteria.
2. Accepted system architecture decides state ownership, trust boundaries, runtime boundaries, and cross-domain invariants.
3. Accepted domain architecture decides detailed flows, schemas, interfaces, failure behaviour, security controls, and testing boundaries for its domain.
4. Accepted ADRs preserve significant decisions and their rationale. They do not replace the linked accepted sources for detailed contracts or behaviour.
5. Executable contracts define validated implementation shapes after they are created. They may narrow representation details but may not expand accepted behaviour.
6. Implementation plans sequence accepted work. They do not change priority or architecture.
7. Source code implements the accepted contracts and behaviour. A code conflict with an accepted requirement is a defect or an explicitly proposed documentation change, not a silent change of authority.

[`AGENTS.md`](../AGENTS.md) defines repository working rules for coding agents. It does not override accepted product or architecture decisions.

A later ADR may supersede an earlier decision only when the supersession is explicit, the replaced record is linked, and affected accepted documents and indexes are updated in the same change. The repository must not retain two conflicting accepted sources.

---

# 4. Document statuses

| Status | Meaning |
| --- | --- |
| `Proposed` | Available for review but not authoritative for a new decision. |
| `Accepted` | Authoritative within its stated responsibility until explicitly superseded. |
| `Superseded` | Retained for traceability but replaced by a linked accepted source. |
| `Deprecated` | No longer recommended and awaiting removal or archival. |

An unlabelled historical input is not authoritative merely because it exists in the repository.

---

# 5. Canonical indexes

| Area | Canonical index | Current role |
| --- | --- | --- |
| Product | [Product Documentation Index](./product/README.md) | Accepted product scope, interaction behaviour, and release acceptance. |
| Architecture | [Architecture Documentation Index](./architecture/README.md) | Accepted system ownership, domain flows, interfaces, security, testing, and operations. |
| Decisions | [Architecture Decision Records](./adr/README.md) | Accepted decision history and rationale. |
| Planning | [Planning Documentation Index](./planning/README.md) | Proposed implementation sequencing, decision gates, acceptance traceability, testing, and delivery risks derived from accepted scope. |
| Contracts | [Contract Documentation Index](./contracts/README.md) | Executable foundation identifiers, roles, errors, configuration, local persistence, and readiness references. |

Current specialised authority remains in architecture until a non-duplicative supplemental index is added:

- Security: [Security, Permission, and Privacy Architecture](./architecture/10-security-permission-and-privacy-architecture.md).
- Testing: [Testing and Quality Strategy](./architecture/11-testing-and-quality-strategy.md).
- Deployment and operations: [Deployment and Operational Readiness](./architecture/12-deployment-and-operational-readiness.md).

Empty or reserved documentation directories are not evidence that an additional speculative documentation batch is required.

---

# 6. Required reading paths

## 6.1 General orientation

1. This index.
2. [Product Documentation Index](./product/README.md).
3. [Architecture Documentation Index](./architecture/README.md).
4. [ADR index](./adr/README.md).
5. [Planning Documentation Index](./planning/README.md).
6. [`AGENTS.md`](../AGENTS.md).

## 6.2 Planning

1. [Product Requirements](./product/01-product-requirements.md).
2. [MVP Scope and Acceptance Criteria](./product/02-mvp-scope-and-acceptance-criteria.md).
3. [System Architecture](./architecture/01-system-architecture.md).
4. The affected domain architecture and ADRs.

## 6.3 Implementation

1. [`AGENTS.md`](../AGENTS.md).
2. The applicable accepted product requirement and acceptance criteria.
3. The applicable architecture reading path.
4. The applicable ADRs.
5. The proposed [MVP Implementation Plan](./planning/01-mvp-implementation-plan.md).
6. The applicable plan from the [task-level plan index](./planning/plans/README.md).
7. The applicable reference in the [contract index](./contracts/README.md).

## 6.4 Testing and release

1. [MVP Scope and Acceptance Criteria](./product/02-mvp-scope-and-acceptance-criteria.md).
2. [Testing and Quality Strategy](./architecture/11-testing-and-quality-strategy.md).
3. [Security, Permission, and Privacy Architecture](./architecture/10-security-permission-and-privacy-architecture.md).
4. [Deployment and Operational Readiness](./architecture/12-deployment-and-operational-readiness.md).

---

# 7. Historical and superseded material

[Original Project Brief](./00-Project%20description.md) is retained for challenge traceability and is superseded by the accepted product documentation.

Files under [`resources/`](../resources/README.md), including source documents and archives, are historical inputs. They are not current requirements and must not override files under `docs/product/`, `docs/architecture/`, or `docs/adr/`.

Historical material may be consulted to understand provenance. Any proposal derived from it must be reconciled against the accepted baseline before review.

---

# 8. Change control and failure behaviour

When documentation appears inconsistent:

1. Stop the affected planning or implementation change.
2. Identify each conflicting source and its status.
3. Apply the authority rules in this index and the affected domain index.
4. Resolve a genuine conflict in the authoritative source before downstream work.
5. Record a significant new architectural decision as an ADR after explicit acceptance.
6. Update affected indexes and cross-references in the same change.

Do not resolve a conflict by silently treating source code, a plan, a historical document, or a proposed document as higher authority.

---

# 9. Security and privacy considerations

Documentation, examples, fixtures, and validation output must use synthetic data.

They must not contain:

- Real guest email addresses or personal data.
- Raw session, share, internal-service, or signed-asset tokens.
- Database or object-storage credentials.
- Private storage keys.
- Raw rejected offline drafts.

Guest email remains private application data and must not appear in awareness, scene data, exports, recovery output intended for sharing, or public room interfaces.

---

# 10. Documentation validation

Documentation changes must verify:

- Markdown structure and final newlines.
- Relative links.
- Document paths, titles, statuses, and numbering.
- Product priority and architecture ownership consistency.
- Excalidraw canonical-scene and server-authority invariants.
- Private-data exclusions.
- `git diff --check`.

Code tests are required only when executable behaviour changes. Documentation-only changes still require targeted contradiction and privacy searches.

---

# 11. Definition of done

This index is complete when:

- Every authoritative documentation area has one canonical entry point.
- Accepted, proposed, superseded, and historical material are distinguishable.
- Reading paths lead to existing files.
- Planning and contracts cannot silently override accepted scope or architecture.
- ADR supersession cannot leave contradictory accepted sources.
- Security and privacy boundaries apply to documentation and examples.
- The index is updated whenever a canonical documentation area is added, renamed, or removed.

# ADR 0006: Risk-Based TDD and QA-Intel Release Controls

**Status:** Accepted

**Date:** 2026-07-25

**Decision scope:** Existing accepted architecture

> This ADR records an existing test and release-quality decision from accepted architecture. It does not create a new test API, selector catalog, acceptance suite, CI workflow, or product requirement.

---

# 1. Context

The product combines a third-party canvas, collaboration, server-authoritative permissions, private assets, browser persistence, and offline reconciliation. Happy-path manual testing or isolated unit tests cannot prove the cross-runtime guarantees that protect room integrity and local recovery.

The team has a two-day MVP constraint. Testing must focus effort on product-owned risk rather than duplicating Excalidraw's internal suite or adding enterprise test infrastructure.

---

# 2. Decision

High-risk product policy follows risk-based test-driven development. A failing focused test precedes implementation where practical for deterministic permission, validation, adapter, metadata, asset, offline, privacy, redaction, and conflict-policy behaviour.

When the risk exists at a real boundary, the first meaningful failing test may be an integration or browser test. Examples include Yjs convergence, Hocuspocus connection modes, IndexedDB, object storage, browser media, and network reconnection.

Tests run at the lowest level that proves the behaviour without mocking away its primary risk:

- Unit tests prove deterministic policy, mapping, validation, and state transitions.
- Integration tests prove persistence, API, collaboration, asset, IndexedDB, and adapter boundaries with real supported components where they own the guarantee.
- Playwright browser tests prove assembled multi-client behaviour using isolated browser contexts.
- QA-Intel independently exercises the release candidate and records reviewable evidence.

QA-Intel complements but does not replace engineering tests. Engineering tests do not remove the need for independent QA-Intel evidence on mandatory workflows.

The release flow is:

```text
Accepted criterion and risk
→ Focused failing test at the appropriate level
→ Minimum implementation
→ Passing regression test
→ Boundary-level verification
→ Independent QA-Intel evidence where mandatory
→ Joint engineering and QA release decision
```

P0 behaviour, mandatory QA-Intel evidence, and the protected offline-recovery differentiator form one release gate. The release cannot claim MVP completion while any required part fails.

Conditional P1 capabilities carry their own tests and QA evidence when enabled or claimed complete. A missing or disabled P1 capability does not block the MVP.

Stable non-production inspection hooks may expose redacted, serialisable projections of canonical application state. They remain diagnostic only, do not mutate Excalidraw, Yjs, roles, permissions, or recovery state, and are absent from production builds.

---

# 3. Consequences

## 3.1 Benefits

- Testing effort follows permission, data-loss, privacy, convergence, asset, and recovery risk.
- Real boundaries are exercised where mocks would hide the failure.
- Multi-client and offline evidence is reproducible and reviewable.
- The release decision combines automated regression confidence with independent behavioural validation.
- Optional innovation cannot hide failures in the mandatory path.

## 3.2 Costs and trade-offs

- Integration and browser environments require isolated PostgreSQL, object storage, browser storage, and multiple client contexts.
- Mandatory flaky tests remain quality defects rather than being ignored through retries.
- Evidence collection requires redaction and revision tracking.
- Browser media and offline simulation may be platform-dependent and require documented limitations.

## 3.3 Conditional P1 consequences

Physics, mini-map, radar, recycle bin, archive, and general export tests block only the completion claim for the enabled capability. They remain subordinate to the mandatory release gate.

---

# 4. Alternatives already considered

## 4.1 Unit tests with mocked cross-runtime boundaries only

Rejected because mocks cannot prove Hocuspocus access modes, Yjs convergence, PostgreSQL transactions, private object storage, IndexedDB recovery, or browser network behaviour.

## 4.2 Manual or screenshot-only acceptance

Rejected because screenshots cannot prove scene identity, convergence, server rejection, persistence, recovery isolation, or absence of private data.

## 4.3 Retesting Excalidraw's complete internal suite

Rejected because the product should test its integration and owned guarantees, not duplicate the upstream drawing engine's tests.

## 4.4 QA-Intel as a replacement for engineering tests

Rejected because independent behavioural validation does not replace focused unit and integration regression coverage.

## 4.5 Production mutation hooks for test convenience

Rejected because they could bypass canonical scene ownership and server authority. Production builds exclude test hooks, and non-production hooks are read-only where possible.

---

# 5. Implementation constraints

- Every high-risk test traces to an accepted criterion or architecture invariant.
- Cross-runtime guarantees use real boundary-appropriate components and isolated data.
- Distinct collaborators use separate browser contexts, sessions, IndexedDB stores, and network controls.
- Browser and QA assertions combine visible behaviour, redacted state projections, logs, traces, and relevant network results.
- Tests never create a parallel scene model or mutate canonical state through inspection hooks.
- Test identities and content are synthetic and run-scoped.
- The production build excludes the test API and rejects attempts to enable it.
- Mandatory test failures, blocked runs, flakes, and retries are reported honestly.
- Detailed test matrices, selectors, interfaces, fixtures, and evidence fields remain in the accepted product and testing documents.

---

# 6. Failure and security considerations

- No known P0 data-loss, permission-bypass, private-data, or offline-publication defect may remain at release.
- A retry can diagnose non-determinism but does not erase an unexplained failed mandatory run.
- Quarantining a mandatory test does not make the release gate pass.
- Test evidence excludes real personal data, guest email where prohibited, raw credentials, signed URLs, raw storage keys, raw scene or Yjs state, private recovery content, and binary bodies.
- Test infrastructure is isolated from production databases, buckets, rooms, sessions, and credentials.
- Test convenience never weakens server permission enforcement or private asset policy.

---

# 7. Verification and definition of done

This decision is satisfied when:

- Every P0 and protected offline requirement maps to an appropriate automated test level.
- High-risk deterministic policy has focused regression coverage.
- Real API, collaboration, persistence, asset, and IndexedDB boundaries have integration coverage.
- Multi-client Playwright tests use isolated browser contexts.
- QA-Intel independently passes every mandatory workflow and records redacted evidence.
- Authorised offline reconciliation and permission-revoked rejected-draft recovery both pass.
- The representative 100-element, two-client room remains usable.
- Production-shaped validation proves the test API is absent.
- Conditional P1 tests gate only enabled P1 claims.
- Known limitations and failures are recorded honestly.

---

# 8. Authoritative sources

- [MVP Scope and Acceptance Criteria](../product/02-mvp-scope-and-acceptance-criteria.md)
- [System Architecture](../architecture/01-system-architecture.md)
- [Testing and Quality Strategy](../architecture/11-testing-and-quality-strategy.md)
- [Deployment and Operational Readiness](../architecture/12-deployment-and-operational-readiness.md)

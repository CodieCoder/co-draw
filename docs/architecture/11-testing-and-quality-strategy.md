# Testing and Quality Strategy

## Real-Time Collaborative Infinite Canvas

**Document path:** `docs/architecture/11-testing-and-quality-strategy.md`
**Document status:** Accepted
**Product phase:** Two-day MVP / Hackathon
**Last updated:** 25 July 2026
**Primary owners:** Engineering, QA, and Architecture

---

# 1. Purpose

This document defines the testing responsibilities, test-level boundaries, release evidence, and quality gates for the real-time collaborative infinite canvas.

It consolidates accepted testing requirements from:

- [Product Requirements](../product/01-product-requirements.md)
- [MVP Scope and Acceptance Criteria](../product/02-mvp-scope-and-acceptance-criteria.md)
- [Canvas Interaction Specification](../product/03-canvas-interaction-specification.md)
- [System Architecture](./01-system-architecture.md)
- [Collaboration and Synchronisation Design](./02-collaboration-and-sync-design.md)
- [Data Model and Persistence](./03-data-model-and-persistence.md)
- [API and Service Boundaries](./04-api-and-service-boundaries.md)
- [Excalidraw Integration Design](./05-excalidraw-integration-design.md)
- [Frontend Architecture](./06-frontend-architecture.md)
- [Realtime Presence and Awareness](./07-realtime-presence-and-awareness.md)
- [Asset and Media Architecture](./08-asset-and-media-architecture.md)
- [Offline Sync and Recovery](./09-offline-sync-and-recovery.md)
- [Security, Permission, and Privacy Architecture](./10-security-permission-and-privacy-architecture.md)

The accepted product criteria and domain architectures remain authoritative for feature behaviour, APIs, persistence schemas, collaboration state, and permissions. This document defines how those guarantees are proved; it does not create another contract or state model.

---

# 2. Scope

## 2.1 Mandatory release scope

The MVP release gate covers:

- All P0 product behaviour.
- Critical automated tests.
- Mandatory QA-Intel validation.
- Private guest-data handling.
- Server-authoritative permissions.
- Private image and audio assets.
- Persistent collaborative scene recovery.
- The protected offline-recovery differentiator.
- Performance with at least 100 representative elements.
- Honest evidence and known-failure reporting.

P0 plus mandatory QA-Intel plus protected offline recovery is one release gate. Offline recovery is not optional polish after the MVP is declared complete.

## 2.2 Conditional P1 scope

Tests are required when the corresponding P1 capability is implemented or claimed complete:

- Physics.
- Mini-map.
- Collaborator radar.
- Recycle bin.
- Room archive and restore.
- General PNG or JSON export.

An absent P1 capability and its tests do not block the MVP release. An implemented P1 capability must not be presented as complete while its applicable tests or QA-Intel evidence are failing.

## 2.3 Non-goals

This strategy does not require:

- Retesting Excalidraw's complete internal suite.
- Pixel-perfect screenshot assertions for the canonical scene.
- Production-scale load, soak, or chaos infrastructure.
- A second scene representation created for tests.
- Direct production-database access by browser tests or QA-Intel.
- Kubernetes, distributed test orchestration, or an enterprise test-management platform.

---

# 3. Quality principles

1. Tests prove product-owned guarantees around Excalidraw rather than reimplementing or retesting Excalidraw internals.
2. The Excalidraw scene remains the canonical visual scene in production and tests.
3. High-risk policy is developed through risk-based TDD.
4. Tests run at the lowest level that can prove the behaviour without mocking away its risk.
5. Cross-runtime guarantees require integration or browser evidence.
6. Screenshots support diagnosis but do not prove canvas state alone.
7. Server authority must be tested against a hostile or modified client.
8. Offline recovery tests protect shared-room integrity and local user work.
9. Mandatory failures are release-blocking until fixed or the affected scope is removed honestly.
10. Test hooks are diagnostic projections, never an alternate mutation path.

---

# 4. Responsibilities

| Responsibility | Owner | Required outcome |
| --- | --- | --- |
| Acceptance criteria and priority | Product with Engineering and QA | Every implemented capability has an accepted priority and observable completion condition. |
| Focused TDD | Engineer implementing the behaviour | High-risk logic starts with a failing focused test where practical and ends with passing regression coverage. |
| Integration coverage | Engineer owning the affected runtime or package | Real boundaries are exercised for persistence, collaboration, permissions, assets, and offline recovery. |
| Browser workflow coverage | Feature engineer with QA | Critical user journeys run against the integrated application using isolated browser contexts. |
| Independent validation | QA-Intel | Mandatory workflows are executed independently and produce reviewable evidence. |
| Review | Code reviewer | Tests exercise the intended risk, avoid duplicated scene models, and do not weaken privacy or server authority. |
| Release decision | Engineering and QA | Mandatory automated tests and QA-Intel evidence are reviewed together before the MVP is claimed complete. |

QA-Intel does not replace engineering tests. Engineering tests do not remove the need for independent QA-Intel evidence on release-blocking workflows.

---

# 5. Risk-based TDD policy

## 5.1 Strict TDD targets

A failing test should precede implementation where practical for:

- Guest identity validation and session policy.
- Room and membership permissions.
- Viewer write prevention.
- Room lifecycle transactions.
- Scene adapter serialisation, normalisation, and feedback-loop prevention.
- Product metadata mapping.
- Asset lifecycle and access policy.
- Offline eligibility and reconnection ordering.
- Rejected-draft creation and recovery filtering.
- Awareness privacy validation.
- Log redaction.
- Conflict-policy helpers.
- Conditional P1 recycle-bin transformations.
- Conditional P1 physics lease logic.
- Conditional P1 export privacy filtering.

The expected cycle is:

```text
Accepted criterion
    ↓
Failing focused test
    ↓
Minimum implementation
    ↓
Passing test
    ↓
Refactor with the test passing
    ↓
Boundary-level regression coverage
```

## 5.2 Boundary-first exceptions

Some risks cannot be proved meaningfully through a pure unit test first, including:

- Browser media permissions.
- IndexedDB behaviour.
- Hocuspocus connection modes.
- Yjs convergence.
- Object-storage integration.
- Browser network disconnection and reconnection.

For these cases, the first failing test may be an integration or browser test.

An exploratory spike may temporarily precede a stable test only when the external behaviour is not yet understood. Before the capability is merged or claimed complete:

- The accepted behaviour must be recorded.
- A repeatable regression test must exist at the appropriate level.
- Temporary spike code or test bypasses must be removed.
- Any remaining limitation must be disclosed.

## 5.3 Review evidence

The repository does not require committing a deliberately failing test state.

The review must still make clear:

- Which risk the test protects.
- Why the selected test level is appropriate.
- Which accepted criterion or architecture invariant it traces to.
- Which mocks or fixtures are used.
- Which failure would be missed by lower-level coverage.

---

# 6. Test-level boundaries

| Level | Primary purpose | Real boundaries | Must not become |
| --- | --- | --- | --- |
| Unit | Prove deterministic policy, mapping, validation, and state transitions. | Pure TypeScript and narrowly scoped framework components. | A mocked full-system workflow. |
| Integration | Prove contracts between packages, services, persistence, and collaboration components. | Boundary-appropriate PostgreSQL, object storage, Yjs, Hocuspocus, IndexedDB, API, and adapter instances. | An end-to-end test hidden behind extensive mocks. |
| Browser E2E | Prove user-visible behaviour across the assembled application. | Web, API, collaboration runtime, PostgreSQL, object storage, browser storage, and multiple isolated browser contexts. | A screenshot-only scene assertion. |
| QA-Intel | Independently validate the release candidate and collect diagnostic evidence. | The same release-shaped environment and stable application hooks used by users and Playwright. | A substitute for unit or integration coverage. |

The same behaviour may appear at more than one level when each level protects a different failure mode. Repetition without a distinct risk is unnecessary.

---

# 7. Unit-test boundary

Unit tests cover deterministic logic without requiring a running distributed application.

Primary mandatory targets include:

- Input and identity validation.
- Role and capability derivation.
- Session and share-token policy.
- Stable error mapping.
- Excalidraw scene normalisation and diff helpers.
- Product-object metadata validation.
- Callback-loop suppression.
- Local-history origin classification and remote-history suppression.
- Asset transitions, cache policy, and resource disposal.
- Awareness allowlist validation.
- Offline connection-state derivation.
- Reconnection-gate branching.
- Recovery allowlist filtering.
- Configuration validation and log redaction.

React component tests may verify product-owned controls through accessible roles and labels. They do not prove server permission enforcement or multi-client convergence.

Native Excalidraw drawing, selection, resize, and internal history mechanics remain outside the unit-test scope. Product-owned undo-origin classification, remote-history suppression, publication, permissions, and convergence are inside the adapter and integration test scope.

---

# 8. Integration-test boundary

Integration tests prove behaviour where a mock would hide the main risk.

Mandatory integration coverage includes:

- Guest-session persistence and expiry.
- Atomic room creation and owner membership.
- Share-link and role enforcement.
- Viewer read-only collaboration.
- Yjs document load, persistence, and equivalent reload.
- Two-client convergence and element-order normalisation.
- Local undo and redo propagation without reversing unrelated remote work.
- Remote application without local-history capture or duplicate publication.
- Product metadata association.
- Awareness validation and cleanup.
- Authorised private asset upload and retrieval.
- Cross-room and non-member asset rejection.
- Asset failure and readiness transactions.
- IndexedDB room-cache restoration.
- Permission validation before writable reconnection.
- Rejected offline candidates never attaching to the writable room.
- Recovery output privacy filtering.

Use real test dependencies where they own the guarantee. A repository test may use a real isolated PostgreSQL database while a service test uses an in-process API; a collaboration test should use actual Yjs documents and the supported Hocuspocus path.

Database inspection is permitted in isolated integration environments. It is not the primary assertion surface for browser E2E or QA-Intel.

---

# 9. Browser end-to-end boundary

Playwright browser tests run against the assembled web, API, collaboration, PostgreSQL, and object-storage path.

Requirements:

- Use separate browser contexts for distinct collaborators.
- Use distinct session and browser-storage state for each identity.
- Exercise product controls through accessible roles, labels, and stable selectors.
- Assert scene and collaboration state through the production UI plus the redacted test API.
- Inspect network results and browser logs for permission, asset, and recovery failures.
- Apply offline state to only the intended browser context where the tooling supports it.
- Reload or restart clients when persistence is part of the guarantee.
- Avoid direct mutation of Excalidraw, Yjs, role, or recovery state through test hooks.

The primary supported browser path is the current Chromium-based desktop browser. Current Firefox and Safari should be exercised where time permits, with limitations recorded as required by the accepted product scope.

---

# 10. QA-Intel boundary

QA-Intel is an independent behavioural validation layer.

For each mandatory scenario it:

1. Starts from a documented environment and release identifier.
2. Creates isolated synthetic users and room state.
3. Executes the accepted user workflow.
4. Uses stable UI selectors and redacted inspection hooks.
5. Captures screenshots, trace data, browser logs, and relevant network results.
6. Records pass or fail.
7. Records the likely failure boundary and next investigation step when a scenario fails.
8. Preserves evidence without private data or credentials.

QA-Intel must not:

- Grant roles by editing client state.
- Treat the test API as authority.
- Read a production database as its normal assertion path.
- Accept a screenshot as the only proof of scene convergence.
- Hide a failed first run behind an unexplained rerun.

---

# 11. Mandatory release-coverage matrix

| Release area | Unit coverage | Integration coverage | Browser and QA-Intel evidence |
| --- | --- | --- | --- |
| Guest entry and sessions | Validation, normalisation, expiry, redaction. | Creation, restoration, invalid-session rejection. | Guest enters or restores a session without private data appearing in public surfaces. |
| Rooms and invitations | Capability and share-link policy. | Atomic creation, owner membership, invite acceptance, role limits. | Alice creates a room; Bob joins through the supported share flow. |
| Excalidraw integration | Scene normalisation, metadata mapping, callback suppression, undo-origin classification. | Adapter load, remote application, local undo and redo propagation, persistence reconstruction. | Native elements render, synchronise once, preserve unrelated remote work during undo, and remain after reload. |
| Collaboration and presence | Conflict helpers, awareness validation, connection-state derivation. | Two-client convergence, read-only viewer, persistence, presence cleanup. | Alice and Bob converge; Charlie observes but cannot publish durable edits. |
| Permissions and privacy | Role policy, allowlists, token and log redaction. | Server rejection, private asset isolation, email exclusion. | A modified viewer client still cannot write; private fields are absent from scene, awareness, public data, hooks, recovery output, and diagnostics. |
| Images and audio | Lifecycle policy, mappings, media state transitions. | Upload authorisation, readiness, private resolution, failure paths. | Image sharing and reload work; recorded audio is visible and playable from another authorised client. |
| Protected offline recovery | Eligibility, revalidation ordering, rejected-draft and recovery filtering. | IndexedDB reload, authorised convergence, denied candidate isolation. | A cached room opens offline; authorised edits reconcile; revoked edits remain local, recoverable, and absent from shared state. |
| Performance and resilience | Batching, throttling, retry, and failure-state helpers. | Dependency interruption and recovery at owned boundaries. | A representative 100-element, two-client room remains usable and failures are reported honestly. |

Every mandatory row must have passing applicable coverage. A row is not complete merely because its browser happy path passes.

---

# 12. Mandatory QA-Intel suite

The accepted scenarios [QA-001 through QA-005](../product/02-mvp-scope-and-acceptance-criteria.md#37-qa-intel-acceptance-suite) are release-blocking:

1. Create, join, synchronise, and persist.
2. Viewer permission enforcement.
3. Image sharing.
4. Audio-card creation and playback.
5. Authorised offline reconciliation.

The release also requires the offline rejection workflow defined by the accepted product gate and [Offline Sync and Recovery](./09-offline-sync-and-recovery.md#223-browser-and-qa-intel-tests):

1. Alice opens and caches a room while authorised as an editor.
2. Alice goes offline and makes an eligible scene edit.
3. Another authorised user revokes or downgrades Alice's permission.
4. Alice reconnects.
5. The candidate document does not enter the writable shared room.
6. The current authorised room is loaded separately.
7. Alice's rejected work remains locally recoverable.
8. The recovery artifact excludes guest email, credentials, tokens, awareness, signed URLs, storage keys, and internal diagnostics.

This rejected-draft scenario is mandatory even though general JSON export remains P1. The recovery-only download is a protected P0 recovery mechanism, not general room export.

---

# 13. Conditional P1 coverage

| Capability | Required when implemented | QA-Intel completion evidence |
| --- | --- | --- |
| Physics | Eligibility, coordinate mapping, lease competition and expiry, throttling, valid final Excalidraw transform, failure exit. | An eligible throw converges to an ordinary final Excalidraw state without creating a second durable scene. |
| Mini-map | Scene-bounds projection, viewport navigation, update cost, no scene mutation. | The user can navigate through the derived local overview. |
| Collaborator radar | Awareness projection, off-screen calculation, privacy, local viewport navigation. | The user can locate or navigate to an authorised collaborator without persisting radar state. |
| Recycle bin | Tombstone policy, delete-versus-edit behaviour, authorised restore, idempotency. | Supported deleted content restores without duplicate elements or private-data exposure. |
| Archive and restore | Owner permission, write rejection, asset preservation, active-connection response, idempotency. | Archived rooms reject writes and restore safely. |
| General export | Authorisation, allowlist filtering, asset handling, failure behaviour. | The exported result excludes private and ephemeral data and matches the claimed format. |

Conditional tests block only the completion claim for their capability. They do not block the MVP when that capability is absent or disabled.

---

# 14. Excalidraw test boundary

The application tests:

- The supported Excalidraw package loads through the adapter.
- Product-owned scene translation remains valid.
- Remote updates apply once without feedback loops.
- Scene state persists and reconstructs.
- Product metadata remains associated.
- Private assets resolve through authorised paths.
- Offline and migration flows preserve valid elements.
- Conditional physics produces ordinary Excalidraw transforms.

The application does not create a parallel scene model for assertions. Test projections derive from the canonical Excalidraw scene and are disposable.

Every Excalidraw version upgrade requires adapter regression tests, representative saved-scene tests, collaboration verification, asset verification, and manual interaction review as defined in [Excalidraw Integration Design](./05-excalidraw-integration-design.md#44-upgrade-strategy).

---

# 15. Stable selector policy

Selectors follow this order:

1. Accessible role and name.
2. Associated label.
3. Stable visible product text.
4. Stable `data-testid` only where canvas or product behaviour has no reliable accessible selector.

Stable product-owned examples include:

```text
canvas-root
room-connection-status
asset-upload-progress
recovery-export-button
```

Selectors must describe product behaviour rather than CSS classes, DOM depth, or implementation component names.

The canvas root may expose redacted state attributes such as room role, connection state, or feature mode. Such attributes are diagnostic projections and do not grant authority.

---

# 16. Canvas test API

The accepted development and test-only global remains:

```ts
window.__CANVAS_TEST_API__
```

Its conceptual interface is defined in [Frontend Architecture](./06-frontend-architecture.md#78-canvas-test-api), with collaboration and presence projections defined in:

- [Collaboration and Synchronisation Design](./02-collaboration-and-sync-design.md#67-qa-intel-inspection-support)
- [Realtime Presence and Awareness](./07-realtime-presence-and-awareness.md#78-presence-test-api)
- [Offline Sync and Recovery](./09-offline-sync-and-recovery.md#21-diagnostics)

The combined test interface may expose normalised, serialisable views of:

- Room ID, status, and server-derived role.
- Excalidraw element geometry and order.
- Product-object associations.
- Connection and synchronisation state.
- Redacted collaborator presence.
- Asset lifecycle state.
- IndexedDB readiness and offline status.
- Unsynchronised-change counts or indicators.
- Rejected-draft reason and recovery availability.
- Conditional P1 state only when the feature is enabled.

It must not expose:

- Guest email.
- Raw session, share, service, or signed-asset tokens.
- Signed URLs.
- Object-storage credentials or raw storage keys.
- Raw Yjs documents.
- Raw rejected-draft content.
- Binary bodies.
- A direct scene, Yjs, role, permission, or recovery mutation command.

---

# 17. Production disablement

The test API and test-only control paths must be unavailable in production.

Required controls:

- The production build excludes the test-hook initialisation module where practical.
- Production configuration rejects any attempt to enable the test API.
- A runtime flag alone is insufficient to expose test hooks in a production build.
- Release validation asserts that `window.__CANVAS_TEST_API__` is absent.
- Test fixtures, reset routes, and inspection endpoints are not publicly routable in production.
- Test dependencies are not imported by production packages.

A test-only command may exist only when browser interaction cannot reliably express the action. It must still pass through ordinary server permission enforcement and must not mutate the canonical scene directly.

---

# 18. Test identities and data

Use synthetic, run-scoped identities:

```text
Alice — room owner
Bob — editor
Charlie — viewer
```

Rules:

- Email values use a reserved synthetic test domain and contain no real personal data.
- Usernames remain safe visible text.
- Every parallel run uses unique room, session, asset, and object prefixes or identifiers.
- Storage keys are server-generated and never derive from email.
- Image fixtures are small, valid, deterministic files plus explicit invalid samples.
- Audio tests use deterministic browser media fixtures where supported.
- Recovery fixtures contain representative scene and product metadata but no credentials.
- Performance fixtures contain at least 100 representative ordinary elements and bounded assets.
- Test logs and evidence obey the same email and secret-redaction rules as the application.

Integration fixtures may create state directly through isolated repositories when the repository boundary is the subject of the test. Browser and QA-Intel flows create authoritative state through supported application paths.

---

# 19. Multi-client browser strategy

Each collaborator uses a separate Playwright browser context.

This provides:

- Independent cookies or bearer-session storage.
- Independent IndexedDB databases.
- Independent local caches and recovery artifacts.
- Independent permissions and browser media grants.
- Independent network-state control.

Minimum mandatory arrangements:

- Alice and Bob as separate writable clients.
- Charlie as a separate viewer client.
- One additional authoritative client when changing Alice's permission while Alice is offline.

Do not simulate multiple collaborators by changing a role or guest ID within one browser context.

Offline tests should disconnect only the target client. The other client and server runtimes remain online so the test can observe remote changes, permission revocation, and final shared state.

---

# 20. Test-environment fidelity and isolation

## 20.1 Unit environment

- No external network requirement.
- Deterministic clock and identifier wrappers where time or uniqueness matters.
- No production credentials.

## 20.2 Integration environment

- Isolated PostgreSQL database or schema.
- Isolated private object-storage bucket or prefix.
- Real supported Yjs and Hocuspocus behaviour where collaboration is under test.
- Browser-backed IndexedDB test where browser persistence semantics matter.
- Explicit teardown that preserves failure artifacts but prevents state leakage into another run.

## 20.3 Browser and QA environment

- The assembled web, API, and collaboration runtimes.
- Test-only hooks enabled through a non-production build profile.
- Production-equivalent permission, asset, persistence, and redaction logic.
- Unique run identifier and recorded application revision.
- No connection to production data or object storage.

Mocks are acceptable only when they do not remove the boundary being proved.

---

# 21. Asset and media testing

Mandatory coverage includes:

- Supported image upload, synchronisation, authorised resolution, and reload.
- Unsupported type or size rejection without a ready scene object.
- Viewer and non-member upload rejection.
- Cross-room and unauthorised asset-read rejection.
- Pending-to-ready lifecycle.
- Upload, completion, missing-object, decode, and retry failure.
- Audio recording permission, upload, card association, playback, and cleanup.
- Microphone denial while ordinary canvas editing remains usable.
- Cached offline asset resolution.
- Honest queuing or blocking of a new offline binary.

Tests must assert stable asset identifiers and lifecycle state. They must not snapshot signed URLs, storage credentials, raw audio, or image bodies into ordinary evidence.

---

# 22. Offline and recovery testing

Mandatory coverage includes:

- A previously opened compatible room loads from IndexedDB while offline.
- An uncached room never appears as a valid empty room.
- Eligible scene edits persist locally.
- Local-only and remotely synchronised states remain distinguishable.
- Reconnection validates session, room, membership, and role before writable attachment.
- Authorised candidate updates converge with a second client.
- Viewer, denied, archived-when-applicable, and incompatible candidates do not publish.
- Rejected work remains isolated and recoverable.
- Recovery output is allowlist-filtered.
- IndexedDB unavailability, quota failure, cache corruption, and schema incompatibility fail honestly.
- A queued or blocked offline asset never appears ready.

Tests must preserve both candidate and remote state when simulating reconstruction or migration failure. A false empty room is never a passing recovery result.

---

# 23. Permission, privacy, and security testing

The browser is treated as hostile.

Mandatory adversarial tests include:

- Modify local role or capability state and attempt a durable viewer update.
- Attempt collaboration as an unauthenticated guest or non-member.
- Send an invalid awareness payload containing a private or unsupported field.
- Access an asset from another room.
- Use an expired or revoked session or share link.
- Attempt an unsafe upload.
- Reconnect an offline candidate after permission loss.
- Attempt to enable test hooks in a production build.

Privacy assertions inspect:

- Excalidraw scene data.
- Yjs collaborative state.
- Awareness.
- Public room and collaborator interfaces.
- Asset mappings and exposed filenames.
- General export when conditional P1 is enabled.
- Mandatory rejected-draft recovery output.
- Test APIs.
- Structured logs and browser diagnostics.

Guest email, credentials, tokens, signed URLs, storage keys, and raw recovery content must be absent from every surface where the accepted security architecture forbids them.

---

# 24. Performance testing

The mandatory representative scenario contains:

- At least 100 ordinary Excalidraw elements.
- At least two connected collaborators.
- Pan, zoom, selection, and element transformation.
- Presence traffic.
- Persistence and collaboration activity.

The acceptance outcome is:

- The browser does not freeze.
- Ordinary canvas interaction remains usable for the demonstration.
- Collaboration continues.
- Persistence does not claim success falsely.
- Presence does not become durable scene history.
- Full-scene duplication or replacement is not introduced.

Capture browser traces and relevant durations for comparison between runs. This document does not invent a numeric latency or frame-rate service-level objective that the accepted product documents do not define.

Conditional performance tests cover physics throttling, mini-map recomputation, and radar updates only when those P1 features are enabled.

---

# 25. Failure testing

| Failure injected | Required assertion |
| --- | --- |
| API unavailable | New authoritative operations fail with feedback; existing safe collaboration may continue. |
| Collaboration runtime unavailable | Client becomes reconnecting or offline; cached scene remains visible; eligible local work is preserved. |
| PostgreSQL unavailable | Protected operations and durability claims fail safely; no false success is shown. |
| Object storage unavailable | Shape and text collaboration remains usable; asset operations remain non-ready and actionable. |
| IndexedDB unavailable or quota exceeded | Online work may continue safely; offline readiness or local preservation is not claimed. |
| Permission revoked while offline | Candidate updates never enter the writable room; local work remains recoverable. |
| Cache or schema incompatible | Data is preserved for recovery; no authentic-looking empty room is produced. |
| Asset upload or decode failure | Scene reference is preserved where valid; failed content does not masquerade as ready. |
| Microphone denied or unavailable | Recording does not start; no false asset record is completed; the canvas remains usable. |
| Invalid awareness or private field | Payload is rejected or sanitised and is never persisted. |
| Test API enabled in production | Build, startup validation, or release check fails. |

Failure tests should use supported dependency controls, browser context controls, or isolated test doubles at the dependency boundary. They must not corrupt shared developer or production data.

---

# 26. Evidence requirements

Each browser or QA-Intel run records:

- Scenario or acceptance-criterion identifier.
- Pass, fail, or blocked result.
- Application revision or commit SHA.
- Environment and enabled feature flags.
- Browser name and version.
- Run identifier and time.
- Synthetic actor roles.
- Screenshots at meaningful checkpoints.
- Playwright trace.
- Console errors and warnings.
- Relevant failed network requests and stable error codes.
- Redacted test-API state needed to prove the assertion.
- Likely failure boundary.
- Suggested next investigation step.
- Known limitation or follow-up when applicable.

Evidence must not contain:

- Real personal data.
- Guest email values where ordinary diagnostic policy excludes them.
- Raw session, share, internal-service, or signed-asset tokens.
- Signed URLs or object-storage credentials.
- Raw scene, Yjs, rejected-draft, image, or audio content unless an isolated security review explicitly requires and protects it.

Evidence may be retained by the CI or QA artifact mechanism. It is not committed to the repository merely to prove a run occurred.

---

# 27. Pass, failure, and flake policy

A mandatory test passes only when its assertions pass in the required environment.

Rules:

- A retry may diagnose non-determinism but does not erase the failed first attempt.
- A flaky release-blocking test is a quality defect.
- Quarantining a mandatory test does not make the release green.
- A blocked test must state the environmental blocker and remains incomplete.
- A failed optional P1 test blocks the P1 completion claim, not the MVP when the feature is removed or disabled.
- Scope reduction must remove incomplete UI claims and feature flags, not only skip tests.
- Known failures are recorded honestly with impact and reproduction evidence.

No known P0 data-loss defect, permission bypass, private-data leak, or offline-publication bypass may remain at release.

---

# 28. Security considerations

Test systems are non-production but still process room content and bearer credentials.

Required controls:

- Use synthetic identities and isolated infrastructure.
- Keep test secrets in the test environment's secret mechanism.
- Redact test logs and traces.
- Disable production test hooks.
- Avoid recording raw URLs containing invitation tokens.
- Do not reuse production buckets, databases, or sessions.
- Restrict any test reset capability to the isolated environment.
- Preserve server-authoritative permission checks in every test profile.
- Treat downloaded recovery artifacts as private local data.

Test convenience must never weaken the production security architecture.

---

# 29. Known limitations

The MVP strategy accepts:

- Chromium-first browser automation, with Firefox and Safari tested where time permits.
- Browser-dependent audio recording and fake-media support.
- Behavioural performance acceptance rather than a formal frame-rate or latency SLO.
- No production-scale load or long-duration soak test.
- No multi-region or distributed-failure testing.
- No claim that IndexedDB is encrypted at rest.
- No complete retest of Excalidraw internals.
- Screenshot evidence that supports but does not replace state assertions.
- Recovery only on the same browser profile and device under the accepted offline policy.

These limitations do not permit skipping mandatory privacy, permission, asset, collaboration, or offline-recovery evidence.

---

# 30. Definition of done

The testing and quality strategy is implemented successfully when:

- Every P0 and protected offline requirement maps to an appropriate automated test level.
- Strict TDD targets have focused regression tests.
- Unit and integration suites cover the high-risk policy and runtime boundaries.
- Full-stack Playwright tests use isolated multi-client browser contexts.
- QA-Intel independently validates all mandatory scenarios.
- Authorised offline reconciliation and permission-revoked rejected-draft recovery both pass.
- Private image and audio flows pass success, permission, and failure tests.
- The 100-element, two-client representative scene remains demonstrably usable.
- Stable selectors and redacted inspection hooks support reliable assertions.
- Production builds cannot expose the test API.
- Evidence contains the required diagnostic context without private data or secrets.
- No known P0 data-loss, permission-bypass, privacy, or offline-publication defect remains.
- Conditional P1 tests gate only the capabilities claimed complete.
- Known limitations and failures are recorded honestly.

---

# 31. Final quality policy

The MVP is release-ready only when P0 behaviour, mandatory QA-Intel evidence, and the protected offline-recovery differentiator pass together. Tests inspect the canonical Excalidraw and Yjs collaboration path through stable redacted projections; they never create a second scene model or bypass server authority. Optional P1 capabilities carry their own completion tests but remain subordinate to the mandatory release gate.

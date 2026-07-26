# Contract Documentation Index

**Document path:** `docs/contracts/README.md`

**Document status:** Proposed

**Product phase:** Two-day MVP / Hackathon

**Last updated:** 26 July 2026

**Primary owners:** Engineering and Architecture

---

# 1. Purpose

This index maps executable shared contracts to focused implementation
references. Contract documentation narrows representation details without
expanding accepted product behaviour or changing architectural ownership.

---

# 2. Index

| No. | Document | Executable owner | Status |
| ---: | --- | --- | --- |
| 01 | [Foundation Contracts](./01-foundation-contracts.md) | `packages/contracts` and `packages/config` | Proposed |
| 02 | [Local Persistence and Readiness](./02-local-persistence-and-readiness.md) | Root infrastructure, `packages/database`, API, and collaboration | Proposed |
| 03 | [General Testing Foundation](./03-general-testing-foundation.md) | `packages/test-utils`, root test harness, Vitest, and Playwright | Proposed |
| 04 | [Non-Production Canvas Inspection API](./04-non-production-canvas-test-api.md) | `apps/web`, `packages/config`, Vite, and Playwright | Proposed |

Accepted product, architecture, and ADR documents remain authoritative when a
contract reference conflicts with them.

---

# 3. Maintenance

Update this index and the [main documentation index](../README.md) when a
contract reference is added, renamed, superseded, deprecated, or removed.
Every documented shape must be backed by runtime validation and focused tests.

---

# 4. Definition of done

This index is complete when every documented contract resolves to an executable
public export, relative links resolve, ownership is unambiguous, and no
speculative post-Stage 0 behaviour is presented as implemented.

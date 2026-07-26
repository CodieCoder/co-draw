# Task-Level Implementation Plan Index

## Real-Time Collaborative Infinite Canvas

**Document path:** `docs/planning/plans/README.md`

**Document status:** Accepted

**Product phase:** Two-day MVP / Hackathon

**Last updated:** 26 July 2026

**Primary owners:** Product, Engineering, and QA

---

# 1. Purpose

This is the canonical index and lifecycle convention for task-level implementation plans.

Task-level plans turn a bounded part of the proposed [MVP Implementation Plan](../01-mvp-implementation-plan.md) into executable work. They preserve implementation decisions, scope, dependencies, verification gates, and status outside transient chat or attachment history.

Task-level plans do not create product requirements or silently override accepted architecture. Where a task plan conflicts with an accepted source, the accepted source governs and the task plan must be corrected before implementation continues.

Use the accepted [Task-Level Implementation Plan Template](./TEMPLATE.md) when creating or materially restructuring a plan.

---

# 2. Scope

This directory contains bounded implementation plans for:

- One stage or stage increment.
- One or more related work packages.
- A focused implementation decision and its required evidence.
- Follow-up work that must retain its own historical scope and status.
- One durable objective that Codex Goal mode can execute to a verifiable stopping condition.

The cross-stage dependency sequence remains authoritative in the parent [MVP Implementation Plan](../01-mvp-implementation-plan.md).

---

# 3. Plan index

| No. | Plan | Parent plan | Work packages | Document status | Execution status |
| ---: | --- | --- | --- | --- | --- |
| 0001 | [Stage 0A — Monorepo Scaffold and Executable Contracts](./0001-stage-0a-monorepo-scaffold-and-executable-contracts.md) | [MVP Implementation Plan](../01-mvp-implementation-plan.md) | `FND-001`, `FND-002` | Proposed | Passed |
| 0002 | [Stage 0B — Local Persistence Infrastructure and Truthful Readiness](./0002-stage-0b-local-persistence-infrastructure-and-readiness.md) | [MVP Implementation Plan](../01-mvp-implementation-plan.md) | `FND-003` | Proposed | Passed |
| 0003 | [Stage 0B Review Remediation](./0003-stage-0b-review-remediation.md) | [Stage 0B](./0002-stage-0b-local-persistence-infrastructure-and-readiness.md) | `FND-003` | Proposed | Passed |
| 0004 | [Stage 0C — General Testing Foundation](./0004-stage-0c-general-testing-foundation.md) | [MVP Implementation Plan](../01-mvp-implementation-plan.md) | `FND-004` | Proposed | Passed |
| 0005 | [Stage 0D — Non-Production Canvas Inspection Boundary](./0005-stage-0d-non-production-canvas-test-api.md) | [MVP Implementation Plan](../01-mvp-implementation-plan.md) | `FND-005` | Proposed | Passed |
| 0006 | [Stage 0E — Clean-Environment Onboarding and Continuous Validation](./0006-stage-0e-clean-environment-onboarding-and-ci.md) | [MVP Implementation Plan](../01-mvp-implementation-plan.md) | `FND-006` | Proposed | Passed |

---

# 4. Plan mode and Goal mode contract

Plan mode and Goal mode have different responsibilities:

| Surface | Responsibility |
| --- | --- |
| `/plan` | Clarify the outcome, inspect authoritative context, resolve material ambiguity, define proof, and persist the resulting task-level plan. |
| Persisted task plan | Own the complete scope, constraints, execution steps, status, evidence matrix, and definition of done. |
| `/goal` | Execute one durable objective against the persisted plan until its verifiable stopping condition is proven. |
| In-chat task plan | Show the current execution projection. It does not replace the persisted plan. |

The workflow is:

```text
/plan
→ Inspect and clarify
→ Save the next numbered task plan
→ Index it
→ Pass the plan-readiness gate
→ /goal points to the exact plan path
→ Goal agent executes checkpoints and records evidence
→ Completion audit
→ Execution status becomes Passed
```

Codex guidance for [following a goal](https://learn.chatgpt.com/use-cases/follow-goals), [long-running work](https://learn.chatgpt.com/docs/long-running-work), and [developer commands](https://learn.chatgpt.com/docs/developer-commands?surface=cli) recommends one objective and stopping condition, authoritative inputs, proof commands or artifacts, checkpoints, and a short progress record. It also recommends putting longer instructions in a file and pointing `/goal` at that file.

Task plans and handoffs must remain model- and provider-neutral. They must not
depend on hidden chat history, unstated model defaults, or agent memory. Every
material implementation choice must be either fixed in the plan or bounded by
explicit selection criteria and a required evidence record. On an execution
surface without `/goal`, use the handoff text as the task objective without the
command prefix.

---

# 5. Naming and history

Task-plan filenames use a four-digit, monotonically increasing number followed by a concise kebab-case title:

```text
NNNN-plan-title.md
```

Rules:

1. Start at `0001` and allocate the next unused number.
2. Never reuse or reassign a number.
3. Never overwrite a materially different historical plan.
4. Update an existing plan only when refining or executing the same bounded outcome.
5. Create a new numbered plan when scope, ownership, or the intended outcome changes materially.
6. Keep superseded, deprecated, deferred, and passed plans for traceability.
7. Add, rename, or remove a plan only when this index is updated in the same change.

---

# 6. Required metadata

Every task-level plan must record:

- Document path.
- Document status.
- Execution status.
- Parent plan.
- Applicable work packages.
- One outcome-focused goal objective.
- One verifiable completion statement.
- Last updated date.
- Primary owners.

Document status uses the repository vocabulary:

| Status | Meaning |
| --- | --- |
| `Proposed` | Available for review but not authoritative for a new decision. |
| `Accepted` | Authoritative within its stated responsibility until explicitly superseded. |
| `Superseded` | Retained for traceability but replaced by a linked accepted source. |
| `Deprecated` | No longer recommended and awaiting removal or archival. |

Execution status uses the planning vocabulary:

| Status | Meaning |
| --- | --- |
| `Not started` | Implementation has not begun and readiness has not been established. |
| `Ready` | Dependencies, acceptance criteria, ownership, and tests are known. |
| `In progress` | Implementation or verification is active. |
| `Blocked` | A named dependency or decision prevents safe progress. |
| `Passed` | Implementation and every required evidence gate in the plan pass. |
| `Deferred` | Explicitly outside the active mandatory sequence. |
| `Removed` | Deliberately removed under accepted scope-control rules. |

Document and execution status are independent. A `Proposed` plan may be `Ready` for review, but implementation authority still follows the parent plan, accepted sources, and the user's requested work.

---

# 7. Goal-readiness gate

A plan may use execution status `Ready` only when:

- It defines one outcome and one verifiable stopping condition.
- Its authoritative inputs exist and all material contradictions are resolved.
- It is self-contained and model-neutral: no required instruction exists only
  in chat, and no material choice relies on a provider-specific default.
- Known runtime, dependency-install, local-service, network, and approval
  prerequisites are explicit; unverified environment state remains an
  assumption to check during execution.
- Included, excluded, and allowed incidental changes are explicit.
- Deliverables have clear owning boundaries.
- Execution steps have stable IDs, real dependencies, concrete outputs, and proof.
- Required data or control flows are defined.
- Failure, recovery, permission, and privacy behaviour are explicit.
- Every definition-of-done item maps to a row in the evidence matrix.
- No unresolved decision can materially change the implementation path or completion criteria.
- The ready-to-run `/goal` handoff names the exact persisted plan path and fits within the command's objective limit.

If any item is missing, use `Not started` rather than `Ready`.

---

# 8. Lifecycle

1. Create the plan with document status `Proposed`.
2. Set execution status to `Ready` only after the [goal-readiness gate](#7-goal-readiness-gate) passes.
3. Obtain any required review or acceptance before implementation.
4. Start Goal mode with the plan's ready-to-run handoff objective.
5. Change execution status to `In progress` before the first implementation mutation.
6. Keep execution-step status, decisions, blockers, progress, and evidence current at meaningful checkpoints.
7. Change execution status to `Passed` only after the plan's completion audit proves every listed completion gate.
8. Use `Blocked`, `Deferred`, or `Removed` only with a concrete reason and scope consequence.
9. Preserve the final plan, execution record, and evidence links for historical traceability.

---

# 9. Required plan content

Each goal-ready plan must define:

- Purpose.
- One goal objective, one completion statement, and a ready-to-run goal handoff.
- Authoritative sources and parent-plan relationship.
- Included, excluded, and allowed incidental changes.
- Current-state facts and assumptions that require verification.
- Runtime and package responsibilities.
- Deliverables and owning boundaries.
- Dependency-ordered execution steps with stable IDs, concrete outputs, proof, and status.
- Data or control flows.
- Failure behaviour.
- Security and privacy considerations.
- Required test levels and a requirement-to-evidence matrix.
- A concise progress, decision, and blocker record.
- Documentation updates.
- Definition of done.
- A final completion-audit procedure.

Implementation choices must remain visibly proposed until accepted or embodied in reviewed executable configuration and contracts.

---

# 10. Goal execution rules

The goal agent must:

- Treat the persisted plan as the durable execution contract.
- Project only the current checkpoints into its in-chat task plan.
- Preserve the original objective and scope across turns.
- Run a preflight before the first implementation mutation: inspect the
  worktree, verify pinned tool versions, and identify required local services,
  network access, or approvals.
- Update the persisted plan at meaningful checkpoints rather than relying on chat history.
- Verify assumptions before treating them as facts.
- Keep at most one execution step `In progress` unless the plan explicitly authorizes isolated parallel work.
- Record the exact blocker and evidence instead of weakening a requirement.
- Continue safe in-scope work while useful progress remains.
- Perform the plan's completion audit before claiming the goal complete.

Starting a goal does not broaden filesystem, network, approval, external-action, destructive-action, or Git authority. Those boundaries remain controlled by the user and repository instructions.

---

# 11. Failure and security rules

If a task plan conflicts with accepted product scope, architecture, an ADR, or the parent plan:

1. Stop the affected implementation.
2. Name the conflicting sources and statuses.
3. Correct the proposed plan or obtain explicit approval for an authoritative documentation change.
4. Update affected indexes and cross-references in the same change.

Task plans, examples, and evidence must not contain real guest email, credentials, tokens, signed URLs, raw private scenes, Yjs updates, recovery content, or binary bodies.

No plan may introduce a second canvas model, client-authoritative permission, public asset fallback, or unauthorised offline publication.

---

# 12. Validation requirements

When a task-level plan changes:

- Confirm its scope traces to the parent plan and accepted requirements.
- Confirm all local relative links resolve.
- Confirm filenames and index entries are sequential and consistent.
- Confirm document and execution statuses match the plan and index.
- Run the goal-readiness gate when execution status is `Ready`.
- Confirm every definition-of-done item has appropriately scoped evidence.
- Search for contradictory technology, ownership, priority, and privacy choices.
- Run `git diff --check`.
- Run code tests only when executable behaviour also changes.

---

# 13. Definition of done

This index is complete when:

- Every task-level plan appears exactly once.
- The reusable template and goal handoff convention remain current.
- Filenames, titles, parent plans, work packages, owners, and statuses match.
- Plans remain subordinate to accepted product and architecture sources.
- Plan history cannot be lost by overwriting a materially different task.
- `Ready` means the complete goal-readiness gate passes.
- Execution status cannot reach `Passed` without the plan's required evidence.
- A goal agent can execute a ready plan from its handoff objective without relying on hidden chat context.
- Reading paths and relative links resolve.

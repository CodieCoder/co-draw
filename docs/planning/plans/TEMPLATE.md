# Task-Level Implementation Plan Template

## Real-Time Collaborative Infinite Canvas

**Document path:** `docs/planning/plans/TEMPLATE.md`

**Document status:** Accepted

**Last updated:** 26 July 2026

**Primary owners:** Product, Engineering, and QA

---

# 1. Purpose

Use this template to create a persisted task-level plan that can be handed directly to Codex Goal mode.

A goal-ready plan is an execution contract. It tells the goal agent:

- The exact outcome to achieve.
- The boundaries it must preserve.
- The files and decisions it must treat as authoritative.
- The ordered checkpoints it can execute.
- The proof required for each checkpoint.
- The single verifiable condition at which it may stop.

The plan must be executable without hidden chat context or provider-specific
model behaviour. Fix every material choice in the plan, or give bounded
selection criteria and require the selected artifact to be recorded.

Copy the plan skeleton below into the next numbered file described by the [Task-Level Implementation Plan Index](./README.md). Replace every bracketed placeholder and remove guidance that does not apply.

---

# 2. Plan skeleton

# [Plan title]

**Document path:** `docs/planning/plans/NNNN-concise-plan-title.md`

**Document status:** Proposed

**Execution status:** Not started

**Parent plan:** [Repository-relative link]

**Applicable work packages:** `[ID-001]`

**Goal objective:** [One outcome-focused sentence.]

**Completion statement:** [One sentence describing the externally verifiable stopping condition.]

**Last updated:** [Day Month Year]

**Primary owners:** [Roles or teams]

---

# 1. Purpose

Explain why this bounded plan exists and what parent-plan outcome it advances.

Do not use this section as a feature list. The goal objective and scope own what will be implemented.

---

# 2. Goal contract

## 2.1 Objective

State the result to achieve, not merely the activity to perform.

Good:

> The three application shells build, start, report truthful health, and pass the documented foundation contract gates.

Weak:

> Work on the application scaffold.

## 2.2 Completion statement

Define one stopping condition that can be proven from the completed evidence matrix.

The statement must not rely on:

- Effort expended.
- A turn ending.
- A token or time budget being nearly exhausted.
- A narrow test that does not cover the full objective.
- The absence of an obvious error.

## 2.3 Goal handoff

Provide a ready-to-run objective that points to this persisted file:

```text
/goal Implement the persisted plan at docs/planning/plans/NNNN-concise-plan-title.md in full. Treat its scope, constraints, execution steps, evidence matrix, and definition of done as the execution contract. Change execution status to In progress before the first implementation mutation, keep the plan's execution record current, and preserve unrelated user changes. Do not mark the goal complete until every required item is implemented and the completion audit proves every definition-of-done item.
```

Keep the `/goal` objective concise. Put implementation detail in the plan rather than duplicating it in the command.

Do not name the executing model or provider unless that identity is itself part
of the product contract. An execution surface without `/goal` should use the
same handoff text without the command prefix.

---

# 3. Authoritative sources and constraints

List the repository-relative sources that govern the work:

- [Parent implementation plan](../01-mvp-implementation-plan.md).
- [Applicable accepted product requirement].
- [Applicable accepted architecture].
- [Applicable ADR].
- [Repository instructions](../../../AGENTS.md).

Then state the invariants that every execution step must preserve.

If a proposed plan conflicts with an accepted source, record the conflict and resolve it before setting execution status to `Ready`.

---

# 4. Scope

## 4.1 Included

List concrete deliverables and behaviours included in this plan.

## 4.2 Excluded

List adjacent work that the goal agent must not implement.

## 4.3 Allowed incidental changes

Name ordinary supporting changes the goal agent may make without expanding scope, such as:

- Tests for changed behaviour.
- Documentation for changed commands or contracts.
- Generated lockfiles or migration artifacts required by an included deliverable.

Do not use incidental changes to authorize a materially different product feature, architecture, external action, or destructive operation.

---

# 5. Current state and assumptions

Record only facts that affect execution:

- Existing files or implementation baseline.
- Known local tool versions.
- Dependency-install, local-service, network, or approval prerequisites.
- Existing user changes that must be preserved.
- Decisions already resolved.
- Assumptions the agent must verify before relying on them.

An existing dependency directory or generated artifact does not prove that the
active toolchain and required services are correct. An unverified assumption
cannot serve as completion evidence.

---

# 6. Deliverables and ownership

| Deliverable | Owning boundary | Required output |
| --- | --- | --- |
| `[Deliverable]` | `[Application, package, or document]` | `[File, behaviour, or artifact]` |

Each deliverable must have one clear owner. Derived, cached, ephemeral, and authoritative state must remain distinguishable.

---

# 7. Execution steps

| Step | Action | Depends on | Required outputs | Verification | Status |
| --- | --- | --- | --- | --- | --- |
| `P-01` | [Bounded action] | None | [Files or behaviour] | [Command or inspection] | Not started |
| `P-02` | [Bounded action] | `P-01` | [Files or behaviour] | [Command or inspection] | Not started |

Step rules:

- Use stable step IDs.
- Order steps by real dependency.
- Keep each step small enough to verify independently.
- Name the concrete output rather than saying only "implement" or "finish."
- Name the command, artifact, or inspection that proves the step.
- Use `Not started`, `Ready`, `In progress`, `Blocked`, `Passed`, `Deferred`, or `Removed`.
- Record a blocker rather than weakening a requirement or silently changing scope.

The goal agent may project the current steps into its in-chat task plan. The persisted file remains the durable execution contract.

---

# 8. Data and control flows

Describe every cross-boundary flow that is material to implementation or verification.

Use compact text flows:

```text
Input
→ Owning boundary validates
→ Authoritative state changes
→ Derived output is produced
OR
→ Stable safe failure is returned
```

State explicitly which data is authoritative, cached, derived, and ephemeral.

---

# 9. Failure and security behaviour

Define:

- Fail-open versus fail-closed behaviour.
- State preserved after partial failure.
- Retry, rollback, or recovery boundaries.
- Data that must never enter public output, logs, evidence, or generated artifacts.
- Permissions or approvals required before sensitive or destructive actions.
- The exact condition that should be recorded as a blocker.

Failure handling is part of the deliverable, not optional follow-up work.

---

# 10. Testing and evidence

## 10.1 Required test levels

List the unit, integration, browser, compatibility, performance, security, documentation, or manual review levels that apply.

## 10.2 Evidence matrix

| Requirement | Done condition | Proof command or artifact | Result | Evidence |
| --- | --- | --- | --- | --- |
| `[REQ-01]` | [Observable condition] | `[Exact command or path]` | Pending | Pending |

Evidence rules:

- Every definition-of-done item maps to at least one evidence row.
- A command proves only the behaviour its assertions actually cover.
- Record the command and result; do not paste secrets or unbounded logs into the plan.
- A skipped, quarantined, flaky, partial, or unrun mandatory check is not passing evidence.
- Use `Pending`, `Passed`, `Failed`, or `Blocked` in the result column.
- Link durable evidence where the project stores it; otherwise record a concise result and date.

---

# 11. Execution record

## 11.1 Progress log

Update this log at meaningful checkpoints, not after every command.

| Date | Checkpoint | Outcome | Verification | Next step |
| --- | --- | --- | --- | --- |
| [Date] | Plan prepared | Ready for review | Plan-readiness audit | Start `P-01` after authorization |

## 11.2 Decisions and blockers

| ID | Type | Description | Evidence | Resolution |
| --- | --- | --- | --- | --- |
| `[DEC-01]` | Decision | [Resolved choice] | [Source] | [Implemented record] |
| `[BLK-01]` | Blocker | [Exact blocking condition] | [Reproduction or missing authority] | Open |

Do not rewrite the original goal to make a blocker disappear.

---

# 12. Documentation updates

List every source of truth, index, runbook, example, contract reference, or generated-artifact policy that must change with the implementation.

Documentation completion must be verified alongside executable behaviour.

---

# 13. Definition of done

Use binary, outcome-based statements:

Append one or more evidence-row IDs to every checkbox, for example: `- [ ] The supported path returns the accepted result. (REQ-01)`.

- [ ] Every included deliverable exists at its owning boundary.
- [ ] Every required behaviour is observable through the supported path.
- [ ] Every mandatory failure and security behaviour is verified.
- [ ] Every required test and validation gate passes without skipped mandatory coverage.
- [ ] The evidence matrix has no `Pending`, `Failed`, or `Blocked` mandatory row.
- [ ] Documentation and indexes match the implemented state.
- [ ] No excluded work is claimed complete.
- [ ] No unresolved question or blocker prevents the goal objective.
- [ ] The final diff preserves unrelated user changes and contains no unintended artifact.

Add plan-specific outcomes after these common gates.

---

# 14. Completion audit

Before changing execution status to `Passed` or allowing the goal to complete:

1. Re-read the goal objective, included scope, exclusions, and every explicit deliverable.
2. Map each definition-of-done item to current authoritative evidence.
3. Inspect the actual files, runtime behaviour, commands, and artifacts named by that evidence.
4. Treat missing, stale, narrow, indirect, or uncertain evidence as incomplete.
5. Resolve every mandatory `Pending`, `Failed`, or `Blocked` row.
6. Review the complete diff and preserve unrelated user changes.
7. Update the execution steps, evidence matrix, progress log, document date, and task-plan index.
8. Change execution status to `Passed` only when the full objective and stopping condition are proven.

The final handoff must summarize:

- Files and behaviour delivered.
- Decisions made.
- Required validation and results.
- Remaining optional or deferred work.
- Any known limitation that does not contradict completion.

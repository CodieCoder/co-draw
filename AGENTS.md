# AGENTS.md

## Project

This repository contains a real-time collaborative infinite-canvas web application.

The application uses Excalidraw as its drawing and interaction engine. It must not implement a second canvas scene model or replace Excalidraw with a custom renderer.

## Sources of truth

Before making architectural, planning, or implementation changes, read the relevant documents under:

- `docs/README.md`
- `docs/product/`
- `docs/architecture/`
- `docs/adr/`
- `docs/planning/`
- `docs/planning/plans/`

Start with:

- `docs/README.md`
- `docs/product/README.md`
- `docs/product/01-product-requirements.md`
- `docs/product/02-mvp-scope-and-acceptance-criteria.md`
- `docs/architecture/01-system-architecture.md`
- `docs/planning/README.md`
- `docs/planning/01-mvp-implementation-plan.md`

Read additional documents related to the task before editing files.

Before implementation, read the applicable task-level plan under `docs/planning/plans/` when one exists.

Files under `resources/` and the superseded `docs/00-Project description.md` are historical source material. They are non-authoritative and must not override accepted documentation.

## Toolchain and package-manager rules

- This is a pnpm-only workspace. Do not use npm, Yarn, or Bun to install dependencies or run repository scripts.
- Before executable work, activate the runtime from `.nvmrc` and verify the exact versions with `node --version` and `corepack pnpm --version`.
- Prefer `corepack pnpm <command>` so execution does not depend on a globally installed pnpm binary or an nvm-version-specific Corepack shim.
- If an interactive shell needs plain `pnpm`, run `corepack enable pnpm` after selecting the pinned Node version and then refresh the shell command cache with `hash -r`.
- Do not treat an existing `node_modules` directory as proof that the active runtime or package-manager binary is correct.
- If npm reports unknown `.npmrc` settings or Turbo cannot find the package-manager binary, correct the active Node/Corepack setup; do not regenerate the lockfile or change pnpm configuration as a workaround.

## Core architectural decisions

- Excalidraw is the only canvas rendering and editing engine.
- The Excalidraw scene is the canonical canvas scene.
- Do not duplicate the complete scene in React state, Zustand, PostgreSQL, or another application model.
- Yjs and Hocuspocus provide collaborative scene synchronization.
- Yjs Awareness provides ephemeral presence.
- PostgreSQL stores application and authorization data.
- Object storage stores image, audio, and export binaries.
- IndexedDB supports local collaborative persistence and offline recovery.
- Matter.js provides temporary physics simulation.
- Physics results are converted into ordinary Excalidraw element transforms.
- Permissions are enforced by the API and collaboration server, not only by the frontend.
- Guest email is private and must never appear in awareness, scene data, exports, or public room interfaces.

## Documentation rules

When creating or updating documentation:

1. Treat existing accepted documents as authoritative unless the task explicitly changes a decision.
2. Identify contradictions before introducing new decisions.
3. Keep mandatory MVP requirements separate from post-MVP features.
4. Do not add unnecessary infrastructure or enterprise complexity.
5. Use complete, implementation-oriented Markdown.
6. Include:
   - purpose
   - scope
   - responsibilities
   - data or control flows
   - failure behaviour
   - security considerations
   - testing requirements
   - definition of done
7. Cross-reference related documents using repository-relative links.
8. Update the relevant folder index when files are added, renamed, or removed.
9. Do not silently change previously accepted architecture.
10. Record significant new architectural decisions as ADRs.
11. Persist task-level implementation plans under `docs/planning/plans/`, use the sequential four-digit filename convention, and update `docs/planning/plans/README.md` in the same change. Keep `docs/planning/README.md` linked to that canonical task-plan index rather than duplicating individual plan entries. Do not leave an implementation plan only in chat or attachment history.

## Task plans and goal execution

- Create or materially restructure task-level plans from `docs/planning/plans/TEMPLATE.md`.
- A plan may be marked `Ready` only after the goal-readiness gate in `docs/planning/plans/README.md` passes.
- Every ready plan must contain one outcome-focused goal objective, one verifiable completion statement, a ready-to-run `/goal` handoff, dependency-ordered execution steps, and a requirement-to-evidence matrix.
- `/goal` should point to the exact persisted plan path instead of duplicating the full plan in chat.
- When implementation begins, change execution status to `In progress` and keep step status, decisions, blockers, progress, and evidence current at meaningful checkpoints.
- Do not change execution status to `Passed` or claim the goal complete until the plan's completion audit proves every definition-of-done item.
- Starting a goal does not broaden authorization for external writes, destructive actions, Git operations, deployment, or scope expansion.

## Document status

Use one of:

- Proposed
- Accepted
- Superseded
- Deprecated

Existing architecture documents without a final review should remain Proposed or Draft.

## Writing style

- Be precise and direct.
- Prefer concrete rules over generic advice.
- Define ownership of state and responsibility.
- Distinguish authoritative state from cached, derived, and ephemeral state.
- Avoid repeating entire sections from other documents.
- Link to the authoritative document instead.
- Use TypeScript examples where interfaces clarify the design.
- Do not fabricate APIs or features that contradict product scope.

## Validation

After documentation changes:

- Check Markdown structure.
- Check relative links where tooling exists.
- Search for contradictory technology choices.
- Search for accidental private-data exposure.
- Confirm the document numbering and filenames are consistent.
- Review `git diff`.
- Summarize files created, decisions added, unresolved questions, and validation performed.

## Git policy

- Do not overwrite unrelated user changes.
- Keep documentation changes in focused commits.
- Do not amend an existing commit unless explicitly requested.
- Do not push or open a pull request unless explicitly requested.

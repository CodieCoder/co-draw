# AGENTS.md

## Project

This repository contains a real-time collaborative infinite-canvas web application.

The application uses Excalidraw as its drawing and interaction engine. It must not implement a second canvas scene model or replace Excalidraw with a custom renderer.

## Sources of truth

Before making architectural, planning, or implementation changes, read the relevant documents under:

- `docs/product/`
- `docs/architecture/`
- `docs/adr/`
- `docs/planning/`

Start with:

- `docs/product/01-product-requirements.md`
- `docs/product/02-mvp-scope-and-acceptance-criteria.md`
- `docs/architecture/01-system-architecture.md`

Read additional documents related to the task before editing files.

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

# Historical Source Materials

## Status and authority

Files under `resources/` are historical inputs retained for provenance and comparison.

They are not authoritative product requirements, architecture, contracts, implementation plans, or release criteria.

Current authority begins at the [Documentation Index](../docs/README.md), with product scope under [`docs/product/`](../docs/product/README.md), architecture under [`docs/architecture/`](../docs/architecture/README.md), and accepted decisions under [`docs/adr/`](../docs/adr/README.md).

---

## Contents

This directory may contain:

- Original or intermediate product documents.
- Source-format documents such as `.docx`.
- Imported Markdown.
- Archives such as `.zip`.
- Reference material used to prepare the accepted baseline.

Different files may contain obsolete priorities, terminology, technology suggestions, or incomplete privacy and permission rules.

---

## Usage rules

Historical material may be used to:

- Trace the origin of a requirement.
- Compare an accepted document with earlier drafts.
- Recover source formatting or context.

It must not be used to:

- Override accepted documentation.
- Add implementation scope without product review.
- Select a conflicting technology.
- Weaken server-authoritative permissions or private-data controls.
- Reintroduce a custom canvas engine or a second durable scene model.

When historical material suggests a missing requirement, treat it as a proposal and reconcile it against the accepted product and architecture documents before implementation.

---

## Security and privacy

Do not add production credentials, real guest identities, raw session or share tokens, signed URLs, private storage keys, or rejected offline draft content to this directory.

Historical examples are not approved test fixtures merely because they are stored in the repository.

---

## Definition of done

This notice is effective when:

- `resources/` is identified as non-authoritative from the master documentation index and repository instructions.
- Historical files remain available without being presented as current requirements.
- Coding agents are directed to accepted sources before planning or implementation.

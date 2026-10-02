# ADR-0063: Release notes in two levels — "What's new" in the app, a changelog for developers

**Status:** Accepted
**Date:** 2026-10-03
**Slice:** cross-cutting
**Refines:** —
**Category:** Process & product decisions

## Context

The app showed `v3/src/lib/changelog.ts` as its changelog — one entry per push, written as commit
messages. Measured 2026-10-03: 113 entries with 132 items, 91 of them in commit style
("fix(…): …"), 73 purely internal (documentation, tests, CI). The owner found it unreadable: single
words and fragments. The pre-push hook requires a new version per push, and ten stacked branches
carry entries in that format, so its shape cannot change without breaking every merge.

## Decision

Two levels, two files:

- **What's new** — `v3/src/lib/whatsNew.ts`, written by hand for the people who use the app, shown
  in the app. Only changes they can notice, in plain words, saying what they can now do; grouped
  per version as **New / Improved / Fixed / Removed**. No commit types, plan names or technical
  terms. Early history is condensed into one entry for the first playable version.
- **Changelog** — `v3/src/lib/changelog.ts` stays the per-push record for developers. Every item
  starts with a Conventional Commits type (ADR-0060). `CHANGELOG.md` is generated from it in the
  Keep a Changelog layout: per version, the items grouped as Added (`feat`), Fixed (`fix`),
  Changed (`perf`, `refactor`, `a11y`, `security`) and Internal (`docs`, `test`, `ci`, `build`,
  `chore`, `style`).

Checked by `v3/tests/unit/whatsNew.test.ts`: plain-language texts (full sentences, no commit
types, no technical terms), versions that exist in the changelog, newest first; from this ADR on,
every version whose changelog has a user-facing change (`feat`, `fix`, `perf`, `a11y`, except the
scopes `test`, `ci`, `docs`, `build`) has a What's new entry. And every changelog item carries a
Conventional Commits type.

Sources: Keep a Changelog 1.1.0 — "Changelogs are for humans, not machines", "The same types of
changes should be grouped", "Using commit log diffs as changelogs is a bad idea: they're full of
noise"; release-note practice — "translate 'what we built' into 'what you get'", "Drop codenames,
ticket IDs, and jargon from user-facing notes" (Archbee, release-notes.dev).

**Deviation:** Keep a Changelog has no "Internal" group. The developer changelog keeps internal
changes (the owner wants them visible there) under their own heading; the app never shows them.
Versions are one per push (3.0.N) — not Semantic Versioning, stated in `CHANGELOG.md`.

## Consequences

**Positive:**

- The app tells people what changed for them, in their words.
- Developers keep a complete, grouped record, generated, never typed twice.

**Negative / Trade-offs:**

- A user-facing change is written twice — as a commit-style item and as a What's new sentence.
  The check makes sure the second is not forgotten.

## Alternatives considered

- **One changelog, reworded:** internal changes would stay visible in the app — rejected by the
  owner.
- **Changing the format of `changelog.ts`:** would break the merge of every stacked branch — not
  taken.

## Related

- **Files:** `v3/src/lib/whatsNew.ts`, `v3/src/lib/changelog.ts`, `v3/scripts/sync-changelog.ts`,
  `v3/src/screens/StartScreen.tsx`, `v3/tests/unit/whatsNew.test.ts`
- **ADRs:** ADR-0060 (commit message convention)

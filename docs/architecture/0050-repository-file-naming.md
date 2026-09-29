# ADR-0050: Repository file naming

**Status:** Accepted
**Date:** 2026-09-29
**Slice:** cross-cutting
**Refines:** ADR-0047
**Category:** Prozess- & Produktentscheidungen

## Context

The repository had grown three naming styles side by side: `UPPER_SNAKE.md` in the root
(`BACKLOG.md`, `TESTING.md`, `DESIGN_SYSTEM_CHEATSHEET.md`, `V3_CONCEPT_BRIEF.md`),
uppercase files inside `docs/` (`PRODUCT.md`, `MANUAL_IPHONE_CHECKLIST.md`), and
lowercase-kebab leaves (`pad.md`, ADRs). Design downloads lived in root folders named
`SoS_DESIGN_<DDMMYYYY>` — a date format that does not sort. The public GitHub page is read
by prospective clients and colleagues, so the structure has to look deliberate.

Mixed case is also a technical risk: macOS file systems ignore case, Linux (CI, GitHub
Pages) does not. A link to `TESTING.md` for a file `testing.md` works locally and breaks
after the push. This happened during the rename itself — a supposedly broken probe link
passed the local link check.

## Decision

1. **Repository root:** only standard files — `README.md`, `LICENSE`, `CHANGELOG.md`,
   `CLAUDE.md` (Claude Code loads exactly this name). All other documentation lives in
   `docs/`.
2. **`docs/`:** file names in **lowercase-kebab** (`design-system.md`, `testing.md`).
   Allowed exceptions: `README.md` (hub / folder entry, rendered by GitHub when the folder
   is opened) and `_template.md`. ADRs keep `NNNN-title.md` (Nygard / MADR convention).
3. **Hubs are `README.md`** of their folder (refines ADR-0047, which named them
   `PRODUCT.md`, `DESIGN.md`, `ARCHITECTURE.md`, `DEVELOPMENT.md`): `docs/README.md` is the
   documentation entry point, `docs/product/README.md` the product hub, and so on.
4. **Dates in names:** ISO 8601 (`YYYY-MM-DD`). Claude Design downloads go to
   `design-sources/<YYYY-MM-DD>/`; file names inside stay as delivered.
5. **`CHANGELOG.md` is generated** from `v3/src/lib/changelog.ts` (`npm run sync:changelog`,
   part of `sync:docs`) — answers ADR-0047's open question: one source, never stale.
6. **Enforced** by `v3/tests/unit/docsGuards.test.ts`: root allowlist, lowercase-kebab in
   `docs/`, ISO-dated design folders, every relative Markdown link resolves with exact case,
   README states the Node version from `.nvmrc` and the live URL from the Vite base.

Mapping applied on 2026-09-29: `BACKLOG.md` → `docs/backlog.md`, `TESTING.md` →
`docs/development/testing.md`, `V3_CONCEPT_BRIEF.md` → `docs/architecture/concept-brief.md`,
`DESIGN_SYSTEM.md` / `DESIGN_SYSTEM_CHEATSHEET.md` / `DESIGN_NOTES.md` →
`docs/design/design-system.md` / `design-system-cheatsheet.md` / `design-notes.md`,
`docs/DOCUMENTATION_MAP.md` → `docs/README.md`, `docs/product/PRODUCT.md` →
`docs/product/README.md`, `docs/MANUAL_IPHONE_CHECKLIST.md` →
`docs/development/manual-iphone-checklist.md`, `docs/design/CLAUDE_DESIGN_SPEC.md` →
`docs/design/claude-design-spec.md`, `docs/analysis/FOUNDATION_ANALYSIS.md` →
`docs/analysis/foundation-analysis.md`, `SoS_DESIGN_25052026/` / `SoS_DESIGN_28092026/` →
`design-sources/2026-05-25/` / `design-sources/2026-09-28/`.

## Consequences

**Positiv:**
- One recognisable scheme; GitHub shows each area's hub when the folder is opened.
- Case-mismatch links can no longer slip through on macOS.
- The public changelog is always current.

**Negativ / Trade-offs:**
- Several files named `README.md` — editors disambiguate by folder.
- Plain-text references are longer (`docs/design/design-system.md §6` instead of
  `DESIGN_SYSTEM.md §6`).
- Historic commit messages and changelog entries keep the old names.

## Alternatives Considered

**`index.md` as hub name:** common for documentation site generators, but GitHub does not
render it automatically when a folder is opened. Rejected while GitHub is the reading
platform.

**Uppercase everywhere:** keeps old names, but perpetuates the case risk and mixes with the
lowercase ADRs and component specs. Rejected.

## Related

- **Dateien:** `v3/tests/unit/docsGuards.test.ts`, `scripts/sync-changelog.ts`,
  `docs/README.md`
- **ADRs:** ADR-0047 (documentation architecture, refined here)
- **Quelldokumente:** `docs/README.md`, `CLAUDE.md` §Reference documents
- **Commits:** see git log "(1/3)", "(2/3)", "(3/3)" on 2026-09-29

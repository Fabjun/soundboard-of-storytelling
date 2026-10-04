# ADR-0056: Documentation freshness is checked automatically

**Status:** Accepted
**Date:** 2026-09-30
**Slice:** infrastructure
**Refines:** ADR-0047
**Refined by:** ADR-0073 (American spelling, a Vale rule plus a code guard)
**Category:** Test infrastructure & workflow

## Context

During S5 (2026-09-30) stale facts and dead references were found only by chance: `testing.md`
still recommended CSS-class locators and called long-written drag tests "test.skip"; links to
renamed headings in other files passed the link check; active docs still used superseded names
("Scene", `SceneRail.tsx`, "Sets store"); code spans named files that no longer exist or were
ambiguous (`tokens.css` exists three times). The user asked for these to be kept current
automatically.

## Decision

Standards: docs-as-code — links are validated like code (`remark-validate-links`, remark /
unified), prose terminology is linted (Vale, the de facto prose linter with `substitution` /
`existence` rules), derivable facts are generated, not typed.

1. **Links and anchors** — `npm run link:check` runs `remark-validate-links` over all Markdown:
   files **and headings across files** (replaces `markdown-link-check`, which checked anchors only
   within a file and slugged raw heading text).
2. **Superseded terms** — Vale (`.vale.ini`, style `.vale/styles/SoS`, rule
   `SupersededTerms`) runs on **active** documentation in pre-commit and CI
   (`npm run lint:docs`, from the repository root). Historical records — ADRs, backlog, design
   notes, analysis snapshots, design import logs, the V1/V2 inventory — and generated files that
   quote other text are excluded in `.vale.ini`; single historical passages in active docs are
   marked `<!-- vale SoS.SupersededTerms = NO --><!-- reason: … -->` … `= YES`. Both are
   collected in the exception register (ADR-0053).
3. **Vale install** — Vale is a Go binary, not an npm package: `scripts/vale-install.ts` (run by
   `npm install` / `npm ci` via `prepare`) downloads the pinned version from the official
   release and verifies it against SHA-256 hashes pinned **in the repository**. The weekly check
   reports newer releases. The third-party npm wrapper was rejected (single maintainer, downloads
   binaries outside `npm audit`'s view).
4. **Paths in code spans exist** — in active docs, a code span that looks like a file path
   (`` `docs/…/x.md` ``, `` `v3/src/…/x.ts` ``) names a file in this repository; ambiguous short
   names are written as full paths; external or planned files are plain text. Guarded by
   `docsGuards.test.ts`, which reads the historical list from `.vale.ini` (single source).
5. **Section references are links** — a reference to a section is a link to its anchor:
   a Markdown link whose text names file and section, e.g.
   [testing.md §Flaky tests](../development/testing.md#flaky-tests-quarantine) (validated by `link:check`),
   `path.md#anchor` (repository-relative, without the section sign) in code comments and
   wherever Markdown links cannot render (HTML comments, fenced blocks). `docsGuards.test.ts`
   allows the section sign in active docs only in headings and anchored link text, bans it in
   code, and resolves every `path.md#anchor` with GitHub's slug algorithm (`github-slugger`,
   the library GitHub-compatible tools use). A referenced bold pseudo-heading becomes a real
   heading. Historical docs keep their free-text references (they record what was true then).
6. **Derivable facts are not typed** — counts and lists that the code determines (tests per
   project, hook steps) live in generated sections or are referenced; prose names the
   source instead of repeating the number.
7. **Counter-check procedure** for every new check: baseline green → break → red for exactly
   that reason → restore → green (`docs/development/testing.md`).

## Consequences

**Positive:**

- A renamed file, heading or concept fails the commit where the old name is still used in
  active docs.
- Nine real broken anchors and several stale statements were found and fixed on introduction.

**Negative / Trade-offs:**

- Vale needs network access on install (GitHub release) and a manual version bump.
- Historical passages in active docs need an explicit marker with a reason.

## Alternatives considered

**Own regex guard for terms** (instead of Vale): lighter, but not Markdown-aware (code spans,
tables) and would have to be replaced as the project grows; the owner chose the standard tool.

**Fuzzy checker for free-text `file.md §Section` references:** measured on 365 references —
140 could not be matched unambiguously (short forms, bold pseudo-headings, tables). Not
reliable; the reference format itself was made uniform instead (decision 6).

## Related

- **Files:** `v3/package.json` (`github-slugger`), `.vale.ini`, `.vale/styles/SoS/SupersededTerms.yml`, `scripts/vale-install.ts`,
  `v3/package.json` (`link:check`, `lint:docs`, `vale:install`), `v3/tests/unit/docsGuards.test.ts`
- **ADRs:** ADR-0047 (documentation architecture), ADR-0053 (exceptions)
- **Sources:** https://github.com/remarkjs/remark-validate-links · https://vale.sh/docs ·
  https://lwn.net/Articles/964075/ · https://grafana.com/docs/writers-toolkit/review/lint-prose/rules/
- **Commits:** see git log "(T13" (first part was titled "T13 1/2" before the scope grew)

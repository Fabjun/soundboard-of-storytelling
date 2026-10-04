# ADR-0073: American English spelling, checked in every file

**Status:** Proposed
**Date:** 2026-10-04
**Slice:** cross-cutting
**Refines:** ADR-0056
**Category:** Process & product decisions

## Context

<!-- vale SoS.AmericanSpelling = NO -->

The project language is English (CLAUDE.md), but the spelling variant was never fixed. Measured
2026-10-04 in README, CLAUDE.md and docs: color 64 / colour 41, behavior 59 / behaviour 29,
license 31 / licence 5, center 27 / centre 1 — and the same mix in code comments, test names and
CSS.

<!-- vale SoS.AmericanSpelling = YES -->

Code identifiers were American (`color`, `license`, `LICENSE`), as in the web platform's own
APIs. Owner decision 2026-10-04 (review of PR #44): American English everywhere, historical
records included; only verbatim quotations and third-party texts keep their spelling.

## Decision

1. **American English** in every text of the repository: app UI, code, comments, test names,
   styles, configuration, documentation, release notes — historical records included (ADRs,
   backlog history, released notes): spelling changes no meaning. The Google developer
   documentation style guide spells after Merriam-Webster, an American dictionary ("use the
   first form listed" — [Google: Spelling](https://developers.google.com/style/spelling)).
2. **One word list, two checks:** `.vale/styles/SoS/AmericanSpelling.yml` (a Vale substitution
   rule, [Vale substitution](https://docs.vale.sh/checks/substitution)) maps each British form to
   the American one. Vale applies it to the Markdown files (`npm run lint:docs`; the historical
   files, otherwise exempt from the SoS rules, get this rule too); `codeGuards` ("American spelling
   outside Markdown") reads the same list and checks every other tracked file.
3. **Exceptions** (ADR-0053), named with their reason in `codeGuards`: Claude Design downloads in
   `design-sources/` (kept as delivered), the icon catalog's search words (British forms are
   deliberate synonyms, so a search for `armour` finds the armor), V1's icon ids in
   `v1-map.json`, third-party license texts, `package-lock.json`. A verbatim quotation inside a
   Markdown file is marked with `<!-- vale SoS.AmericanSpelling = NO -->` … `= YES`.
4. **Clean-up 2026-10-04:** 265 words in 76 files, replaced by script from the word list (case
   kept); no identifier but one local variable (`cancelled` → `canceled`), no CSS class, token or
   file name changed; four headings (and with them their anchors) changed, checked by
   `link:check`.

## Consequences

**Positive:**

- One spelling everywhere, kept by checks instead of memory (the British forms had come back
  in new text several times).
- The word list grows in one place; both checks follow it.

**Negative / Trade-offs:**

- The list covers the forms it names; a British form not on it passes until it is added.

## Alternatives considered

**British English** — against the code identifiers and the web APIs (`color`, `center`), which
stay American in any case.

**Vale's packaged Google style** — downloaded at setup (`vale sync`) and bringing many other rules
with it; the project checks with its one style `SoS` (ADR-0056), to which one more rule is added.

## Related

- **Files:** `.vale/styles/SoS/AmericanSpelling.yml`, `.vale.ini`,
  `v3/tests/unit/codeGuards.test.ts`
- **ADRs:** ADR-0056 (documentation checks), ADR-0053 (exceptions)
- **Source documents:** [docs/backlog.md](../backlog.md) "One English spelling variant"
- **Sources:** https://developers.google.com/style/spelling ·
  https://docs.vale.sh/checks/substitution

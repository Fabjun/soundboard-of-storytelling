# ADR-0047: Documentation architecture — hub / leaf / template

**Status:** Accepted
**Date:** 2026-09-28
**Slice:** cross-cutting
**Refines:** —
**Refined by:** ADR-0050 (file naming — hubs are `README.md`, lowercase-kebab leaves)
**Category:** Prozess- & Produktentscheidungen

## Context

By 2026-09 the project documentation had grown to ~9,400 lines across 60+ Markdown files
(excluding `v1-reference/` and the design archive). Product concept, design decisions,
open work and process rules were spread over `docs/architecture/concept-brief.md`, `docs/design/design-system.md`,
`docs/design/design-system-cheatsheet.md`, `docs/design/design-notes.md`, `docs/backlog.md` (~2,000 lines mixing
decisions with to-dos), `v1-reference/HANDOFF.md` and `CLAUDE.md` (579 lines).

Consequences observed:

- No single place states what the app is and how its parts relate. A session on
  2026-09-28 conflated the two app modes (GAME / SETUP) with the Library — a direct
  result of reconstructing the concept from scattered sources.
- No per-element design specification exists (`docs/design/design-system.md §4 Komponentenanatomie`
  is an empty TODO).
- Provisional ideas and settled decisions sit side by side without a consistent status,
  so provisional items read as binding.
- `CLAUDE.md` is well above the recommended size for agent instruction files.

## Decision

1. **Hub / leaf / template per documentation area.** Each area has one hub file
   (foundations, rules, index), one leaf file per unit, and a `_template.md` that every
   leaf follows. Extending the docs means adding a leaf from the template and one index
   row — existing files stay untouched. A hub section that outgrows the hub becomes a
   leaf under the same rules.

   ```
   docs/
     product/        README.md (hub) · features/ (leaves, when needed)
     design/         README.md (hub) · components/_template.md + one file per element
                     · reference/ (generated class + token inventories)
     architecture/   README.md (hub + ADR index) · ADRs (leaves) · _template.md
     development/    README.md (hub: workflow, testing, gates)
   ```

2. **English** for all new documentation. Terms in the docs match the app UI verbatim.
   (Conversation with the user may be German.)

3. **Status on every statement** that is a decision or a proposal:
   **Decided** (confirmed by the user) · **Open** (question not yet answered) ·
   **Parked** (idea, not to be built without explicit go-ahead). Nothing enters a spec as
   Decided without user confirmation.

4. **Code owns values.** Colours, sizes, spacing and other concrete values live only in
   `v3/src/styles/tokens.css` and the CSS. Specs describe purpose, anatomy, states,
   behavior and rules, and name tokens (`--mode-game`) — never copy their values.

5. **Incremental migration, just in time.** Documents are built when needed, not in one
   pass. Old documents stay in place until their content has been transferred and
   confirmed; they then move to `docs/archive/`. Nothing is deleted.
   Order: docs/product/README.md → docs/design/README.md hub + specs for the elements the mobile Board layout
   needs → build that layout → further specs as elements are touched, plus
   docs/architecture/README.md / docs/development/README.md → finally slim `CLAUDE.md`, re-point generators,
   archive old files, reduce `docs/backlog.md` to open work.

6. **Source-to-target mapping.**

   | Old file | Content → | Fate |
   |---|---|---|
   | `docs/architecture/concept-brief.md` | product parts → docs/product/README.md; technical parts → docs/architecture/README.md; workflow parts → docs/development/README.md | fully archived |
   | `docs/design/design-system.md` | rules → docs/design/README.md; generated §6/§A → `design/reference/` | fully archived |
   | `docs/design/design-system-cheatsheet.md` | absorbed into docs/design/README.md | fully archived |
   | `docs/design/design-notes.md` | settled decisions → docs/design/README.md / component specs; open items → docs/backlog.md | fully archived |
   | `v1-reference/HANDOFF.md` §4 | design principles → docs/design/README.md | stays (V1 reference) |
   | `docs/development/testing.md` | → docs/development/README.md | fully archived |
   | `CLAUDE.md` | details → docs/development/README.md + docs/architecture/README.md | stays, slimmed |
   | `docs/README.md` | becomes the sole index (`docs/README.md`) | replaced |
   | `docs/analysis/foundation-analysis.md`, import-gate protocols (`docs/design/imports/`) | — | fully archived |
   | `docs/backlog.md` | decisions → docs/product/README.md + docs/design/README.md | **partially emptied, stays** (open work only) |
   | `CHANGELOG.md` (root) | — | **open question**: keep vs. drop in favor of `v3/src/lib/changelog.ts` |

7. **Transfer unit is the section, not the file.** When content moves into a new
   document, it is removed from the old source in the *same commit* and replaced there
   with a one-line pointer (`→ moved to docs/product/README.md §3`). This happens per section, not
   per file — a hub section is transferred and its source pointer left behind before the
   next section is touched. Keeps commits small and reviewable (per the Evidence
   Requirements' execution-time scope discipline) and guarantees no statement exists in
   two places at once.

8. **Archive convention.** A file only moves to `docs/archive/` once every section it
   held has been transferred and confirmed (per rule 7) — i.e. once it is empty of
   authoritative content. Moving (not deleting) preserves it; it gains a header line:
   `*Archived YYYY-MM-DD — superseded by …. Not authoritative. Kept for history.*`
   Links pointing at the old path are updated in the same commit; the existing
   `link:check` pre-commit/CI gate catches any missed reference.

## Consequences

**Positiv:**
- One authoritative place per question: what the product is (PRODUCT), how an element
  looks and behaves (component spec), why the system is built this way (ADR).
- Modular growth: new elements, features and decisions add files instead of lengthening
  existing ones.
- Agent sessions read only the hubs and the leaves relevant to the task
  (progressive disclosure), keeping context small.
- Explicit status prevents provisional ideas from being treated as binding.

**Negativ / Trade-offs:**
- More files than a single-document approach; navigation depends on the hub indexes
  staying current (candidate for a generator, like the ADR index).
- During migration, old and new documents coexist. Old documents carry a
  "being superseded by …" note once a section has moved.
- The generators (`scripts/sync-sb-classes-inventory.ts`, `scripts/sync-tokens-inventory.ts`)
  currently write into `docs/design/design-system.md`; moving their output requires a separate,
  planned change to scripts, pre-commit hook and CI.

## Alternatives Considered

- **One large `docs/design/README.md`** holding all element specs — rejected: 15–20 elements × full
  spec schema exceeds ~1,500 lines, recreating the BACKLOG problem.
- **German documentation** — rejected: UI, code and ~90 % of existing docs are English;
  mixing languages invites term mismatches (e.g. "Szene" vs "Scene").
- **Big-bang consolidation** of all documents in one pass — rejected: repeats the
  2026-06 pattern of documentation work displacing product work, and invites
  misinterpretation when reconstructing decisions without user review.
- **Keep the current structure and add a spec section to `docs/design/design-system.md`** — rejected:
  does not resolve the mixed decision/to-do content of `docs/backlog.md` or the size of
  `CLAUDE.md`.

## Related

- **Dateien:** `docs/product/README.md`, `docs/design/components/_template.md`,
  `docs/README.md`
- **ADRs:** ADR-0045 (two-axis adaptive model — referenced by the component template),
  ADR-0046 (design→code import gate)
- **Quelldokumente:** `CLAUDE.md` Workflow rule 9, `docs/backlog.md` §Documentation consolidation
- **Commits:** —

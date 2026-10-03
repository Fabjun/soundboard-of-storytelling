# Documentation Map — Soundboard of Storytelling

This file describes the role and scope of every documentation locus in the project.
It is the starting point for finding where something belongs or where to look something up.

---

## Target structure (migration in progress — ADR-0047)

The documentation is being consolidated into a hub / leaf / template structure
([ADR-0047](architecture/0047-documentation-architecture.md)). Migration is incremental:
the documents listed further below stay authoritative for any topic whose new home is
not yet filled and confirmed.

| Area         | Hub                                           | Leaves                                                                                                           | Template                                         | State                   | Source(s)                                                                                                                                                                                                      |
| ------------ | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product      | [`docs/product/README.md`](product/README.md) | [`features/data-backup.md`](product/features/data-backup.md), [`v1-v2-inventory.md`](product/v1-v2-inventory.md) | —                                                | In progress (see below) | `docs/architecture/concept-brief.md` (product parts), `docs/backlog.md` (decisions)                                                                                                                            |
| Design       | docs/design/README.md _(planned)_             | [`components/pad.md`](design/components/pad.md) (Draft)                                                          | [`_template.md`](design/components/_template.md) | First spec; hub pending | `docs/design/design-system.md`, `docs/design/design-system-cheatsheet.md`, `docs/design/design-notes.md`, [HANDOFF.md §4](../design-sources/2026-05-25/HANDOFF.md#4--key-design-decisions--why-it-is-this-way) |
| Architecture | `docs/architecture/README.md`                 | ADRs in `docs/architecture/`                                                                                     | [`_template.md`](architecture/_template.md)      | ADRs exist; hub pending | `docs/architecture/concept-brief.md` (technical parts)                                                                                                                                                         |
| Development  | docs/development/README.md _(planned)_        | —                                                                                                                | —                                                | Pending                 | `docs/development/testing.md`, `CLAUDE.md` (workflow parts)                                                                                                                                                    |

**Product progress (2026-09-28):**

| docs/product/README.md section                                                                       | State                                                                                                                                                                                                                                                                                                                                                                                                                                  | Transferred from (source now holds a pointer)                                                                          |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [§1 Purpose & audience](product/README.md#1-purpose--audience)                                       | Pending — discussed, not yet written                                                                                                                                                                                                                                                                                                                                                                                                   | —                                                                                                                      |
| [§2 A game session](product/README.md#2-a-game-session)                                              | Pending                                                                                                                                                                                                                                                                                                                                                                                                                                | —                                                                                                                      |
| [§3 App modes](product/README.md#3-app-modes-game-and-setup)                                         | Filled                                                                                                                                                                                                                                                                                                                                                                                                                                 | BACKLOG B8, D2, Performance Lock; Stage Lock superseded                                                                |
| [§4 Screens & navigation](product/README.md#4-screens--navigation)                                   | Pending                                                                                                                                                                                                                                                                                                                                                                                                                                | —                                                                                                                      |
| [§5 Core concepts](product/README.md#5-core-concepts) — Board, decks & quick access / Pads / Library | Filled (Library: one line)                                                                                                                                                                                                                                                                                                                                                                                                             | [concept-brief.md §4.1](architecture/concept-brief.md#41--data-model) key concepts; BACKLOG Slice 6 set entries        |
| [§6 Platforms & input](product/README.md#6-platforms--input) — Input                                 | Filled (Platforms pending)                                                                                                                                                                                                                                                                                                                                                                                                             | —                                                                                                                      |
| [§7 Design principles](product/README.md#7-design-principles)                                        | Filled                                                                                                                                                                                                                                                                                                                                                                                                                                 | BACKLOG tinkerer principle, overarching principle                                                                      |
| [§8 Out of scope](product/README.md#8-out-of-scope) · [§9 Glossary](product/README.md#9-glossary)    | Pending                                                                                                                                                                                                                                                                                                                                                                                                                                | —                                                                                                                      |
| [§10 Open questions](product/README.md#10-open-questions)                                            | Q1 and Q2 decided                                                                                                                                                                                                                                                                                                                                                                                                                      | —                                                                                                                      |
| Leaf `features/data-backup.md`                                                                       | Filled                                                                                                                                                                                                                                                                                                                                                                                                                                 | [concept-brief.md §4.6](architecture/concept-brief.md#46--template-exportimport); BACKLOG V1-compatible template entry |
| Leaf `v1-v2-inventory.md`                                                                            | Decisions filled for [§1 Pads](product/v1-v2-inventory.md#1-pads--playback), [§2 Controls](product/v1-v2-inventory.md#2-controls--numpad), [§3 Board](product/v1-v2-inventory.md#3-board-decks--quick-access) (partly), [§5 Data](product/v1-v2-inventory.md#5-data--backup); [§4 Library](product/v1-v2-inventory.md#4-library), [§6](product/v1-v2-inventory.md#6-settings)–[§8](product/v1-v2-inventory.md#8-help--onboarding) open | —                                                                                                                      |

**Slice plan:** re-planned 2026-09-28 — single source [CLAUDE.md §Slice progress](../CLAUDE.md#slice-progress) (Slices 9–14;
5–8 superseded, numbers not reused). Design hub docs/design/README.md _(planned)_ + component specs follow with
Slice 13 (adaptive layout).

Full old-file → new-home mapping, including files that are only partially emptied
(`docs/backlog.md`) or stay outside this table (`CLAUDE.md`, `design-sources/2026-05-25/HANDOFF.md`), and the
open `CHANGELOG.md` (root) question: see
[ADR-0047 Decision §6](architecture/0047-documentation-architecture.md#decision).

**Rules for new documentation:** English · every decision or proposal carries a status
(**Decided** / **Open** / **Parked**) · specs name tokens, never copy their values ·
old documents move to `docs/archive/` once transferred and confirmed — nothing is deleted.

---

## Orientation (read first)

### `docs/architecture/concept-brief.md`

The **mandatory session-start document**. Binding architecture for V3.0: stack decisions,
state management, audio engine and session start protocol. (Product concepts incl. the data model's
key concepts → `docs/product/README.md`; slice plan → [CLAUDE.md §Slice progress](../CLAUDE.md#slice-progress).)
Read before any other document at the start of every Claude Code session.
**Source of truth for:** Architectural decisions binding V3.0 development; starting point
for every session. Kept up to date by Claude Code as slices complete and decisions harden.

---

## Design system

### `docs/design/design-system.md`

Full design system specification. This is the **source of truth** for all design rules.
Auto-generated sections [§6 (CSS class inventory)](design/design-system.md#6-component-inventory) and [§A (token inventory)](design/design-system.md#a-token-inventory) are maintained
by `npm run sync:docs` — do not edit them manually.
**Source of truth for:** CSS class rules, state vocabulary (`is-*`), token usage rules,
component anatomy, pixel-frame patterns, and all project-wide naming conventions ([§1](design/design-system.md#1-naming-conventions-project-wide)).

### `docs/design/design-system-cheatsheet.md`

Single-page quick reference for daily use. Short form of `docs/design/design-system.md`.
When the cheatsheet and the main document conflict, the main document wins.
**Source of truth for:** Nothing exclusively — it summarises `docs/design/design-system.md`.

---

## Design origin

### `design-sources/2026-05-25/`

Frozen design handoff package from the original external design phase (2026-05-25).
Contains: 30+ JSX reference files (`app.jsx`, `foundations.jsx`, `v1`–`v26` exploration
files), `design-sources/2026-05-25/tokens.css` (design handoff origin — see note below),
`design-sources/2026-05-25/HANDOFF.md`,
`Design System.html`, `Responsive Strategy V3.html`.
**Source of truth for:** Visual and interaction design intent; source material for V3
component implementations; original component shapes and token values.
**Note on `design-sources/2026-05-25/tokens.css`:** This is the original token file from the
design phase. It is kept as a reference only — the running app loads
`v3/src/styles/tokens.css`, which has evolved since handoff (see that file's header).

### `v3/src/styles/tokens.css`

Canonical app token file. This is the file the app loads at runtime.
Has `@inventory` comments (used by `npm run sync:tokens`). Has diverged from the design
handoff origin since V3 development began.
**Source of truth for:** All CSS custom properties (tokens) used in the running app.

---

## Decision records

### `docs/architecture/`

Architecture Decision Records (ADRs). Documents cross-cutting decisions: data model,
persistence strategy, platform assumptions, new infrastructure choices.
Index: `docs/architecture/README.md`. Template: `docs/architecture/_template.md`.
**Source of truth for:** Why a major architectural approach was chosen and what
alternatives were considered.

---

## Engineering guidance

### `CLAUDE.md`

Claude Code operating instructions. Permanent coding standards and workflow rules.
Must be kept up to date after every session that establishes new permanent standards.
**Source of truth for:** Conventions Claude must follow; rules for commits, testing,
build, slice completion, and all code-level standards enforced during sessions.

### `docs/development/testing.md`

Test architecture, commands, and conventions. Includes the `data-testid` naming
convention, E2E patterns, known caveats (Playwright/WebKit limitations), and the
pre-commit/CI gate specification.
**Source of truth for:** Test structure, test commands, `data-testid` naming.

### `docs/development/manual-iphone-checklist.md`

Checklist for manual verification on iPhone + Brave that cannot be automated in Playwright
(audio playback, file-picker, tab-switch lifecycle, Add to Home Screen). Run through this
before the final commit of any slice touching `src/audio/`, `src/db/`, or file handling.
**Source of truth for:** Manual iPhone verification steps beyond the automated test suite.

---

## Working notes

### `docs/design/design-notes.md`

Design-detail decisions, RESOLVED entries, and slice-specific open questions.
Not a feature backlog and not an architecture record. When a design-detail decision
hardens into a permanent convention, it migrates to `docs/design/design-system.md`. When a deferred
item becomes a feature or known limitation, it moves to `docs/backlog.md`.
**Source of truth for:** Design-detail rationale and open "how exactly" questions at
the slice level.

### `docs/backlog.md`

Living backlog: all deferred items, known limitations, and open UX decisions.
Updated at each slice completion (per CLAUDE.md Workflow Rule 14).
**Source of truth for:** What work is explicitly deferred, and why.

---

## Analysis

### `docs/analysis/foundation-analysis.md`

Foundation audit of the documentation set — a **snapshot of 2026-06-05**, not maintained
(structure audit A22, 2026-10-03). Inventories the documents of that day, records drift findings
(critical / important / cosmetic) and a **Document Coupling Map**
([§6](analysis/foundation-analysis.md#6-document-coupling-map)) of which concepts had to stay in
sync. Cross-document consistency is checked by tools now — docsGuards, `link:check` and Vale
(ADR-0056); open points live in [docs/backlog.md](backlog.md).
**Source of truth for:** nothing current — historical record.

---

## Release history

### `CHANGELOG.md`

Human-readable release log. Tracks notable changes per version in Keep-a-Changelog format.
Updated alongside the in-app changelog (`v3/src/lib/changelog.ts`) on each push.
**Source of truth for:** External-facing release notes and version history.

---

## Hierarchy rule

When two documents make conflicting statements about the same topic, the precedence is:

1. `CLAUDE.md` — binding operating rule (highest)
2. `docs/architecture/` ADR — architectural decision
3. `docs/design/design-system.md` — design system specification
4. `docs/design/design-system-cheatsheet.md` — summary of the above
5. `docs/design/design-notes.md` / `docs/backlog.md` — working notes (lower; may be outdated)

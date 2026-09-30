# ADR-0027: Pad type colours are semantically reserved

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting
**Refines:** —
**Category:** UI architecture

## Context

The four pad types (SINGLE, LOOP, PLAYLIST, COMBO) have dedicated colours. These colours
appear in many places: pad spine (left bar), type pill, mixer strip border, bulk-select
highlight, icon colour. That makes the colour the primary semantic signal for the pad type.

`design-sources/2026-05-25/HANDOFF.md §4.3` is explicit: "Don't reuse these colors for
anything else."

> _The reservation is not recorded as an explicit prohibition in a separate document, but is
> implied consistently in the design system and in CLAUDE.md. This ADR makes it explicit._

## Decision

The four pad type colours are reserved **exclusively** for their type:

| Type     | Token            | Colour                 |
| -------- | ---------------- | ---------------------- |
| SINGLE   | `--pad-single`   | Warm gold              |
| LOOP     | `--pad-loop`     | Teal                   |
| PLAYLIST | `--pad-playlist` | Violet                 |
| COMBO    | `--pad-combo`    | Rose magenta (#C9529D) |

These colours and their variants (`--pad-*-soft`, `--pad-*-glow`) must not be used for other
semantic purposes (e.g. "success" or "warning").

For other semantics: `--success` (teal alias), `--danger`, `--blood-bright`, `--flame`.

## Consequences

**Positive:**

- Users learn the colour → type mapping once; afterwards the UI parses at a glance. This is a
  proven design principle from V1.
- Theme adjustments (Slice 8) can override pad type colours per theme without breaking the
  semantics (e.g. `.sb-theme-crimson { --pad-single: ... }`).

**Negative / Trade-offs:**

- `--pad-combo` (rose magenta) is unusual after a colour change (copper → rose magenta). That
  was a deliberate decision to separate COMBO clearly from SINGLE (gold/warm) and from
  LOOP/SETUP (teal).

## Alternatives considered

**Recycle colours for other purposes:** e.g. teal (`--pad-loop`) for "success". That would make
"is this pad a LOOP or is this a success indicator?" ambiguous. Clearly not chosen.

## Related

- **Files:** `v3/src/styles/tokens.css` (--pad-single, --pad-loop, --pad-playlist, --pad-combo and their variants)
- **ADRs:** ADR-0022 (design tokens), ADR-0026 (mode toggle tokens)
- **Source documents:** `design-sources/2026-05-25/HANDOFF.md §4.3`, `CLAUDE.md §Design language §Color code rule`
- **Commits:** `eac8690` — refactor: align slice 1+2 (--pad-combo copper→rose magenta)

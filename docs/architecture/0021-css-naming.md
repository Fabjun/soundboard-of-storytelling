# ADR-0021: CSS classes `sb-<block>` / `sb-<block>-<part>` / `is-<state>`

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting
**Refines:** —
**Refined by:** ADR-0052 (`has-*` states allowed; themes `sb-theme-*`; no other namespaces)
**Category:** UI architecture

## Context

The design system from `design-sources/2026-05-25/` defines a CSS naming convention that V3
adopts directly. The convention is described in `docs/design/design-system-cheatsheet.md`
("The 60-second contract").

The question when porting: should BEM (Block__Element--Modifier) be used, or a simplified
variant? The design system had already answered this for us: BEM-like, but without `__` and
`--`.

## Decision

**Class structure:**
- Block: `sb-<block>` (e.g. `sb-pad`, `sb-btn`, `sb-card`)
- Part: `sb-<block>-<part>` (e.g. `sb-pad-spine`, `sb-btn-label`)
- State: `is-<state>` (e.g. `is-hot`, `is-setup`, `is-danger`, `is-deep`)

**Rules (from docs/design/design-system-cheatsheet.md §60-second contract):**
- No BEM `__` (no `sb-pad__spine`) — only a single `-`
- No BEM `--` for modifiers (no `sb-btn--primary`) — states are `is-*`
- States are never block-namespaced (`is-hot`, not `pad--hot`)
- New `sb-*` classes: register them in `docs/design/design-system.md §6` in the same commit

**Pixel frame customisation:**
- Never new clip-path / border CSS for variants
- Customisation via CSS custom properties: `--pix-bg`, `--pix-border`, `--pix-step`

**State vocabulary (managed inventory — complete in docs/design/design-system.md §3; add new
classes there, not here):**

## Consequences

**Positive:**
- Design-system JSX can be used directly as starting code (ADR-0001).
- Consistency across the ~20 components in `v3/src/components/`.
- A clear state vocabulary prevents redundant classes.

**Negative / Trade-offs:**
- Not classic BEM: developers with a BEM background have to learn the difference.
  Documented in the cheat sheet.
- Closed state vocabulary: new states need explicit registration in
  `docs/design/design-system.md §3` before use.

## Alternatives considered

**Classic BEM:** more precision for complex hierarchies. Unnecessary for this design system
(flat component structure, few sub-elements).

**CSS modules / Tailwind:** scoped classes, no global namespace. Would make the design-system
JSX not directly usable (ADR-0001). Not chosen.

## Related

- **Files:** `v3/src/styles/tokens.css`, `v3/src/components/*.tsx`
- **ADRs:** ADR-0022 (design tokens), ADR-0024 (clip-path), ADR-0025 (is-deep)
- **Source documents:** `docs/design/design-system-cheatsheet.md`, `design-sources/2026-05-25/HANDOFF.md §4.1`

## Amendments

**2026-06-15:** `is-conflict` added to the vocabulary (registered in
`docs/design/design-system.md §3`). Reason: the scene-rename import gate
(`docs/design/imports/scene-rename-conflict.md`) flagged the class as missing from the closed
set; the user chose option (a) — a global state class — (vs. (c) a component-local modifier).
Semantics: name conflict / invalid input in uniqueness checks. Reusable for board rename, pad
set names and all future validation-conflict situations.

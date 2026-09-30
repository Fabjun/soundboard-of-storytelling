# ADR-0022: Design tokens in `v3/src/styles/tokens.css` — no colour literals

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting
**Refines:** —
**Category:** UI architecture

## Context

The design system delivers `design-sources/2026-05-25/tokens.css` as a complete token system:
colours, typography, spacing, pixel frame styles, theme overrides, animation keyframes.
`docs/architecture/concept-brief.md §4.7` states: "Token language follows the design system
canonically."

The alternative would be to hard-code colours/fonts/spacing directly in JSX or CSS.

## Decision

**No colour literals, no hard-coded spacing values ≥12 px in new code.** All visual values
come from `tokens.css` custom properties:

```css
/* Allowed */
color: var(--text);
background: var(--surface);
gap: var(--space-4);

/* Forbidden */
color: #ccc;
background: #1a1a2e;
gap: 16px;
```

`v3/src/styles/tokens.css` started as a copy of `design-sources/2026-05-25/tokens.css`
but has diverged during V3 development: 9 tokens were added (runtime animation
variables, grid layout variables, new ambient glow tokens — `--flame-soft`,
`--flame-aura`, `--grid-cols/gap/rows`, `--spark-duration/dx/dy`, `--undo-duration`),
and `--pix-bg-layer` was removed. The design handoff origin
(`design-sources/2026-05-25/tokens.css`) is kept as a reference only and is not loaded by
the app. See `docs/README.md` for the full documentation structure.
Theme overrides (`.sb-theme-verdant`, `.sb-theme-neon`, `.sb-theme-crimson`) are contained in
`tokens.css`.

**Forbidden in new V3 code (from docs/design/design-system-cheatsheet.md):**

- new colour literals
- `--sb-*` legacy aliases (only for backward-compatible references)
- `border-radius` on the `sb-pix` family (clip-path, ADR-0024)
- theme overrides for spacing / radius / type (only colours are theme-specific)

## Consequences

**Positive:**

- Theme switching (Slice 8) is trivial: a different CSS class on the root element, token
  overrides apply automatically everywhere.
- Consistency: 50+ components use the same token names.
- The token documentation in `CLAUDE.md §Design language` is canonical.

**Negative / Trade-offs:**

- Token names have to be known (`--gold` instead of `#F5D57A`). A one-off learning effort when
  reading the cheat sheet.
- No TypeScript support for token names (CSS custom properties are strings). Typos only
  become visible when rendering.

## Alternatives considered

**CSS-in-JS (Emotion, styled-components):** TypeScript support for token names. Not
compatible with the design-system approach (HANDOFF.md: "copy tokens.css verbatim").
Overhead without added value at this app size.

**Tailwind:** utility-first, no token system per se. Would replace the existing design
system. Not chosen.

## Related

- **Files:** `v3/src/styles/tokens.css`, `design-sources/2026-05-25/tokens.css`
- **ADRs:** ADR-0021 (CSS naming), ADR-0023 (surface hierarchy), ADR-0027 (pad type colours)
- **Source documents:** `docs/architecture/concept-brief.md §4.7`, `CLAUDE.md §Design language`, `design-sources/2026-05-25/HANDOFF.md §4`

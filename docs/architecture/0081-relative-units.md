# ADR-0081: Relative units for type and spacing

**Status:** Accepted
**Date:** 2026-10-09
**Slice:** infrastructure
**Refines:** ADR-0022
**Category:** UI architecture

## Context

Measured 2026-10-02: the stylesheets held 452 px values and no rem — font sizes and spacing
ignored the text size a user sets in the browser or the operating system. The owner decided
(2026-10-02, BACKLOG "Relative units for sizes") to switch before Slice 13 with this scheme: rem
for type and spacing, `fr` / flex / `%` for layout, `clamp()` for fluid sizes, px only for
borders, pixel-art details and minimum touch targets; an ADR fixes it, the tokens migrate, a guard
blocks new px values for type and spacing. Built while the owner was away (2026-10-09) — the
scheme is the owner's; how it is applied was accepted by the owner 2026-10-09 (spacing tokens and
the named px exceptions, rem rather than em, one components file).

## Decision

1. **Type and spacing are rem** — the tokens `--space-*` and `--fs-*` (`v3/src/styles/tokens.css`)
   and every `font-size`, `padding`, `margin` and `gap` in the stylesheets. The value is px / 16,
   so at the browser's default text size (16 px) every size is the same as before: the visual
   baselines stayed pixel-identical.
2. **px stays** for borders and outlines, radii (pixel-art corners), pixel-art details (the 1 px
   line between waveform bars), shadows, minimum touch targets (44 px — Apple HIG 44 pt; WCAG 2.5.8
   asks for 24 px) and media-query breakpoints. Three px values in spacing properties stay on
   purpose, each named with its reason in the guard.
3. **Guard:** `codeGuards` "type and spacing in rem" — a px value in a type or spacing property
   fails the commit unless it is a named exception; the spacing and type tokens must be rem.
   An E2E test doubles the root font size and checks that type and spacing double too.
4. Component styles live in `v3/src/styles/components.css`, the tokens alone in `tokens.css`
   (split the same day; BACKLOG "Component styles out of tokens.css").

Industry standard: WCAG 2.2 SC 1.4.4 Resize Text (text resizable to 200 % without loss of content
or function); web.dev, "Typography" — rem / em so text responds to user preferences; MDN,
"CSS values and units" (rem relative to the root font size).

## Consequences

**Positive:**

- A user's larger text setting enlarges the app's type and spacing.
- New px values for type or spacing are caught on the next commit.

**Negative / Trade-offs:**

- Fixed-size boxes (pad cells at the PAD SIZE in px, the 44 px touch minimums) do not grow with
  the text: at a large text size, text inside them can get tight. Fluid sizes (`clamp()`) for
  those come with the layout work of Slice 13.
- Press Start 2P and VT323 are pixel fonts: at sizes that are no multiple of their grid they look
  softer — only at a text size other than the default.

## Alternatives considered

**px with a root scale variable:** keeps px, scales by a custom property — does not follow the
browser's own text size setting. Rejected (WCAG 1.4.4 is about the user's setting).

**em instead of rem for spacing:** spacing would follow each element's own font size — harder to
keep one spacing scale. Rejected; rem is the scale, em only where an element must scale with its
own text.

## Related

- **Files:** `v3/src/styles/tokens.css`, `v3/src/styles/components.css`,
  `v3/tests/unit/codeGuards.test.ts`, `v3/tests/e2e/a11y.spec.ts`
- **ADRs:** ADR-0022 (design tokens), ADR-0080 (accessibility checks)
- **Sources:** https://www.w3.org/WAI/WCAG22/Understanding/resize-text,
  https://web.dev/learn/design/typography,
  https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Values_and_units

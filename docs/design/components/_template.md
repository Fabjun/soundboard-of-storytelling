# <Element name>

> **Component spec** — one file per UI element. Copy this template, replace the
> placeholders, add a row to the component index in the design hub.
> Rules: [ADR-0047](../../architecture/0047-documentation-architecture.md) — English,
> status on every statement, token **names** only (values live in `v3/src/styles/tokens.css`).

**Status:** Draft | Reviewed
**Code:** `v3/src/components/<File>.tsx`
**Last reviewed:** YYYY-MM-DD

Status markers used below: **Decided** · **Open** · **Parked**
(see [docs/product/README.md — Status legend](../../product/README.md#status-legend)).

---

## Purpose

What the element is for, and when it is used (and when not).

## Anatomy

The named parts of the element.

| Part | Description | Status |
|---|---|---|
| … | … | … |

## Variants

Configurations selected via props.

| Variant | When | Status |
|---|---|---|
| … | … | … |

## States

State classes from the closed `is-*` vocabulary (`docs/design/design-system.md §3`).

| State | Trigger | Appearance | Status |
|---|---|---|---|
| … | … | … | … |

## Behavior

### In GAME mode

…

### In SETUP mode

…

## Adaptive behavior

Per [ADR-0045](../../architecture/0045-two-axis-adaptive-model.md).

### Axis 1 — Screen format (narrow / wide)

…

### Axis 2 — Input type (touch / pointer + keyboard)

…

## Tokens & classes

Names only — no values.

- Tokens: `--…`
- Classes: `sb-…`

## Accessibility

Touch target (min. 44 px), contrast, color-independent cues, keyboard access.

## Open questions

| # | Question | Status |
|---|---|---|
| … | … | **Open** |

## Sources

- ADRs: …
- Design origin: `SoS_DESIGN_25052026/…`
- Decisions: …

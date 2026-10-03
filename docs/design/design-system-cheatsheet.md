# Soundboard of Storytelling — Design System Cheatsheet

> **Reminder, not replacement.** `docs/design/design-system.md` is the source of truth.
> This page is the print-out to keep next to the keyboard. When this sheet
> and the main document disagree, the main document wins.

---

## The 60-second contract

1. Class names are `sb-<block>` and `sb-<block>-<part>`. No BEM `__` / `--`.
2. State is `is-<state>`. Never bare (`active`), never block-scoped (`pad--hot`).
3. Pixel-frame variants are made by overriding `--pix-bg` / `--pix-border` /
   `--pix-step` — **not** by writing new clip-path / border CSS.
4. Spacing tokens (`var(--space-*)`) are mandatory for layout gaps ≥ 12 px.
5. New `sb-*` classes are registered in [design-system.md §6](design-system.md#6-component-inventory) **in the
   same commit** that introduces them. No exceptions.

---

## Decision tree

```
Need to style something.
│
├── Does it have the stepped pixel-frame shape?
│     YES → use sb-pix / sb-card / sb-pad / sb-btn / sb-pill / sb-menu-row
│           customise via --pix-bg / --pix-border / --pix-step
│     NO  → continue
│
├── Is the difference from the base a one-axis tweak?
│     YES → inline override of the relevant --pix-* var
│     NO  → continue
│
├── Is it a runtime / contextual condition?
│     YES → is-* state class (must be in the state vocabulary)
│     NO  → continue
│
├── Is it a closed set of named flavors (≤ 5)?
│     YES → sb-<block>-<variant> class
│     NO  → continue
│
├── Is it pure layout (flex/gap/align) on a wrapper with no semantic name?
│     YES → Path B: layout primitive class → see the layout-primitives list for the canonical set
│           Never inline for static layout. See Path D in CLAUDE.md.
│     NO  → continue
│
└── Structural or reusable value?
      YES → Does an existing sb-*/is-* class fit (check the inventory)?
              YES → Path A: use it.
              NO  → Path B: new sb-* class; extend a similar one if found;
                    register in the inventory same-commit. No occurrence threshold.
```

References in the tree: state vocabulary = [design-system.md §3](design-system.md#3-state-vocabulary-closed-set),
layout-primitives list = [§5a](design-system.md#5a-layout-primitives), inventory =
[§6](design-system.md#6-component-inventory).

> **Binding rule:** [CLAUDE.md §Permanent coding standards](../../CLAUDE.md#permanent-coding-standards) — CSS class vs. inline style (four paths).
> When this tree and that rule disagree, CLAUDE.md wins.

---

## Quick reminders

- **State vocabulary** (closed set — see [design-system.md §3](design-system.md#3-state-vocabulary-closed-set) for full table):
  `is-active` · `is-on` · `is-hot` · `is-setup` · `is-game` · `is-danger`
  · `is-conflict` · `is-raised` · `is-italic` · `is-loop` · `is-playlist` · `is-combo`
  · `is-deep` · `is-compact`.
  New state? Add it to the state vocabulary first.

- **Porting from old JSX:** `is-playing` on `sb-pad` → `is-hot`.
  `is-loop` on `sb-pad` → drop, set `--pad-color: var(--pad-loop)`.
  `is-loop` on `sb-pill` stays — same word, different block.

- **Forbidden in new V3 code:** new color literals · `--sb-*` legacy
  aliases · `border-radius` on `sb-pix`-family · `box-shadow` on
  clip-path elements (use `filter: drop-shadow`) · utility classes
  (`sb-mt-4` etc.) · theme overrides of spacing / radius / type.

- **Three inventories to keep in sync** (same-commit rule):
  [§3 state vocabulary](design-system.md#3-state-vocabulary-closed-set) ·
  [§6 component inventory](design-system.md#6-component-inventory) ·
  [§A token inventory](design-system.md#a-token-inventory).

---

_One page. Anything more is in `docs/design/design-system.md`._

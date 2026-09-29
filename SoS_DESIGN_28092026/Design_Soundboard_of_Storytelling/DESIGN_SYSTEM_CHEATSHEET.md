# Soundboard of Storytelling — Design System Cheatsheet

> **Reminder, not replacement.** `DESIGN_SYSTEM.md` is the source of truth.
> This page is the print-out you keep next to the keyboard. When this sheet
> and the main document disagree, the main document wins.

---

## The 60-second contract

1. Class names are `sb-<block>` and `sb-<block>-<part>`. No BEM `__` / `--`.
2. State is `is-<state>`. Never bare (`active`), never block-scoped (`pad--hot`).
3. Pixel-frame variants are made by overriding `--pix-bg` / `--pix-border` /
   `--pix-step` — **not** by writing new clip-path / border CSS.
4. Spacing tokens (`var(--space-*)`) are mandatory for layout gaps ≥ 12 px.
5. New `sb-*` classes are registered in §6 of `DESIGN_SYSTEM.md` **in the
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
│     YES → is-* state class (must be in §3 vocabulary)
│     NO  → continue
│
├── Is it a closed set of named flavors (≤ 5)?
│     YES → sb-<block>-<variant> class
│     NO  → continue
│
├── Is it pure layout (gap, flex, grid)?
│     YES → inline style — do not invent utility classes
│     NO  → continue
│
└── Does it appear in ≥ 3 unrelated call sites?
      YES → new Preact component + new sb-* class; register in §6
      NO  → keep it inline. Wait for the third occurrence.
```

---

## Quick reminders

- **State vocabulary** (closed set — see §3 for full table):
  `is-active` · `is-on` · `is-hot` · `is-setup` · `is-game` · `is-danger`
  · `is-raised` · `is-italic` · `is-loop` · `is-playlist` · `is-combo`.
  New state? Add it to §3 first.

- **Porting from old JSX:** `is-playing` on `sb-pad` → `is-hot`.
  `is-loop` on `sb-pad` → drop, set `--pad-color: var(--pad-loop)`.
  `is-loop` on `sb-pill` stays — same word, different block.

- **Forbidden in new V3 code:** new color literals · `--sb-*` legacy
  aliases · `border-radius` on `sb-pix`-family · `box-shadow` on
  clip-path elements (use `filter: drop-shadow`) · utility classes
  (`sb-mt-4` etc.) · theme overrides of spacing / radius / type.

- **Three inventories to keep in sync** (same-commit rule):
  §3 state vocabulary · §6 component inventory · §A token cheat-sheet.

---

*One page. If you needed more, you needed `DESIGN_SYSTEM.md`.*

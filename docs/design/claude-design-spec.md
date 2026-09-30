>>> BINDING CLASS SPEC — use ONLY the classes and tokens below;
    anything missing → TODO-CLASS: comment, never invent a name <<<

# Claude Design Session Spec — Soundboard of Storytelling

> Paste at the start of **production-near** Claude Design sessions.
> Exploration sessions may run free; this spec applies when output will enter production.

---

## Layout primitives (closed set)

Source: [design-system.md §5a](design-system.md#5a-layout-primitives).

| Class | Behaviour | Use for |
|-------|-----------|---------|
| `sb-row` | flex row, 8px gap, align-center, min-width:0 | icon+label pairs, toolbar rows |
| `sb-row-sm` | flex row, 4px gap, align-center | tight action clusters |
| `sb-row-wrap` | flex row, flex-wrap, 4px gap | tag groups, wrapping grids |
| `sb-row-fill` | flex:1, centers content both axes | empty-state containers |
| `sb-col` | flex-column, min-height:0 | column containers, scroll parents |
| `sb-flex-1` | flex:1 | spacer / push siblings apart |
| `sb-flex-min` | flex:1 + min-width:0 | truncatable text fill |
| `sb-flex-trunc` | flex:1 + min-width:0 + ellipsis | text that clips at boundary |
| `sb-scroll-fill` | flex:1 scroll fill (requires `sb-col` parent) | scrollable panels |

---

## State classes (closed vocabulary)

Source: [design-system.md §3](design-system.md#3-state-vocabulary-closed-set).

| Class | Meaning |
|-------|---------|
| `is-active` | active element in a group |
| `is-on` | binary on-state (toggle) |
| `is-hot` | audio currently playing |
| `is-setup` | SETUP mode active |
| `is-game` | GAME mode active |
| `is-danger` | destructive action (2-tap confirm) |
| `is-raised` | elevated surface |
| `is-italic` | italic rendering |
| `is-loop` | loop context |
| `is-playlist` | playlist context |
| `is-combo` | combo context |
| `is-deep` | pad depth-stack opt-in |
| `is-compact` | compact rendering |
| `is-looping` | pad currently looping |
| `is-drag-source` | DnD: pad being dragged |
| `is-drag-swap` | DnD target: swap |
| `is-insert-before` | DnD target: insert before |
| `is-insert-after` | DnD target: insert after |

---

## Core tokens

Full list: [design-system.md §A](design-system.md#a-token-inventory). Core subset:

**Surfaces**
`--night` `--deep` `--surface` `--raised` `--top` `--sunk`

**Borders**
`--border` `--border-soft` `--border-strong` `--border-gold` `--border-blood`

**Text**
`--text` `--text-strong` `--text-dim` `--text-mute`

**Brand accents**
`--gold` `--gold-bright` `--flame` `--blood` `--blood-bright`

**Mode**
`--mode-setup` `--mode-game`

**Pad type colors**
`--pad-single` `--pad-loop` `--pad-playlist` `--pad-combo`

**Spacing** (4 / 8 / 12 / 16 / 20 / 24px — larger values in [design-system.md §A](design-system.md#a-token-inventory))
`--space-1` `--space-2` `--space-3` `--space-4` `--space-5` `--space-6`

**Radius**
`--radius-sm` `--radius-md` `--radius-lg`

**Typography**
`--font-display` `--font-ui` `--font-mono`
`--fs-xs(12)` `--fs-sm(14)` `--fs-md(16)` `--fs-lg(18)` `--fs-xl(22)` `--fs-2xl(28)`

---

## TODO-CLASS rule

If a design needs a class or layout not covered above: write `TODO-CLASS: <description>`
as a comment in the JSX — **never invent a class name**. All TODO-CLASS markers are
resolved (translated or registered) at import time before production merge.

---

## Maintenance

This file mirrors [design-system.md §5a](design-system.md#5a-layout-primitives) (layout primitives), [§3](design-system.md#3-state-vocabulary-closed-set) (is-* vocabulary),
and the core subset of `v3/src/styles/tokens.css`. Update in the same commit when any of
those change. Coupling tracked in [foundation-analysis.md §6](../analysis/foundation-analysis.md#6-document-coupling-map).

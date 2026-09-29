# Soundboard of Storytelling — Design System Conventions

> **Binding** for V3 (Preact + TypeScript). When repo code disagrees with this
> document, this document wins. Known inconsistencies in the existing JSX
> reference files are listed in §8 — do not imitate them.
>
> Audience: the V3 author (when reviewing code) and Claude Code (when
> generating new components for Slice 3+).

---

## §0 · The 60-second contract

1. Class names are `sb-<block>` and `sb-<block>-<part>`. No BEM `__` / `--`.
2. State is `is-<state>`. Never bare (`active`), never block-scoped (`pad--hot`).
3. Pixel-frame variants are made by overriding `--pix-bg` / `--pix-border` /
   `--pix-step`, **not** by writing new clip-path / border CSS.
4. Spacing tokens (`var(--space-*)`) are mandatory for layout gaps ≥ 12 px.
5. New `sb-*` classes are registered in §6 **in the same commit** that
   introduces them. No exceptions.

---

## §1 · Class naming

The system uses an `sb-*` namespace with state modifiers prefixed `is-*`. It is
**not BEM** and porting it to BEM is not in scope — that would rewrite 60+
existing selectors for zero functional gain.

### Anatomy

```
sb-pad              ← block         (the component shell)
sb-pad-title        ← sub-element   (a part inside the block)
sb-pad-meta         ← sub-element
sb-pad-key          ← sub-element
sb-btn              ← block
sb-btn-primary      ← variant       (semantic flavor — fixed enum)
sb-btn-sm           ← variant       (size — fixed enum)
sb-btn-ghost        ← variant
.sb-pad.is-hot      ← state         (transient, behavioural)
.sb-pill.is-loop    ← state         (taxonomic — pad type)
```

### Rules

- **Block:** one hyphen-cased noun. `sb-pad`, `sb-card`, `sb-menu-row`,
  `sb-panel-header`, `sb-status-bar`, `sb-mode-badge`.
- **Sub-element:** `sb-<block>-<part>`. Always parented inside the block in
  CSS (`.sb-menu-row .sb-row-title { … }`) — never used standalone.
- **Variant:** `sb-<block>-<variant>`. Variants are a **closed set** defined
  alongside the block in `tokens.css`. Buttons have `-primary`, `-filled`,
  `-ghost`, `-danger`, `-sm`. Cards do not have variants — they use states
  (`.sb-card.is-raised`).
- **State:** `is-<state>`. Always applied as a **second class** on the block
  itself. See §3 for the controlled vocabulary.

### What goes in `class`, what goes in `style`

The existing code mixes class-based styling with inline `style={…}` heavily.
This is **intentional**, not sloppy. Hold the line:

| Goes in `class` (an `sb-*` rule)       | Goes in inline `style`              |
|----------------------------------------|-------------------------------------|
| Visual identity: type, color, border   | Layout: flex / grid / gap           |
| State (`is-active`, `is-hot`)          | One-off positioning (`marginLeft`)  |
| Reusable across ≥ 3 call sites         | Composition decisions per parent    |
| Anything that uses pixel-frame shape   | Sizing tied to a specific layout    |

If you find yourself writing `style={{ background: '…', border: '…' }}` —
stop. That's a class.

---

## §2 · Reuse vs. own class

Three questions, in order. The first `yes` decides.

**Q1. Does it need the chunky stepped corner shape?**
→ Yes: it is a pixel-frame element. Use `sb-pix`, `sb-card`, `sb-pad`, `sb-btn`,
`sb-menu-row`, or `sb-pill` as the base. Customise via the `--pix-*` custom
properties, never by replacing the `clip-path` or `border` directly.

```jsx
// ✓ correct — variant via --pix-* override
<div className="sb-card" style={{ '--pix-bg': 'var(--raised)' }}>…</div>

// ✗ wrong — defeats the system
<div className="sb-card" style={{ background: '#22224A', clipPath: 'none' }}>…</div>
```

**Q2. Is the styling just layout (flex direction, gap, grid columns)?**
→ Yes: inline `style` is the right tool. Don't invent `sb-row` /
`sb-flex-gap-12` utility classes. The system has no utility layer and is not
getting one.

**Q3. Will this pattern appear in ≥ 3 unrelated call sites?**
→ Yes: factor it into a Preact component **and** give it an `sb-*` class.
Register the class in §6 in the same commit.
→ No: keep it inline at the call site. Do **not** preemptively abstract.

The threshold of three is deliberate. The current kit (see §6) was built by
this rule: `KvRow`, `MixerRowV2`, `LabelSliderV2`, `Waveform` all earned
their class once they appeared a third time.

---

## §3 · State modifiers

State classes are **always** prefixed `is-` and applied as a second class on
the block. State is **transient or contextual** — what the element currently
*is*, not what it permanently *kind-of* is. Type-of-thing modifiers (loop /
playlist / combo on a pill) also use `is-*` and live in the same vocabulary;
the system treats type as runtime state because a `sb-pill` reused in
different contexts may carry different types.

### Controlled vocabulary

| State          | Meaning                                       | Used on                                  |
|----------------|-----------------------------------------------|------------------------------------------|
| `is-active`    | Selected / current in a navigation set        | `sb-card`, `sb-menu-row`, `sb-tab`, `sb-panel-header`, `sb-num` |
| `is-on`        | Boolean ON (toggles, "playing" pills)         | `sb-toggle`, `sb-pill`                   |
| `is-hot`       | Pad currently playing (audio is live)         | `sb-pad`                                 |
| `is-deep`      | Pad uses the recommended depth stack          | `sb-pad`                                 |
| `is-setup`     | Element is in SETUP (edit) mode               | `sb-pad`, `sb-mode-badge`, `sb-mode-toggle` |
| `is-game`      | Element is in GAME (live) mode                | `sb-mode-badge`, `sb-mode-toggle`        |
| `is-square`    | Pad canvas constrains every pad to 1:1 aspect | `sb-pad-canvas`                          |
| `is-danger`    | Destructive variant                           | `sb-card`                                |
| `is-raised`    | Sits on `--raised` instead of `--surface`     | `sb-card`                                |
| `is-italic`    | Synthesised oblique for Share Tech Mono       | `sb-mono`                                |
| `is-loop`      | Pad type · teal                               | `sb-pill`                                |
| `is-playlist`  | Pad type · violet                             | `sb-pill`                                |
| `is-combo`     | Pad type · copper                             | `sb-pill`                                |

**Do not invent new state names ad hoc.** If you need a new state, add it to
this table first.

### Known inconsistency: `is-playing` → `is-hot`

`components.jsx::Pad` writes `is-playing` and `is-loop` directly on `.sb-pad`.
This predates the v2 convention. The canonical state on a pad is **`is-hot`**;
loop is conveyed by `--pad-color` / `--pad-glow`, not by a class.

**For V3 (Preact + TS) — binding policy:**

1. **Port the corrected form.** V3's `<Pad>` emits `is-hot` and nothing else.
   No `is-playing`, no `is-loop` on the pad shell.
2. **Do not "fix" the old JSX file.** `components.jsx` is a frozen reference
   artefact. Touching it invalidates the reference value of every other
   v\*-jsx file that was reviewed against the current state.
3. **When porting from JSX, mechanically translate:** `is-playing` → `is-hot`;
   `is-loop` (on `sb-pad`) → drop the class, set `--pad-color: var(--pad-loop)`
   on the element instead. The `--pad-color` channel is how pad type is
   communicated to the shell (see `tokens.css` §PAD, the `.sb-pad::before`
   spine reads from this var).
4. **`is-loop` on `sb-pill` is correct** and stays — same word, different
   block, different meaning. Don't conflate them.

---

## §4 · Variant vs. new component

When you need something "like X, but slightly different":

**Use a variant class (`sb-x-foo`) when:**
- The difference is one of a small, named set (size: sm/md/lg; flavor:
  primary/ghost/danger). Buttons are the canonical case.
- The variant is **mutually exclusive** with peers — a button is `-primary`
  *or* `-ghost`, never both.

**Use a `--pix-*` override (no new class) when:**
- The difference is a one-axis tweak: just the border colour, just the bg.
  See `MenuRow` in `components.jsx` — danger state is a one-line
  `'--pix-border': 'var(--sb-border-danger)'` override, not a `sb-menu-row-danger`
  class. That's the right call.

**Use an `is-*` state when:**
- The difference is a runtime condition, not a permanent choice.
  Selected / playing / live / setup.

**Build a new component when at least two of these are true:**
- It has its own internal layout (sub-elements that are themselves laid out).
- It would need 3+ variants if expressed as one component with flags.
- It composes other components, not just primitives.

**Concrete cases from the existing code:**

| Situation                                  | Resolution                            |
|--------------------------------------------|---------------------------------------|
| Button needs to be smaller                 | `sb-btn-sm` variant ✓                |
| Card needs a red border for delete zones   | `is-danger` state ✓                  |
| MenuRow needs a danger color               | `--pix-border` override inline ✓     |
| Need a row that shows a label + a control  | `KvRow` component (appears ≥ 5×) ✓   |
| Need a mixer-strip-but-vertical            | New component (`<MixerRowV2>` is horizontal-only; a vertical channel-strip is a different layout, different sub-elements) ✓ |

The opposite mistake — building `MixerStripV2Vertical` when an `is-vertical`
state would do — is also wrong. Watch out for variants whose CSS is 80%
different from the base: that's a new component wearing a costume.

---

## §5 · Spacing & token discipline

### Mandatory tokens

- **All spacing values ≥ 12 px** must use `var(--space-*)`. The 4-base scale
  (4, 8, 12, 16, 20, 24, 32, 40, 48, 64) covers everything except micro-tuning.
- **All colors** must come from a token. `tokens.css` has alpha-baked
  variants (`--gold-soft`, `--pad-loop-soft`, `--pad-loop-glow`, `--blood-soft`)
  for the cases that need transparency.
- **All font families** use `--font-display`, `--font-ui`, `--font-mono`. Never
  the literal name.
- **All font sizes ≥ 12 px** use `--fs-*` or `--fs-pixel-*`.

### Permitted hardcoded pixels

These are OK without a token:

- Micro-padding inside a single component: `padding: 2px 6px` on `sb-num`,
  `padding: 1px 5px` on the hotkey chip. Sub-12 px values are not part of the
  spacing scale by design.
- 1 px / 2 px border widths.
- Specific pixel positions in decorative pixel art (the icon `<rect>`
  coordinates in `foundations.jsx`).
- One-off geometry inside an SVG path or `clip-path`.

### Forbidden

- New colour literals (`#22224A`, `rgba(109,181,184,.16)`) anywhere in V3.
  If you reach for one, the token is missing — add it to `tokens.css`.
- Re-aliasing existing tokens with project-local names. `--my-primary:
  var(--gold)` is not a refactor, it is a leak.
- Using `--sb-*` legacy aliases in **new** code. They exist only so the
  reference v\*-jsx files keep rendering. Canonical names: `--surface`, `--gold`,
  `--space-4`. (See §8.)
- New font stacks. Three voices is the budget.

### When you need a new variable

Add it to `tokens.css` in the matching section (Surfaces / Borders / Text /
Brand / Pad types / Semantic / Spacing / Radius / Elevation / Type) with a
**comment explaining what it solves**. Every existing token has a comment;
match the density. Theme overrides go in the `.theme-*` blocks only when the
expressive layer changes — never structure (spacing, radius, type).

---

## §6 · Component inventory

Living inventory of every reusable building block. Grouped by composition
level. Source file in brackets.

### Maintenance rule (binding)

> **When you introduce a new `sb-*` class or a new exported Preact component,
> add a row to §6 in the same commit. When you rename or deprecate one,
> update §6 in the same commit.** This file is the authoritative inventory;
> grep-finding classes in `.css` is not a substitute.
>
> Claude Code: treat "did §6 get updated?" as a mandatory checklist item on
> every PR that touches `tokens.css` or any V3 `*.tsx` component.
> The V3 author: the same, when reviewing.

### Atoms (pixel-frame primitives)

| Class           | Role                                       | Source          |
|-----------------|--------------------------------------------|-----------------|
| `sb-pix`        | Bare pixel-frame shell — shape only        | `tokens.css`    |
| `sb-card`       | Padded panel with shadow                   | `tokens.css`    |
| `sb-btn`        | Action trigger; variants `-primary` `-filled` `-ghost` `-danger` `-sm` | `tokens.css` |
| `sb-pill`       | Inline status / type chip                  | `tokens.css`    |
| `sb-pad`        | Soundboard pad shell                       | `tokens.css`    |
| `sb-menu-row`   | Home-screen tappable row with icon         | `tokens.css`    |

### Atoms (non-framed)

| Class           | Role                                       | Source          |
|-----------------|--------------------------------------------|-----------------|
| `sb-display`    | Press Start 2P hero title                  | `tokens.css`    |
| `sb-display-vt` | VT323 mid-weight title with glow           | `tokens.css`    |
| `sb-label`      | Uppercase UI label                         | `tokens.css`    |
| `sb-mono`       | Share Tech Mono body / caption             | `tokens.css`    |
| `sb-caption`    | Tertiary mono micro-copy                   | `tokens.css`    |
| `sb-slider`     | Track + fill + thumb                       | `tokens.css`    |
| `sb-toggle`     | Boolean switch                             | `tokens.css`    |
| `sb-num`        | Numeric scrubber chip (Premiere-style)     | `tokens.css`    |
| `sb-tabs`/`sb-tab` | Horizontal tab strip                    | `tokens.css`    |
| `sb-dot`        | Status dot inside a `sb-pill`              | `tokens.css`    |
| `sb-icon`       | Wrapper slot for a `PixelIcon`             | `tokens.css`    |

### Chrome (workspace shell)

| Class                | Role                                    | Source          |
|----------------------|-----------------------------------------|-----------------|
| `sb-panel-header`    | Tinted strip atop every panel/inspector | `tokens.css`    |
| `sb-status-bar` / `sb-status-section` | Bottom info strip       | `tokens.css`    |
| `sb-mode-badge`      | SETUP / GAME indicator (compact chip)   | `tokens.css`    |
| `sb-mode-toggle`     | Interactive screen header · SETUP⇄GAME, Board only · directional pixel-spark animation on flip · honours `prefers-reduced-motion` | `v24-mode-toggle.jsx` |
| `sb-inspector` / `sb-inspector-section` | Right-rail container | `tokens.css`    |
| `sb-scanlines`       | CRT overlay (decorative)                | `tokens.css`    |
| `sb-grid-bg`         | Grid backdrop for SETUP canvas          | `tokens.css`    |
| `sb-pad-canvas`      | Wrapper for any grid of `.sb-pad` children · owns `--pad-aspect` / `--pad-min-height` · `is-square` modifier flips every child pad to 1:1 | `v26-pad-shape.jsx` |

### Molecules (Preact components — composed atoms)

| Component       | Composes                                   | Source          |
|-----------------|--------------------------------------------|-----------------|
| `<MenuRow>`     | `sb-menu-row` + `sb-icon` + title + sub    | `components.jsx`|
| `<Pad>`         | `sb-pad` + key chip + icon + title + meta  | `components.jsx`|
| `<Pill>`        | `sb-pill` + `sb-dot`                       | `components.jsx`|
| `<LabelSlider>` | label + value + `sb-slider`                | `components.jsx`|
| `<ToggleRow>`   | label + sub + `sb-toggle`                  | `components.jsx`|
| `<Tabs>`        | `sb-tabs` + `sb-tab`s                      | `components.jsx`|
| `<MixerStrip>`  | now-playing row (horizontal)               | `components.jsx`|

### Pro-tool chrome components (V2 — primary for V3)

| Component         | Role                                     | Source           |
|-------------------|------------------------------------------|------------------|
| `<TopBarV2>`      | App top bar with flame + breadcrumb + mode | `v2-screens.jsx` |
| `<StatusBarV2>`   | Bottom status strip                      | `v2-screens.jsx` |
| `<PanelHeaderV2>` | Panel header with icon + title + right slot | `v2-screens.jsx` |
| `<KvRow>`         | Label-on-left, control-on-right inspector row | `v2-screens.jsx` |
| `<MixerRowV2>`    | Now-playing row, type-colored left bar   | `v2-screens.jsx` |
| `<LabelSliderV2>` | Slider with label + readout, type-tinted | `v2-screens.jsx` |
| `<Waveform>`      | Compact waveform bars                    | `v2-screens.jsx` |

V3 should prefer the V2 components (`*V2`). The non-V2 versions in
`components.jsx` are kept for the older reference screens only.

### Decorations (rare-use ornaments)

`<SectionLabel>`, `<PixelDivider>`, `<CornerBrackets>`, `<ArcaneSigil>`,
`<PixelPanel>` — see `decorations.jsx`. Use sparingly; they're punctuation,
not grammar.

---

## §7 · Decision cheatsheet

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

## §8 · Anti-patterns

Every one of these has been observed somewhere — in older code, in drafts,
or as a tempting shortcut. Don't.

1. **Bare state classes.** `<div class="active">`. Always `is-active`, always
   on the block.
2. **BEM modifiers.** `pad--hot`, `pad__title`. The system uses single hyphens.
   Don't half-port to BEM.
3. **`is-playing` on `sb-pad`.** Canonical state is `is-hot`. See §3.
4. **`is-loop` on `sb-pad`.** Pad type goes on `--pad-color`, not as a class.
   `is-loop` on `sb-pill` is fine — different block.
5. **Using `--sb-*` legacy aliases in new code.** They exist only to keep
   pre-v2 screens rendering. New code uses `--surface`, `--gold`, `--space-4`.
6. **New color literals.** Every `#RRGGBB` and `rgba(...)` in V3 should be
   traceable to `tokens.css`. Need a new shade? Add a token first.
7. **Re-aliasing tokens locally.** `--my-card-bg: var(--raised)` is not
   abstraction, it's a second name for the same thing. Use the token directly.
8. **Outer `box-shadow` on a clip-path element.** `clip-path` doesn't
   clip `box-shadow` — the shadow renders against the element's bounding
   box, not its silhouette, so a stepped pixel-frame ends up with a
   rectangular shadow halo behind it. Use `filter: drop-shadow(...)` for
   outer shadows; it follows the clipped silhouette correctly. Tokens
   exist: `--shadow-card`, `--shadow-pop`, `--glow-gold`, `--glow-flame`.

   **Inset `box-shadow` is fine and is used on purpose** — `inset` shadows
   render inside the element's padding box, which `clip-path` then clips
   along with everything else, so the highlight stays neatly inside the
   stepped silhouette. The 1-px pixel-edge relief on `v15-pad-depth.jsx`
   treatments D (`edge`) and F (`full`) is the canonical example:

   ```jsx
   boxShadow: `
     inset 1px 1px 0 0 rgba(255,255,255,.10),
     inset -1px -1px 0 0 rgba(0,0,0,.45)
   `
   ```

   The inner-glow on a hot pad (also v15, plus the v17 preview pad) layers
   onto the same inset stack: `inset 0 0 6px ${glow}, inset 0 0 18px ${glow}`.
   The rule is about outer shadows only.

   **Stacking outer filters: `--pad-filter-base`.** `.sb-pad.is-hot` sets
   `filter:` to a glow stack. If a base treatment (e.g. `is-deep`'s chunky
   pixel lift) also sets `filter:`, the hot state would clobber it. The
   system routes base filters through the custom property
   `--pad-filter-base` (defaults to `none`), and `is-hot` concatenates the
   glow onto whatever that resolves to. New treatments that need an outer
   filter on `sb-pad` set `--pad-filter-base`, not `filter:` directly. The
   `--pix-bg-layer` escape hatch on the `sb-pix` family is the same idea
   for the padding-box layer: it accepts a comma-separated list of background
   layers (including their own `padding-box` clip) and falls back to the
   standard `linear-gradient(var(--pix-bg), var(--pix-bg)) padding-box` when
   unset.
9. **`border-radius` on `sb-pix`-family elements.** They're explicitly
   `border-radius: 0` with stepped corners via `clip-path`. Adding radius
   breaks the visual language.
10. **Utility classes.** No `sb-mt-4`, `sb-flex`, `sb-text-center`. Layout
    lives in inline `style`. The system has no utility layer and will not
    grow one — it would collide with the `sb-<block>-<variant>` namespace.
11. **Theme overrides touching structure tokens.** `.theme-verdant` may
    override surfaces, borders, brand, and one pad-type spike. It must not
    override `--space-*`, `--radius-*`, `--font-*`, `--fs-*`. Structure is
    constant across themes.
12. **Skipping §6.** If you add a `sb-*` class without a §6 row in the same
    commit, the inventory is no longer authoritative — and the next person
    (you in two weeks, or Claude Code) cannot trust it. Same commit, every
    time.

---

## §A · Token cheat-sheet

For the full list with comments, read `tokens.css` top-to-bottom — it's
annotated. This is the lookup table.

| Group         | Tokens                                                          |
|---------------|-----------------------------------------------------------------|
| Surfaces      | `--night` `--deep` `--surface` `--raised` `--top` `--sunk`      |
| Borders       | `--border` `--border-soft` `--border-strong` `--border-gold` `--border-blood` |
| Text          | `--text` `--text-strong` `--text-dim` `--text-mute` `--text-on-gold` `--text-on-blood` |
| Brand         | `--gold` `--gold-bright` `--gold-dim` `--gold-soft` `--flame` `--blood` `--blood-bright` `--blood-soft` |
| Pad types     | `--pad-single` `--pad-loop` `--pad-playlist` `--pad-combo` (+ `-soft` / `-glow` each) |
| Pad surface   | `--pad-edge-light` `--pad-edge-dark` *(is-deep treatment: inset edge relief + bevel gradient stops)* |
| Feature       | `--fade` `--fade-soft` *(audio fade-in/fade-out ramps)* |
| Semantic      | `--success` `--warning` `--danger` `--info`                    |
| Mode          | `--mode-setup` `--mode-game` (+ `-soft` and `-glow` each)      |
| Atmosphere    | `--glow-radial`                                                 |
| Spacing       | `--space-1` `-2` `-3` `-4` `-5` `-6` `-8` `-10` `-12` `-16`    |
| Radius        | `--radius-sm` `-pad` `-md` `-lg` `-xl` *(legacy; pixel-frame uses clip-path)* |
| Elevation     | `--shadow-card` `--shadow-pop` `--shadow-pad-lift` `--glow-gold` `--glow-flame`    |
| Type families | `--font-display` `--font-ui` `--font-mono`                     |
| Type sizes    | `--fs-xs` `-sm` `-md` `-lg` `-xl` `-2xl` `-3xl` `-4xl`         |
| Type pixel    | `--fs-pixel-sm` `-md` `-lg`                                    |

Themes: `.theme-verdant`, `.theme-neon`, `.theme-crimson` (and the default
violet-gold root). Apply on a root container.

---

*End of document. Length: ~4 pages. Update §3 if you add a state, §6 if you
add a class or component, §A if you add a token group. Anything else
substantive — open a PR against this file before writing the code.*

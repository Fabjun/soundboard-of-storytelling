# Import Gate Record: Animated Flame

**Gate run date:** 2026-09-28 / 2026-09-29
**Artifact:** `SoS_DESIGN_25052026/v13-animated-flame.jsx` — `<AnimatedFlame />` (lines 76–407)
**ADR:** ADR-0046 (design → code import gate)
**Gate status:** COMPLETE — imported into `v3/src/components/AnimatedFlame.tsx` +
`v3/src/lib/flameMath.ts`, used on the StartScreen (replaces the static `PixelIcon` placeholder).
**Scope:** the flame only (product owner decision). Title, background and buttons of the
StartScreen are unchanged; the design's `IntroScreen`, `ColdMeter` and "TAP TO THAW" label
were not imported.

> **Superseding design pending:** the product owner reports a newer flame design in Claude
> Design. When it arrives (new `SoS_DESIGN_<DDMMYYYY>/` folder), re-run this gate against it
> and carry the V3 additions below over.

---

## Fidelity check (1:1)

Machine-compared against the design file:

| Data | Design | V3 | Result |
|---|---|---|---|
| `FLAME_TIP` | 4 | 4 | identical |
| `FLAME_BODY` | 98 | 98 | identical |
| `ICE_FACETS` | 16 | 16 | identical |
| `CHIP_SOURCES` | 15 | 15 | identical |
| `GLITTER_POS` | 16 | 16 | identical |
| Icicles | 5 | 5 | identical |
| Colour literals (10) | hex | tokens with identical values | identical |

All timings, thresholds and particle physics are copied unchanged (tip 12 fps, sway, breath,
embers, heart pulse, halo, tongue lick, thaw grace 1.6 s / decay 0.45, freeze 0.18 per tap,
spark and chip counts, gravity, drag, glitter).

## Gate checks

1. **Path-D inline styles:** static styles moved to `sb-animated-flame`, `-halo`, `-svg`,
   `-frost` (with `@inventory`). Remaining inline values are computed per frame or from props
   (size, cursor, transforms, blended colours, opacity) — Path C.
2. **Class names:** new `sb-*` classes registered via `sync:classes`; no new `is-*` state
   (a proposed `is-interactive` was dropped — not in the closed vocabulary; cursor is prop-driven inline).
3. **Hex / px literals:** all colours are tokens — `--flame-outer/-mid/-core/-heart`,
   `--ice-outer/-mid/-core/-heart`, `--flame-halo-turn`, `--ice-frost`, `--flame-highlight`,
   `--flame-smoke`; halo warm = `--flame`, halo cold = `--ice-mid`.
4. **TODO-CLASS markers:** none.
5. **Token existence:** all tokens defined in `v3/src/styles/tokens.css`.

## Deviations from the design

| # | Deviation | Reason | Decided |
|---|---|---|---|
| X1 | `hexToRgb` also parses `rgb(…)` | Design bug: spark colour nests `lerpColor` output (`rgb(…)`) into `lerpColor`, producing `rgb(NaN,…)` → sparks rendered **black**. Fix restores the intended white-hot → gold. | 2026-09-28 |
| X2 | Frost vignette `radial-gradient(circle closest-side, transparent 50%, frost 85%, transparent 100%)` | Design's `radial-gradient(circle, transparent 50%, frost 100%)` fills the corners of the rectangular root → visible **light box** when frozen (verified in the original design, screenshot). Now a soft round ring. | 2026-09-28 (open: softer or removed — revisit with the new design) |
| X3 | `touch-action: manipulation`, `-webkit-tap-highlight-color: transparent` | Rapid taps (to freeze) would trigger iOS double-tap zoom and a grey tap flash — not visible in the design (mouse). | 2026-09-28 |
| X4 | Core ring glow: core pixels glide smoothly towards heart / mid colour (3 targets/s, max 22 %) | Product owner request: the inside looked static. | 2026-09-29 |
| X5 | Heart flicker: 5 fps jitter (±15 %), occasional lit neighbour pixel, one random corner at 65 % | Product owner request: break the static 2×2 square, subtly. | 2026-09-29 |
| X6 | Sparks cool into black smoke (`--flame-smoke`) and live 1.6× longer | Product owner request: bright like sparks first, then black, visible longer. | 2026-09-29 |

## Tests

- `v3/tests/unit/flameMath.test.ts` — shape data, colour maths, X1, X4–X6.
- `visual-startscreen.spec.ts` — the flame well is **masked** (continuous JS animation); the rest
  of the StartScreen stays pixel-compared.

## Parked

- Settings option "reduce motion" for the flame and other animations (product owner: the flame
  is meant to move and be played with; reduction becomes an option) — BACKLOG.

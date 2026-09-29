# Import Gate Record: Animated Flame (hybrid)

**Gate run dates:** 2026-09-28 (v13, SVG) · 2026-09-29 (Hearth, canvas hybrid)
**ADR:** ADR-0046 (design → code import gate)
**Gate status:** COMPLETE — `v3/src/components/AnimatedFlame.tsx` + `v3/src/lib/flameMath.ts`,
used on the StartScreen (replaced the static `PixelIcon` placeholder).
**Scope:** the flame only (product owner decision). Title, background and buttons of the
StartScreen are unchanged.

## Sources

| Part | Artifact | Why |
|---|---|---|
| **Idle animation** | `SoS_DESIGN_25052026/v13-animated-flame.jsx` `<AnimatedFlame />` (lines 76–407) | Product owner: livelier idle than Hearth |
| **Freeze / hold / thaw, particles, glow, canvas engine** | `SoS_DESIGN_28092026/Design_Soundboard_of_Storytelling/flame-engine.jsx` + `flame-themes.jsx` → **Hearth** (lines 6–211) | Product owner: better ice transformation — no box or circle, better sparks and steam |

The 2026-09-28 v13-only import (SVG) is superseded by this hybrid. Hearth's siblings
(Verdant, Neon, Crimson) are parked for the themes (BACKLOG, Slice 14).

## Fidelity check

Machine-compared: `FLAME_TIP` (4) and `FLAME_BODY` (98) are identical in v13, Hearth and V3;
the Hearth palette (8 colours) is identical to the v13 palette and to the tokens.

**From v13, values unchanged:** tip flicker 12 fps + reach-up extension, sway (0.4), breath
(±3 %), tongue lick, two rising embers, heart pulse, `flicker = 1 − charge × 1.4`.

**From Hearth, values unchanged:** phase automaton (charge +0.15 per tap, grace 0.22 s,
hold 4.0 s, thaw 0.34/s), freeze threshold per pixel and freeze front
(`globalCool 0.7`, `front × 2.4`, `× 0.6`), glow drop-shadow (rgb 232,130,30 → 120,180,224,
alpha 0.5, blur 12 → 16), shiver (sin 40t × 0.3, decay 5/s, hold jolt 0.5), idle embers
(p 0.018/frame) and crackle (3.5–7 s, 1–2 sparks), falling frost (p charge × 0.45), frost cracks
(p 0.07, 0.2 s), facets with drifting glint and sparkle crosses, hold-tap shards (5–12),
revert strike (p 0.4, burst 0.32), melt drips, re-ignite (7 embers), steam lobes,
particle physics and fades, ~45 fps ticker cap (22 ms).

## Gate checks

1. **Path-D inline styles:** static styles in `sb-animated-flame` / `sb-animated-flame-canvas`
   (`@inventory`). Inline only: prop-derived size/offset/cursor and the per-state glow filter
   (Path C).
2. **Class names:** registered via `sync:classes`; no new `is-*` state.
3. **Hex literals:** none in code — tokens `--flame-outer/-mid/-core/-heart`,
   `--ice-outer/-mid/-core/-heart`, `--flame` (warm glow), `--ice-glow`, `--flame-steam`,
   `--flame-highlight`.
4. **TODO-CLASS markers:** none.
5. **Token existence:** all defined in `v3/src/styles/tokens.css`.

## Deviations and additions

| # | Item | Reason | Date |
|---|---|---|---|
| X1 | Hybrid: v13 idle + Hearth freeze on one canvas | Product owner choice (best of both) | 2026-09-29 |
| X2 | Body motion is v13's whole-body sway + breath (not Hearth's per-row sway) and v13's tip flicker (not Hearth's noise tip / tip-dance) | Part of the v13 idle | 2026-09-29 |
| X3 | Core-ring glow: core pixels glide towards heart / mid colour (3 targets/s, max 22 %) | Product owner request | 2026-09-29 |
| X4 | Heart as four pixels: 5 fps jitter (±15 %), occasional lit neighbour, one random corner at 65 % | Product owner request | 2026-09-29 |
| X5 | Canvas `touch-action: manipulation` (Hearth: `none`), root without tap highlight | Page stays scrollable on phones; no iOS tap flash / double-tap zoom | 2026-09-29 |
| X6 | Facets drawn with the body offset (sway/shiver) | Keeps glints aligned with the pixels | 2026-09-29 |

Dropped from the v13-only import: frost vignette (box → ring), radial halo, spark→smoke,
v13 ice facets/icicles/chips — replaced by Hearth.

Not imported from Hearth: `hearthTexture` / `hearthAccent` (defined but unused in the design).

## Tests

- `v3/tests/unit/flameMath.test.ts` — shape data, colours and glow, freeze front, phase
  automaton, particles, core flicker.
- `visual-startscreen.spec.ts` — the flame well **and** the larger canvas field are masked
  (continuous animation); the rest of the StartScreen stays pixel-compared.

## Parked

- Settings option "reduce motion" (BACKLOG, Slice 14).
- Theme flames Verdant, Neon, Crimson (BACKLOG, Slice 14).

// ─────────────────────────────────────────────────────────────────────────────
// flameMath — shape data and colour maths for <AnimatedFlame />
//
// Source: SoS_DESIGN_25052026/v13-animated-flame.jsx (lines 11–71), imported 1:1.
// All coordinates and numbers are unchanged from the design. Colours are not
// hardcoded here: the palette is read from design tokens at runtime and passed
// in (see AnimatedFlame.tsx). Import record: docs/design/imports/animated-flame.md
// ─────────────────────────────────────────────────────────────────────────────

/** A pixel on the 16×17 flame grid: [x, y, layer] — layer 0 = outer, 1 = mid, 2 = core. */
export type FlamePixel = [number, number, number];
/** A grid position without layer: [x, y]. */
export type GridPos = [number, number];

/** Tip rows (y = 0, 1) — animated. */
export const FLAME_TIP: FlamePixel[] = [
  [7, 0, 2],
  [8, 0, 2],
  [7, 1, 1],
  [8, 1, 1],
];

/** Stable body — everything below y = 2. */
// prettier-ignore
export const FLAME_BODY: FlamePixel[] = [
  [6, 2, 0], [7, 2, 2], [8, 2, 2], [9, 2, 0],
  [6, 3, 0], [7, 3, 2], [8, 3, 2], [9, 3, 0],
  [5, 4, 0], [6, 4, 1], [7, 4, 2], [8, 4, 2], [9, 4, 1], [10, 4, 0],
  [5, 5, 0], [6, 5, 1], [7, 5, 2], [8, 5, 2], [9, 5, 1], [10, 5, 0],
  [4, 6, 0], [5, 6, 1], [6, 6, 2], [7, 6, 2], [8, 6, 2], [9, 6, 2], [10, 6, 1], [11, 6, 0],
  [4, 7, 0], [5, 7, 1], [6, 7, 2], [7, 7, 2], [8, 7, 2], [9, 7, 2], [10, 7, 1], [11, 7, 0],
  [3, 8, 0], [4, 8, 1], [5, 8, 2], [6, 8, 2], [7, 8, 2], [8, 8, 2], [9, 8, 2], [10, 8, 2], [11, 8, 1], [12, 8, 0],
  [3, 9, 0], [4, 9, 1], [5, 9, 2], [6, 9, 2], [7, 9, 2], [8, 9, 2], [9, 9, 2], [10, 9, 2], [11, 9, 1], [12, 9, 0],
  [3, 10, 0], [4, 10, 1], [5, 10, 2], [6, 10, 2], [7, 10, 2], [8, 10, 2], [9, 10, 2], [10, 10, 2], [11, 10, 1], [12, 10, 0],
  [4, 11, 0], [5, 11, 1], [6, 11, 2], [7, 11, 2], [8, 11, 2], [9, 11, 2], [10, 11, 1], [11, 11, 0],
  [4, 12, 0], [5, 12, 1], [6, 12, 2], [7, 12, 2], [8, 12, 2], [9, 12, 2], [10, 12, 1], [11, 12, 0],
  [5, 13, 0], [6, 13, 1], [7, 13, 2], [8, 13, 2], [9, 13, 1], [10, 13, 0],
  [5, 14, 0], [6, 14, 0], [7, 14, 1], [8, 14, 1], [9, 14, 0], [10, 14, 0],
  [6, 15, 0], [7, 15, 0], [8, 15, 0], [9, 15, 0],
];

/** Ice facets — fade in when freezing. The first 11 are tinted, the rest white. */
// prettier-ignore
export const ICE_FACETS: GridPos[] = [
  [4, 7], [5, 8], [6, 9], [7, 10],
  [11, 7], [10, 8], [9, 9],
  [6, 11], [7, 12], [8, 13],
  [4, 5], [11, 5], [3, 10], [12, 10], [5, 13], [10, 13],
];

/** Pixels that can chip off as ice-chip particles. */
// prettier-ignore
export const CHIP_SOURCES: GridPos[] = [
  [4, 7], [5, 5], [6, 8], [7, 10], [10, 5], [11, 7], [10, 8], [9, 9],
  [4, 9], [5, 11], [10, 11], [6, 13], [9, 13], [5, 8], [11, 9],
];

/** Possible glitter positions on the ice. */
// prettier-ignore
export const GLITTER_POS: GridPos[] = [
  [4, 5], [5, 5], [10, 5], [11, 5], [5, 7], [10, 7], [4, 9], [11, 9],
  [6, 11], [9, 11], [5, 13], [10, 13], [7, 8], [8, 8], [3, 10], [12, 10],
];

/** Icicles below the base when fully frozen. */
// prettier-ignore
export const ICICLES: GridPos[] = [
  [5, 15], [6, 16], [8, 16], [10, 15], [11, 16],
];

/** One temperature family of the flame (warm = GAME colours, cold = SETUP ice). */
export type FlameFamily = { outer: string; mid: string; core: string; heart: string };

/** Full palette, resolved from design tokens. All values are 6-digit hex colours. */
export type FlamePalette = {
  warm: FlameFamily;
  cold: FlameFamily;
  /** Halo at cold = 0 (design: #E8821E). */
  haloWarm: string;
  /** Halo at cold = 0.5 — lilac turning point (design: #9F88E8). */
  haloTurn: string;
  /** Halo at cold = 1 (design: #5BAFD8 — same as the ice mid colour). */
  haloCold: string;
  /** Frost vignette base colour (design: rgba(155,210,235,…)). */
  frost: string;
  /** Spark / glitter / highlight white (design: #FFFFFF). */
  highlight: string;
  /** Smoke the sparks cool down into (V3 addition — design sparks only faded out). */
  smoke: string;
};

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Parses '#rrggbb' (leading '#' optional, surrounding whitespace ignored) and also
 * 'rgb(r,g,b)' — the output format of lerpColor.
 *
 * Deviation from the design: the design's hexToRgb only read hex, but its spark colour
 * nests lerpColor (an 'rgb(…)' string) into lerpColor — yielding rgb(NaN,…), which
 * browsers draw black. Accepting 'rgb(…)' restores the intended white-hot → gold sparks.
 */
export function hexToRgb(color: string): [number, number, number] {
  const c = color.trim();
  const rgb = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/.exec(c);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  const h = c.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Linear blend of two colours ('#rrggbb' or 'rgb(r,g,b)') → 'rgb(r,g,b)'. */
export function lerpColor(c1: string, c2: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  return `rgb(${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(lerp(b1, b2, t))})`;
}

/** Colour of a body layer at a given coldness (0 = warm, 1 = frozen). */
export function colorAt(layer: number, cold: number, palette: FlamePalette): string {
  const w = palette.warm;
  const c = palette.cold;
  if (layer === 0) return lerpColor(w.outer, c.outer, cold);
  if (layer === 1) return lerpColor(w.mid, c.mid, cold);
  return lerpColor(w.core, c.core, cold);
}

/** Halo colour: warm → lilac turn (cold 0–0.5) → cold (0.5–1). */
export function haloColorAt(cold: number, palette: FlamePalette): string {
  return cold < 0.5
    ? lerpColor(palette.haloWarm, palette.haloTurn, cold * 2)
    : lerpColor(palette.haloTurn, palette.haloCold, (cold - 0.5) * 2);
}

/** Frost vignette colour with the design's alpha formula: (cold − 0.3) × 0.18. */
export function frostColorAt(cold: number, palette: FlamePalette): string {
  const [r, g, b] = hexToRgb(palette.frost);
  return `rgba(${r},${g},${b},${(cold - 0.3) * 0.18})`;
}

// ── Core flicker (V3 addition, not in the design — product owner request 2026-09-29) ──

/** Frame rate of the heart flicker (jitter, dim corner, neighbour) — slower than the 12fps tip. */
export const CORE_FLICKER_FPS = 5;

/** New glow targets per second for the core ring — pixels glide smoothly between them. */
export const RING_GLOW_FPS = 3;

/** Max. share the core ring moves towards the heart (brighter) or mid colour (darker). */
export const RING_GLOW_STRENGTH = 0.22;

/** The 2×2 heart as four pixels (top-left, top-right, bottom-left, bottom-right). */
// prettier-ignore
export const HEART_PIXELS: GridPos[] = [
  [7, 9], [8, 9], [7, 10], [8, 10],
];

/** How much the randomly chosen dim heart corner loses (0.35 → shines at 65 %). */
export const HEART_CORNER_DIM = 0.35;

/** Neighbours of the 2×2 heart (x 7–8, y 9–10) that can briefly light up. */
// prettier-ignore
export const HEART_NEIGHBOURS: GridPos[] = [
  [7, 8], [8, 8], [6, 9], [9, 10], [7, 11], [8, 11],
];

/** Deterministic pseudo-random value in [0, 1) for a flicker frame and a pixel index. */
export function flickerNoise(frame: number, i: number): number {
  const n = Math.sin(frame * 12.9898 + i * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Smoothly interpolated noise in [0, 1): glides from the value of frame ⌊pos⌋ to the next
 * with a smoothstep ease, so the core ring glows instead of jumping.
 */
export function smoothNoise(pos: number, i: number): number {
  const f0 = Math.floor(pos);
  const frac = pos - f0;
  const t = frac * frac * (3 - 2 * frac);
  return lerp(flickerNoise(f0, i), flickerNoise(f0 + 1, i), t);
}

/**
 * Colour of one core-layer pixel with a subtle flicker: brighter towards the heart or
 * darker towards the mid colour, by at most `strength` (scaled by the flame's flicker,
 * so a frozen flame is still).
 */
export function coreFlickerColor(
  core: string,
  heart: string,
  mid: string,
  noise: number,
  flicker: number,
  strength = 0.3,
): string {
  const a = noise * 2 - 1; // −1 … 1
  return a >= 0
    ? lerpColor(core, heart, a * strength * flicker)
    : lerpColor(core, mid, -a * strength * flicker);
}

// ── Spark → smoke (V3 addition, not in the design — product owner request 2026-09-29) ──

/** Spark lifetime multiplier: sparks live ~60 % longer so the smoke phase stays visible. */
export const SPARK_LIFE_SCALE = 1.6;

/** Share of the spark's life (from birth) spent glowing; the rest turns into smoke. */
export const SPARK_GLOW_PHASE = 0.45;

/**
 * Spark colour over its life. `t` = remaining life ratio (1 at birth → 0 at death).
 * Glow phase: white-hot → ember (core/mid by `warmth`), as in the design.
 * Smoke phase: ember → smoke (black).
 */
export function sparkColorAt(t: number, warmth: number, palette: FlamePalette): string {
  const ember = lerpColor(palette.warm.core, palette.warm.mid, warmth);
  const glowEnd = 1 - SPARK_GLOW_PHASE; // t at which the glow phase ends
  if (t >= glowEnd) {
    const k = (1 - t) / SPARK_GLOW_PHASE; // 0 at birth → 1 at end of glow
    return lerpColor(palette.highlight, ember, 0.6 + k * 0.4);
  }
  return lerpColor(ember, palette.smoke, 1 - t / glowEnd);
}

/** Spark opacity: fully visible through glow and most of the smoke phase, fades at the end. */
export function sparkOpacityAt(t: number): number {
  return Math.min(1, t * 3);
}

// ─────────────────────────────────────────────────────────────────────────────
// flameMath — shape data, colour maths, freeze state machine and particles
// for <AnimatedFlame /> (hybrid flame).
//
// Sources (Claude Design):
//   • Idle animation — design-sources/2026-05-25/v13-animated-flame.jsx (+ V3 additions:
//     core-ring glow, heart flicker)
//   • Freeze / hold / thaw, particles, glow — design-sources/2026-09-28/…/flame-engine.jsx
//     and flame-themes.jsx ("Hearth"), values unchanged.
// Colours are never hardcoded here: the palette is read from design tokens at runtime
// and passed in. Import record: docs/design/imports/animated-flame.md
// ─────────────────────────────────────────────────────────────────────────────

/** A pixel on the 16×17 flame grid: [x, y, layer] — layer 0 = outer, 1 = mid, 2 = core. */
export type FlamePixel = [number, number, number];
/** A grid position without layer: [x, y]. */
export type GridPos = [number, number];

// ── Shape (identical in v13 and Hearth) ─────────────────────────────────────

/** Tip rows (y = 0, 1) — animated. */
export const FLAME_TIP: FlamePixel[] = [
  [7, 0, 2],
  [8, 0, 2],
  [7, 1, 1],
  [8, 1, 1],
];

/** Stable body — everything below y = 2. */
// Formatting: keep the pixel table aligned row by row (Prettier would reflow it).
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

/** Tip + body — every pixel of the flame (Hearth: FLAME_PIX). */
export const FLAME_PIX: FlamePixel[] = FLAME_TIP.concat(FLAME_BODY);

/** The 2×2 heart as four pixels (top-left, top-right, bottom-left, bottom-right). V3 addition. */
// Formatting: keep the pixel table aligned row by row (Prettier would reflow it).
// prettier-ignore
export const HEART_PIXELS: GridPos[] = [
  [7, 9], [8, 9], [7, 10], [8, 10],
];

/** Neighbours of the 2×2 heart that can briefly light up. V3 addition. */
// Formatting: keep the pixel table aligned row by row (Prettier would reflow it).
// prettier-ignore
export const HEART_NEIGHBOURS: GridPos[] = [
  [7, 8], [8, 8], [6, 9], [9, 10], [7, 11], [8, 11],
];

/** Stable facets of the ice crystal (Hearth). */
// Formatting: keep the pixel table aligned row by row (Prettier would reflow it).
// prettier-ignore
export const HEARTH_FACETS: GridPos[] = [
  [5, 5], [10, 5], [7, 3], [4, 9], [11, 9], [6, 8], [9, 8], [7, 11], [5, 13], [10, 13], [8, 6],
];

/** Edge pixels ice shards break off from when tapping the frozen flame (Hearth). */
// Formatting: keep the pixel table aligned row by row (Prettier would reflow it).
// prettier-ignore
export const SHARD_EDGES: GridPos[] = [
  [3, 8], [4, 6], [4, 9], [5, 5], [11, 6], [12, 8], [12, 10], [11, 9], [10, 5], [5, 13], [10, 13], [7, 2],
];

// ── Canvas field (Hearth) ───────────────────────────────────────────────────

/** Field size in cells; the 16×17 flame sits at (FIELD_OX, FIELD_OY). */
export const FIELD_W = 32;
export const FIELD_H = 40;
export const FIELD_OX = 8;
export const FIELD_OY = 12;
/** Canvas pixels per cell. */
export const CELL = 10;

// ── Timing (v13 idle + V3 additions) ────────────────────────────────────────

/** Heart flicker frame rate (jitter, dim corner, neighbour) — V3 addition. */
export const CORE_FLICKER_FPS = 5;
/** New glow targets per second for the core ring — pixels glide between them. V3 addition. */
export const RING_GLOW_FPS = 3;
/** Max. share the core ring moves towards the heart (brighter) or mid colour (darker). */
export const RING_GLOW_STRENGTH = 0.22;
/** How much the randomly chosen dim heart corner loses (0.35 → shines at 65 %). */
export const HEART_CORNER_DIM = 0.35;

// ── Hearth behaviour (values 1:1) ───────────────────────────────────────────

export const HEARTH = {
  chargePerTap: 0.15,
  thawRate: 0.34,
  holdDur: 4.0,
  grace: 0.22,
} as const;

// ── Palette ─────────────────────────────────────────────────────────────────

/** One temperature family of the flame (warm = GAME colours, cold = SETUP ice). */
export type FlameFamily = { outer: string; mid: string; core: string; heart: string };

/** Full palette, resolved from design tokens. All values are 6-digit hex colours. */
export type FlamePalette = {
  warm: FlameFamily;
  cold: FlameFamily;
  /** Glow at charge 0 (Hearth: rgb(232,130,30)). */
  glowWarm: string;
  /** Glow at charge 1 (Hearth: rgb(120,180,224)). */
  glowCold: string;
  /** Steam (Hearth: #e2eef4). */
  steam: string;
  /** White for sparks' hot core, glints, cracks, shard glitter. */
  highlight: string;
};

// ── Colour maths ────────────────────────────────────────────────────────────

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Parses '#rrggbb' (leading '#' optional, whitespace ignored) and 'rgb(r,g,b)'. */
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

/** Colour of a layer (0 outer · 1 mid · 2 core) within one family. */
export function layerOf(family: FlameFamily, layer: number): string {
  if (layer === 0) return family.outer;
  if (layer === 1) return family.mid;
  return family.core;
}

/** Glow colour for the canvas drop-shadow (Hearth: alpha 0.5, warm → cold with charge). */
export function glowColorAt(charge: number, palette: FlamePalette): string {
  const [r1, g1, b1] = hexToRgb(palette.glowWarm);
  const [r2, g2, b2] = hexToRgb(palette.glowCold);
  return `rgba(${Math.round(lerp(r1, r2, charge))},${Math.round(lerp(g1, g2, charge))},${Math.round(lerp(b1, b2, charge))},0.5)`;
}

/** Glow blur radius in CSS px (Hearth: 12 + charge × 4). */
export function glowBlurAt(charge: number): number {
  return 12 + charge * 4;
}

// ── Freeze front (Hearth) ───────────────────────────────────────────────────

/**
 * Freeze threshold per pixel: LOW at the edge and top (freezes first), HIGH in the core
 * bottom-centre (freezes last). Thawing reverses it — warmth spreads from the inside out.
 */
export function freezeThreshold(x: number, y: number): number {
  const edge = Math.abs(x - 7.5) / 4.5; // 0 centre … 1 edge
  return (1 - edge) * 0.5 + (y / 15) * 0.28;
}

/** How far a pixel has turned to ice (0 warm … 1 ice) at a given charge (Hearth colorAt). */
export function pixelFreeze(charge: number, x: number, y: number): number {
  const globalCool = charge * 0.7;
  const front = Math.max(0, Math.min(1, (charge - freezeThreshold(x, y)) * 2.4));
  return Math.min(1, globalCool + front * 0.6);
}

// ── State machine (Hearth: idle → transform → hold → revert → idle) ────────

export type FlamePhase = 'idle' | 'transform' | 'hold' | 'revert';

export type FlameState = {
  charge: number;
  phase: FlamePhase;
  /** Time (s) of the last tap that added charge. */
  lastTap: number;
  /** Time (s) the hold phase started (refreshed by taps while holding). */
  holdStart: number;
  /** Tap shake, decays quickly. */
  shiver: number;
};

export function initialFlameState(): FlameState {
  return { charge: 0, phase: 'idle', lastTap: -9, holdStart: 0, shiver: 0 };
}

/** Advances the phase automaton by dt at time t (seconds). Mutates and returns `st`. */
export function stepFlameState(st: FlameState, t: number, dt: number): FlameState {
  if (st.phase === 'transform') {
    if (st.charge >= 0.999) {
      st.phase = 'hold';
      st.holdStart = t;
    } else if (t - st.lastTap > HEARTH.grace) st.phase = 'revert';
  } else if (st.phase === 'hold') {
    st.charge = 1;
    if (t - st.holdStart > HEARTH.holdDur) st.phase = 'revert';
  } else if (st.phase === 'revert') {
    st.charge = Math.max(0, st.charge - dt * HEARTH.thawRate);
    if (st.charge <= 0.001) {
      st.charge = 0;
      st.phase = 'idle';
    }
  }
  if (st.shiver > 0) st.shiver = Math.max(0, st.shiver - dt * 5);
  return st;
}

/**
 * Applies a tap at time t. Returns 'hold-tap' when the flame was frozen solid (the hold is
 * refreshed and shards should burst) or 'charge' when the tap added charge.
 */
export function tapFlameState(st: FlameState, t: number): 'hold-tap' | 'charge' {
  if (st.phase === 'hold') {
    st.shiver = 0.7;
    st.holdStart = t;
    return 'hold-tap';
  }
  st.charge = Math.min(1, st.charge + HEARTH.chargePerTap);
  st.lastTap = t;
  if (st.charge >= 0.999) {
    st.phase = 'hold';
    st.holdStart = t;
  } else st.phase = 'transform';
  st.shiver = 1;
  return 'charge';
}

// ── Particles (Hearth engine) ───────────────────────────────────────────────

export type ParticleKind = 'ember' | 'frost' | 'steam' | 'shard' | 'drip';

export type Particle = {
  kind: ParticleKind;
  /** Position in field cells. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Gravity (cells/s²); negative rises. */
  g: number;
  life: number;
  maxLife: number;
  /** Fade-out duration at the end of life (s). */
  fade: number;
  color: string;
  /** Size in cells. */
  s: number;
  rot: number;
  spin: number;
  /** Steam only: grows and drifts sideways. */
  steamDrift: boolean;
  /** Steam only: stable per-particle variation seed. */
  seed: number;
};

/** Advances and prunes particles (Hearth updateParticles + steam onUpd). Mutates `ps`. */
export function updateParticles(ps: Particle[], dt: number): void {
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i];
    p.life -= dt;
    if (p.life <= 0) {
      ps.splice(i, 1);
      continue;
    }
    p.vy += p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.spin * dt;
    if (p.steamDrift) {
      p.s += dt * 0.4;
      p.vx += Math.sin((p.maxLife - p.life) * 1.6 + p.x) * dt * 0.8;
    }
  }
}

/** Particle opacity: full until the last `fade` seconds (Hearth drawParticles). */
export function particleAlpha(p: Particle): number {
  return Math.max(0, Math.min(1, p.life / (p.fade || 0.3)));
}

/**
 * Random emission point over the whole flame, weighted towards the tip (Hearth flameEmit).
 * `rand` returns [0, 1) — injectable for tests.
 */
export function flameEmit(rand: () => number = Math.random): GridPos {
  for (let tries = 0; tries < 8; tries++) {
    const e = FLAME_PIX[Math.floor(rand() * FLAME_PIX.length)];
    if (rand() < 1 - e[1] / 17) return [e[0], e[1]];
  }
  return [7, 3];
}

// ── V3 additions: heart flicker + core-ring glow ────────────────────────────

/** Deterministic pseudo-random value in [0, 1) for a frame and a pixel index. */
export function flickerNoise(frame: number, i: number): number {
  const n = Math.sin(frame * 12.9898 + i * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

/** Smoothly interpolated noise in [0, 1): glides between frame values (smoothstep). */
export function smoothNoise(pos: number, i: number): number {
  const f0 = Math.floor(pos);
  const frac = pos - f0;
  const t = frac * frac * (3 - 2 * frac);
  return lerp(flickerNoise(f0, i), flickerNoise(f0 + 1, i), t);
}

/**
 * Colour of one core-ring pixel: brighter towards the heart or darker towards the mid
 * colour, by at most `strength`, scaled by the flame's flicker (a frozen flame is still).
 */
export function coreFlickerColor(
  core: string,
  heart: string,
  mid: string,
  noise: number,
  flicker: number,
  strength = RING_GLOW_STRENGTH,
): string {
  const a = noise * 2 - 1; // −1 … 1
  return a >= 0
    ? lerpColor(core, heart, a * strength * flicker)
    : lerpColor(core, mid, -a * strength * flicker);
}

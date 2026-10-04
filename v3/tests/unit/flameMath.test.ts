/**
 * @fileoverview flameMath — unit tests
 *
 * Pure math for the hybrid AnimatedFlame: shape, colors, Hearth freeze front,
 * phase automaton, particles, V3 core flicker. No DOM, no mocks needed.
 * Expected values mirror v13-animated-flame.jsx and flame-engine/-themes.jsx (Hearth).
 */

import {
  FLAME_BODY,
  FLAME_PIX,
  FLAME_TIP,
  HEART_NEIGHBOURS,
  HEART_PIXELS,
  HEARTH,
  HEARTH_FACETS,
  SHARD_EDGES,
  coreFlickerColor,
  flameEmit,
  flickerNoise,
  freezeThreshold,
  glowBlurAt,
  glowColorAt,
  hexToRgb,
  initialFlameState,
  layerOf,
  lerp,
  lerpColor,
  particleAlpha,
  pixelFreeze,
  smoothNoise,
  stepFlameState,
  tapFlameState,
  updateParticles,
  type FlamePalette,
  type Particle,
} from '../../src/lib/flameMath';

// Design values (Hearth PAL + glow endpoints + steam)
const PALETTE: FlamePalette = {
  warm: { outer: '#C46818', mid: '#E8881E', core: '#F5C242', heart: '#FFE8A0' },
  cold: { outer: '#3F88B8', mid: '#5BAFD8', core: '#9FD8EE', heart: '#E8F8FF' },
  glowWarm: '#E8821E',
  glowCold: '#78B4E0',
  steam: '#E2EEF4',
  highlight: '#FFFFFF',
};

function particle(p: Partial<Particle>): Particle {
  return {
    kind: 'ember',
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    g: 0,
    life: 1,
    maxLife: 1,
    fade: 0.3,
    color: '#FFFFFF',
    s: 1,
    rot: 0,
    spin: 0,
    steamDrift: false,
    seed: 0,
    ...p,
  };
}

describe('color math', () => {
  it('lerp interpolates linearly', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
  });

  it('parses hex (with/without #, whitespace) and rgb()', () => {
    expect(hexToRgb('#C46818')).toEqual([196, 104, 24]);
    expect(hexToRgb(' c46818')).toEqual([196, 104, 24]);
    expect(hexToRgb('rgb(245,194,66)')).toEqual([245, 194, 66]);
  });

  it('lerpColor returns endpoints and rounds the midpoint', () => {
    expect(lerpColor('#000000', '#FFFFFF', 0)).toBe('rgb(0,0,0)');
    expect(lerpColor('#000000', '#FFFFFF', 0.5)).toBe('rgb(128,128,128)');
    expect(lerpColor('#000000', '#FFFFFF', 1)).toBe('rgb(255,255,255)');
  });

  it('layerOf maps 0/1/2 to outer/mid/core', () => {
    expect(layerOf(PALETTE.warm, 0)).toBe('#C46818');
    expect(layerOf(PALETTE.warm, 1)).toBe('#E8881E');
    expect(layerOf(PALETTE.warm, 2)).toBe('#F5C242');
  });

  it('glow goes warm → cold at alpha 0.5, blur 12 → 16 (Hearth)', () => {
    expect(glowColorAt(0, PALETTE)).toBe('rgba(232,130,30,0.5)');
    expect(glowColorAt(1, PALETTE)).toBe('rgba(120,180,224,0.5)');
    expect(glowBlurAt(0)).toBe(12);
    expect(glowBlurAt(1)).toBe(16);
  });
});

describe('shape data', () => {
  it('keeps the design pixel counts', () => {
    expect(FLAME_TIP).toHaveLength(4);
    expect(FLAME_BODY).toHaveLength(98);
    expect(FLAME_PIX).toHaveLength(102);
    expect(HEARTH_FACETS).toHaveLength(11);
    expect(SHARD_EDGES).toHaveLength(12);
  });

  it('stays inside the 16×17 grid', () => {
    for (const [x, y, layer] of FLAME_BODY) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(16);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThan(17);
      expect([0, 1, 2]).toContain(layer);
    }
  });

  it('heart pixels form the 2×2 square at x 7–8, y 9–10; neighbors are adjacent', () => {
    expect(HEART_PIXELS).toEqual([
      [7, 9],
      [8, 9],
      [7, 10],
      [8, 10],
    ]);
    for (const [x, y] of HEART_NEIGHBOURS) {
      expect(x).toBeGreaterThanOrEqual(6);
      expect(x).toBeLessThanOrEqual(9);
      expect(y).toBeGreaterThanOrEqual(8);
      expect(y).toBeLessThanOrEqual(11);
    }
  });
});

describe('freeze front (Hearth)', () => {
  it('edge and top freeze before the bottom center', () => {
    expect(freezeThreshold(3, 8)).toBeLessThan(freezeThreshold(7, 13));
    expect(freezeThreshold(7, 0)).toBeLessThan(freezeThreshold(7, 14));
  });

  it('pixelFreeze is 0 when warm, 1 when fully charged, and monotonic in charge', () => {
    expect(pixelFreeze(0, 7, 10)).toBe(0);
    expect(pixelFreeze(1, 7, 10)).toBe(1);
    let prev = -1;
    for (let c = 0; c <= 1.0001; c += 0.1) {
      const v = pixelFreeze(c, 7, 10);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  it('at half charge the edge is icier than the core', () => {
    expect(pixelFreeze(0.5, 3, 8)).toBeGreaterThan(pixelFreeze(0.5, 7, 13));
  });
});

describe('phase automaton (Hearth)', () => {
  it('a tap charges by 0.15 and enters transform', () => {
    const st = initialFlameState();
    expect(tapFlameState(st, 10)).toBe('charge');
    expect(st.charge).toBeCloseTo(HEARTH.chargePerTap, 10);
    expect(st.phase).toBe('transform');
    expect(st.shiver).toBe(1);
  });

  it('transform → revert after the grace period without taps', () => {
    const st = initialFlameState();
    tapFlameState(st, 10);
    stepFlameState(st, 10 + HEARTH.grace + 0.01, 0.02);
    expect(st.phase).toBe('revert');
  });

  it('enough taps reach hold; hold lasts holdDur, then reverts and thaws to idle', () => {
    const st = initialFlameState();
    let t = 10;
    for (let i = 0; i < 7; i++) tapFlameState(st, (t += 0.1));
    expect(st.phase).toBe('hold');
    expect(st.charge).toBe(1);
    stepFlameState(st, t + HEARTH.holdDur - 0.1, 0.02);
    expect(st.phase).toBe('hold');
    stepFlameState(st, t + HEARTH.holdDur + 0.1, 0.02);
    expect(st.phase).toBe('revert');
    for (let i = 0; i < 200 && st.phase !== 'idle'; i++) stepFlameState(st, t + 5 + i * 0.05, 0.05);
    expect(st.phase).toBe('idle');
    expect(st.charge).toBe(0);
  });

  it('a tap while holding returns hold-tap and refreshes the hold', () => {
    const st = initialFlameState();
    let t = 10;
    for (let i = 0; i < 7; i++) tapFlameState(st, (t += 0.1));
    expect(tapFlameState(st, t + 3)).toBe('hold-tap');
    expect(st.holdStart).toBe(t + 3);
    stepFlameState(st, t + 3 + HEARTH.holdDur - 0.1, 0.02);
    expect(st.phase).toBe('hold');
  });
});

describe('particles (Hearth engine)', () => {
  it('moves particles with gravity and removes dead ones', () => {
    const ps = [particle({ vy: 0, g: 10, life: 1 }), particle({ life: 0.01 })];
    updateParticles(ps, 0.1);
    expect(ps).toHaveLength(1);
    expect(ps[0].vy).toBeCloseTo(1, 10);
    expect(ps[0].y).toBeCloseTo(0.1, 10);
  });

  it('steam grows while it drifts', () => {
    const ps = [particle({ kind: 'steam', steamDrift: true, s: 1, life: 2, maxLife: 2 })];
    updateParticles(ps, 0.5);
    expect(ps[0].s).toBeCloseTo(1.2, 10);
  });

  it('is fully opaque until the fade window at the end of life', () => {
    expect(particleAlpha(particle({ life: 1, fade: 0.3 }))).toBe(1);
    expect(particleAlpha(particle({ life: 0.15, fade: 0.3 }))).toBeCloseTo(0.5, 10);
  });

  it('flameEmit returns a flame pixel (deterministic rand)', () => {
    const [x, y] = flameEmit(() => 0);
    expect(FLAME_PIX.some(([px, py]) => px === x && py === y)).toBe(true);
  });
});

describe('core flicker (V3 addition)', () => {
  it('flickerNoise is deterministic and stays in [0, 1)', () => {
    for (let frame = 0; frame < 100; frame++) {
      for (let i = 0; i < 30; i++) {
        const n = flickerNoise(frame, i);
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThan(1);
        expect(flickerNoise(frame, i)).toBe(n);
      }
    }
  });

  it('smoothNoise hits frame values at whole positions and glides in between', () => {
    expect(smoothNoise(3, 5)).toBeCloseTo(flickerNoise(3, 5), 10);
    const mid = smoothNoise(3.5, 5);
    expect(mid).toBeGreaterThanOrEqual(Math.min(flickerNoise(3, 5), flickerNoise(4, 5)));
    expect(mid).toBeLessThanOrEqual(Math.max(flickerNoise(3, 5), flickerNoise(4, 5)));
  });

  it('coreFlickerColor is still when frozen and bounded by strength when warm', () => {
    const { core, heart, mid } = PALETTE.warm;
    expect(coreFlickerColor(core, heart, mid, 0.95, 0)).toBe('rgb(245,194,66)');
    expect(coreFlickerColor(core, heart, mid, 1, 1, 0.3)).toBe(lerpColor(core, heart, 0.3));
    expect(coreFlickerColor(core, heart, mid, 0, 1, 0.3)).toBe(lerpColor(core, mid, 0.3));
  });
});

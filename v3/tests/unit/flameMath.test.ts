// ─────────────────────────────────────────────────────────────────────────────
// flameMath — unit tests
//
// Pure colour maths + shape data for AnimatedFlame. No DOM, no mocks needed.
// Expected values mirror SoS_DESIGN_25052026/v13-animated-flame.jsx.
// ─────────────────────────────────────────────────────────────────────────────

import {
  FLAME_BODY,
  FLAME_TIP,
  ICE_FACETS,
  HEART_NEIGHBOURS,
  HEART_PIXELS,
  colorAt,
  coreFlickerColor,
  flickerNoise,
  smoothNoise,
  sparkColorAt,
  sparkOpacityAt,
  frostColorAt,
  haloColorAt,
  hexToRgb,
  lerp,
  lerpColor,
  type FlamePalette,
} from '../../src/lib/flameMath';

// Design values (v13-animated-flame.jsx WARM / COLD + halo / frost literals)
const PALETTE: FlamePalette = {
  warm: { outer: '#C46818', mid: '#E8881E', core: '#F5C242', heart: '#FFE8A0' },
  cold: { outer: '#3F88B8', mid: '#5BAFD8', core: '#9FD8EE', heart: '#E8F8FF' },
  haloWarm: '#E8821E',
  haloTurn: '#9F88E8',
  haloCold: '#5BAFD8',
  frost: '#9BD2EB',
  highlight: '#FFFFFF',
  smoke: '#050404',
};

describe('lerp / hexToRgb', () => {
  it('interpolates linearly', () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 10, 1)).toBe(10);
  });

  it('parses hex with or without #, ignoring surrounding whitespace (CSS token values)', () => {
    expect(hexToRgb('#C46818')).toEqual([196, 104, 24]);
    expect(hexToRgb('c46818')).toEqual([196, 104, 24]);
    expect(hexToRgb(' #c46818')).toEqual([196, 104, 24]);
  });
});

describe('lerpColor', () => {
  it('returns the endpoints at t = 0 and t = 1', () => {
    expect(lerpColor('#000000', '#FFFFFF', 0)).toBe('rgb(0,0,0)');
    expect(lerpColor('#000000', '#FFFFFF', 1)).toBe('rgb(255,255,255)');
  });

  it('rounds the midpoint like the design', () => {
    expect(lerpColor('#000000', '#FFFFFF', 0.5)).toBe('rgb(128,128,128)');
  });

  it('accepts its own rgb() output as input (nested blend used by sparks)', () => {
    const inner = lerpColor(PALETTE.warm.core, PALETTE.warm.mid, 0); // rgb(245,194,66)
    expect(hexToRgb(inner)).toEqual([245, 194, 66]);
    // Spark colour at birth (t = 1 → 1 − t·0.4 = 0.6) — must be a valid colour, never NaN
    const spark = lerpColor(PALETTE.highlight, inner, 0.6);
    expect(spark).not.toContain('NaN');
    expect(spark).toBe('rgb(249,218,142)');
  });
});

describe('colorAt', () => {
  it('maps layers 0/1/2 to outer/mid/core', () => {
    expect(colorAt(0, 0, PALETTE)).toBe('rgb(196,104,24)'); // #C46818
    expect(colorAt(1, 0, PALETTE)).toBe('rgb(232,136,30)'); // #E8881E
    expect(colorAt(2, 0, PALETTE)).toBe('rgb(245,194,66)'); // #F5C242
  });

  it('is fully ice-coloured at cold = 1', () => {
    expect(colorAt(0, 1, PALETTE)).toBe('rgb(63,136,184)'); // #3F88B8
    expect(colorAt(2, 1, PALETTE)).toBe('rgb(159,216,238)'); // #9FD8EE
  });
});

describe('haloColorAt', () => {
  it('goes warm → lilac → cold', () => {
    expect(haloColorAt(0, PALETTE)).toBe('rgb(232,130,30)'); // #E8821E
    expect(haloColorAt(0.5, PALETTE)).toBe('rgb(159,136,232)'); // #9F88E8
    expect(haloColorAt(1, PALETTE)).toBe('rgb(91,175,216)'); // #5BAFD8
  });
});

describe('frostColorAt', () => {
  it('uses the design alpha formula (cold − 0.3) × 0.18', () => {
    expect(frostColorAt(1, PALETTE)).toBe(`rgba(155,210,235,${(1 - 0.3) * 0.18})`);
  });
});

describe('shape data', () => {
  it('keeps the design pixel counts', () => {
    expect(FLAME_TIP).toHaveLength(4);
    expect(FLAME_BODY).toHaveLength(98);
    expect(ICE_FACETS).toHaveLength(16);
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
});

describe('core flicker (V3 addition)', () => {
  it('flickerNoise is deterministic and stays in [0, 1)', () => {
    for (let frame = 0; frame < 200; frame++) {
      for (let i = 0; i < 40; i++) {
        const n = flickerNoise(frame, i);
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThan(1);
        expect(flickerNoise(frame, i)).toBe(n);
      }
    }
  });

  it('coreFlickerColor stays at the core colour when the flame is frozen (flicker = 0)', () => {
    const core = PALETTE.warm.core;
    expect(coreFlickerColor(core, PALETTE.warm.heart, PALETTE.warm.mid, 0.95, 0)).toBe(
      'rgb(245,194,66)',
    );
    expect(coreFlickerColor(core, PALETTE.warm.heart, PALETTE.warm.mid, 0.05, 0)).toBe(
      'rgb(245,194,66)',
    );
  });

  it('brightens towards the heart and darkens towards the mid colour, bounded by strength', () => {
    const { core, heart, mid } = PALETTE.warm;
    // noise 1 → a = 1 → 30 % towards heart
    expect(coreFlickerColor(core, heart, mid, 1, 1)).toBe(lerpColor(core, heart, 0.3));
    // noise 0 → a = −1 → 30 % towards mid
    expect(coreFlickerColor(core, heart, mid, 0, 1)).toBe(lerpColor(core, mid, 0.3));
  });

  it('smoothNoise hits the frame values at whole positions and glides in between', () => {
    expect(smoothNoise(3, 5)).toBeCloseTo(flickerNoise(3, 5), 10);
    expect(smoothNoise(4, 5)).toBeCloseTo(flickerNoise(4, 5), 10);
    const mid = smoothNoise(3.5, 5);
    const lo = Math.min(flickerNoise(3, 5), flickerNoise(4, 5));
    const hi = Math.max(flickerNoise(3, 5), flickerNoise(4, 5));
    expect(mid).toBeGreaterThanOrEqual(lo);
    expect(mid).toBeLessThanOrEqual(hi);
  });

  it('heart pixels form the design 2×2 square at x 7–8, y 9–10', () => {
    expect(HEART_PIXELS).toEqual([
      [7, 9],
      [8, 9],
      [7, 10],
      [8, 10],
    ]);
  });

  it('heart neighbours are adjacent to the 2×2 heart', () => {
    for (const [x, y] of HEART_NEIGHBOURS) {
      expect(x).toBeGreaterThanOrEqual(6);
      expect(x).toBeLessThanOrEqual(9);
      expect(y).toBeGreaterThanOrEqual(8);
      expect(y).toBeLessThanOrEqual(11);
    }
  });
});

describe('spark → smoke (V3 addition)', () => {
  it('starts white-hot like the design and ends as black smoke', () => {
    const ember = lerpColor(PALETTE.warm.core, PALETTE.warm.mid, 0);
    expect(sparkColorAt(1, 0, PALETTE)).toBe(lerpColor(PALETTE.highlight, ember, 0.6));
    expect(sparkColorAt(0, 0, PALETTE)).toBe('rgb(5,4,4)');
  });

  it('never produces an invalid colour over the whole life', () => {
    for (let t = 1; t >= 0; t -= 0.05) {
      expect(sparkColorAt(t, 0.5, PALETTE)).not.toContain('NaN');
    }
  });

  it('stays fully opaque until the last third of its life', () => {
    expect(sparkOpacityAt(1)).toBe(1);
    expect(sparkOpacityAt(0.34)).toBe(1);
    expect(sparkOpacityAt(0.15)).toBeCloseTo(0.45, 5);
    expect(sparkOpacityAt(0)).toBe(0);
  });
});

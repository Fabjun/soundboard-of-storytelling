/**
 * @fileoverview flameMath — property-based tests (T11b)
 *
 * Color blending rules that must hold for EVERY color pair. On failure fast-check prints the
 * seed and the shrunk counterexample; pass `{ seed, path }` as fc options to reproduce it.
 * Example-based tests: flameMath.test.ts.
 */

import { fc, test } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import { hexToRgb, lerpColor } from '../../src/lib/flameMath';

const channel = fc.integer({ min: 0, max: 255 });
const rgb = fc.tuple(channel, channel, channel);
const hex = ([r, g, b]: [number, number, number]): string =>
  `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;

describe('color blending', () => {
  test.prop([rgb])('hexToRgb reads back what was written, as #rrggbb and as rgb()', (c) => {
    expect(hexToRgb(hex(c))).toEqual(c);
    expect(hexToRgb(`rgb(${c.join(',')})`)).toEqual(c);
  });

  test.prop([rgb, rgb, fc.double({ min: 0, max: 1, noNaN: true })])(
    'lerpColor stays between both colors in every channel, and hits them at t = 0 and 1',
    (a, b, t) => {
      const mixed = hexToRgb(lerpColor(hex(a), hex(b), t));
      mixed.forEach((c, i) => {
        expect(c).toBeGreaterThanOrEqual(Math.min(a[i], b[i]));
        expect(c).toBeLessThanOrEqual(Math.max(a[i], b[i]));
      });
      expect(hexToRgb(lerpColor(hex(a), hex(b), 0))).toEqual(a);
      expect(hexToRgb(lerpColor(hex(a), hex(b), 1))).toEqual(b);
    },
  );
});

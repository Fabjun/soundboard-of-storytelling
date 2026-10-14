/**
 * @fileoverview UiIcon — the interface's icons are drawn at whole multiples of their pixel grid
 * (ADR-0085). Cases: below, at, between and above multiples of a 16-pixel grid; never 0.
 */

import { pixelSide } from '../../src/components/UiIcon';

describe('pixelSide', () => {
  it('rounds to the nearest whole multiple of the grid, at least one', () => {
    expect(pixelSide(16, 16)).toBe(16);
    expect(pixelSide(11, 16)).toBe(16);
    expect(pixelSide(2, 16)).toBe(16); // never 0
    expect(pixelSide(23, 16)).toBe(16);
    expect(pixelSide(24, 16)).toBe(32); // half way rounds up
    expect(pixelSide(40, 16)).toBe(48);
    expect(pixelSide(48, 16)).toBe(48);
  });
});

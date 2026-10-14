/**
 * @fileoverview motion — whether the app animates (docs/product/features/settings.md S6, S12)
 * Cases: every combination of the switch and the system's "reduce motion"; the system preference
 * read from matchMedia, and false where there is none.
 */

import { motionAllowed, systemPrefersReducedMotion } from '../../src/lib/motion';

describe('motionAllowed', () => {
  it('animates only with the switch on and no reduced motion asked by the system', () => {
    expect(motionAllowed(true, false)).toBe(true);
    expect(motionAllowed(false, false)).toBe(false);
    expect(motionAllowed(true, true)).toBe(false); // the switch never overrides the system (S12)
    expect(motionAllowed(false, true)).toBe(false);
  });
});

describe('systemPrefersReducedMotion', () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reads the system's preference", () => {
    const query = vi.fn((q: string) => ({ matches: q === '(prefers-reduced-motion: reduce)' }));
    vi.stubGlobal('window', { matchMedia: query });
    expect(systemPrefersReducedMotion()).toBe(true);
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });
    expect(systemPrefersReducedMotion()).toBe(false);
  });

  it('is false where there is no window or no matchMedia', () => {
    vi.stubGlobal('window', undefined);
    expect(systemPrefersReducedMotion()).toBe(false);
    vi.stubGlobal('window', {});
    expect(systemPrefersReducedMotion()).toBe(false);
  });
});

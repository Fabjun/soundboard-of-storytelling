/**
 * @fileoverview trimRange — unit tests: the rules behind the PAD editor's trim and fade handles
 *
 * Edge-case checklist: untrimmed pad (no trimEnd, trimEnd 0, trimEnd before trimStart), values
 * outside the file, each handle at and beyond its bounds, fades shrinking with the region, fades
 * that would overlap, keyboard keys of the WAI-ARIA slider pattern, a key the slider ignores.
 * Property: whatever handle moves wherever, the rules hold.
 */

import { fc, test as propTest } from '@fast-check/vitest';
import {
  fromPad,
  handlePosition,
  handleRange,
  keyTarget,
  MAX_FADE,
  MIN_REGION,
  moveHandle,
  stepTarget,
  toPad,
  type Handle,
  type TrimValues,
} from '../../src/lib/trimRange';

const DUR = 20;
const v = (o: Partial<TrimValues> = {}): TrimValues => ({
  trimStart: 2,
  trimEnd: 12,
  fadeIn: 1,
  fadeOut: 2,
  ...o,
});

describe('fromPad / toPad', () => {
  it('reads an untrimmed pad as the whole file — trimEnd missing, 0 or not after the start', () => {
    for (const trimEnd of [undefined, 0, 1]) {
      expect(fromPad({ trimStart: 3, trimEnd, fadeIn: 0, fadeOut: 0 }, DUR).trimEnd).toBe(DUR);
    }
  });

  it('pulls values outside the file and fades that do not fit into range', () => {
    expect(fromPad({ trimStart: 50, trimEnd: 60, fadeIn: 30, fadeOut: 30 }, DUR)).toEqual({
      trimStart: DUR - MIN_REGION,
      trimEnd: DUR,
      fadeIn: MIN_REGION,
      fadeOut: 0,
    });
  });

  it('stores trimEnd only when it ends before the file, trimStart only when above 0', () => {
    expect(toPad(v({ trimStart: 0, trimEnd: DUR }), DUR)).toEqual({
      trimStart: undefined,
      trimEnd: undefined,
      fadeIn: 1,
      fadeOut: 2,
    });
    expect(toPad(v(), DUR)).toMatchObject({ trimStart: 2, trimEnd: 12 });
  });
});

describe('moveHandle', () => {
  it('keeps the start before the end, at least MIN_REGION apart', () => {
    expect(moveHandle(v(), 'trimStart', 15, DUR).trimStart).toBe(12 - MIN_REGION);
    expect(moveHandle(v(), 'trimEnd', 1, DUR).trimEnd).toBe(2 + MIN_REGION);
    expect(moveHandle(v(), 'trimStart', -5, DUR).trimStart).toBe(0);
    expect(moveHandle(v(), 'trimEnd', 99, DUR).trimEnd).toBe(DUR);
  });

  it('shrinks the fades when the region gets shorter than them', () => {
    const shorter = moveHandle(v({ fadeIn: 3, fadeOut: 3 }), 'trimEnd', 6, DUR);
    expect(shorter).toEqual({ trimStart: 2, trimEnd: 6, fadeIn: 3, fadeOut: 1 });
  });

  it('a fade handle sets the fade length, never past the other fade or MAX_FADE', () => {
    expect(moveHandle(v(), 'fadeIn', 5, DUR).fadeIn).toBe(3);
    expect(moveHandle(v(), 'fadeIn', 11, DUR).fadeIn).toBe(8); // 10 s region − 2 s fade-out
    expect(moveHandle(v(), 'fadeOut', 7, DUR).fadeOut).toBe(5);
    expect(moveHandle(v({ trimEnd: 20, fadeIn: 0 }), 'fadeOut', 0, DUR).fadeOut).toBe(MAX_FADE);
    expect(moveHandle(v(), 'fadeIn', 0, DUR).fadeIn).toBe(0);
  });

  it('rounds to hundredths of a second', () => {
    expect(moveHandle(v(), 'trimStart', 1.23456, DUR).trimStart).toBe(1.23);
  });
});

describe('handlePosition / handleRange', () => {
  it('places the fade handles at the inner edges of the fades', () => {
    expect(handlePosition(v(), 'fadeIn')).toBe(3);
    expect(handlePosition(v(), 'fadeOut')).toBe(10);
    expect(handleRange(v(), 'fadeIn', DUR)).toEqual([2, 10]);
    expect(handleRange(v(), 'fadeOut', DUR)).toEqual([3, 12]);
  });

  it('reports positions in hundredths, without float residue (0.7 + 0.1 is 0.8)', () => {
    const tenths = v({ trimStart: 0.7, trimEnd: 0.9, fadeIn: 0.1, fadeOut: 0.1 });
    expect(handlePosition(tenths, 'fadeIn')).toBe(0.8);
    expect(handlePosition(tenths, 'fadeOut')).toBe(0.8);
  });
});

describe('keyTarget (WAI-ARIA slider keys)', () => {
  it('arrows step by 0.1 s, Page keys by 1 s, Home / End jump to the range', () => {
    const at = (key: string) => keyTarget(v(), 'trimStart', key, DUR);
    expect(at('ArrowRight')).toBeCloseTo(2.1);
    expect(at('ArrowUp')).toBeCloseTo(2.1);
    expect(at('ArrowLeft')).toBeCloseTo(1.9);
    expect(at('ArrowDown')).toBeCloseTo(1.9);
    expect(at('PageUp')).toBe(3);
    expect(at('PageDown')).toBe(1);
    expect(at('Home')).toBe(0);
    expect(at('End')).toBeCloseTo(12 - MIN_REGION);
    expect(at('a')).toBeNull();
  });

  it('stepTarget moves any slider the same way — the playback position uses it', () => {
    expect(stepTarget(5, 2, 8, 'ArrowRight')).toBeCloseTo(5.1);
    expect(stepTarget(5, 2, 8, 'PageDown')).toBe(4);
    expect(stepTarget(5, 2, 8, 'Home')).toBe(2);
    expect(stepTarget(5, 2, 8, 'End')).toBe(8);
    expect(stepTarget(5, 2, 8, 'Enter')).toBeNull();
  });
});

describe('trimRange — property', () => {
  const handle = fc.constantFrom<Handle>('trimStart', 'trimEnd', 'fadeIn', 'fadeOut');
  propTest.prop([
    fc.array(fc.tuple(handle, fc.double({ min: -50, max: 50, noNaN: true })), { maxLength: 30 }),
  ])('every sequence of moves keeps the rules', (moves) => {
    let s = fromPad({ fadeIn: 0, fadeOut: 0 }, DUR);
    for (const [h, p] of moves) s = moveHandle(s, h, p, DUR);
    expect(s.trimStart).toBeGreaterThanOrEqual(0);
    expect(s.trimEnd).toBeLessThanOrEqual(DUR);
    expect(s.trimEnd - s.trimStart).toBeGreaterThanOrEqual(MIN_REGION - 1e-9);
    expect(s.fadeIn).toBeGreaterThanOrEqual(0);
    expect(s.fadeOut).toBeGreaterThanOrEqual(0);
    expect(s.fadeIn).toBeLessThanOrEqual(MAX_FADE);
    expect(s.fadeOut).toBeLessThanOrEqual(MAX_FADE);
    expect(s.fadeIn + s.fadeOut).toBeLessThanOrEqual(s.trimEnd - s.trimStart + 1e-9);
  });
});

/**
 * @fileoverview padDuration — unit tests: the running time a pad shows (2026-10-11)
 * Edge-case checklist: no files, unknown lengths, one file, a trimmed file, a short sound (never
 * 0:00), several Single files (range; equal lengths once), a Loop with one and several files, ∞
 * and a repeat count, a Combo, a file of zero length.
 */

import type { ComboPad, LoopPad, SinglePad } from '../../src/types';
import { fileSeconds, padDurationText } from '../../src/lib/padDuration';

const base = { name: 'P', volume: 80, fadeIn: 0, fadeOut: 0, order: 'sequential' as const };
const single = (files: SinglePad['files']): SinglePad => ({
  id: 's',
  type: 'single',
  files,
  ...base,
});
const loop = (files: LoopPad['files'], repeat?: number): LoopPad => ({
  id: 'l',
  type: 'loop',
  files,
  ...base,
  ...(repeat ? { repeat } : {}),
});
const lengths: Record<string, number> = { a: 12.2, b: 75, c: 0.4, z: 0 };
const durationOf = (hash: string) => lengths[hash];

describe('fileSeconds', () => {
  it('is the whole file without a trim, the trimmed region with one', () => {
    expect(fileSeconds({ hash: 'b' }, 75)).toBe(75);
    expect(fileSeconds({ hash: 'b', trimStart: 5, trimEnd: 20 }, 75)).toBe(15);
  });

  it('is null for an unknown or zero length', () => {
    expect(fileSeconds({ hash: 'x' }, undefined)).toBeNull();
    expect(fileSeconds({ hash: 'z' }, 0)).toBeNull();
  });
});

describe('padDurationText', () => {
  it('shows nothing without a file with a known length, and nothing for a Combo', () => {
    expect(padDurationText(single([]), durationOf)).toBeNull();
    expect(padDurationText(single([{ hash: 'x' }]), durationOf)).toBeNull();
    const combo: ComboPad = {
      id: 'c',
      type: 'combo',
      name: 'C',
      volume: 80,
      fadeIn: 0,
      fadeOut: 0,
      steps: [],
    };
    expect(padDurationText(combo, durationOf)).toBeNull();
  });

  it('a Single with one file shows its length, rounded up; a short sound never reads 0:00', () => {
    expect(padDurationText(single([{ hash: 'a' }]), durationOf)).toBe('0:13');
    expect(padDurationText(single([{ hash: 'c' }]), durationOf)).toBe('0:01');
    expect(padDurationText(single([{ hash: 'b', trimStart: 5, trimEnd: 20 }]), durationOf)).toBe(
      '0:15',
    );
  });

  it('a Single with several files shows the shortest and the longest; equal ones once', () => {
    expect(padDurationText(single([{ hash: 'b' }, { hash: 'a' }]), durationOf)).toBe('0:13–1:15');
    expect(padDurationText(single([{ hash: 'a' }, { hash: 'a' }]), durationOf)).toBe('0:13');
  });

  it('a Loop shows one pass of all its files, and ∞ or its repeat count', () => {
    expect(padDurationText(loop([{ hash: 'a' }]), durationOf)).toBe('0:13 ∞');
    expect(padDurationText(loop([{ hash: 'a' }, { hash: 'b' }], 3), durationOf)).toBe('1:28 ×3');
  });
});

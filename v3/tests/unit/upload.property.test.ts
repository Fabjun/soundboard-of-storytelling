/**
 * @fileoverview upload — property-based tests (T11b)
 *
 * Rules for the formatters and the waveform peaks that must hold for EVERY input. On failure
 * fast-check prints the seed and the shrunk counterexample; pass `{ seed, path }` as fc options
 * to reproduce it. Example-based tests: upload.test.ts.
 */

import { fc, test } from '@fast-check/vitest';
import { describe, expect } from 'vitest';
import { computePeaks, formatBytes, formatDuration } from '../../src/lib/upload';

/** Minimal AudioBuffer: computePeaks only reads channel 0. */
/** Byte counts: anywhere, plus densely around the unit boundaries (boundary value analysis —
 *  uniform random values almost never hit the few bytes where a unit switches). */
const byteCount = fc.oneof(
  fc.nat({ max: 10 * 1024 ** 3 }),
  ...[1024, 1024 ** 2, 1024 ** 3].map((edge) =>
    fc.integer({ min: Math.max(0, edge - 2048), max: edge + 2048 }),
  ),
);

const bufferOf = (samples: number[]): AudioBuffer =>
  ({ getChannelData: () => Float32Array.from(samples) }) as unknown as AudioBuffer;

describe('formatters', () => {
  test.prop([fc.double({ min: 0, max: 360_000, noNaN: true })])(
    'formatDuration is M:SS and reads back as the whole seconds',
    (seconds) => {
      const text = formatDuration(seconds);
      expect(text).toMatch(/^\d+:[0-5]\d$/);
      const [m, s] = text.split(':').map(Number);
      expect(m * 60 + s).toBe(Math.floor(seconds));
    },
  );

  test.prop([byteCount])(
    'formatBytes reads back as the byte count, within the rounding of the display',
    (bytes) => {
      const [value, unit] = formatBytes(bytes).split(' ');
      const size = { B: 1, KB: 1024, MB: 1024 ** 2 }[unit as 'B' | 'KB' | 'MB'];
      const step = unit === 'MB' ? 0.1 : 1; // MB with one decimal, B and KB whole numbers
      expect(Math.abs(Number(value) * size - bytes)).toBeLessThanOrEqual((step / 2) * size);
    },
  );
  test.prop([byteCount])(
    'formatBytes never shows 1024 of a unit (rounding up switches to the next unit)',
    (bytes) => {
      expect(formatBytes(bytes)).not.toMatch(/^1024(\.0)? (B|KB)$/);
    },
  );
});

describe('waveform peaks', () => {
  test.prop([
    fc.array(fc.float({ min: -1, max: 1, noNaN: true }), { minLength: 1, maxLength: 400 }),
    fc.integer({ min: 1, max: 60 }),
  ])('computePeaks returns N values in [0, 1]', (samples, n) => {
    const peaks = computePeaks(bufferOf(samples), n);
    expect(peaks).toHaveLength(n);
    expect(peaks.every((p) => p >= 0 && p <= 1)).toBe(true);
  });

  test.prop([
    fc.array(fc.float({ min: -1, max: 1, noNaN: true }), { minLength: 1, maxLength: 400 }),
  ])('an inverted signal has the same peaks (a peak is a level, not a signed value)', (samples) => {
    expect(computePeaks(bufferOf(samples.map((v) => -v)))).toEqual(computePeaks(bufferOf(samples)));
  });

  test.prop([
    fc.array(fc.float({ min: -1, max: 1, noNaN: true }), { minLength: 30, maxLength: 400 }),
  ])('no peak is larger than the loudest sample', (samples) => {
    const loudest = Math.max(...samples.map((v) => Math.abs(Math.fround(v))));
    expect(Math.max(...computePeaks(bufferOf(samples)))).toBeLessThanOrEqual(
      +loudest.toFixed(3) + 1e-9,
    );
  });
});

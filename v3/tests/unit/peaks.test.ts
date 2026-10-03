/**
 * @fileoverview peaks — unit tests: stored resolution and the coarse view of it (ADR-0065)
 *
 * Edge-case checklist: fewer, equal and more peaks than bars; bars that do not divide the peaks
 * evenly; empty peaks; the highest value of each share survives; old 30-peak entries are coarse.
 */

import { downsamplePeaks, LIST_BARS, needsFinePeaks, PEAK_COUNT } from '../../src/lib/peaks';

describe('downsamplePeaks', () => {
  it('keeps peaks that are not longer than the bars, as a copy', () => {
    const peaks = [0.1, 0.5];
    const out = downsamplePeaks(peaks, 30);
    expect(out).toEqual(peaks);
    expect(out).not.toBe(peaks);
    expect(downsamplePeaks([], 30)).toEqual([]);
  });

  it('takes the highest peak of each share', () => {
    expect(downsamplePeaks([0.1, 0.9, 0.2, 0.3, 0.8, 0.4], 3)).toEqual([0.9, 0.3, 0.8]);
  });

  it('covers every peak when the bars do not divide them evenly', () => {
    const peaks = Array.from({ length: PEAK_COUNT }, (_, i) => (i === PEAK_COUNT - 1 ? 1 : 0));
    const out = downsamplePeaks(peaks, LIST_BARS);
    expect(out).toHaveLength(LIST_BARS);
    expect(out.at(-1)).toBe(1); // the last peak lands in the last bar
  });
});

describe('needsFinePeaks', () => {
  it('marks entries stored before ADR-0065 (30 peaks), not those with PEAK_COUNT', () => {
    expect(needsFinePeaks(new Array(30).fill(0))).toBe(true);
    expect(needsFinePeaks(new Array(PEAK_COUNT).fill(0))).toBe(false);
  });
});

/**
 * @fileoverview preview — unit tests: the PAD editor's playhead and its start / stop
 *
 * Edge-case checklist: a Single runs to its region end and stops there; a Loop wraps inside its
 * region (also when started mid-region); a start before the trim start or after the end is pulled
 * into the region; the clock going backwards; no position while nothing plays. The audio facade
 * is mocked — the engine side is tested in tests/unit/audio/engine.test.ts.
 */

import type { LoopPad, SinglePad } from '../../src/types';
import { previewPlaying } from '../../src/state/store';

// vi.hoisted: the mock factory runs before the imports, so its fns are created with it
const { previewFile, stopEngine } = vi.hoisted(() => ({
  previewFile: vi.fn((_pad: unknown, _file: string, _from: number) => Promise.resolve()),
  stopEngine: vi.fn(),
}));
vi.mock('../../src/audio/index', () => ({ previewFile, stopPreview: stopEngine }));

const { positionAt, previewPosition, startPreview, stopPreview } =
  await import('../../src/lib/preview');

const base = {
  id: 'p',
  name: 'P',
  volume: 80,
  fadeIn: 0,
  fadeOut: 0,
  order: 'sequential' as const,
};
const single = (o: Partial<SinglePad> = {}): SinglePad => ({
  ...base,
  type: 'single',
  files: [{ hash: 'h' }],
  ...o,
});
const loop = (o: Partial<LoopPad> = {}): LoopPad => ({
  ...base,
  type: 'loop',
  files: [{ hash: 'h' }],
  ...o,
});
/** A file of the pad with its own trim (ADR-0068). */
const file = (trimStart?: number) =>
  trimStart === undefined ? { hash: 'h' } : { hash: 'h', trimStart };

beforeEach(() => {
  previewFile.mockClear();
  stopEngine.mockClear();
  previewPlaying.value = false;
});

describe('positionAt', () => {
  const r = { from: 2, startedAt: 1000, regionStart: 2, regionEnd: 5, loop: false };

  it('runs with the clock and stops at the region end for a Single', () => {
    expect(positionAt(r, 1000)).toBe(2);
    expect(positionAt(r, 2500)).toBe(3.5);
    expect(positionAt(r, 9000)).toBe(5);
  });

  it('wraps inside the region for a Loop, also when it started mid-region', () => {
    expect(positionAt({ ...r, loop: true }, 4000)).toBe(2); // 2 + 3 s = 5 → back to 2
    expect(positionAt({ ...r, loop: true, from: 4 }, 2500)).toBe(2.5); // 4 + 1.5 = 5.5 → 2.5
  });

  it('does not run backwards when the clock does', () => {
    expect(positionAt(r, 500)).toBe(2);
  });
});

describe('startPreview / stopPreview / previewPosition', () => {
  it('starts the engine preview and reports the playhead only while it plays', () => {
    let now = 0;
    startPreview(single(), file(1), 3, 8, () => now);
    expect(previewFile).toHaveBeenCalledWith(expect.objectContaining({ id: 'p' }), file(1), 3);
    expect(previewPosition(() => now)).toBeNull(); // not yet reported as playing
    previewPlaying.value = true;
    now = 1000;
    expect(previewPosition(() => now)).toBe(4);
    stopPreview();
    expect(stopEngine).toHaveBeenCalled();
    expect(previewPosition(() => now)).toBeNull();
  });

  it('restarts the clock once the engine has started — loading the file does not move the playhead', async () => {
    let now = 0;
    const started = startPreview(single(), file(), 0, 8, () => now);
    now = 700; // the file loads
    await started;
    previewPlaying.value = true;
    now = 1700;
    expect(previewPosition(() => now)).toBe(1);
  });

  it("pulls the start into the file's region — before its trim start, after its trim end", () => {
    previewPlaying.value = true;
    startPreview(loop(), file(2), 0, 6, () => 0);
    expect(previewPosition(() => 0)).toBe(2);
    startPreview(single(), file(), 9, 6, () => 0);
    expect(previewPosition(() => 0)).toBe(6);
  });
});

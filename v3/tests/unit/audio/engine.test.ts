// @vitest-environment jsdom
/**
 * @fileoverview Audio engine — characterization tests (T4, before Slice 9d)
 *
 * Pins down TODAY's behaviour of src/audio/engine.ts + the facade in
 * src/audio/index.ts, so that the Slice-9d change to the play dispatch
 * (docs/architecture/0048-pad-pool-decks.md#4-audio-engine--change-under-product-owner-control) shows every behavioural
 * difference as a red test. The engine itself is NOT modified here.
 *
 * Runs against a fake Web Audio API that records what the engine does (sources,
 * buffers, start/stop calls, gain automation). IDB is mocked: libGet returns a
 * blob-like whose bytes are the hash, so each decoded buffer carries its hash
 * as a tag. The engine keeps module-level state → fresh module per test.
 */

import type { ComboPad, LoopPad, Pad, PadFile, SinglePad } from '../../../src/types';
import type * as EngineModule from '../../../src/audio/engine';
import type * as FacadeModule from '../../../src/audio/index';

// ── IDB mock ──────────────────────────────────────────────────────────────────

const missing = new Set<string>();
vi.mock('../../../src/db/idb', () => ({
  libGet: vi.fn(async (hash: string) =>
    missing.has(hash)
      ? null
      : { blob: { arrayBuffer: () => Promise.resolve(new TextEncoder().encode(hash).buffer) } },
  ),
}));

// ── Fake Web Audio ────────────────────────────────────────────────────────────

type GainEvent = [kind: 'set' | 'ramp', value: number, time: number] | ['cancel', number];

class FakeParam {
  value = 1;
  events: GainEvent[] = [];
  setValueAtTime(v: number, t: number): void {
    this.events.push(['set', v, t]);
  }
  linearRampToValueAtTime(v: number, t: number): void {
    this.events.push(['ramp', v, t]);
  }
  cancelScheduledValues(t: number): void {
    this.events.push(['cancel', t]);
  }
}

class FakeGain {
  gain = new FakeParam();
  connect(): void {}
}

type FakeBuffer = { tag: string; length: number; numberOfChannels: number; duration: number };

class FakeSource {
  buffer: FakeBuffer | null = null;
  loop = false;
  loopStart = 0;
  loopEnd = 0;
  onended: (() => void) | null = null;
  started: { when: number; offset?: number; dur?: number } | null = null;
  /** Buffer tag at start time (the engine may release .buffer later). */
  startedTag: string | undefined;
  stopped: { when: number | 'now' } | null = null;
  connect(): void {}
  start(when: number, offset?: number, dur?: number): void {
    this.started = { when, offset, dur };
    this.startedTag = this.buffer?.tag;
  }
  stop(when?: number): void {
    this.stopped = { when: when ?? 'now' };
  }
  /** Simulate the browser finishing playback. */
  end(): void {
    this.onended?.();
  }
}

class FakeAudioContext {
  static last: FakeAudioContext | null = null;
  /** 'interrupted' is WebKit's state on iOS (call, other app's audio, system sheet). */
  state: 'running' | 'suspended' | 'interrupted' = 'running';
  currentTime = 0;
  destination = {};
  sources: FakeSource[] = [];
  gains: FakeGain[] = [];
  decodes: string[] = [];
  constructor() {
    FakeAudioContext.last = this;
  }
  createGain(): FakeGain {
    const g = new FakeGain();
    this.gains.push(g);
    return g;
  }
  createBufferSource(): FakeSource {
    const s = new FakeSource();
    this.sources.push(s);
    return s;
  }
  decodeAudioData(ab: ArrayBuffer): Promise<FakeBuffer> {
    const tag = new TextDecoder().decode(ab);
    this.decodes.push(tag);
    return Promise.resolve({ tag, length: 1000, numberOfChannels: 1, duration: 1 });
  }
  resume(): Promise<void> {
    this.state = 'running';
    return Promise.resolve();
  }
}

/** Let the engine's async chains (libGet → arrayBuffer → decode) settle. */
async function flush(): Promise<void> {
  for (let i = 0; i < 20; i++) await Promise.resolve();
}

// ── Pad factories ─────────────────────────────────────────────────────────────

// App pads (ADR-0048, Slice 9d): Single / Loop hold `files` + `order`; the facade maps them to
// the engine's shapes (toEnginePad). An empty ref ('') means "no file". A trim given here belongs
// to the pad's one file (ADR-0068).
type Trim = { trimStart?: number; trimEnd?: number };
const base = { name: 'pad', volume: 80, fadeIn: 0, fadeOut: 0 };
/** One file of a pad with the given trim (only the ends that are set). */
const fileOf = (hash: string, { trimStart, trimEnd }: Trim = {}): PadFile => ({
  hash,
  ...(trimStart === undefined ? {} : { trimStart }),
  ...(trimEnd === undefined ? {} : { trimEnd }),
});
const single = (id: string, ref: string, extra: Partial<SinglePad> & Trim = {}): SinglePad => {
  const { trimStart, trimEnd, ...rest } = extra;
  return {
    ...base,
    id,
    type: 'single',
    files: ref ? [fileOf(ref, { trimStart, trimEnd })] : [],
    order: 'sequential',
    ...rest,
  };
};
const loop = (id: string, ref: string, extra: Partial<LoopPad> & Trim = {}): LoopPad => {
  const { trimStart, trimEnd, ...rest } = extra;
  return {
    ...base,
    id,
    type: 'loop',
    files: ref ? [fileOf(ref, { trimStart, trimEnd })] : [],
    order: 'sequential',
    ...rest,
  };
};
/** The former Playlist: a Loop with several files, in order or shuffled. */
const playlist = (
  id: string,
  files: (string | PadFile)[],
  opts: { shuffle?: boolean } = {},
): LoopPad => ({
  ...base,
  id,
  type: 'loop',
  files: files.map((f) => (typeof f === 'string' ? fileOf(f) : f)),
  order: opts.shuffle ? 'shuffle' : 'sequential',
});
const combo = (id: string, steps: ComboPad['steps']): ComboPad => ({
  ...base,
  id,
  type: 'combo',
  steps,
});

// ── Fresh engine per test ─────────────────────────────────────────────────────

type Engine = typeof EngineModule;
type Facade = typeof FacadeModule;
let engine: Engine;
let audio: Facade;
let ctx: FakeAudioContext;
let started: [string, boolean][];
let stopped: string[];
const pads = new Map<string, Pad>();

/** Which file each started source played, in start order. */
function tags(): (string | undefined)[] {
  return ctx.sources.map((s) => s.startedTag);
}

beforeEach(async () => {
  vi.resetModules();
  missing.clear();
  pads.clear();
  started = [];
  stopped = [];
  FakeAudioContext.last = null;
  vi.stubGlobal('AudioContext', FakeAudioContext);
  Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: () => Promise.resolve(),
  });
  engine = await import('../../../src/audio/engine');
  audio = await import('../../../src/audio/index');
  engine.configureCallbacks({
    onPadStarted: (id, isLoop) => started.push([id, isLoop]),
    onPadStopped: (id) => stopped.push(id),
    // Same mapping as the facade's bridge (index.ts): app pads → engine shapes
    getPad: (id) => {
      const pad = pads.get(id);
      return pad ? audio.toEnginePad(pad) : null;
    },
  });
  engine.initAudio();
  ctx = FakeAudioContext.last!;
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ── Dispatch + SINGLE ─────────────────────────────────────────────────────────

describe('single', () => {
  test('plays once from the start; reports started (not loop) and stopped on end', async () => {
    await audio.play('s', single('s', 'h1'));
    await flush();
    expect(tags()).toEqual(['h1']);
    expect(ctx.sources[0].loop).toBe(false);
    expect(ctx.sources[0].started).toEqual({ when: 0, offset: 0, dur: undefined });
    expect(started).toEqual([['s', false]]);
    expect(audio.isPlaying('s')).toBe(true);

    ctx.sources[0].end();
    expect(stopped).toEqual(['s']);
    expect(audio.isPlaying('s')).toBe(false);
  });

  test('trim: starts at trimStart for trimEnd − trimStart; fade-out pre-scheduled to trim end', async () => {
    await audio.play('s', single('s', 'h1', { trimStart: 1, trimEnd: 3, fadeOut: 0.5 }));
    await flush();
    expect(ctx.sources[0].started).toEqual({ when: 0, offset: 1, dur: 2 });
    // volume 80 → 0.8; fade-out starts at max(0 + fadeIn, 0 + dur − fadeOut) = 1.5
    expect(ctx.gains.at(-1)!.gain.events).toEqual([
      ['set', 0.8, 0],
      ['set', 0.8, 1.5],
      ['ramp', 0, 2],
    ]);
  });

  test('re-trigger stops the running sound and starts it again', async () => {
    await audio.play('s', single('s', 'h1'));
    await flush();
    await audio.play('s', single('s', 'h1'));
    await flush();
    expect(ctx.sources).toHaveLength(2);
    expect(ctx.sources[0].stopped).toEqual({ when: 'now' });
    expect(ctx.sources[1].started).not.toBeNull();
    expect(started).toEqual([
      ['s', false],
      ['s', false],
    ]);
    expect(stopped).toEqual(['s']);
  });

  test('missing audio: nothing starts, nothing throws', async () => {
    missing.add('gone');
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    await audio.play('s', single('s', 'gone'));
    await flush();
    expect(ctx.sources).toHaveLength(0);
    expect(started).toEqual([]);
    expect(err).toHaveBeenCalled();
  });
});

// ── LOOP ──────────────────────────────────────────────────────────────────────

// ── Several files (ADR-0048, Slice 9d) ────────────────────────────────────────

describe('single with several files', () => {
  test('sequential: each trigger plays the next file in turn, then starts over', async () => {
    const pad = single('s', 'f1', { files: ['f1', 'f2', 'f3'].map((h) => fileOf(h)) });
    for (let i = 0; i < 4; i++) {
      await audio.play('s', pad);
      await flush();
      ctx.sources.at(-1)!.end();
    }
    expect(tags()).toEqual(['f1', 'f2', 'f3', 'f1']);
  });

  test('the turn is kept per pad', async () => {
    const files = (...hashes: string[]) => hashes.map((h) => fileOf(h));
    await audio.play('a', single('a', '', { files: files('a1', 'a2') }));
    await flush();
    await audio.play('b', single('b', '', { files: files('b1', 'b2') }));
    await flush();
    await audio.play('a', single('a', '', { files: files('a1', 'a2') }));
    await flush();
    expect(tags()).toEqual(['a1', 'b1', 'a2']);
  });

  test('shuffle: each trigger plays a random file', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const files = ['f1', 'f2', 'f3'].map((h) => fileOf(h));
    await audio.play('s', single('s', '', { files, order: 'shuffle' }));
    await flush();
    expect(tags()).toEqual(['f3']);
  });

  test('each file plays within its own trim (ADR-0068)', async () => {
    const files = [
      fileOf('f1', { trimStart: 0.1, trimEnd: 0.4 }),
      fileOf('f2', { trimStart: 0.5 }),
    ];
    const pad = single('s', '', { files });
    await audio.play('s', pad);
    await flush();
    ctx.sources.at(-1)!.end();
    await audio.play('s', pad);
    await flush();
    expect(ctx.sources[0].started?.offset).toBe(0.1);
    expect(ctx.sources[0].started?.dur).toBeCloseTo(0.3);
    expect(ctx.sources[1].started).toEqual({ when: 0, offset: 0.5, dur: undefined });
  });

  test('no file: nothing starts', async () => {
    await audio.play('s', single('s', ''));
    await flush();
    expect(ctx.sources).toHaveLength(0);
  });
});

describe('loop with several files (the former playlist)', () => {
  test('plays its files one after another; a single file loops seamlessly instead', async () => {
    await audio.play('p', playlist('p', ['h1', 'h2']));
    await flush();
    expect(ctx.sources[0].loop).toBe(false);
    ctx.sources[0].end();
    await flush();
    expect(tags()).toEqual(['h1', 'h2']);

    await audio.play('one', playlist('one', ['h9']));
    await flush();
    expect(ctx.sources.at(-1)!.loop).toBe(true);
    expect(started.at(-1)).toEqual(['one', true]);
  });

  test('each file plays within its own trim; an untrimmed one whole (engine change, ADR-0068)', async () => {
    // V1 played every playlist file whole: start(0) — owner-approved change 2026-10-03
    await audio.play('p', playlist('p', [fileOf('h1', { trimStart: 0.2, trimEnd: 0.6 }), 'h2']));
    await flush();
    expect(ctx.sources[0].started?.offset).toBe(0.2);
    expect(ctx.sources[0].started?.dur).toBeCloseTo(0.4);
    ctx.sources[0].end();
    await flush();
    expect(ctx.sources[1].started).toEqual({ when: 0, offset: 0, dur: undefined });
  });

  test('inside a combo, each file of the list plays within its own trim too', async () => {
    pads.set('p', playlist('p', [fileOf('h1', { trimStart: 0.3 }), 'h2']));
    // A background child: the step needs a duration to keep the combo (and the child) running
    void audio.play('c', combo('c', [{ padIds: ['p'], duration: 9 }]));
    await flush();
    expect(ctx.sources[0].started).toEqual({ when: 0, offset: 0.3, dur: undefined });
  });
});

describe('loop', () => {
  test('loops the buffer and reports started as loop', async () => {
    await audio.play('l', loop('l', 'h1'));
    await flush();
    expect(ctx.sources[0].loop).toBe(true);
    expect(started).toEqual([['l', true]]);
  });

  test('triggering again while it runs starts nothing new', async () => {
    await audio.play('l', loop('l', 'h1'));
    await flush();
    await audio.play('l', loop('l', 'h1'));
    await flush();
    expect(ctx.sources).toHaveLength(1);
    expect(started).toHaveLength(1);
  });

  test('a trimmed loop repeats its region: loopStart / loopEnd mark it, start() gets no duration', async () => {
    // A duration in start() counts every pass of the loop (Web Audio spec), so the region played
    // once and fell silent until 2026-10-03
    await audio.play('l', loop('l', 'h1', { trimStart: 0.25, trimEnd: 0.75 }));
    await flush();
    const s = ctx.sources[0];
    expect([s.loop, s.loopStart, s.loopEnd]).toEqual([true, 0.25, 0.75]);
    expect(s.started).toEqual({ when: 0, offset: 0.25, dur: undefined });
  });

  test('a loop trimmed only at the start loops from there to the end of the file', async () => {
    await audio.play('l', loop('l', 'h1', { trimStart: 0.25 }));
    await flush();
    const s = ctx.sources[0];
    expect([s.loopStart, s.loopEnd]).toEqual([0.25, 1]); // fake buffers last 1 s
  });
});

// ── Preview (PAD editor, Slice 15a) ──────────────────────────────────────────

describe('preview', () => {
  test("a Single previews from the tapped second at full volume, to the file's trim end", async () => {
    await audio.previewFile(
      single('p', '', { fadeIn: 1 }),
      fileOf('h1', { trimStart: 0.2, trimEnd: 0.8 }),
      0.5,
    );
    await flush();
    const s = ctx.sources[0];
    expect(s.startedTag).toBe('h1');
    expect(s.started?.offset).toBe(0.5);
    expect(s.started?.dur).toBeCloseTo(0.3); // from 0.5 to the trim end 0.8
    expect(ctx.gains.at(-1)!.gain.events[0]).toEqual(['set', 0.8, 0]); // no fade-in mid-file
  });

  test('a Loop previews from the tapped second and then repeats its whole region', async () => {
    await audio.previewFile(loop('p', ''), fileOf('h1', { trimStart: 0.2, trimEnd: 0.8 }), 0.5);
    await flush();
    const s = ctx.sources[0];
    expect([s.loopStart, s.loopEnd, s.started?.offset]).toEqual([0.2, 0.8, 0.5]);
  });

  test('a tap before the trim start previews from the trim start, with the fade-in', async () => {
    await audio.previewFile(loop('p', '', { fadeIn: 1 }), fileOf('h1', { trimStart: 0.2 }), 0);
    await flush();
    expect(ctx.sources[0].started?.offset).toBe(0.2);
    expect(ctx.gains.at(-1)!.gain.events[0]).toEqual(['set', 0, 0]);
  });

  test('the preview is no pad playing: no playing / looping pad, previewPlaying instead', async () => {
    const store = await import('../../../src/state/store');
    audio.initAudioBridge();
    await audio.previewFile(loop('p', ''), fileOf('h1'), 0);
    await flush();
    expect(store.previewPlaying.value).toBe(true);
    expect([...store.playingPads.value, ...store.loopingPads.value]).toEqual([]);
    audio.stopPreview();
    expect(store.previewPlaying.value).toBe(false);
  });
});

describe('loop (continued)', () => {
  test('fade-in ramps from 0 to the pad volume', async () => {
    await audio.play('l', loop('l', 'h1', { fadeIn: 2, volume: 50 }));
    await flush();
    expect(ctx.gains.at(-1)!.gain.events).toEqual([
      ['set', 0, 0],
      ['ramp', 0.5, 2],
    ]);
  });
});

// ── PLAYLIST ──────────────────────────────────────────────────────────────────

describe('playlist', () => {
  test('plays files in order and wraps around endlessly; reported as NOT loop', async () => {
    audio.play('p', playlist('p', ['h1', 'h2', 'h3']));
    await flush();
    expect(tags()).toEqual(['h1']);
    ctx.sources[0].end();
    await flush();
    ctx.sources[1].end();
    await flush();
    ctx.sources[2].end();
    await flush();
    expect(tags()).toEqual(['h1', 'h2', 'h3', 'h1']);
    expect(started).toEqual([['p', false]]);
  });

  test('releases a track buffer when it ends (iOS memory rule)', async () => {
    audio.play('p', playlist('p', ['h1', 'h2']));
    await flush();
    expect(engine.libBufs['h1']).toBeDefined();
    ctx.sources[0].end();
    await flush();
    expect(engine.libBufs['h1']).toBeUndefined();
    expect(ctx.sources[0].buffer).toBeNull();
  });

  test('shuffle picks with Math.random', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    audio.play('p', playlist('p', ['h1', 'h2', 'h3'], { shuffle: true }));
    await flush();
    expect(tags()).toEqual(['h3']);
  });

  test('empty playlist does nothing', async () => {
    audio.play('p', playlist('p', []));
    await flush();
    expect(ctx.sources).toHaveLength(0);
    expect(started).toEqual([]);
  });
});

// ── REPEAT (ADR-0069, engine change approved by the owner 2026-10-04) ───────────

describe('repeat', () => {
  test('a one-file Loop plays its region N times in ONE source — duration N × region — then stops', async () => {
    // Web Audio: start()'s duration counts every loop pass, so one source plays exactly N passes
    await audio.play('l', loop('l', 'h1', { trimStart: 0.25, trimEnd: 0.75, repeat: 3 }));
    await flush();
    const s = ctx.sources[0];
    expect([s.loop, s.loopStart, s.loopEnd]).toEqual([true, 0.25, 0.75]);
    expect(s.started?.offset).toBe(0.25);
    expect(s.started?.dur).toBeCloseTo(1.5);
    expect(ctx.sources).toHaveLength(1);
    s.end();
    expect(stopped).toEqual(['l']); // it stops by itself, reported like a Single
    expect(audio.isPlaying('l')).toBe(false);
  });

  test('without a repeat count a Loop still runs until stopped (no duration)', async () => {
    await audio.play('l', loop('l', 'h1', { trimStart: 0.25, trimEnd: 0.75 }));
    await flush();
    expect(ctx.sources[0].started?.dur).toBeUndefined();
  });

  test('the preview from mid-region counts that first part as one pass', async () => {
    await audio.previewFile(
      loop('p', '', { repeat: 2 }),
      fileOf('h1', { trimStart: 0.2, trimEnd: 0.6 }),
      0.5,
    );
    await flush();
    // two passes of 0.4 s, minus the 0.3 s before the start point
    expect(ctx.sources[0].started?.dur).toBeCloseTo(0.5);
  });

  test('a Loop with several files plays the list N times, then stops', async () => {
    audio.play('p', { ...playlist('p', ['h1', 'h2']), repeat: 2 });
    await flush();
    for (let i = 0; i < 4; i++) {
      ctx.sources[i].end();
      await flush();
    }
    expect(tags()).toEqual(['h1', 'h2', 'h1', 'h2']);
    expect(stopped).toEqual(['p']);
    expect(audio.isPlaying('p')).toBe(false);
  });

  // In a combo a Loop child runs in the background — the next step starts at once (PR #36);
  // with a count it stops by itself instead of running until the combo is stopped.
  test('in a combo, a Loop child with a count plays N passes in one source', async () => {
    pads.set('bg', loop('bg', 'h3', { repeat: 2 }));
    void audio.play('c', combo('c', [{ padIds: ['bg'], duration: 9 }]));
    await flush();
    expect(ctx.sources[0].started?.dur).toBeCloseTo(2); // fake buffers last 1 s
  });

  test('in a combo, a list child with a count starts no track after its passes', async () => {
    pads.set('pl', { ...playlist('pl', ['a', 'b']), repeat: 1 });
    void audio.play('c', combo('c', [{ padIds: ['pl'], duration: 9 }]));
    await flush();
    ctx.sources[0].end();
    await flush();
    ctx.sources[1].end(); // one pass through the list is done
    await flush();
    expect(tags()).toEqual(['a', 'b']); // without the count it would start 'a' again
  });
});

// ── STOP / STOP ALL / FADE OUT ALL ────────────────────────────────────────────

describe('stopping', () => {
  test('stop immediately: sources stopped now, reported stopped', async () => {
    await audio.play('l', loop('l', 'h1'));
    await flush();
    audio.stop('l');
    expect(ctx.sources[0].stopped).toEqual({ when: 'now' });
    expect(stopped).toEqual(['l']);
    expect(audio.isPlaying('l')).toBe(false);
  });

  test('stop with fade-out: ramps to 0, stops at the end, cleans up after the fade', async () => {
    vi.useFakeTimers();
    await audio.play('l', loop('l', 'h1'));
    await flush();
    audio.stop('l', false, 1);
    const g = ctx.gains.at(-1)!;
    expect(g.gain.events.slice(-3)).toEqual([
      ['cancel', 0],
      ['set', 1, 0],
      ['ramp', 0, 1],
    ]);
    expect(ctx.sources[0].stopped).toEqual({ when: 1 });
    expect(stopped).toEqual(['l']);
    expect(audio.isPlaying('l')).toBe(true); // until the cleanup timer
    vi.advanceTimersByTime(1100);
    expect(audio.isPlaying('l')).toBe(false);
  });

  test('stopAll stops every playing pad', async () => {
    await audio.play('a', loop('a', 'h1'));
    await audio.play('b', single('b', 'h2'));
    await flush();
    audio.stopAll();
    expect(ctx.sources.every((s) => s.stopped)).toBe(true);
    expect(stopped.sort()).toEqual(['a', 'b']);
  });

  test('fadeOutAll ramps every pad to 0, then stops them', async () => {
    vi.useFakeTimers();
    await audio.play('a', loop('a', 'h1'));
    await flush();
    audio.fadeOutAll(2);
    expect(ctx.gains.at(-1)!.gain.events.at(-1)).toEqual(['ramp', 0, 2]);
    expect(stopped).toEqual([]);
    vi.advanceTimersByTime(2050);
    expect(ctx.sources[0].stopped).toEqual({ when: 'now' });
    expect(stopped).toEqual(['a']);
  });
});

// ── Decode / memory ───────────────────────────────────────────────────────────

describe('decoding', () => {
  test('two pads with the same file trigger ONE decode', async () => {
    void audio.play('a', single('a', 'h1'));
    void audio.play('b', single('b', 'h1'));
    await flush();
    expect(ctx.decodes).toEqual(['h1']);
    expect(ctx.sources).toHaveLength(2);
  });
});

// ── COMBO ─────────────────────────────────────────────────────────────────────

describe('combo', () => {
  test('steps run in order: singles gate the next step, loops keep running in the background', async () => {
    pads.set('s1', single('s1', 'h1'));
    pads.set('s2', single('s2', 'h2'));
    pads.set('bg', loop('bg', 'h3'));
    audio.play('c', combo('c', [{ padIds: ['s1', 'bg'] }, { padIds: ['s2'] }]));
    await flush();
    expect(started).toEqual([['c', false]]);
    expect(tags().sort()).toEqual(['h1', 'h3']);
    const bg = ctx.sources.find((s) => s.buffer?.tag === 'h3')!;
    expect(bg.loop).toBe(true);

    ctx.sources.find((s) => s.buffer?.tag === 'h1')!.end();
    await flush();
    expect(tags()).toContain('h2');
    expect(bg.stopped).toBeNull(); // background loop still running

    ctx.sources.find((s) => s.buffer?.tag === 'h2')!.end();
    await flush();
    expect(bg.stopped).toEqual({ when: 'now' }); // combo finished → background stops
    expect(stopped).toEqual(['c']);
  });

  test('a step with only a duration waits before the next step', async () => {
    vi.useFakeTimers();
    pads.set('s1', single('s1', 'h1'));
    audio.play('c', combo('c', [{ padIds: [], duration: 1 }, { padIds: ['s1'] }]));
    await flush();
    expect(ctx.sources).toHaveLength(0);
    vi.advanceTimersByTime(1000);
    await flush();
    expect(tags()).toEqual(['h1']);
  });

  // KNOWN ENGINE BUG (found 2026-09-29, T4): a combo step with stopAll calls
  // stopAllInternal(), which also stops THIS combo (engine.ts:600-603 → 370-372), so the
  // next step never runs. V1 excluded the running combo (V1 changelog v163: "stopAll to skip
  // srcs[exceptComboId]"); the port lost it. Real impact: the V1 "DAY" combo (stop all →
  // rooster) would never play the rooster. test.fails documents the bug; when the engine is
  // fixed (under product-owner control, BACKLOG "step stops the combo itself") this
  // test starts passing → test.fails turns red → switch it to test().
  test.fails('"stop all" step stops everything first, then continues after 200 ms', async () => {
    vi.useFakeTimers();
    await audio.play('L', loop('L', 'h9'));
    await flush();
    pads.set('s1', single('s1', 'h1'));
    audio.play('c', combo('c', [{ padIds: [], stopAll: true }, { padIds: ['s1'] }]));
    await flush();
    expect(ctx.sources[0].stopped).toEqual({ when: 'now' });
    expect(tags()).toEqual(['h9']);
    vi.advanceTimersByTime(200);
    await flush();
    expect(tags()).toEqual(['h9', 'h1']);
  });

  test('current behaviour (bug): the stopAll step reports the running combo itself as stopped', async () => {
    vi.useFakeTimers();
    pads.set('s1', single('s1', 'h1'));
    audio.play('c', combo('c', [{ padIds: [], stopAll: true }, { padIds: ['s1'] }]));
    await flush();
    expect(stopped).toContain('c');
    expect(audio.isPlaying('c')).toBe(false);
    vi.advanceTimersByTime(1000);
    await flush();
    expect(ctx.sources).toHaveLength(0); // the next step never runs
  });

  test('stopping a combo stops everything it started', async () => {
    pads.set('s1', single('s1', 'h1'));
    pads.set('bg', loop('bg', 'h3'));
    audio.play('c', combo('c', [{ padIds: ['s1', 'bg'] }]));
    await flush();
    audio.stop('c');
    expect(ctx.sources.every((s) => s.stopped)).toBe(true);
    expect(stopped).toEqual(['c']);
    expect(audio.isPlaying('c')).toBe(false);
  });

  test('nested combo runs to its end before the outer combo continues', async () => {
    pads.set('s1', single('s1', 'h1'));
    pads.set('s2', single('s2', 'h2'));
    pads.set('inner', combo('inner', [{ padIds: ['s1'] }]));
    audio.play('outer', combo('outer', [{ padIds: ['inner'] }, { padIds: ['s2'] }]));
    await flush();
    expect(tags()).toEqual(['h1']);
    ctx.sources[0].end();
    await flush();
    expect(tags()).toEqual(['h1', 'h2']);
  });
});

// ── Not initialised ───────────────────────────────────────────────────────────

describe('before initAudio()', () => {
  test('play does nothing until the audio context exists', async () => {
    vi.resetModules();
    const freshEngine = await import('../../../src/audio/engine');
    const freshAudio = await import('../../../src/audio/index');
    const s: string[] = [];
    freshEngine.configureCallbacks({
      onPadStarted: (id) => s.push(id),
      onPadStopped: () => {},
      getPad: () => null,
    });
    FakeAudioContext.last = null;
    await freshAudio.play('s', single('s', 'h1'));
    await flush();
    expect(FakeAudioContext.last).toBeNull();
    expect(s).toEqual([]);
  });
});

// ── iOS: silent switch and interruptions (owner device test 2026-10-03) ─────────

describe('iOS: silent switch and interrupted audio', () => {
  /** A fresh engine unlocked once; returns the silent clip it played and the session it set. */
  async function unlock(withSession: boolean) {
    vi.resetModules();
    const played: HTMLMediaElement[] = [];
    Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value(this: HTMLMediaElement) {
        played.push(this);
        return Promise.resolve();
      },
    });
    const session = { type: 'auto' };
    if (withSession)
      Object.defineProperty(navigator, 'audioSession', { configurable: true, value: session });
    try {
      const fresh = await import('../../../src/audio/engine');
      fresh.initAudio();
    } finally {
      if (withSession) Reflect.deleteProperty(navigator, 'audioSession');
    }
    return { played, session };
  }

  test('with the Audio Session API (iOS 17+), unlocking makes the page a playback app', async () => {
    const { played, session } = await unlock(true);
    expect(session.type).toBe('playback');
    expect(played).toHaveLength(1);
    expect(played[0].loop).toBe(false); // the session keeps playback; no endless clip needed
  });

  test('without it (iOS before 17), the silent clip keeps looping to hold the playback session', async () => {
    const { played } = await unlock(false);
    expect(played).toHaveLength(1);
    expect(played[0].loop).toBe(true);
  });

  test('a context that iOS interrupted is resumed when a pad plays', async () => {
    ctx.state = 'interrupted';
    await audio.play('s', single('s', 'h1'));
    await flush();
    expect(ctx.state).toBe('running');
    expect(started).toEqual([['s', false]]);
  });

  test('a context that iOS interrupted is resumed when the app becomes visible again', () => {
    ctx.state = 'interrupted';
    document.dispatchEvent(new Event('visibilitychange'));
    expect(ctx.state).toBe('running');
  });
});

// ── Signal bridge (changes with Slice 9c: pads move to the board pool) ─────────

describe('initAudioBridge', () => {
  test('finds combo children in the board decks and mirrors start into the signals', async () => {
    const store = await import('../../../src/state/store');
    const s1 = single('s1', 'h1');
    store.boards.value = [
      {
        id: 'b',
        name: 'B',
        themeId: 'hearth',
        pads: [s1], // combo children are found in the board's pool (ADR-0048)
        decks: [],
        quickAccess: [],
      },
    ];
    audio.initAudioBridge();
    audio.play('c', combo('c', [{ padIds: ['s1'] }]));
    await flush();
    expect(tags()).toEqual(['h1']);
    expect(store.playingPads.value.has('c')).toBe(true);
  });

  test('a Loop with several files glows like a loop; a Single does not', async () => {
    const store = await import('../../../src/state/store');
    const many = playlist('many', ['h1', 'h2']);
    const once = single('once', 'h3');
    store.boards.value = [
      { id: 'b', name: 'B', themeId: 'hearth', pads: [many, once], decks: [], quickAccess: [] },
    ];
    audio.initAudioBridge();
    await audio.play('many', many);
    await audio.play('once', once);
    await flush();
    expect(store.loopingPads.value.has('many')).toBe(true);
    expect(store.loopingPads.value.has('once')).toBe(false);
    expect(store.playingPads.value.has('once')).toBe(true);
  });
});

// ── Combo children in detail (T11c: mutation testing left createPadInstance unguarded) ─

describe('combo children', () => {
  test('a single child plays its trim window: offset trimStart, duration trimEnd − trimStart', async () => {
    pads.set('s1', single('s1', 'h1', { trimStart: 2, trimEnd: 5 }));
    audio.play('c', combo('c', [{ padIds: ['s1'] }]));
    await flush();
    expect(ctx.sources[0].started).toEqual({ when: 0, offset: 2, dur: 3 });
  });

  test('without a trim window a child starts at 0 and plays to the end', async () => {
    pads.set('s1', single('s1', 'h1'));
    audio.play('c', combo('c', [{ padIds: ['s1'] }]));
    await flush();
    expect(ctx.sources[0].started).toEqual({ when: 0, offset: 0, dur: undefined });
  });

  test('a loop child loops its trim window — region in loopStart / loopEnd, no total duration', async () => {
    pads.set('bg', loop('bg', 'h3', { trimStart: 1, trimEnd: 4 }));
    audio.play('c', combo('c', [{ padIds: ['bg'], duration: 9 }]));
    await flush();
    const s = ctx.sources[0];
    expect(s.loop).toBe(true);
    expect([s.loopStart, s.loopEnd]).toEqual([1, 4]);
    expect(s.started).toEqual({ when: 0, offset: 1, dur: undefined });
  });

  test('a child uses its own volume and fade-in on its own gain', async () => {
    pads.set('s1', single('s1', 'h1', { volume: 50, fadeIn: 2 }));
    audio.play('c', combo('c', [{ padIds: ['s1'] }]));
    await flush();
    const childGain = ctx.gains[ctx.gains.length - 1];
    expect(childGain.gain.events).toEqual([
      ['set', 0, 0],
      ['ramp', 0.5, 2],
    ]);
  });

  // A child that finishes while it is being started (found 2026-10-01, T11c; fixed under the
  // owner's control 2026-10-02) used to start the next step twice.
  test('a child without an audio reference counts as finished at once', async () => {
    pads.set('s0', single('s0', ''));
    pads.set('s2', single('s2', 'h2'));
    audio.play('c', combo('c', [{ padIds: ['s0'] }, { padIds: ['s2'] }]));
    await flush();
    expect(tags()).toEqual(['h2']);
  });

  test('a child whose audio is missing counts as finished', async () => {
    missing.add('gone');
    pads.set('s0', single('s0', 'gone'));
    pads.set('s2', single('s2', 'h2'));
    audio.play('c', combo('c', [{ padIds: ['s0'] }, { padIds: ['s2'] }]));
    await flush();
    expect(tags()).toEqual(['h2']);
  });

  // A Loop with several files runs in the background of a combo, like a one-file loop, and its
  // list repeats until the combo stops (owner decision 2026-10-02, PR #36).
  test('a Loop with several files runs in the background: the next step starts at once, the list repeats', async () => {
    pads.set('pl', playlist('pl', ['a', 'b']));
    pads.set('s2', single('s2', 'h2'));
    audio.play('c', combo('c', [{ padIds: ['pl'] }, { padIds: ['s2'] }]));
    await flush();
    expect(tags()).toEqual(['a', 'h2']);
    ctx.sources[0].end();
    await flush();
    expect(tags()).toEqual(['a', 'h2', 'b']);
    expect(engine.libBufs['a']).toBeUndefined(); // released after it ended (iOS memory rule)
    ctx.sources[2].end();
    await flush();
    expect(tags()).toEqual(['a', 'h2', 'b', 'a']); // starts over
  });

  test('a looping list whose files are all missing stops instead of spinning', async () => {
    missing.add('m1');
    missing.add('m2');
    pads.set('pl', playlist('pl', ['m1', 'm2']));
    pads.set('s2', single('s2', 'h2'));
    audio.play('c', combo('c', [{ padIds: ['pl'] }, { padIds: ['s2'] }]));
    await flush();
    expect(tags()).toEqual(['h2']);
    const idb = await import('../../../src/db/idb');
    const tries = vi.mocked(idb.libGet).mock.calls.filter(([h]) => h === 'm1').length;
    expect(tries).toBe(1); // one round, then it gave up — no endless retry
  });

  // Slice 9d behaviour change: a Loop with no file is mapped to the engine's loop (not to an
  // empty playlist), i.e. a silent background child — so the next step starts once, at once.
  // Before 9d the empty playlist was a foreground child that ended at once (and hit the
  // double-start bug).
  test('an empty loop child does not hold up the combo', async () => {
    pads.set('pl', playlist('pl', []));
    pads.set('s2', single('s2', 'h2'));
    audio.play('c', combo('c', [{ padIds: ['pl'] }, { padIds: ['s2'] }]));
    await flush();
    expect(tags()).toEqual(['h2']);
  });

  test('a child that ends at once starts the next step exactly once', async () => {
    pads.set('s0', single('s0', ''));
    pads.set('pl', playlist('pl', []));
    pads.set('s2', single('s2', 'h2'));
    audio.play('c1', combo('c1', [{ padIds: ['s0', 'pl'] }, { padIds: ['s2'] }]));
    await flush();
    expect(tags()).toEqual(['h2']);
  });

  test('a child that ends at once does not cut short a sibling that still plays', async () => {
    pads.set('s0', single('s0', ''));
    pads.set('s1', single('s1', 'h1'));
    pads.set('s2', single('s2', 'h2'));
    audio.play('c', combo('c', [{ padIds: ['s0', 's1'] }, { padIds: ['s2'] }]));
    await flush();
    expect(tags()).toEqual(['h1']); // the next step waits for s1
    ctx.sources[0].end();
    await flush();
    expect(tags()).toEqual(['h1', 'h2']);
  });

  test("a step whose children all end at once still waits for the step's duration", async () => {
    vi.useFakeTimers();
    pads.set('s0', single('s0', ''));
    pads.set('s2', single('s2', 'h2'));
    audio.play('c', combo('c', [{ padIds: ['s0'], duration: 2 }, { padIds: ['s2'] }]));
    await flush();
    expect(tags()).toEqual([]);
    vi.advanceTimersByTime(2000);
    await flush();
    expect(tags()).toEqual(['h2']);
  });

  test('a shuffled playlist child picks its file with Math.random', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    pads.set('pl', playlist('pl', ['a', 'b', 'z'], { shuffle: true }));
    // A background child: the step needs a duration to keep the combo (and the child) running
    audio.play('c', combo('c', [{ padIds: ['pl'], duration: 9 }]));
    await flush();
    expect(tags()).toEqual(['z']);
  });

  test('stopping the combo silences the child and ignores its late "ended" event', async () => {
    pads.set('s1', single('s1', 'h1'));
    pads.set('s2', single('s2', 'h2'));
    audio.play('c', combo('c', [{ padIds: ['s1'] }, { padIds: ['s2'] }]));
    await flush();
    const childGain = ctx.gains[ctx.gains.length - 1];
    audio.stop('c');
    expect(childGain.gain.value).toBe(0);
    ctx.sources[0].end(); // the browser reports the end after the stop
    await flush();
    expect(tags()).toEqual(['h1']); // the next step does not start
  });
});

// ── "Fade out all" combo step (T11c: had no test at all) ──────────────────────

describe('fade out all (combo step)', () => {
  test('ramps every other playing pad to 0 over the duration, then stops and reports it', async () => {
    vi.useFakeTimers();
    await audio.play('L', loop('L', 'h9'));
    await flush();
    const loopGain = ctx.gains[ctx.gains.length - 1];
    pads.set('s1', single('s1', 'h1'));
    audio.play('c', combo('c', [{ padIds: [], fadeOutAll: 2 }, { padIds: ['s1'] }]));
    await flush();
    expect(loopGain.gain.events.slice(-3)).toEqual([
      ['cancel', 0],
      ['set', loopGain.gain.value, 0],
      ['ramp', 0, 2],
    ]);
    expect(ctx.sources[0].stopped).toBeNull(); // still fading

    vi.advanceTimersByTime(2050);
    await flush();
    expect(ctx.sources[0].stopped).toEqual({ when: 'now' });
    expect(stopped).toContain('L');
    expect(stopped).not.toContain('c'); // the fading combo itself keeps running
    expect(audio.isPlaying('L')).toBe(false);
  });

  test('the next step waits for the fade plus 100 ms', async () => {
    vi.useFakeTimers();
    pads.set('s1', single('s1', 'h1'));
    audio.play('c', combo('c', [{ padIds: [], fadeOutAll: 1 }, { padIds: ['s1'] }]));
    await flush();
    vi.advanceTimersByTime(1099);
    await flush();
    expect(ctx.sources).toHaveLength(0);
    vi.advanceTimersByTime(1);
    await flush();
    expect(tags()).toEqual(['h1']);
  });

  test('other running combos are stopped at once', async () => {
    vi.useFakeTimers();
    pads.set('bg', loop('bg', 'h3'));
    audio.play('other', combo('other', [{ padIds: ['bg'], duration: 60 }]));
    await flush();
    pads.set('s1', single('s1', 'h1'));
    audio.play('c', combo('c', [{ padIds: [], fadeOutAll: 1 }, { padIds: ['s1'] }]));
    await flush();
    expect(stopped).toContain('other');
    expect(ctx.sources[0].stopped).toEqual({ when: 'now' });
  });
});

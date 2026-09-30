// ─────────────────────────────────────────────────────────────────────────────
// Audio engine — characterization tests (T4, before Slice 9d)
//
// Pins down TODAY's behaviour of src/audio/engine.ts + the facade in
// src/audio/index.ts, so that the Slice-9d change to the play dispatch
// (docs/architecture/0048-pad-pool-decks.md#4-audio-engine--change-under-product-owner-control) shows every behavioural
// difference as a red test. The engine itself is NOT modified here.
//
// Runs against a fake Web Audio API that records what the engine does (sources,
// buffers, start/stop calls, gain automation). IDB is mocked: libGet returns a
// blob-like whose bytes are the hash, so each decoded buffer carries its hash
// as a tag. The engine keeps module-level state → fresh module per test.
// ─────────────────────────────────────────────────────────────────────────────

import type { ComboPad, LoopPad, Pad, PlaylistPad, SinglePad } from '../../../src/types';
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
  state: 'running' | 'suspended' = 'running';
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

const base = { name: 'pad', position: null, volume: 80, fadeIn: 0, fadeOut: 0 };
const single = (id: string, ref: string, extra: Partial<SinglePad> = {}): SinglePad => ({
  ...base,
  id,
  type: 'single',
  libraryItemRef: ref,
  ...extra,
});
const loop = (id: string, ref: string, extra: Partial<LoopPad> = {}): LoopPad => ({
  ...base,
  id,
  type: 'loop',
  libraryItemRef: ref,
  ...extra,
});
const playlist = (id: string, files: string[], extra: Partial<PlaylistPad> = {}): PlaylistPad => ({
  ...base,
  id,
  type: 'playlist',
  files,
  ...extra,
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
    getPad: (id) => pads.get(id) ?? null,
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
        settings: { quickAccessLayout: 'hidden', quickAccessSetCount: 1 },
        decks: [
          {
            id: 'd',
            name: 'D',
            order: 0,
            gridConfig: { cols: 4, rows: 4, gap: 8, padSize: 'md' },
            pads: [s1],
          },
        ],
        sets: [],
      },
    ];
    audio.initAudioBridge();
    audio.play('c', combo('c', [{ padIds: ['s1'] }]));
    await flush();
    expect(tags()).toEqual(['h1']);
    expect(store.playingPads.value.has('c')).toBe(true);
  });
});

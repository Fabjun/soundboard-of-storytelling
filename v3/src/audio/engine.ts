/**
 * @fileoverview Audio Engine — core logic (ADR-0044)
 *
 * Algorithm fidelity: V1's LRU cache, iOS hacks, playlist advancement, and
 * combo sequencer are ported from V1's index.html (lines 2751–4238; local archive
 * ~/dev/archive/botc-soundboard/, not in this repository).
 * No algorithm redesign; module-scope state replaces V1's globals.
 */

// The engine plays V1's pad shapes; index.ts maps the app's pads to them (toEnginePad).
import type { ComboPad, PadFile } from '../types';
import type {
  EngineLoopPad as LoopPad,
  EnginePlaylistPad as PlaylistPad,
  EngineSinglePad as SinglePad,
} from './types';
import { libGet } from '../db/idb';
import type { AudioCallbacks, ComboRuntimeState, PadInstance } from './types';

// ── Module-scope state (V1 globals → module scope) ────────────────────────────

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;

const srcs: Record<string, AudioBufferSourceNode[]> = {};
const gains: Record<string, GainNode> = {};
const playPos: Record<string, number> = {};
const comboState: Record<string, ComboRuntimeState> = {};

let callbacks: AudioCallbacks | null = null;

// ── LRU decoded-buffer cache (V1 lines 2751–2775) ────────────────────────────

const LRU_BUF_MAX_BYTES = 150 * 1024 * 1024; // 150 MB

/**
 * Decoded audio by library hash — the LRU cache (iPhone memory rule 7). Exported for the LRU
 * tests; the engine itself is the only writer.
 */
export const libBufs: Record<string, AudioBuffer> = {};
const libBufLru: string[] = []; // access-order, front = oldest
let libBufBytes = 0;
const libBufLoading: Record<string, Promise<void>> = {};

/** Returns the memory a decoded buffer takes: samples × channels × 4 bytes (32-bit float PCM). */
export function bufDecodedBytes(buf: AudioBuffer): number {
  return buf.length * buf.numberOfChannels * 4;
}

/**
 * Marks the buffer in `libBufs` under `hash` as just used, and evicts the least recently used
 * buffers while the cache is over 150 MB — always keeping the newest one.
 */
export function lruSet(hash: string): void {
  if (libBufLru.includes(hash)) {
    libBufLru.splice(libBufLru.indexOf(hash), 1);
    libBufLru.push(hash);
    return;
  }
  libBufLru.push(hash);
  libBufBytes += bufDecodedBytes(libBufs[hash]);
  while (libBufBytes > LRU_BUF_MAX_BYTES && libBufLru.length > 1) {
    const evict = libBufLru.shift()!;
    libBufBytes -= bufDecodedBytes(libBufs[evict]);
    delete libBufs[evict];
  }
}

/** Drops one buffer from the cache and its size from the total (no-op when it is not cached). */
export function lruDelete(hash: string): void {
  if (!libBufs[hash]) return;
  libBufBytes -= bufDecodedBytes(libBufs[hash]);
  const idx = libBufLru.indexOf(hash);
  if (idx !== -1) libBufLru.splice(idx, 1);
  delete libBufs[hash];
}

// ── Decode (V1 lines 2879–2893) ───────────────────────────────────────────────

async function ensureLibBuf(hash: string): Promise<void> {
  if (libBufs[hash]) return;
  if (!libBufLoading[hash]) {
    libBufLoading[hash] = (async () => {
      const entry = await libGet(hash);
      if (!entry?.blob) throw new Error('Audio not in library: ' + hash.slice(0, 8));
      if (!ctx) throw new Error('AudioContext not ready');
      const arrayBuf = await entry.blob.arrayBuffer();
      const buf = await ctx.decodeAudioData(arrayBuf);
      libBufs[hash] = buf;
      lruSet(hash);
    })().finally(() => {
      delete libBufLoading[hash];
    });
  }
  await libBufLoading[hash];
}

// ── Gain helpers ──────────────────────────────────────────────────────────────

function fadeInGain(g: GainNode, targetVol: number, fadeIn: number): void {
  if (fadeIn > 0) {
    g.gain.setValueAtTime(0, ctx!.currentTime);
    g.gain.linearRampToValueAtTime(targetVol, ctx!.currentTime + fadeIn);
  } else {
    g.gain.setValueAtTime(targetVol, ctx!.currentTime);
  }
}

// ── Context state ─────────────────────────────────────────────────────────────

/**
 * Tells whether the context waits to be resumed: `suspended`, or WebKit's `interrupted` (iOS:
 * after a phone call, another app's audio or a system sheet). The DOM types list only
 * `suspended`, so an iOS context that was interrupted used to stay silent (2026-10-03).
 */
function isHalted(c: AudioContext): boolean {
  const state: string = c.state;
  return state === 'suspended' || state === 'interrupted';
}

/**
 * Starts a looping source on its trimmed region. loopStart / loopEnd mark the region, and no
 * duration is passed: in start() a duration counts every pass of the loop (Web Audio spec,
 * AudioBufferSourceNode.start: "including any whole or partial loop iterations"), so a trimmed
 * loop played its region once and fell silent — V1 had the same (owner-approved fix 2026-10-03).
 * Without a trim end the region runs to the end of the buffer: a loopEnd of 0 would loop the
 * whole buffer from its start, ignoring trimStart. `startAt` begins the first pass inside the
 * region (the PAD editor's preview, owner-approved 2026-10-03); it defaults to the region start.
 * `repeat` (ADR-0069, owner-approved 2026-10-04) makes exactly that use of the duration: the
 * source plays `repeat` passes of the region — seamless and sample-accurate in one source, where
 * V1 chained a new source per pass — and then ends (a first pass from `startAt` counts as one).
 */
function startLoopSource(
  s: AudioBufferSourceNode,
  tStart: number,
  tEnd: number,
  hasDur: boolean,
  startAt?: number,
  repeat?: number,
): void {
  s.loop = true;
  s.loopStart = tStart;
  s.loopEnd = hasDur ? tEnd : (s.buffer?.duration ?? 0);
  const offset = startAt === undefined ? tStart : Math.min(Math.max(startAt, tStart), s.loopEnd);
  if (repeat === undefined) {
    s.start(0, offset);
    return;
  }
  const region = s.loopEnd - tStart;
  s.start(0, offset, Math.max(0, repeat * region - (offset - tStart)));
}

/**
 * Starts a source of a playlist on its file's trimmed region (ADR-0068; owner-approved engine
 * change 2026-10-03 — V1 played every playlist file whole). Without a trim end it plays to the
 * end of the file; a trim end not after the start counts as none, as for single files.
 */
function startFileSource(s: AudioBufferSourceNode, file: PadFile): void {
  const tStart = file.trimStart ?? 0;
  const tEnd = file.trimEnd ?? 0;
  if (tEnd > tStart) s.start(0, tStart, tEnd - tStart);
  else s.start(0, tStart);
}

// ── Callback bridge ───────────────────────────────────────────────────────────

function onPadStarted(id: string, isLoop: boolean): void {
  callbacks?.onPadStarted(id, isLoop);
}

function onPadStopped(id: string): void {
  callbacks?.onPadStopped(id);
}

// ── initAudio — iOS-safe, idempotent (ADR-0043) ───────────────────────────────

/**
 * Creates the audio context on the first call and unlocks audio on iOS; later calls do nothing.
 *
 * @remarks Must be called synchronously inside a tap handler (TAP TO UNLOCK): iOS allows the
 * silent-audio session fix and `resume()` only within the user gesture.
 */
export function initAudio(): void {
  if (ctx) return;

  // iOS plays Web Audio on the "ambient" channel, which the ring/silent switch mutes (owner device
  // test 2026-10-03: pads ran but were silent). iOS 17+ offers the Audio Session API: "playback"
  // makes the page a playback app, like a music player (owner decision: sound with the switch on).
  const session = navigator.audioSession;
  if (session) session.type = 'playback';

  // AVAudioSession fix for iOS before 17: a playing audio element moves the session to
  // 'playback'. It has to keep playing — a one-shot clip lets the session fall back — so it
  // loops where the Audio Session API is missing. Must run synchronously in the user-gesture
  // handler — same event loop tick as the click, before any await.
  const sil = Object.assign(document.createElement('audio'), {
    src: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA',
    loop: !session,
  });
  sil.setAttribute('playsinline', '');
  // play() returns a Promise in modern browsers, undefined in old WebKit.
  // Guard against calling .catch() on undefined to avoid a sync throw.
  const silPlay = sil.play();
  if (silPlay) silPlay.catch(() => {});

  ctx = new (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  )();
  masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);

  // iOS creates AudioContexts in 'suspended' state even inside a user-gesture
  // handler. Fire resume() synchronously here — iOS honours the request because
  // we are still in the same gesture tick. The async chain in playOnce/playLoop
  // is a safety net but is not reliable on its own for older iOS versions.
  ctx.resume().catch(() => {});

  // Resume AudioContext when the tab becomes visible after backgrounding.
  // iOS suspends it automatically on tab switch; this restores it.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && ctx && isHalted(ctx)) {
      ctx.resume().catch(() => {});
    }
  });
}

// ── SINGLE playback (V1 play() 'once' path, ~line 3855) ───────────────────────

/**
 * Plays a Single's file once, with its volume, fades and trim; a pad that is still playing
 * restarts. Does nothing before `initAudio` or without a file; a file that cannot be loaded is
 * logged, not thrown.
 */
export async function playOnce(padId: string, pad: SinglePad): Promise<void> {
  if (!ctx || !pad.libraryItemRef) return;
  const hash = pad.libraryItemRef;

  // Fire-and-forget — consistent with playLoop/playPlaylist/playCombo.
  // Awaiting resume() creates an async gap during which iOS WebKit can cancel
  // running source nodes in other pads. The source scheduled below will play
  // once the context is running.
  if (isHalted(ctx)) ctx.resume().catch(() => {});

  try {
    await ensureLibBuf(hash);
  } catch (e) {
    console.error(`Failed to load audio for "${pad.name}":`, e);
    return;
  }

  const buf = libBufs[hash];
  if (!buf) return;

  // Re-trigger: stop any in-progress playback before starting fresh.
  stopPad(padId, true);

  const vol = pad.volume / 100;
  const fi = pad.fadeIn;
  const fo = pad.fadeOut;
  const tStart = pad.trimStart ?? 0;
  const tEnd = pad.trimEnd ?? 0;
  const hasDur = tEnd > tStart;
  const dur = hasDur ? tEnd - tStart : undefined;

  const s = ctx.createBufferSource();
  const g = ctx.createGain();
  fadeInGain(g, vol, fi);
  if (hasDur && fo > 0) {
    const foStart = Math.max(ctx.currentTime + fi, ctx.currentTime + dur! - fo);
    g.gain.setValueAtTime(vol, foStart);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + dur!);
  }
  s.buffer = buf;
  s.connect(g);
  g.connect(masterGain!);
  gains[padId] = g;
  if (hasDur) s.start(0, tStart, dur);
  else s.start(0, tStart);
  srcs[padId] = [s];

  s.onended = () => {
    onPadStopped(padId);
    delete srcs[padId];
    delete gains[padId];
  };

  onPadStarted(padId, false);
}

// ── LOOP playback (V1 play() 'loop' path, ~line 3879) ────────────────────────

/**
 * Loops a Loop's single file seamlessly (within its trim) until it is stopped; a pad that is
 * already playing is left alone. Does nothing before `initAudio` or without a file.
 */
export async function playLoop(padId: string, pad: LoopPad): Promise<void> {
  if (!ctx || !pad.libraryItemRef) return;
  if (srcs[padId]) return; // defensive: caller should have checked isPlaying

  const hash = pad.libraryItemRef;
  // Fire-and-forget resume — avoids async gap that can cancel other pads on iOS.
  if (isHalted(ctx)) ctx.resume().catch(() => {});

  try {
    await ensureLibBuf(hash);
  } catch (e) {
    console.error(`Failed to load audio for "${pad.name}":`, e);
    return;
  }

  const buf = libBufs[hash];
  if (!buf || srcs[padId]) return; // guard: may have been stopped during load

  const vol = pad.volume / 100;
  const fi = pad.fadeIn;
  const tStart = pad.trimStart ?? 0;
  const tEnd = pad.trimEnd ?? 0;
  const hasDur = tEnd > tStart;

  const g = ctx.createGain();
  fadeInGain(g, vol, fi);
  g.connect(masterGain!);
  gains[padId] = g;

  const s = ctx.createBufferSource();
  s.buffer = buf;
  s.connect(g);
  startLoopSource(s, tStart, tEnd, hasDur, pad.startAt, pad.repeat);
  srcs[padId] = [s];
  // With a repeat count the source ends by itself after its passes (stopPad clears this first)
  if (pad.repeat !== undefined) {
    s.onended = () => {
      onPadStopped(padId);
      delete srcs[padId];
      delete gains[padId];
    };
  }

  onPadStarted(padId, true);
}

// ── PLAYLIST playback (V1 play() playlist path + playNext, ~lines 3809–3944) ──

/**
 * Plays a list of files one after another — a Loop with several files (`toEnginePad`). Each
 * file's decoded buffer is released before the next one is decoded (iPhone memory rules 2 and 5).
 */
export function playPlaylist(padId: string, pad: PlaylistPad): void {
  if (!ctx || !pad.files.length) return;
  if (srcs[padId]) return; // defensive
  if (isHalted(ctx)) ctx.resume().catch(() => {});

  srcs[padId] = []; // sentinel: truthy so guard in playNextTrack passes
  onPadStarted(padId, false);
  playNextTrack(padId, pad);
}

async function playNextTrack(padId: string, pad: PlaylistPad): Promise<void> {
  if (!ctx || !srcs[padId]) return;

  const files = pad.files;
  // playPos counts the tracks this run has started; with a repeat count (ADR-0069) the run ends
  // after `repeat` passes through the list — in shuffle, as many tracks as that
  const played = playPos[padId] ?? 0;
  if (pad.repeat !== undefined && played >= pad.repeat * files.length) {
    onPadStopped(padId);
    delete srcs[padId];
    delete gains[padId];
    delete playPos[padId];
    return;
  }
  playPos[padId] = played + 1;
  const i = pad.shuffle ? Math.floor(Math.random() * files.length) : played % files.length;

  const file = files[i];
  const hash = file?.hash ?? null;
  if (!file || !hash) {
    if (srcs[padId]) playNextTrack(padId, pad);
    return;
  }

  let buf: AudioBuffer | null = null;
  try {
    await ensureLibBuf(hash);
    if (!srcs[padId]) return; // stopped during load
    buf = libBufs[hash] ?? null;
  } catch (e) {
    console.warn('Playlist decode failed:', hash, e);
    if (srcs[padId]) playNextTrack(padId, pad);
    return;
  }

  if (!buf || !srcs[padId]) return;

  const s = ctx.createBufferSource();
  const g = ctx.createGain();
  fadeInGain(g, pad.volume / 100, pad.fadeIn);
  s.buffer = buf;
  s.connect(g);
  g.connect(masterGain!);
  startFileSource(s, file);
  srcs[padId] = [s];
  gains[padId] = g;

  // Release PCM before next decode to keep RAM flat (V1 pattern, line 3944)
  s.onended = () => {
    if (srcs[padId]) {
      lruDelete(hash);
      s.buffer = null;
      playNextTrack(padId, pad);
    }
  };
}

// ── STOP ──────────────────────────────────────────────────────────────────────

/**
 * Stops a pad. fadeOut is the per-pad fadeOut setting in seconds (0 = immediate
 * cut). immediate=true always overrides to instant stop regardless of fadeOut.
 */
export function stopPad(padId: string, immediate = false, fadeOut = 0): void {
  if (comboState[padId]) {
    stopCombo(padId);
    return;
  }
  if (!srcs[padId]) return;

  onPadStopped(padId);

  const fo = immediate ? 0 : fadeOut;

  if (fo > 0 && gains[padId]) {
    const g = gains[padId];
    g.gain.cancelScheduledValues(ctx!.currentTime);
    g.gain.setValueAtTime(g.gain.value, ctx!.currentTime);
    g.gain.linearRampToValueAtTime(0, ctx!.currentTime + fo);
    srcs[padId].forEach((s) => {
      try {
        s.onended = null;
        s.stop(ctx!.currentTime + fo);
      } catch (_) {}
    });
    const pid = padId;
    setTimeout(
      () => {
        delete srcs[pid];
        delete gains[pid];
        delete playPos[pid];
      },
      fo * 1000 + 100,
    );
  } else {
    srcs[padId].forEach((s) => {
      try {
        s.onended = null;
        s.stop();
      } catch (_) {}
    });
    delete srcs[padId];
    delete gains[padId];
    delete playPos[padId];
  }
}

/** Stops every playing pad and every running combo at once, without fades. */
export function stopAllInternal(): void {
  for (const padId of Object.keys(srcs)) {
    srcs[padId].forEach((s) => {
      try {
        s.onended = null;
        s.stop();
      } catch (_) {}
    });
    onPadStopped(padId);
    delete srcs[padId];
    delete gains[padId];
    delete playPos[padId];
  }
  for (const padId of Object.keys(comboState)) {
    stopCombo(padId);
  }
}

/**
 * Fades every playing pad out over `duration` seconds and then stops it; running combos stop at
 * once (their gain nodes are not reachable for a fade). Does nothing while audio is suspended.
 */
export function fadeOutAllInternal(duration: number): void {
  if (!ctx || isHalted(ctx)) return;

  // Stop combos immediately — their GainNodes are local to createPadInstance,
  // not in the module-level gains dict, so we can't fade them gracefully.
  for (const padId of Object.keys(comboState)) {
    stopCombo(padId);
  }

  for (const padId of Object.keys(gains)) {
    const g = gains[padId];
    if (g?.gain) {
      try {
        g.gain.cancelScheduledValues(ctx.currentTime);
        g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
      } catch (_) {}
    }
  }

  setTimeout(
    () => {
      for (const padId of Object.keys(srcs)) {
        srcs[padId].forEach((s) => {
          try {
            s.onended = null;
            s.stop();
          } catch (_) {}
        });
        onPadStopped(padId);
        delete srcs[padId];
        delete gains[padId];
        delete playPos[padId];
      }
    },
    duration * 1000 + 50,
  );
}

// ── COMBO ENGINE (V1 lines 3970–4238) ────────────────────────────────────────

function isInfiniteBg(pad: SinglePad | LoopPad | PlaylistPad): boolean {
  return pad.type === 'loop' || (pad.type === 'playlist' && pad.loop === true);
}

/**
 * Creates a self-contained playable handle from a pad for combo sequencer use.
 * Does NOT register in module-level srcs/gains — audio is fully local.
 */
function createPadInstance(
  pad: SinglePad | LoopPad | PlaylistPad,
  volOverride?: number,
  fadeOverride?: number,
): PadInstance {
  const g = ctx!.createGain();
  const vol = (volOverride != null ? volOverride : pad.volume) / 100;
  const fadeIn = fadeOverride != null ? fadeOverride : pad.fadeIn;
  fadeInGain(g, vol, fadeIn);
  g.connect(masterGain!);

  const active: AudioBufferSourceNode[] = [];
  let stopped = false;

  const tStart = ('trimStart' in pad ? pad.trimStart : undefined) ?? 0;
  const tEnd = ('trimEnd' in pad ? pad.trimEnd : undefined) ?? 0;
  const hasDur = tEnd > tStart;
  const dur = hasDur ? tEnd - tStart : undefined;

  function doStart(onEnded: (() => void) | null): void {
    if (pad.type === 'single') {
      (async () => {
        const hash = pad.libraryItemRef;
        if (!hash) {
          onEnded?.();
          return;
        }
        try {
          await ensureLibBuf(hash);
          const b = libBufs[hash];
          if (!b || stopped) {
            onEnded?.();
            return;
          }
          const s = ctx!.createBufferSource();
          s.buffer = b;
          s.connect(g);
          active.push(s);
          s.onended = () => {
            if (!stopped) onEnded?.();
          };
          if (hasDur) s.start(0, tStart, dur);
          else s.start(0, tStart);
        } catch (e) {
          console.warn('Combo single load:', e);
          onEnded?.();
        }
      })();
    } else if (pad.type === 'loop') {
      (async () => {
        const hash = pad.libraryItemRef;
        if (!hash) {
          onEnded?.();
          return;
        }
        try {
          await ensureLibBuf(hash);
          const b = libBufs[hash];
          if (!b || stopped) {
            onEnded?.();
            return;
          }
          const s = ctx!.createBufferSource();
          s.buffer = b;
          s.connect(g);
          active.push(s);
          const repeat = pad.repeat;
          startLoopSource(s, tStart, tEnd, hasDur, undefined, repeat);
          // Without a repeat count an infinite loop: onEnded fires only when instance.stop() is
          // called; with one it ends by itself after its passes (ADR-0069)
          if (repeat !== undefined) {
            s.onended = () => {
              if (!stopped) onEnded?.();
            };
          }
        } catch (e) {
          console.warn('Combo loop load:', e);
          onEnded?.();
        }
      })();
    } else {
      // playlist
      if (!pad.files.length) {
        onEnded?.();
        return;
      }
      let pos = 0;
      let round = 1;
      // A looping list starts over at its end — unless a whole round played nothing (every file
      // missing or undecodable), so it never spins without sound — or its repeat count is reached
      // (ADR-0069).
      let playedThisRound = false;
      (async function nextTrack() {
        if (stopped) return;
        if (pos >= pad.files.length) {
          const lastRound = pad.repeat !== undefined && round >= pad.repeat;
          if (!pad.loop || !playedThisRound || lastRound) {
            onEnded?.();
            return;
          }
          pos = 0;
          round++;
          playedThisRound = false;
        }
        const i = pad.shuffle ? Math.floor(Math.random() * pad.files.length) : pos;
        pos++;
        const file = pad.files[i];
        const hash = file?.hash ?? null;
        if (!file || !hash) {
          nextTrack();
          return;
        }
        try {
          await ensureLibBuf(hash);
          const b = libBufs[hash];
          if (!b || stopped) {
            nextTrack();
            return;
          }
          const s = ctx!.createBufferSource();
          s.buffer = b;
          s.connect(g);
          active.push(s);
          playedThisRound = true;
          s.onended = () => {
            if (stopped) return;
            active.splice(active.indexOf(s), 1);
            lruDelete(hash);
            nextTrack();
          };
          startFileSource(s, file);
        } catch (e) {
          console.warn('Combo playlist decode failed:', e);
          nextTrack();
        }
      })();
    }
  }

  return {
    start: doStart,
    stop: () => {
      stopped = true;
      active.forEach((s) => {
        try {
          s.stop();
        } catch (_) {}
      });
      try {
        g.gain.value = 0;
      } catch (_) {}
    },
  };
}

/**
 * Runs a combo's steps in order; a combo that is running restarts from its first step. The
 * pads of each step are looked up through the `getPad` callback (`configureCallbacks`).
 */
export function playCombo(padId: string, pad: ComboPad): void {
  if (!ctx) return;
  if (isHalted(ctx)) ctx.resume().catch(() => {});
  if (comboState[padId]) stopCombo(padId); // retrigger: stop then restart
  const state: ComboRuntimeState = {
    stopped: false,
    bgInstances: [],
    currentFgInstances: [],
    onFinish: null,
    pad,
  };
  comboState[padId] = state;
  srcs[padId] = []; // sentinel
  onPadStarted(padId, false);
  playComboStep(padId, state, pad);
}

function playComboInternal(padId: string, pad: ComboPad, onFinish: () => void): void {
  const state: ComboRuntimeState = {
    stopped: false,
    bgInstances: [],
    currentFgInstances: [],
    onFinish,
    pad,
  };
  comboState[padId] = state;
  playComboStep(padId, state, pad);
}

function playComboStep(padId: string, state: ComboRuntimeState, pad: ComboPad, stepIdx = 0): void {
  if (state.stopped || stepIdx >= pad.steps.length) {
    finishCombo(padId, state);
    return;
  }

  const step = pad.steps[stepIdx];
  let delayNext = 0;

  if (step.stopAll) {
    stopAllInternal();
    delayNext = 200;
  }

  if (step.fadeOutAll != null && step.fadeOutAll > 0) {
    fadeOutAllExcept(padId, step.fadeOutAll);
    delayNext = step.fadeOutAll * 1000 + 100;
  }

  state.currentFgInstances = [];
  let fgRem = 0;
  // A child can end while it is being started (no audio reference, empty playlist). Until every
  // child of this step is started, an end only counts down — otherwise the next step started
  // inside the loop and again after it (BACKLOG "Bug: combo step starts the next step twice").
  let starting = true;
  const childEnded = () => {
    if (state.stopped) return;
    fgRem--;
    if (fgRem === 0 && !starting) playComboStep(padId, state, pad, stepIdx + 1);
  };

  for (const childId of step.padIds) {
    const childPad = callbacks?.getPad(childId);
    if (!childPad) continue;

    if (childPad.type === 'combo') {
      fgRem++;
      playComboInternal(childId, childPad, childEnded);
      continue;
    }

    const inst = createPadInstance(childPad);
    if (isInfiniteBg(childPad)) {
      state.bgInstances.push(inst);
      inst.start(null);
    } else {
      fgRem++;
      state.currentFgInstances.push(inst);
      inst.start(childEnded);
    }
  }
  starting = false;

  // No foreground child, or all of them ended while starting: wait for the step's duration
  // (or the stop-all / fade-out delay), then go on.
  if (fgRem === 0) {
    const ms = Math.max((step.duration ?? 0) * 1000, delayNext);
    if (ms > 0) {
      state.pauseTimer = setTimeout(() => {
        if (!state.stopped) playComboStep(padId, state, pad, stepIdx + 1);
      }, ms);
    } else {
      playComboStep(padId, state, pad, stepIdx + 1);
    }
  }
}

function finishCombo(padId: string, state: ComboRuntimeState): void {
  clearTimeout(state.pauseTimer);
  state.bgInstances.forEach((i) => i.stop());
  delete comboState[padId];
  if (!state.onFinish) {
    onPadStopped(padId);
    delete srcs[padId];
  } else {
    state.onFinish();
  }
}

function stopCombo(padId: string): void {
  const state = comboState[padId];
  if (!state) return;
  state.stopped = true;
  clearTimeout(state.pauseTimer);
  state.bgInstances.forEach((i) => i.stop());
  state.currentFgInstances.forEach((i) => i.stop());
  // Stop any nested combos referenced in steps (mirrors V1 pads[id].steps scan)
  for (const step of state.pad.steps) {
    for (const childId of step.padIds) {
      if (comboState[childId]) stopCombo(childId);
    }
  }
  delete comboState[padId];
  if (!state.onFinish) {
    onPadStopped(padId);
    delete srcs[padId];
  }
}

function fadeOutAllExcept(exceptPadId: string, duration: number): void {
  if (!ctx || isHalted(ctx)) return;

  for (const cid of Object.keys(comboState)) {
    if (cid !== exceptPadId) stopCombo(cid);
  }

  const fadingIds: string[] = [];
  for (const pid of Object.keys(gains)) {
    if (pid === exceptPadId) continue;
    const g = gains[pid];
    if (g?.gain) {
      try {
        g.gain.cancelScheduledValues(ctx.currentTime);
        g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
        fadingIds.push(pid);
      } catch (_) {}
    }
  }

  setTimeout(
    () => {
      for (const pid of fadingIds) {
        if (srcs[pid]) {
          srcs[pid].forEach((s) => {
            try {
              s.onended = null;
              s.stop();
            } catch (_) {}
          });
          delete srcs[pid];
        }
        onPadStopped(pid);
        delete gains[pid];
        delete playPos[pid];
      }
    },
    duration * 1000 + 50,
  );
}

// ── Public configuration ──────────────────────────────────────────────────────

/** Connects the engine to the app: start / stop notices and the lookup of a combo's pads. */
export function configureCallbacks(cb: AudioCallbacks): void {
  callbacks = cb;
}

/** Tells whether the pad is playing — a running combo or playlist counts from its start. */
export function isPlayingInternal(padId: string): boolean {
  return !!srcs[padId];
}

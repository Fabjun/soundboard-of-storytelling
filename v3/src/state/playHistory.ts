/**
 * @fileoverview Play history — remembers when each pad was last started (E1 "Last played")
 *
 * Watches the playing pads (the audio bridge's signal) — the audio code itself is not touched.
 * Stored in the preferences (IndexedDB key-value store), never in the board, so playing during a
 * game causes no board writes.
 */

import { effect } from '@preact/signals';
import { playingPads } from './store';
import { setLastPlayed } from './prefs';

/** Starts recording; returns a function that stops it. Call once at app start. */
export function startPlayHistory(now: () => number = Date.now): () => void {
  let before = new Set<string>();
  return effect(() => {
    const playing = playingPads.value;
    for (const id of playing) if (!before.has(id)) setLastPlayed(id, now());
    before = new Set(playing);
  });
}

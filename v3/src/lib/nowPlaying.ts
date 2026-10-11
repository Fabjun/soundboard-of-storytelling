/**
 * @fileoverview nowPlaying — the status line that says which sounds play now (Slice 13f)
 *
 * docs/product/features/adaptive-layout.md#decided L9 (owner decision 2026-10-11): one line in the
 * status bar and the dock, as V1's `_updSpBar`: "N playing: a · b · c…" — the first three names
 * in the order the pads started, then … — or "No sound" when nothing plays.
 */

import type { Pad } from '../types';

/** How many names the line shows before it ends in … (V1: three). */
const NOW_PLAYING_NAMES = 3;

/** The line when nothing plays. */
export const NO_SOUND = 'No sound';

/**
 * Returns the status line for the playing pads `ids`, in their order (a Set keeps the order the
 * pads started in). Names come from `pads`; an id that is no pad of them (the PAD editor's
 * preview, a pad deleted while it plays) is not counted.
 */
export function nowPlayingText(ids: Iterable<string>, pads: readonly Pad[]): string {
  const byId = new Map(pads.map((p) => [p.id, p]));
  const names: string[] = [];
  for (const id of ids) {
    const pad = byId.get(id);
    // A pad without a name shows as — here too, as on the pad (PadGridCell)
    if (pad) names.push(pad.name || '—');
  }
  if (names.length === 0) return NO_SOUND;
  const shown = names.slice(0, NOW_PLAYING_NAMES).join(' · ');
  return `${names.length} playing: ${shown}${names.length > NOW_PLAYING_NAMES ? '…' : ''}`;
}

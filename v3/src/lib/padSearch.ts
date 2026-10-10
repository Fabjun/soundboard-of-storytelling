/**
 * @fileoverview padSearch — find pads by name, in the current view (Slice 13c)
 *
 * docs/product/README.md#board-decks--quick-access (owner decision 2026-09-28): search is always
 * available and applies to the current view only — All pads or the current deck; it combines with
 * the sort. A pad matches when every word of the query is part of its name, ignoring case — the
 * same rule as the icon search (src/lib/iconSet.ts). An empty query matches every pad.
 */

import type { Pad } from '../types';

/** The words of a query, lower case; an empty or blank query has none. */
export function searchWords(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

/** Returns the pads whose name holds every word of `query`, in their order; all for no words. */
export function searchPads(pads: readonly Pad[], query: string): Pad[] {
  const words = searchWords(query);
  if (words.length === 0) return [...pads];
  return pads.filter((p) => {
    const name = p.name.toLowerCase();
    return words.every((w) => name.includes(w));
  });
}

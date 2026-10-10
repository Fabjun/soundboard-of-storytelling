/**
 * @fileoverview padSearch — find pads by name (Slice 13c)
 * Edge-case checklist: empty and blank query (all pads, a copy), one word, several words (every
 * one must match, in any order), case, a word inside a name, no match, the order kept.
 */

import type { Pad } from '../../src/types';
import { searchPads, searchWords } from '../../src/lib/padSearch';

const pad = (id: string, name: string): Pad => ({
  id,
  name,
  type: 'single',
  files: [],
  order: 'sequential',
  volume: 80,
  fadeIn: 0,
  fadeOut: 0,
});
const pads = [pad('a', 'Thunder Storm'), pad('b', 'Owl'), pad('c', 'storm bell'), pad('d', 'Rain')];
const ids = (list: Pad[]) => list.map((p) => p.id);

describe('searchPads', () => {
  it('an empty or blank query keeps every pad, as a new list', () => {
    expect(ids(searchPads(pads, ''))).toEqual(['a', 'b', 'c', 'd']);
    expect(ids(searchPads(pads, '   '))).toEqual(['a', 'b', 'c', 'd']);
    expect(searchPads(pads, '')).not.toBe(pads);
  });

  it('finds a word anywhere in the name, ignoring case; the order stays', () => {
    expect(ids(searchPads(pads, 'STORM'))).toEqual(['a', 'c']);
    expect(ids(searchPads(pads, 'ai'))).toEqual(['d']);
  });

  it('every word must be in the name, in any order', () => {
    expect(ids(searchPads(pads, 'bell storm'))).toEqual(['c']);
    expect(ids(searchPads(pads, 'storm owl'))).toEqual([]);
  });

  it('splits the query on any run of spaces', () => {
    expect(searchWords('  Thunder   storm ')).toEqual(['thunder', 'storm']);
  });
});

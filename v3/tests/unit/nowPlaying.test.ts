/**
 * @fileoverview nowPlaying — unit tests: the status line of the playing pads (Slice 13f)
 * Edge-case checklist: nothing plays, one pad, exactly three (no …), four (three names and …), the
 * start order kept, an id that is no pad (preview, deleted pad) not counted, only such ids (No
 * sound), an empty name.
 */

import type { Pad } from '../../src/types';
import { NO_SOUND, nowPlayingText } from '../../src/lib/nowPlaying';

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
const pads = [pad('a', 'Rain'), pad('b', 'Wind'), pad('c', 'Bell'), pad('d', 'Owl')];

describe('nowPlayingText', () => {
  it('says No sound when nothing plays', () => {
    expect(nowPlayingText([], pads)).toBe(NO_SOUND);
  });

  it('names one playing pad', () => {
    expect(nowPlayingText(['b'], pads)).toBe('1 playing: Wind');
  });

  it('names three pads without …, in the order they started', () => {
    expect(nowPlayingText(new Set(['c', 'a', 'b']), pads)).toBe('3 playing: Bell · Rain · Wind');
  });

  it('names the first three of four and ends in …', () => {
    expect(nowPlayingText(['d', 'a', 'b', 'c'], pads)).toBe('4 playing: Owl · Rain · Wind…');
  });

  it('does not count an id that is no pad of the board', () => {
    expect(nowPlayingText(['__preview__', 'a', 'gone'], pads)).toBe('1 playing: Rain');
    expect(nowPlayingText(['__preview__'], pads)).toBe(NO_SOUND);
  });

  it('shows a pad without a name as —, as the pad does', () => {
    expect(nowPlayingText(['x'], [pad('x', '')])).toBe('1 playing: —');
  });
});

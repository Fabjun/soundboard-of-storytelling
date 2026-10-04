/**
 * @fileoverview iconSet — keys, loading on demand, drawing lookup, categories and search (ADR-0070)
 */
import { describe, it, expect } from 'vitest';
import {
  getIconCategory,
  getIconDrawing,
  ICON_CATEGORIES,
  ICON_SET_PREFIXES,
  iconsByCategory,
  isIconKey,
  loadIconCatalog,
  loadIconSets,
  loadIconSetsFor,
  parseIconKey,
  searchIcons,
} from '../../src/lib/iconSet';

describe('keys', () => {
  it('a key is set:name in lower case with single hyphens', () => {
    expect(isIconKey('nikoichu:dragon')).toBe(true);
    expect(isIconKey('kenney-1bit:dice-6')).toBe(true);
    const bad = [
      'dragon',
      'Nikoichu:dragon',
      'nikoichu:dragon--red',
      'nikoichu:-dragon',
      'a:b:c',
      ':dragon',
      'nikoichu:',
      7,
      undefined,
    ];
    expect(bad.filter(isIconKey)).toEqual([]);
  });

  it('parseIconKey splits a key and refuses a malformed one', () => {
    expect(parseIconKey('kenney-1bit:dice-6')).toEqual({ prefix: 'kenney-1bit', name: 'dice-6' });
    expect(parseIconKey('dragon')).toBeNull();
  });
});

describe('loading on demand', () => {
  it('a drawing is unknown until its pack is loaded, then has the pack size', async () => {
    expect(getIconDrawing('pixelarticons:heart')).toBeUndefined();
    await loadIconSetsFor(['pixelarticons:heart', 'not a key']);
    expect(getIconDrawing('pixelarticons:heart')).toMatchObject({ size: 24 });
    // The path data alone, read from the one-path body — drawn as an element, no HTML string
    expect(getIconDrawing('pixelarticons:heart')?.d).toMatch(/^M\d+ \d+h\d+v1H\d+z/);
    expect(getIconDrawing('nikoichu:dragon')).toBeUndefined(); // another pack, not loaded yet
  });

  it('every pack loads; unknown keys and prefixes give nothing', async () => {
    await loadIconSets([...ICON_SET_PREFIXES, 'unknown-pack']);
    expect(getIconDrawing('nikoichu:dragon')).toMatchObject({ size: 16 });
    expect(getIconDrawing('nikoichu:no-such-icon')).toBeUndefined();
    expect(getIconDrawing('unknown-pack:dragon')).toBeUndefined();
    expect(getIconDrawing('dragon')).toBeUndefined();
  });

  it('the category of an icon comes from its pack', async () => {
    await loadIconSets();
    expect(getIconCategory('nikoichu:dragon')).toBe('creatures');
    expect(getIconCategory('nikoichu:no-such-icon')).toBeUndefined();
    expect(getIconCategory('dragon')).toBeUndefined();
  });
});

describe('categories and search', () => {
  it('iconsByCategory lists every category in the fixed order, each icon once', async () => {
    await loadIconSets();
    const groups = iconsByCategory();
    expect([...groups.keys()]).toEqual([...ICON_CATEGORIES]);
    const all = [...groups.values()].flat();
    expect(new Set(all).size).toBe(all.length);
    expect(groups.get('games')).toContain('nikoichu:d20');
  });

  it('search finds names first, then search words; every word must match', async () => {
    await loadIconSets();
    const catalog = await loadIconCatalog();
    const hits = searchIcons('Dragon', catalog);
    expect(hits[0]).toMatch(/dragon/); // a name match comes first
    expect(hits).toContain('nikoichu:dragon');
    // A search word finds icons whose name does not contain it (e.g. the cobra is tagged "poison")
    expect(searchIcons('poison', catalog)).toContain('nikoichu:cobra');
    expect(searchIcons('dragon xyzzy', catalog)).toEqual([]);
    expect(searchIcons('   ', catalog)).toEqual([]);
  });
});

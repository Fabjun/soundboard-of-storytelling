/**
 * @fileoverview v1Icons — V1's pad icon ids map to icon keys of the collection (ADR-0070)
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { v1IconKey } from '../../src/lib/v1Icons';
import { isIconKey } from '../../src/lib/iconSet';

const map = JSON.parse(
  readFileSync(join(__dirname, '../../src/icons/v1-map.json'), 'utf8'),
) as Record<string, string>;
const catalog = JSON.parse(
  readFileSync(join(__dirname, '../../src/icons/catalog.json'), 'utf8'),
) as Record<string, unknown>;

describe('v1IconKey', () => {
  it('maps both V1 id kinds: pixelarticons names and Nikoichu file ids', () => {
    expect(v1IconKey('wind')).toBe('pixelarticons:wind');
    expect(v1IconKey('px-rpg-creature-archetypes-dragon')).toBe('nikoichu:dragon');
  });

  it('a V1 icon left out as another drawing takes the kept drawing of its motif', () => {
    expect(v1IconKey('px-weather-water-droplet-liquid-rain-element-small')).toBe(
      'nikoichu:water-droplet',
    );
  });

  it('an id the collection lacks — or an inherited object key — gives nothing', () => {
    expect(v1IconKey('not-an-icon')).toBeUndefined();
    expect(v1IconKey('constructor')).toBeUndefined();
    expect(v1IconKey('__proto__')).toBeUndefined();
  });

  it('every target is a well-formed key of an icon that exists', () => {
    const bad = Object.entries(map).filter(([, key]) => !isIconKey(key) || !(key in catalog));
    expect(bad).toEqual([]);
  });
});

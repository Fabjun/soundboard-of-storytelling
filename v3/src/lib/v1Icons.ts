/**
 * @fileoverview v1Icons — V1's pad icon ids as V3 icon keys (ADR-0070)
 *
 * V1 stored a pad's icons as `{b: "<id>"}`: pixelarticons by name (`clock`), Nikoichu's icons as
 * `px-` + their file name (`px-rpg-creature-archetypes-dragon`). The map comes from
 * scripts/build-icons.ts; a V1 icon left out only as another drawing of a kept motif maps to the
 * kept drawing. Used by the V1 import and by `migratePad` for pads that kept V1's id (`iconRef`).
 */

import V1_MAP from '../icons/v1-map.json';

const map: Record<string, string> = V1_MAP;

/** The icon key for a V1 icon id, or undefined when the icon is not in the collection. */
export function v1IconKey(id: string): string | undefined {
  return Object.hasOwn(map, id) ? map[id] : undefined;
}

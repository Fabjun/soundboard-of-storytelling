/**
 * @fileoverview iconSet — the pad icon collection (ADR-0070)
 *
 * The icons come as one IconifyJSON file per pack (src/icons/sets, written by
 * scripts/build-icons.ts) and a catalog with the search words of every icon. An icon is named by
 * its key `set:name` (Iconify style, e.g. `nikoichu:dragon`); names are unique within a set.
 * Nothing is loaded at start: a set is imported when a board or the icon picker needs it, as its
 * own chunk (precached for offline use like the rest of the build).
 */

/** At most this many icons per pad (as in V1). */
export const PAD_ICONS_MAX = 4;

/** The fixed category list (owner decision 2026-10-04); every icon has exactly one. */
export const ICON_CATEGORIES = [
  'people',
  'creatures',
  'animals',
  'nature',
  'weather',
  'places',
  'travel',
  'weapons',
  'magic',
  'items',
  'food',
  'clothing',
  'games',
  'music',
  'emotions',
  'symbols',
  'interface',
] as const;
/** One category of the fixed list. */
export type IconCategory = (typeof ICON_CATEGORIES)[number];

/** The part of IconifyJSON this app writes and reads. */
export type IconSetJson = {
  prefix: string;
  info: {
    name: string;
    total: number;
    version: string;
    author: { name: string; url: string };
    license: { title: string; spdx: string; url: string };
    height: number;
  };
  width: number;
  height: number;
  icons: Record<string, { body: string }>;
  categories: Record<string, string[]>;
};

/** Search words and original reference of one icon, by key. */
export type IconCatalog = Record<string, { tags: string[]; source: string }>;

/** What it takes to draw an icon: its path data and its viewBox size. */
export type IconDrawing = { d: string; size: number };

const NAME = '[a-z0-9]+(?:-[a-z0-9]+)*';
const KEY = new RegExp(`^(${NAME}):(${NAME})$`);

/** True for a well-formed key `set:name` (lower case, digits, single hyphens). */
export function isIconKey(v: unknown): v is string {
  return typeof v === 'string' && KEY.test(v);
}

/** The set prefix and the name of a key, or null for a malformed one. */
export function parseIconKey(key: string): { prefix: string; name: string } | null {
  const m = KEY.exec(key);
  return m ? { prefix: m[1], name: m[2] } : null;
}

/** The packs of the collection; each import becomes its own chunk. */
const SET_LOADERS: Record<string, () => Promise<{ default: IconSetJson }>> = {
  nikoichu: () => import('../icons/sets/nikoichu.json'),
  pixelarticons: () => import('../icons/sets/pixelarticons.json'),
  'kenney-1bit': () => import('../icons/sets/kenney-1bit.json'),
  'kacper-1bit': () => import('../icons/sets/kacper-1bit.json'),
};

/** The prefixes of every pack, in the order the picker lists them. */
export const ICON_SET_PREFIXES = Object.keys(SET_LOADERS);

const loaded = new Map<string, IconSetJson>();
let catalog: IconCatalog | null = null;

/** Loads the given packs (all by default); each one once. Unknown prefixes are ignored. */
export async function loadIconSets(prefixes: readonly string[] = ICON_SET_PREFIXES): Promise<void> {
  await Promise.all(
    prefixes
      .filter((p) => SET_LOADERS[p] && !loaded.has(p))
      .map(async (p) => loaded.set(p, (await SET_LOADERS[p]()).default)),
  );
}

/** Loads the packs the given keys come from — what a board needs to draw its pads. */
export function loadIconSetsFor(keys: readonly string[]): Promise<void> {
  const prefixes = new Set(
    keys.map((k) => parseIconKey(k)?.prefix).filter((p): p is string => !!p),
  );
  return loadIconSets([...prefixes]);
}

/**
 * The drawing of a key whose pack is loaded; undefined when unknown or not loaded yet. The body is
 * one `<path fill="currentColor" d="…"/>` (checked by iconGuards), so the path data is enough to
 * draw it as a Preact element — no HTML string is inserted.
 */
export function getIconDrawing(key: string): IconDrawing | undefined {
  const parsed = parseIconKey(key);
  const set = parsed ? loaded.get(parsed.prefix) : undefined;
  const icon = parsed && set?.icons[parsed.name];
  const d = icon && / d="([^"]+)"/.exec(icon.body)?.[1];
  return d && set ? { d, size: set.width } : undefined;
}

/** Loads the catalog of search words (once). */
export async function loadIconCatalog(): Promise<IconCatalog> {
  catalog ??= (await import('../icons/catalog.json')).default as IconCatalog;
  return catalog;
}

/** Every key of the loaded packs, grouped by category in the order of ICON_CATEGORIES. */
export function iconsByCategory(): Map<IconCategory, string[]> {
  const out = new Map<IconCategory, string[]>(ICON_CATEGORIES.map((c) => [c, []]));
  for (const prefix of ICON_SET_PREFIXES) {
    const set = loaded.get(prefix);
    if (!set) continue;
    for (const [cat, names] of Object.entries(set.categories)) {
      out.get(cat as IconCategory)?.push(...names.map((n) => `${prefix}:${n}`));
    }
  }
  return out;
}

/**
 * Keys of the loaded packs whose name, search words or category contain every word of the query
 * (case-insensitive). Name matches come first, then matches in the search words; ties keep the
 * order of `iconsByCategory`. An empty query returns nothing.
 */
export function searchIcons(query: string, cat: IconCatalog): string[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const byName: string[] = [];
  const byTag: string[] = [];
  for (const [category, keys] of iconsByCategory()) {
    for (const key of keys) {
      const name = key.slice(key.indexOf(':') + 1);
      const text = `${name} ${(cat[key]?.tags ?? []).join(' ')} ${category}`;
      if (!words.every((w) => text.includes(w))) continue;
      (words.every((w) => name.includes(w)) ? byName : byTag).push(key);
    }
  }
  return [...byName, ...byTag];
}

#!/usr/bin/env tsx
/**
 * @fileoverview build-icons.ts — writes the pad icon sets from the curated selection (ADR-0070).
 *
 * The original icon packs are not part of this public repository (they stay in the owner's
 * archive); this script reads the curated working data made from them — the 1-bit masks, the
 * chosen icons and their names — and writes:
 *   - src/icons/sets/<prefix>.json  one IconifyJSON file per pack (drawing, license info, categories)
 *   - src/icons/catalog.json        search words and original reference of every icon (`set:name`)
 *   - src/icons/sets/<prefix>.LICENSE.txt  the license text where the license requires it (MIT)
 *   - src/icons/v1-map.json         V1's icon id → key, for the V1 import and pads it stored
 *
 * Run (from v3/): npm run build:icons -- [--from <work folder>] [--v1 <V1 icons.js>]
 * Default work folder: ~/dev/archive/icon-sources/work-2026-10-04 (see its README.md); default
 * V1 icon list: ~/dev/archive/botc-soundboard/icons.js (V1 stored `{b: "<id>"}` per pad icon).
 * The output is checked by tests/unit/iconGuards.test.ts; run it again after any change.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeGenerated } from './lib/write-generated';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'src', 'icons');

/** One pack of the selection: its prefix and the license facts IconifyJSON's `info` records. */
type SetInfo = {
  prefix: string;
  name: string;
  version: string;
  author: { name: string; url: string };
  license: { title: string; spdx: string; url: string };
  /** File in the work folder with the license text, where the license requires shipping it. */
  licenseText?: string;
};

/** Packs by the id prefix the working data uses (`<pack>-<n>`). */
const SETS: Record<string, SetInfo> = {
  nikoichu: {
    prefix: 'nikoichu',
    name: '1-bit Pixel Icons',
    version: '1.2',
    author: { name: 'Nikoichu', url: 'https://nikoichu.itch.io/pixel-icons' },
    license: {
      title: 'CC0 1.0',
      spdx: 'CC0-1.0',
      url: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
  },
  pixelarticons: {
    prefix: 'pixelarticons',
    name: 'pixelarticons',
    version: '2.4.1',
    author: { name: 'Gerrit Halfmann', url: 'https://pixelarticons.com' },
    license: {
      title: 'MIT',
      spdx: 'MIT',
      url: 'https://github.com/halfmage/pixelarticons/blob/master/LICENSE',
    },
    licenseText: 'data/pixelarticons-LICENSE',
  },
  kenney: {
    prefix: 'kenney-1bit',
    name: '1-Bit Pack',
    version: '1.2',
    author: { name: 'Kenney', url: 'https://kenney.nl/assets/1-bit-pack' },
    license: {
      title: 'CC0 1.0',
      spdx: 'CC0-1.0',
      url: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
  },
  kacper: {
    prefix: 'kacper-1bit',
    name: '1-Bit Icons',
    version: '1.1',
    author: { name: 'Kacper Woźniak', url: 'https://thkaspar.itch.io/1-bit-icons' },
    license: {
      title: 'CC0 1.0',
      spdx: 'CC0-1.0',
      url: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
  },
};

type Mask = { id: string; n: number; m: string };
type Source = { id: string; source: { ref: string } };
type Name = { name: string; category: string; tags: string[] };

const args = process.argv.slice(2);
const fromArg = args.indexOf('--from');
const WORK =
  fromArg >= 0
    ? resolve(args[fromArg + 1])
    : join(homedir(), 'dev/archive/icon-sources/work-2026-10-04');
const v1Arg = args.indexOf('--v1');
const V1 =
  v1Arg >= 0 ? resolve(args[v1Arg + 1]) : join(homedir(), 'dev/archive/botc-soundboard/icons.js');
const read = <T>(file: string): T => JSON.parse(readFileSync(join(WORK, file), 'utf8')) as T;

/** The 1-bit mask as an SVG path: one rectangle per run of set pixels in a row. */
export function maskToPath(n: number, hex: string): string {
  const bit = (k: number) => (parseInt(hex[k >> 2], 16) >> (3 - (k & 3))) & 1;
  let d = '';
  for (let y = 0; y < n; y++) {
    let x = 0;
    while (x < n) {
      if (!bit(y * n + x)) {
        x++;
        continue;
      }
      let end = x;
      while (end < n && bit(y * n + end)) end++;
      d += `M${x} ${y}h${end - x}v1H${x}z`;
      x = end;
    }
  }
  return d;
}

async function main(): Promise<void> {
  if (!existsSync(WORK)) throw new Error(`build-icons: work folder not found: ${WORK}`);
  const masks = new Map(read<Mask[]>('data/icons.json').map((m) => [m.id, m]));
  const sources = new Map(
    read<Source[]>('data/worklist-all.json').map((o) => [o.id, o.source.ref]),
  );
  const names = read<Record<string, Name>>('data/names.json');
  const chosen = read<string[]>('data/chosen.json');

  const sets = new Map<
    string,
    {
      info: SetInfo;
      size: number;
      icons: Record<string, { body: string }>;
      categories: Record<string, string[]>;
    }
  >();
  const catalog: Record<string, { tags: string[]; source: string }> = {};
  for (const id of chosen) {
    const pack = id.slice(0, id.lastIndexOf('-'));
    const info = SETS[pack];
    const mask = masks.get(id);
    const nm = names[id];
    const ref = sources.get(id);
    if (!info || !mask || !nm || !ref) throw new Error(`build-icons: incomplete data for ${id}`);
    const set =
      sets.get(info.prefix) ??
      sets.set(info.prefix, { info, size: mask.n, icons: {}, categories: {} }).get(info.prefix)!;
    if (mask.n !== set.size)
      throw new Error(`build-icons: ${id} is ${mask.n}px, its set is ${set.size}px`);
    if (set.icons[nm.name]) throw new Error(`build-icons: ${info.prefix}:${nm.name} named twice`);
    set.icons[nm.name] = { body: `<path fill="currentColor" d="${maskToPath(mask.n, mask.m)}"/>` };
    (set.categories[nm.category] ??= []).push(nm.name);
    catalog[`${info.prefix}:${nm.name}`] = { tags: nm.tags, source: ref };
  }

  mkdirSync(join(OUT, 'sets'), { recursive: true });
  const sorted = <T>(o: Record<string, T>) =>
    Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
  for (const { info, size, icons, categories } of sets.values()) {
    const json = {
      prefix: info.prefix,
      info: {
        name: info.name,
        total: Object.keys(icons).length,
        version: info.version,
        author: info.author,
        license: info.license,
        height: size,
      },
      width: size,
      height: size,
      icons: sorted(icons),
      categories: sorted(
        Object.fromEntries(Object.entries(categories).map(([c, list]) => [c, list.sort()])),
      ),
    };
    const changed = await writeGenerated(
      join(OUT, 'sets', `${info.prefix}.json`),
      JSON.stringify(json),
    );
    if (info.licenseText)
      writeFileSync(
        join(OUT, 'sets', `${info.prefix}.LICENSE.txt`),
        readFileSync(join(WORK, info.licenseText), 'utf8'),
      );
    console.log(`${info.prefix}: ${json.info.total} icons${changed ? '' : ' (unchanged)'}`);
  }
  await writeGenerated(join(OUT, 'catalog.json'), JSON.stringify(sorted(catalog)));
  console.log(`catalog: ${Object.keys(catalog).length} icons`);

  // V1 ids: Nikoichu's were `px-` + the file name in lower case with hyphens; pixelarticons' were
  // their names, which the chosen "sharp" drawings carry without `-sharp`. An exact name wins.
  const v1Ids = new Set([...readFileSync(V1, 'utf8').matchAll(/\{id:"([^"]+)"/g)].map((m) => m[1]));
  const v1IdOf = (source: string): string | undefined => {
    const file = /^Sprites\/(.+)\.png$/.exec(source)?.[1];
    const svg = /^svg\/(.+)\.svg$/.exec(source)?.[1];
    return file ? `px-${file.toLowerCase().replace(/_/g, '-')}` : svg?.replace(/-sharp$/, '');
  };
  const v1Map: Record<string, string> = {};
  for (const [key, { source }] of Object.entries(catalog)) {
    const id = v1IdOf(source);
    if (!id || !v1Ids.has(id)) continue;
    if (!v1Map[id] || source === `svg/${id}.svg`) v1Map[id] = key;
  }
  // A V1 icon left out only as another drawing of a kept motif (variant groups, 2026-10-04) takes
  // the kept drawing, so a V1 pad keeps its motif.
  const keyOf = new Map(
    chosen.map((id) => [id, `${SETS[id.slice(0, id.lastIndexOf('-'))].prefix}:${names[id].name}`]),
  );
  for (const group of read<{ groups: { kind: string; ids: string[]; keep?: string }[] }>(
    'data/variants.json',
  ).groups) {
    if (group.kind !== 'variant') continue;
    const kept = [group.keep, ...group.ids].find((id): id is string => !!id && keyOf.has(id));
    if (!kept) continue;
    for (const id of group.ids) {
      const v1 = v1IdOf(sources.get(id) ?? '');
      if (v1 && v1Ids.has(v1) && !v1Map[v1]) v1Map[v1] = keyOf.get(kept)!;
    }
  }
  await writeGenerated(join(OUT, 'v1-map.json'), JSON.stringify(sorted(v1Map)));
  console.log(
    `v1-map: ${Object.keys(v1Map).length} of ${v1Ids.size} V1 icons are in the collection`,
  );
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

/**
 * @fileoverview ownIcons — the user's own SVG pad icons in the library's ICONS tab (Slice 16e,
 * docs/product/features/library.md#l7-own-icons-svg, ADR-0092)
 *
 * A pad names an own icon by the key `own:<id>`, the id being the SHA-256 of the file, so the same
 * file added twice is one icon. The list holds no bytes; an icon's SVG is read when it is first
 * drawn and shown only through `<img>` with an object URL (L7: an image runs no script). Every
 * write counts as a running save.
 */

import { signal } from '@preact/signals';
import { iconDelete, iconGet, iconGetAllMeta, iconPut } from '../db/idb';
import { computeHash } from '../lib/upload';
import { svgIconName, svgProblem } from '../lib/svgCheck';
import type { OwnIcon, OwnIconMeta } from '../types';
import { pendingSaves } from './store';

/** The key prefix of own icons — reserved: no pack of the collection uses it (ADR-0092). */
export const OWN_ICON_PREFIX = 'own';

/** The own icons, by name. */
export const ownIcons = signal<OwnIconMeta[]>([]);

const byName = (a: OwnIconMeta, b: OwnIconMeta) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.id.localeCompare(b.id);

function show(list: OwnIconMeta[]): void {
  ownIcons.value = [...list].sort(byName);
}

async function counted<T>(write: () => Promise<T>): Promise<T> {
  pendingSaves.value++; // synchronously, before the first await
  try {
    return await write();
  } finally {
    pendingSaves.value--;
  }
}

/** The key a pad stores for an own icon. */
export function ownIconKey(id: string): string {
  return `${OWN_ICON_PREFIX}:${id}`;
}

/** The own icon's id of a key, or null when the key names an icon of the collection. */
export function ownIconId(key: string): string | null {
  const prefix = `${OWN_ICON_PREFIX}:`;
  return key.startsWith(prefix) ? key.slice(prefix.length) : null;
}

/** Loads the list of own icons — at app start, before the first render (src/state/boot.ts). */
export async function loadOwnIcons(): Promise<void> {
  show(await iconGetAllMeta());
}

/** What adding files did: icons added, files already there, and why each refused file was refused. */
export type AddIconsResult = { added: number; present: number; refused: string[] };

/** Says what adding files did, in one line: "Added 2 icons · 1 already there. owl.png: only …". */
export function addIconsText({ added, present, refused }: AddIconsResult): string {
  const parts = [
    added === 1 ? 'Added 1 icon' : `Added ${added} icons`,
    ...(present > 0 ? [present === 1 ? '1 already there' : `${present} already there`] : []),
  ];
  return [`${parts.join(' · ')}.`, ...refused].join(' ');
}

/** How one SVG went: added or already there under its id, or refused with the reason. */
export type IconOutcome =
  { kind: 'added' | 'present'; id: string } | { kind: 'refused'; reason: string };

/**
 * Checks one SVG (src/lib/svgCheck.ts) and stores it under the SHA-256 of its bytes; the caller
 * counts the save. `file` is what the bytes came as: its name, type and size.
 */
async function addOne(
  bytes: ArrayBuffer,
  file: { name: string; type: string; size: number },
  addedAt: number,
): Promise<IconOutcome> {
  const svg = new TextDecoder().decode(bytes);
  const reason = svgProblem(file, svg);
  if (reason) return { kind: 'refused', reason };
  const id = computeHash(bytes);
  if (ownIcons.value.some((i) => i.id === id)) return { kind: 'present', id };
  const meta: OwnIconMeta = { id, name: svgIconName(file.name), size: file.size, addedAt };
  await iconPut({ ...meta, svg });
  show([...ownIcons.value, meta]);
  return { kind: 'added', id };
}

/** Sums outcomes for the tab's message. */
function tally(outcomes: readonly IconOutcome[]): AddIconsResult {
  return {
    added: outcomes.filter((o) => o.kind === 'added').length,
    present: outcomes.filter((o) => o.kind === 'present').length,
    refused: outcomes.flatMap((o) => (o.kind === 'refused' ? [o.reason] : [])),
  };
}

/**
 * Adds SVG files as own icons, one at a time; `now` is the date added. A file that fails a check
 * (src/lib/svgCheck.ts) is refused with its reason; the same file again is counted as present.
 * The whole call counts as one running save from its start, so a reload waits for it.
 */
export function addOwnIconFiles(files: readonly File[], now = Date.now()): Promise<AddIconsResult> {
  return counted(async () => {
    const outcomes: IconOutcome[] = [];
    for (const file of files) outcomes.push(await addOne(await file.arrayBuffer(), file, now));
    return tally(outcomes);
  });
}

/** An own icon a backup brings: the file name it came with, the SVG's text and when it was added. */
export type IncomingIcon = { fileName: string; svg: string; addedAt: number };

/**
 * Adds the own icons of a backup, one at a time, through the same checks as an upload — a backup
 * file is not trusted; the id is computed from the text, never taken from the file. Resolves with
 * one outcome per icon, in order, so the caller can map the file's ids to the stored ones.
 */
export function importOwnIcons(icons: readonly IncomingIcon[]): Promise<IconOutcome[]> {
  return counted(async () => {
    const outcomes: IconOutcome[] = [];
    for (const { fileName, svg, addedAt } of icons) {
      const bytes = new TextEncoder().encode(svg);
      const file = { name: fileName, type: 'image/svg+xml', size: bytes.byteLength };
      outcomes.push(await addOne(bytes.slice().buffer, file, addedAt));
    }
    return outcomes;
  });
}

/** Object URL per icon id: one URL for every place that draws it. */
const urls = new Map<string, Promise<string | null>>();

/**
 * The URL to draw an own icon with, as the `src` of an `<img>` — read once, then kept; null when
 * the icon is not there (deleted, or a pad from another device).
 */
export function ownIconUrl(id: string): Promise<string | null> {
  let url = urls.get(id);
  if (!url) {
    url = iconGet(id).then((icon) =>
      icon ? URL.createObjectURL(new Blob([icon.svg], { type: 'image/svg+xml' })) : null,
    );
    urls.set(id, url);
  }
  return url;
}

function forgetUrl(id: string): void {
  const url = urls.get(id);
  urls.delete(id);
  void url?.then((u) => u && URL.revokeObjectURL(u));
}

/**
 * Deletes an own icon; resolves with it, SVG included, for an UNDO (`restoreOwnIcon`), or null when
 * unknown. Pads that name it draw their other icons, or their placeholder. Counts as a running
 * save from the call — reading the icon first must not leave a gap a reload could fall into.
 */
export function deleteOwnIcon(id: string): Promise<OwnIcon | null> {
  return counted(async () => {
    const icon = await iconGet(id);
    if (!icon) return null;
    await iconDelete(id);
    forgetUrl(id);
    show(ownIcons.value.filter((i) => i.id !== id));
    return icon;
  });
}

/** Puts a deleted own icon back — the UNDO of `deleteOwnIcon`. */
export async function restoreOwnIcon(icon: OwnIcon): Promise<void> {
  await counted(() => iconPut(icon));
  forgetUrl(icon.id); // a URL read while it was gone holds null
  const { svg: _svg, ...meta } = icon;
  show([...ownIcons.value.filter((i) => i.id !== icon.id), meta]);
}

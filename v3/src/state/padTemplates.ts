/**
 * @fileoverview padTemplates — pads saved as templates, in the library's PADS tab (Slice 16d,
 * docs/product/features/library.md L6, ADR-0090)
 *
 * SAVE AS TEMPLATE in the PAD editor keeps a copy of a Single or Loop pad's settings and file
 * references (V1 `savePadTemplate`); ADD TO BOARD puts a new copy into a board's pool and, when a
 * deck is chosen, on its next free cell (V1 `importPadTemplate`). A template holds no audio — the
 * files it names must still be in the library (L6 A). A combo is no template: its steps name pads of
 * its own board. Templates live in their own IndexedDB store; every write counts as a running save.
 */

import { signal } from '@preact/signals';
import { templateDelete, templateGetAll, templatePut } from '../db/idb';
import type { LoopPad, PadTemplate, SinglePad } from '../types';
import { addPadToFreeCell, addPadToPool } from '../lib/boardModel';
import { nanoid } from '../lib/nanoid';
import { updateBoard } from './boardWrites';
import { libraryItems, pendingSaves } from './store';

/** The saved templates, by name. */
export const padTemplates = signal<PadTemplate[]>([]);

const byName = (a: PadTemplate, b: PadTemplate) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.id.localeCompare(b.id);

function show(list: PadTemplate[]): void {
  padTemplates.value = [...list].sort(byName);
}

async function counted<T>(write: () => Promise<T>): Promise<T> {
  pendingSaves.value++; // synchronously, before the first await
  try {
    return await write();
  } finally {
    pendingSaves.value--;
  }
}

/** Loads the templates — at app start, before the first render (src/state/boot.ts). */
export async function loadTemplates(): Promise<void> {
  show(await templateGetAll());
}

/**
 * Saves a copy of `pad` as a new template under its name, `now` as the date. The copy has no
 * dates of the pad — a pad added from it is new.
 */
export async function saveTemplate(
  pad: SinglePad | LoopPad,
  now = Date.now(),
): Promise<PadTemplate> {
  const { addedAt: _a, modifiedAt: _m, ...settings } = pad;
  const template: PadTemplate = {
    id: nanoid(),
    name: pad.name,
    savedAt: now,
    pad: structuredClone(settings),
  };
  await counted(() => templatePut(template));
  show([...padTemplates.value, template]);
  return template;
}

/** Renames a template; an empty name keeps the old one. */
export async function renameTemplate(id: string, name: string): Promise<void> {
  const template = padTemplates.value.find((t) => t.id === id);
  const trimmed = name.trim();
  if (!template || !trimmed || trimmed === template.name) return;
  const renamed = { ...template, name: trimmed };
  await counted(() => templatePut(renamed));
  show(padTemplates.value.map((t) => (t.id === id ? renamed : t)));
}

/** Deletes a template; resolves with it, for an UNDO (`restoreTemplate`), or null when unknown. */
export async function deleteTemplate(id: string): Promise<PadTemplate | null> {
  const template = padTemplates.value.find((t) => t.id === id) ?? null;
  if (!template) return null;
  await counted(() => templateDelete(id));
  show(padTemplates.value.filter((t) => t.id !== id));
  return template;
}

/** Puts a deleted template back — the UNDO of `deleteTemplate`. */
export async function restoreTemplate(template: PadTemplate): Promise<void> {
  await counted(() => templatePut(template));
  show([...padTemplates.value.filter((t) => t.id !== template.id), template]);
}

/** The template's files that are no longer in the library — a pad from it stays silent for them. */
export function missingFiles(template: PadTemplate): number {
  const present = new Set(libraryItems.value.map((m) => m.id));
  return template.pad.files.filter((f) => !present.has(f.hash)).length;
}

/**
 * Adds a new pad from the template to a board: into its pool, and on the next free cell of
 * `deckId` when one is given (a full deck grows a row). The board's undo can take it back.
 * Resolves with the new pad's id, or null when the board is unknown or could not be saved.
 */
export async function addTemplateToBoard(
  templateId: string,
  boardId: string,
  deckId: string | null,
  now = Date.now(),
): Promise<string | null> {
  const template = padTemplates.value.find((t) => t.id === templateId);
  if (!template) return null;
  const pad = { ...structuredClone(template.pad), id: nanoid(), addedAt: now };
  const saved = await updateBoard(boardId, `add pad '${pad.name}' from a template`, (board) =>
    deckId === null ? addPadToPool(board, pad) : addPadToFreeCell(board, deckId, pad),
  );
  return saved ? pad.id : null;
}

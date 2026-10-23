/**
 * @fileoverview padTemplates — pads saved as templates (Slice 16d, library.md L6, ADR-0090)
 *
 * IDB is fake-indexeddb (fresh per test). Cases: save keeps settings and files, not the dates;
 * the list by name over a reload; rename (empty keeps the name); delete and its UNDO; files gone
 * from the library counted; ADD TO BOARD into a deck's next free cell or the pool only, with a new
 * id, undoable through the board; an unknown template or board adds nothing; saves counted.
 */

import { IDBFactory } from 'fake-indexeddb';
import type { Board, Deck, LoopPad, SinglePad } from '../../src/types';
import { _resetDB, templateGetAll } from '../../src/db/idb';
import { boards, libraryItems, pendingSaves } from '../../src/state/store';
import { stepBoard } from '../../src/state/boardWrites';
import {
  addTemplateToBoard,
  deleteTemplate,
  loadTemplates,
  missingFiles,
  padTemplates,
  renameTemplate,
  restoreTemplate,
  saveTemplate,
} from '../../src/state/padTemplates';
import { newPad } from '../../src/lib/padUtils';

const owl = (): SinglePad => {
  const p = newPad('p1', 'single', 'Owl', ['h1', 'h2']);
  if (p.type !== 'single') throw new Error('a Single');
  return { ...p, volume: 40, fadeIn: 1.5, icons: ['set:owl'], addedAt: 5, modifiedAt: 9 };
};
const rain = (): LoopPad => {
  const p = newPad('p2', 'loop', 'Rain', ['h1']);
  if (p.type !== 'loop') throw new Error('a Loop');
  return { ...p, repeat: 3 };
};

const deck: Deck = {
  id: 'd1',
  name: 'Deck 1',
  order: 0,
  gridConfig: { cols: 2, rows: 1, gap: 8 },
  placements: [],
};
const board = (): Board => ({
  id: 'b1',
  name: 'Night',
  themeId: 'hearth',
  pads: [],
  decks: [deck],
  padSize: 88,
  quickAccess: [],
});

beforeEach(() => {
  (globalThis as Record<string, unknown>).indexedDB = new IDBFactory();
  _resetDB();
  padTemplates.value = [];
  libraryItems.value = [];
  boards.value = [board()];
  pendingSaves.value = 0;
});

describe('saveTemplate / loadTemplates', () => {
  test('keeps the settings and files, not the dates; listed by name, also after a reload', async () => {
    await saveTemplate(rain(), 100);
    const t = await saveTemplate(owl(), 200);
    expect(t).toMatchObject({ name: 'Owl', savedAt: 200 });
    expect(t.pad).toMatchObject({ type: 'single', volume: 40, fadeIn: 1.5, icons: ['set:owl'] });
    expect(t.pad.files.map((f) => f.hash)).toEqual(['h1', 'h2']);
    expect(t.pad).not.toHaveProperty('addedAt');
    expect(t.pad).not.toHaveProperty('modifiedAt');

    padTemplates.value = [];
    await loadTemplates();
    expect(padTemplates.value.map((x) => x.name)).toEqual(['Owl', 'Rain']);
  });

  test('a template is a copy: a later change of the pad does not reach it', async () => {
    const pad = owl();
    const t = await saveTemplate(pad);
    pad.files.push({ hash: 'h3' });
    expect(t.pad.files).toHaveLength(2);
  });

  test('counts as a running save while it writes', async () => {
    const running = saveTemplate(owl());
    expect(pendingSaves.value).toBe(1);
    await running;
    expect(pendingSaves.value).toBe(0);
  });
});

describe('renameTemplate / deleteTemplate / restoreTemplate', () => {
  test('a rename is stored and re-sorts; an empty or same name keeps it', async () => {
    const t = await saveTemplate(owl());
    await saveTemplate(rain());
    await renameTemplate(t.id, '  Wolf ');
    expect(padTemplates.value.map((x) => x.name)).toEqual(['Rain', 'Wolf']);
    await renameTemplate(t.id, '   ');
    expect((await templateGetAll()).find((x) => x.id === t.id)?.name).toBe('Wolf');
  });

  test('a delete resolves with the template, and its UNDO puts it back', async () => {
    const t = await saveTemplate(owl());
    const deleted = await deleteTemplate(t.id);
    expect(deleted?.id).toBe(t.id);
    expect(await templateGetAll()).toEqual([]);
    await restoreTemplate(deleted!);
    expect((await templateGetAll()).map((x) => x.id)).toEqual([t.id]);
    expect(await deleteTemplate('nope')).toBeNull();
  });
});

describe('missingFiles / addTemplateToBoard', () => {
  test('counts the files no longer in the library', async () => {
    const t = await saveTemplate(owl());
    expect(missingFiles(t)).toBe(2);
    libraryItems.value = [
      { id: 'h1', type: 'audio', name: 'a', size: 1, tags: [], addedAt: 1, duration: 1, peaks: [] },
    ];
    expect(missingFiles(t)).toBe(1);
  });

  test('adds a new pad on the next free cell of a deck; the board can undo it', async () => {
    const t = await saveTemplate(owl());
    const id = await addTemplateToBoard(t.id, 'b1', 'd1', 777);
    expect(id).not.toBe('p1');
    const b = boards.value[0];
    expect(b.pads).toEqual([
      expect.objectContaining({ id, name: 'Owl', addedAt: 777, volume: 40 }),
    ]);
    expect(b.decks[0].placements).toEqual([
      expect.objectContaining({ padId: id, position: { col: 0, row: 0 } }),
    ]);
    // Twice: two pads, each with its own id and cell
    const second = await addTemplateToBoard(t.id, 'b1', 'd1');
    expect(second).not.toBe(id);
    expect(boards.value[0].decks[0].placements.map((p) => p.position.col)).toEqual([0, 1]);
    stepBoard('b1', 'undo');
    expect(boards.value[0].pads.map((p) => p.id)).toEqual([id]);
  });

  test('without a deck the pad goes into the pool only; unknown template or board adds nothing', async () => {
    const t = await saveTemplate(rain());
    const id = await addTemplateToBoard(t.id, 'b1', null);
    expect(boards.value[0].pads.map((p) => p.id)).toEqual([id]);
    expect(boards.value[0].decks[0].placements).toEqual([]);
    expect(await addTemplateToBoard('nope', 'b1', null)).toBeNull();
    expect(await addTemplateToBoard(t.id, 'no-board', null)).toBeNull();
  });
});

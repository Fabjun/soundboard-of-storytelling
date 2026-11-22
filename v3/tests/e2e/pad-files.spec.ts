/**
 * @fileoverview Full E2E — several files per pad, each with its own trim (Slice 15b, ADR-0068)
 *
 * The PAD editor's file list: the library picker adds several ticked files at once, ▲ / ▼ move a
 * file, ✕ removes it on a tap (the editor's undo takes it back), "in order" / "shuffled" set how several files play, and
 * each file keeps its own trim. Everything is checked again after the board is reopened (stored,
 * not only shown). Library entries are seeded (metadata only) — no playback needed, so it runs in
 * Chromium and WebKit.
 */

import { test, expect, type Page } from '@playwright/test';
import {
  addNamedPad,
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  goToBoardList,
  padCells,
  reopenFirstBoard,
  seedTestAudio,
  type SeedAudio,
} from './helpers';

const id = (n: number) => `e2e${String(n).padStart(61, '0')}`;
const FILES: SeedAudio[] = [
  { id: id(11), name: 'alpha.wav', duration: 2 },
  { id: id(12), name: 'bravo.wav', duration: 3 },
  { id: id(13), name: 'charlie.wav', duration: 4 },
];

const editor = (page: Page) => page.getByRole('dialog', { name: 'Pad editor', exact: true });
const button = (page: Page, name: string) =>
  editor(page).getByRole('button', { name, exact: true });
const fileList = (page: Page) =>
  editor(page).getByRole('list', { name: 'Audio files', exact: true });
/** A file of the library picker — its row adds "(in this pad)" once the pad has it. */
const pick = (page: Page, f: SeedAudio) =>
  editor(page).getByRole('checkbox', { name: new RegExp(`^${f.name.replace('.', '\\.')}`) });
const addButton = (page: Page) => editor(page).getByRole('button', { name: /^ADD \d+ FILES?$/ });

/** The names in the file list, top to bottom — the select button is a row's only text. */
const listed = (page: Page) => fileList(page).getByRole('listitem').allTextContents();

/** BROWSE → tick the files → ADD. */
async function addFiles(page: Page, files: SeedAudio[]) {
  await button(page, 'BROWSE').click();
  for (const f of files) await pick(page, f).check();
  await addButton(page).click();
}

/** Closes the editor (its last change is written at once) and opens the pad again from a reopened board. */
async function reopenPad(page: Page) {
  await button(page, 'Close the pad editor').click();
  await reopenFirstBoard(page);
  await enterSetupMode(page);
  await padCells(page).first().click();
  await editor(page).waitFor();
}

test.beforeEach(async ({ page }) => {
  for (const f of FILES) await seedTestAudio(page, f);
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await addNamedPad(page, 'Files');
});

test('the picker adds several ticked files at once; files already in the pad are marked', async ({
  page,
}) => {
  await button(page, 'BROWSE').click();
  const add = addButton(page);
  await expect(add).toBeDisabled();
  for (const f of FILES) await pick(page, f).check();
  await expect(add).toHaveText('ADD 3 FILES');
  await add.click();
  expect(await listed(page)).toEqual(['alpha.wav', 'bravo.wav', 'charlie.wav']);

  await button(page, 'BROWSE').click();
  const alpha = pick(page, FILES[0]);
  await expect(alpha).toBeChecked();
  await expect(alpha).toBeDisabled();
});

test('files move with ▲ / ▼, are removed on a tap that undo takes back, and the order mode is kept', async ({
  page,
}) => {
  await addFiles(page, FILES);
  await button(page, 'Move alpha.wav down').click();
  expect(await listed(page)).toEqual(['bravo.wav', 'alpha.wav', 'charlie.wav']);
  await button(page, 'Move charlie.wav up').click();
  expect(await listed(page)).toEqual(['bravo.wav', 'charlie.wav', 'alpha.wav']);
  await expect(button(page, 'Move bravo.wav up')).toBeDisabled(); // the first file

  const remove = button(page, 'Remove charlie.wav');
  await remove.click();
  expect(await listed(page)).toEqual(['bravo.wav', 'alpha.wav']);
  await button(page, 'Undo').click();
  expect(await listed(page)).toEqual(['bravo.wav', 'charlie.wav', 'alpha.wav']);
  await remove.click();
  expect(await listed(page)).toEqual(['bravo.wav', 'alpha.wav']);

  const order = (p: Page) =>
    editor(p)
      .getByRole('group', { name: 'How several files play', exact: true })
      .getByRole('button', { name: 'SHUFFLED', exact: true });
  await order(page).click();
  await reopenPad(page);
  expect(await listed(page)).toEqual(['bravo.wav', 'alpha.wav']);
  await expect(order(page)).toHaveAttribute('aria-pressed', 'true');
});

test('each file keeps its own trim', async ({ page }) => {
  await addFiles(page, FILES.slice(0, 2));
  const start = editor(page).getByRole('spinbutton', { name: 'Start (s)', exact: true });
  const end = editor(page).getByRole('spinbutton', { name: 'End (s)', exact: true });
  const file = (name: string) => fileList(page).getByRole('button', { name, exact: true });

  await file('alpha.wav').click();
  await end.fill('1.5');
  await end.press('Enter');
  await file('bravo.wav').click();
  await expect(end).toHaveValue('3'); // bravo is 3 s long and untrimmed
  await start.fill('1');
  await start.press('Enter');

  await reopenPad(page);
  await file('alpha.wav').click();
  await expect(start).toHaveValue('0');
  await expect(end).toHaveValue('1.5');
  await file('bravo.wav').click();
  await expect(start).toHaveValue('1');
  await expect(end).toHaveValue('3');
});

test('a Loop keeps its repeat count; ∞ sets it back to until stopped (ADR-0069)', async ({
  page,
}) => {
  await page
    .getByRole('group', { name: 'TYPE', exact: true })
    .getByRole('button', { name: 'LOOP', exact: true })
    .click();
  const repeat = page.getByRole('group', { name: 'REPEAT', exact: true });
  const count = repeat.getByRole('spinbutton', { name: 'Repeat count', exact: true });
  const forever = repeat.getByRole('button', { name: 'Repeat until stopped', exact: true });
  await expect(forever).toHaveAttribute('aria-pressed', 'true'); // a new Loop runs until stopped

  await count.fill('5000');
  await count.press('Enter');
  await expect(count).toHaveValue('999'); // the highest count
  await count.fill('3');
  await count.press('Enter');
  await expect(forever).toHaveAttribute('aria-pressed', 'false');

  await reopenPad(page);
  await expect(count).toHaveValue('3');
  await forever.click();
  await reopenPad(page);
  await expect(count).toHaveValue('');
  await expect(forever).toHaveAttribute('aria-pressed', 'true');
});

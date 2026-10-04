/**
 * @fileoverview Full E2E — several files per pad, each with its own trim (Slice 15b, ADR-0068)
 *
 * The PAD editor's file list: the library picker adds several ticked files at once, ▲ / ▼ move a
 * file, ✕ removes it on a second tap, "in order" / "shuffled" set how several files play, and
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

/** The names in the file list, top to bottom. */
const listed = (page: Page) =>
  page.locator('[data-testid^="pad-file-list-select-button-"]').allTextContents();

/** BROWSE → tick the files → ADD. */
async function addFiles(page: Page, files: SeedAudio[]) {
  await page.getByTestId('pad-editor-panel-browse-button').click();
  for (const f of files) await page.getByTestId(`pad-editor-panel-pick-input-${f.id}`).check();
  await page.getByTestId('pad-editor-panel-add-files-button').click();
}

/** Closes the editor (its last change is written at once) and opens the pad again from a reopened board. */
async function reopenPad(page: Page) {
  await page.getByTestId('pad-editor-panel-close-button').click();
  await reopenFirstBoard(page);
  await enterSetupMode(page);
  await padCells(page).first().click();
  await page.getByTestId('pad-editor-panel').waitFor();
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
  await page.getByTestId('pad-editor-panel-browse-button').click();
  const add = page.getByTestId('pad-editor-panel-add-files-button');
  await expect(add).toBeDisabled();
  for (const f of FILES) await page.getByTestId(`pad-editor-panel-pick-input-${f.id}`).check();
  await expect(add).toHaveText('ADD 3 FILES');
  await add.click();
  expect(await listed(page)).toEqual(['alpha.wav', 'bravo.wav', 'charlie.wav']);

  await page.getByTestId('pad-editor-panel-browse-button').click();
  const alpha = page.getByTestId(`pad-editor-panel-pick-input-${FILES[0].id}`);
  await expect(alpha).toBeChecked();
  await expect(alpha).toBeDisabled();
});

test('files move with ▲ / ▼, are removed on a second tap, and the order mode is kept', async ({
  page,
}) => {
  await addFiles(page, FILES);
  await page.getByTestId('pad-file-list-down-button-0').click();
  expect(await listed(page)).toEqual(['bravo.wav', 'alpha.wav', 'charlie.wav']);
  await page.getByTestId('pad-file-list-up-button-2').click();
  expect(await listed(page)).toEqual(['bravo.wav', 'charlie.wav', 'alpha.wav']);
  await expect(page.getByTestId('pad-file-list-up-button-0')).toBeDisabled();

  const remove = page.getByTestId('pad-file-list-remove-button-1');
  await remove.click();
  await expect(remove).toHaveText('CONFIRM'); // the first tap only asks
  expect(await listed(page)).toHaveLength(3);
  await remove.click();
  expect(await listed(page)).toEqual(['bravo.wav', 'alpha.wav']);

  await page.getByTestId('pad-file-list-order-button-shuffle').click();
  await reopenPad(page);
  expect(await listed(page)).toEqual(['bravo.wav', 'alpha.wav']);
  await expect(page.getByTestId('pad-file-list-order-button-shuffle')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('each file keeps its own trim', async ({ page }) => {
  await addFiles(page, FILES.slice(0, 2));
  const start = page.getByTestId('pad-editor-panel-trim-start-input');
  const end = page.getByTestId('pad-editor-panel-trim-end-input');

  await page.getByTestId('pad-file-list-select-button-0').click();
  await end.fill('1.5');
  await end.press('Enter');
  await page.getByTestId('pad-file-list-select-button-1').click();
  await expect(end).toHaveValue('3'); // bravo is 3 s long and untrimmed
  await start.fill('1');
  await start.press('Enter');

  await reopenPad(page);
  await page.getByTestId('pad-file-list-select-button-0').click();
  await expect(start).toHaveValue('0');
  await expect(end).toHaveValue('1.5');
  await page.getByTestId('pad-file-list-select-button-1').click();
  await expect(start).toHaveValue('1');
  await expect(end).toHaveValue('3');
});

test('a Loop keeps its repeat count; ∞ sets it back to until stopped (ADR-0069)', async ({
  page,
}) => {
  await page.getByTestId('pad-editor-panel-type-button-loop').click();
  const count = page.getByTestId('pad-editor-panel-repeat-input');
  const forever = page.getByTestId('pad-editor-panel-repeat-forever-button');
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

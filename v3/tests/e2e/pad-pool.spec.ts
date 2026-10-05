/**
 * @fileoverview Full E2E — pad pool views and actions (Slice 9e,
 * docs/architecture/0048-pad-pool-decks.md#2-behavior-final-not-provisional)
 *
 * - Remove from deck keeps the pad: All pads still shows it
 * - Delete pad shows "used in N decks" and removes it from every deck and All pads
 * - The PAD editor's deck checklist places the pad in another deck and takes it out again
 * - A rename and a deck checkbox in quick succession both survive a reload
 * - All pads creates pads that sit in no deck: ADD PAD and a library drop (owner decision
 *   2026-10-02)
 * - A board opens in the view it showed last (owner decision 2026-10-02)
 *
 * No audio needed: pads come from ADD PAD (runs in Chromium and WebKit).
 */

import { test, expect, type Page } from '@playwright/test';
import {
  TEST_AUDIO_NAME,
  createBoardAndNavigate,
  enterSetupMode,
  ensureTestAudio,
  goToBoardList,
  pointerDrag,
  reopenFirstBoard,
  addNamedPad,
  closePadEditor,
  padCells,
} from './helpers';

const tabs = (page: Page) => page.locator('[data-testid^="deck-rail-deck-tab-"]');

/** Two decks; returns their ids in rail order. */
async function twoDecks(page: Page): Promise<[string, string]> {
  await page.getByTestId('deck-rail-new-button').click();
  await page.getByTestId('deck-rail-new-button').click();
  await expect(tabs(page)).toHaveCount(2);
  const ids = await tabs(page).evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-testid')!.replace('deck-rail-deck-tab-', '')),
  );
  return [ids[0], ids[1]];
}

/** ADD PAD in the open deck (shared helper), returning the pad's cell test id. */
const addPadCell = async (page: Page, name: string) =>
  `pad-grid-cell-${await addNamedPad(page, name)}`;

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await enterSetupMode(page);
});

test('remove from deck keeps the pad in All pads', async ({ page }) => {
  await twoDecks(page);
  await tabs(page).first().click();
  const cell = await addPadCell(page, 'Thunder');

  // Two taps: the first only arms the button
  const remove = page.getByTestId('pad-editor-panel-remove-button');
  await remove.click();
  await expect(remove).toHaveText('CONFIRM REMOVE');
  await expect(page.getByTestId(cell)).toBeVisible();
  await remove.click();
  await expect(page.getByTestId(cell)).toHaveCount(0);

  // All pads: the whole pool, including pads in no deck
  await page.getByTestId('deck-rail-all-pads-tab').click();
  await expect(page.getByTestId('deck-rail-all-pads-tab')).toContainText('1');
  await expect(page.getByTestId(cell)).toContainText('Thunder');
  await expect(page.locator('[data-testid^="pad-grid-cell-empty-slot-"]')).toHaveCount(0);

  // Opened from All pads: no deck → no key and no "remove from deck"
  await page.getByTestId(cell).click();
  await expect(page.getByTestId('pad-editor-panel')).toBeVisible();
  await expect(page.getByTestId('pad-editor-panel-remove-button')).toHaveCount(0);
});

test('delete pad shows its decks and removes it everywhere', async ({ page }) => {
  await page.getByTestId('deck-rail-new-button').click();
  await tabs(page).first().waitFor();
  const cell = await addPadCell(page, 'Thunder');

  // Duplicate the deck: the copy places the same pad (ADR-0048)
  await closePadEditor(page);
  await tabs(page).first().hover();
  await tabs(page).first().locator('[data-testid^="deck-rail-copy-button-"]').click();
  await expect(tabs(page)).toHaveCount(2);

  await page.getByTestId(cell).click();
  const del = page.getByTestId('pad-editor-panel-delete-button');
  await del.click();
  await expect(page.getByTestId('pad-editor-panel-delete-text')).toContainText('Used in 2 decks');
  await del.click();

  await expect(page.getByTestId(cell)).toHaveCount(0);
  await tabs(page).nth(1).click();
  await expect(page.getByTestId(cell)).toHaveCount(0);
  await page.getByTestId('deck-rail-all-pads-tab').click();
  await expect(page.getByTestId(cell)).toHaveCount(0);
});

test('the deck checklist places the pad in another deck and takes it out', async ({ page }) => {
  const [deck1, deck2] = await twoDecks(page);
  await tabs(page).first().click();
  const cell = await addPadCell(page, 'Thunder');

  const box1 = page.getByTestId(`pad-editor-panel-deck-input-${deck1}`);
  const box2 = page.getByTestId(`pad-editor-panel-deck-input-${deck2}`);
  await expect(box1).toBeChecked();
  await expect(box2).not.toBeChecked();
  await box2.check();
  await expect(box2).toBeChecked();

  // The second deck shows it on its first free cell
  await closePadEditor(page);
  await tabs(page).nth(1).click();
  await expect(page.getByTestId(cell)).toHaveAttribute('data-pos', '0,0');

  // Uncheck from All pads → gone from the second deck, still in the pool
  await page.getByTestId('deck-rail-all-pads-tab').click();
  await page.getByTestId(cell).click();
  await page.getByTestId(`pad-editor-panel-deck-input-${deck2}`).uncheck();
  await closePadEditor(page);
  await tabs(page).nth(1).click();
  await expect(page.getByTestId(cell)).toHaveCount(0);
  await tabs(page).first().click();
  await expect(page.getByTestId(cell)).toBeVisible();
});

test('a rename and a deck checkbox right after it both survive a reload', async ({ page }) => {
  const [, deck2] = await twoDecks(page);
  await tabs(page).first().click();
  const cell = await addPadCell(page, 'Thunder');

  // Rename (saved after a 500 ms debounce) and check the second deck before that save runs
  await page.getByTestId('pad-editor-panel-name-input').fill('Rain');
  await page.getByTestId(`pad-editor-panel-deck-input-${deck2}`).check();
  // reopenFirstBoard waits for the debounced rename save too (src/lib/debouncedSave.ts)

  await reopenFirstBoard(page);
  await tabs(page).nth(1).click();
  await expect(page.getByTestId(cell)).toContainText('Rain');
});

const emptySlots = (page: Page) => page.locator('[data-testid^="pad-grid-cell-empty-slot-"]');

test('ADD PAD in All pads creates a pad that sits in no deck', async ({ page }) => {
  const [deck1] = await twoDecks(page);
  await page.getByTestId('deck-rail-all-pads-tab').click();
  await page.getByText('ADD PAD', { exact: true }).click();
  await page.getByTestId('pad-editor-panel-name-input').fill('Wind');
  const cell = padCells(page).first();
  await expect(cell).toContainText('Wind');
  await expect(page.getByTestId(`pad-editor-panel-deck-input-${deck1}`)).not.toBeChecked();
  await closePadEditor(page);
  await tabs(page).first().click();
  await expect(padCells(page)).toHaveCount(0); // the deck holds no pad
});

test('a library file dropped on All pads becomes a pad in no deck', async ({ page }) => {
  await ensureTestAudio(page);
  await reopenFirstBoard(page);
  await enterSetupMode(page);
  await page.getByTestId('deck-rail-all-pads-tab').click();
  await page.getByTitle('Open library panel').click();
  const row = page
    .locator('[data-testid^="library-panel-row-"]')
    .filter({ hasText: TEST_AUDIO_NAME })
    .first();
  await row.waitFor();
  await pointerDrag(page, row, page.getByText('No pads yet', { exact: false }));
  await expect(padCells(page)).toHaveCount(1);
  await expect(padCells(page).first()).toContainText(TEST_AUDIO_NAME);
  await expect(page.getByTestId('deck-rail-all-pads-tab')).toContainText('1');
});

test('a board opens in the view it showed last', async ({ page }) => {
  await twoDecks(page);
  // A pad only in the second deck: visible there and in All pads, not in the first deck
  await tabs(page).nth(1).click();
  await addPadCell(page, 'Rain');

  await reopenFirstBoard(page);
  await expect(padCells(page)).toContainText(['Rain']); // second deck again, not the first
  await expect(emptySlots(page)).toHaveCount(15);

  await page.getByTestId('deck-rail-all-pads-tab').click();
  await reopenFirstBoard(page);
  await expect(padCells(page)).toContainText(['Rain']);
  await expect(emptySlots(page)).toHaveCount(0); // All pads has no empty cells
});

test('All pads sorts by name, by date added and reversed; the choice stays with the board', async ({
  page,
}) => {
  await page.getByTestId('deck-rail-new-button').click();
  await tabs(page).first().waitFor();
  for (const name of ['Bravo', 'Alpha', 'Charlie']) await addPadCell(page, name);
  await closePadEditor(page);
  await page.getByTestId('deck-rail-all-pads-tab').click();

  const order = async () =>
    (await padCells(page).allTextContents()).map(
      (t) => ['Alpha', 'Bravo', 'Charlie'].find((n) => t.includes(n)) ?? t,
    );
  expect(await order()).toEqual(['Alpha', 'Bravo', 'Charlie']); // Name A→Z by default

  await page.getByTestId('board-screen-sort-input').selectOption({ label: 'Date added' });
  await expect.poll(order).toEqual(['Charlie', 'Alpha', 'Bravo']); // newest first

  await page.getByTestId('board-screen-reverse-button').click();
  await expect.poll(order).toEqual(['Bravo', 'Alpha', 'Charlie']); // oldest first

  await reopenFirstBoard(page); // the board opens in All pads again, with the same sort
  await expect.poll(order).toEqual(['Bravo', 'Alpha', 'Charlie']);
  await expect(page.getByTestId('board-screen-sort-input')).toHaveValue('added');
});

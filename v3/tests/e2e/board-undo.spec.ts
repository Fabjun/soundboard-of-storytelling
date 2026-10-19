/**
 * @fileoverview Full E2E — undo and redo of board changes (Slice 18a, ADR-0086)
 *
 * In SETUP ↶ / ↷ in the top bar and Cmd / Ctrl + Z, Shift + Cmd / Ctrl + Z step through every
 * change of the board; each step is saved. A text field keeps its own keys, the open PAD editor
 * its draft history (ADR-0084); GAME has no undo. Undoing NEW DECK of the shown deck shows the
 * first deck. The history lasts while the app is open. A deleted pad or deck shows a toast whose
 * UNDO puts back just that deletion (Slice 18b); it goes after 6 s or when the board is left. A
 * board deleted in the board list comes back the same way, with its decks and pads (Slice 18c).
 * No playback — Chromium and WebKit.
 */

import { test, expect, type Page } from '@playwright/test';
import {
  addNamedPad,
  closePadEditor,
  createBoardAndNavigate,
  createDeck,
  enterGameMode,
  enterSetupMode,
  goToBoardList,
  padCells,
  reopenFirstBoard,
} from './helpers';

const undoButton = (page: Page) => page.getByTestId('board-top-bar-undo-button');
const redoButton = (page: Page) => page.getByTestId('board-top-bar-redo-button');
const deckTabs = (page: Page) => page.locator('[data-testid^="deck-rail-deck-tab-"]');
const toast = (page: Page) => page.getByTestId('undo-toast');

/** Opens the first pad's editor and deletes the pad (two taps). */
async function deleteFirstPad(page: Page) {
  await padCells(page).first().click();
  const del = page.getByTestId('pad-editor-panel-delete-button');
  await del.click();
  await del.click();
  await expect(padCells(page)).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await addNamedPad(page, 'Rain');
  await closePadEditor(page);
});

test('↶ and ↷ step through the changes; an undo is stored, the history ends with the app', async ({
  page,
}) => {
  const pad = padCells(page);
  await undoButton(page).click(); // the name, saved in the PAD editor
  await expect(pad).toHaveCount(1);
  await expect(pad.first()).not.toContainText('Rain');
  await undoButton(page).click(); // ADD PAD
  await expect(pad).toHaveCount(0);
  await redoButton(page).click();
  await redoButton(page).click();
  await expect(pad.first()).toContainText('Rain');
  await expect(redoButton(page)).toBeDisabled();

  await undoButton(page).click();
  await undoButton(page).click();
  await expect(pad).toHaveCount(0);
  await reopenFirstBoard(page);
  await enterSetupMode(page);
  await expect(pad).toHaveCount(0); // the undo was saved
  await expect(undoButton(page)).toBeDisabled(); // a new start has no history
});

test('Cmd / Ctrl + Z undoes and Shift redoes — not in a text field', async ({ page }) => {
  const pad = padCells(page);
  await page.keyboard.press('ControlOrMeta+z');
  await expect(pad.first()).not.toContainText('Rain');
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect(pad.first()).toContainText('Rain');

  // The search bar is open until folded (a bar toggle's default)
  await expect(page.getByTestId('board-screen-search-toggle-button')).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await page.getByTestId('board-screen-search-input').focus();
  await page.keyboard.press('ControlOrMeta+z');
  await expect(pad.first()).toContainText('Rain'); // the field's own undo, not the board's
});

test('with the PAD editor open, Cmd / Ctrl + Z undoes its draft, not the board', async ({
  page,
}) => {
  await padCells(page).first().click();
  const name = page.getByTestId('pad-editor-panel-name-input');
  await name.fill('Storm');
  await page.getByTestId('pad-editor-panel-undo-button').focus(); // out of the text field
  await page.keyboard.press('ControlOrMeta+z');
  await expect(name).toHaveValue('Rain');
  await page.getByRole('button', { name: 'Close the pad editor' }).click();
  await expect(padCells(page)).toHaveCount(1);
  await expect(padCells(page).first()).toContainText('Rain');
});

test('GAME has no undo', async ({ page }) => {
  await enterGameMode(page);
  await expect(undoButton(page)).toHaveCount(0);
  await page.keyboard.press('ControlOrMeta+z');
  await expect(padCells(page).first()).toContainText('Rain');
});

test('undoing NEW DECK of the deck shown shows the first deck', async ({ page }) => {
  await createDeck(page); // shown now
  await expect(deckTabs(page)).toHaveCount(2);
  await undoButton(page).click();
  await expect(deckTabs(page)).toHaveCount(1);
  await expect(page.getByText('Select a deck')).toHaveCount(0);
  await expect(padCells(page).first()).toContainText('Rain'); // the first deck, with its pad
});

test("a deleted pad comes back with the toast's UNDO; a change made since stays", async ({
  page,
}) => {
  await deleteFirstPad(page);
  await expect(toast(page)).toContainText("Deleted 'Rain'");
  await deckTabs(page).first().dblclick(); // rename the deck meanwhile
  await page.getByTestId('deck-rail-name-input').fill('Storm');
  await page.getByTestId('deck-rail-name-input').press('Enter');
  await expect(deckTabs(page).first()).toContainText('Storm');

  await page.getByTestId('undo-toast-undo-button').click();
  await expect(padCells(page).first()).toContainText('Rain');
  await expect(deckTabs(page).first()).toContainText('Storm');
  await expect(toast(page)).toHaveCount(0);
});

test('the toast goes when the board is left', async ({ page }) => {
  await deleteFirstPad(page);
  await expect(toast(page)).toBeVisible();
  await page.getByTestId('board-top-bar-back-button').click();
  await page.locator('[data-testid^="board-list-screen-name-text-"]').first().click();
  await expect(page.getByTestId('mode-toggle')).toBeVisible();
  await expect(toast(page)).toHaveCount(0);
});

test('the toast goes 6 s after it appeared, also when the screen draws again meanwhile', async ({
  page,
}) => {
  // clock flows: stopping it would stop Preact's passive effects, the toast's timer among them
  // (testing.md pitfall 9) — so the final check waits 1 s only, far below the 4 s a restarted
  // time would still have left
  await page.clock.install();
  await deleteFirstPad(page);
  await expect(toast(page)).toBeVisible();
  await page.clock.runFor(5_000);
  // A preference changes, the board screen draws again: the toast's time must not start over
  await page.getByTestId('board-screen-search-toggle-button').click();
  await page.clock.runFor(2_000);
  await expect(toast(page)).toHaveCount(0, { timeout: 1_000 });
});

test("a deleted board comes back with the toast's UNDO, with its decks and pads, also after a reload", async ({
  page,
}) => {
  await page.getByTestId('board-top-bar-back-button').click();
  const rows = page.locator('[data-testid^="board-list-screen-row-"]');
  await expect(rows).toHaveCount(1);
  const del = rows.first().locator('[data-testid^="board-list-screen-delete-button-"]');
  await del.click();
  await del.click();
  await expect(rows).toHaveCount(0);
  await expect(toast(page)).toContainText("Deleted board '");

  await page.getByTestId('undo-toast-undo-button').click();
  await expect(rows).toHaveCount(1);
  await reopenFirstBoard(page);
  await expect(deckTabs(page)).toHaveCount(1);
  await expect(padCells(page).first()).toContainText('Rain');
});

/**
 * @fileoverview Full E2E — undo and redo of board changes (Slice 18a, ADR-0086)
 *
 * In SETUP ↶ / ↷ in the top bar and Cmd / Ctrl + Z, Shift + Cmd / Ctrl + Z step through every
 * change of the board; each step is saved. A text field keeps its own keys, the open PAD editor
 * its draft history (ADR-0084); GAME has no undo. Undoing NEW DECK of the shown deck shows the
 * first deck. The history lasts while the app is open. No playback — Chromium and WebKit.
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

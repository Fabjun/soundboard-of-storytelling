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
 * - An empty All pads names the next step of its mode: ADD PAD in SETUP, SETUP in GAME (17c)
 *
 * No audio needed: pads come from ADD PAD (runs in Chromium and WebKit).
 */

import { test, expect, type Page } from '@playwright/test';
import {
  TEST_AUDIO_NAME,
  createBoardAndNavigate,
  enterGameMode,
  enterSetupMode,
  ensureTestAudio,
  goToBoardList,
  pointerDrag,
  reopenFirstBoard,
  addNamedPad,
  closePadEditor,
  openDeckActions,
  padCells,
  deckRows,
  deckSelect,
  newDeckButton,
  undoToast,
  allPadsButton,
  deckBox,
} from './helpers';

const tabs = deckRows;

/** Opens the deck in rail position `n` (0 = the first). */
const openDeck = (page: Page, n: number) => deckSelect(tabs(page).nth(n)).click();

/** Two decks, Deck 1 and Deck 2; returns their names in rail order. */
async function twoDecks(page: Page): Promise<[string, string]> {
  await newDeckButton(page).click();
  await newDeckButton(page).click();
  await expect(deckSelect(tabs(page))).toHaveText([/Deck 1/, /Deck 2/]);
  return ['Deck 1', 'Deck 2'];
}

/** ADD PAD in the open deck (shared helper), returning the pad's cell test id. */
const addPadCell = async (page: Page, name: string) =>
  `pad-grid-cell-${await addNamedPad(page, name)}`;

const padName = (page: Page) => page.getByRole('textbox', { name: 'NAME', exact: true });
const save = (page: Page) => page.getByRole('button', { name: 'SAVE', exact: true });

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await enterSetupMode(page);
});

test('remove from deck keeps the pad in All pads', async ({ page }) => {
  await twoDecks(page);
  await openDeck(page, 0);
  const cell = await addPadCell(page, 'Thunder');

  // One tap removes it; ↶ puts it back, ↷ takes it out again (ADR-0086)
  await page.getByRole('button', { name: 'REMOVE FROM DECK', exact: true }).click();
  await expect(page.getByTestId(cell)).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByTestId(cell)).toBeVisible();
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(page.getByTestId(cell)).toHaveCount(0);

  // All pads: the whole pool, including pads in no deck
  await allPadsButton(page).click();
  await expect(allPadsButton(page)).toContainText('1');
  await expect(page.getByTestId(cell)).toContainText('Thunder');
  await expect(page.locator('[data-testid^="pad-grid-cell-empty-slot-"]')).toHaveCount(0);

  // Opened from All pads: no deck → no key and no "remove from deck"
  await page.getByTestId(cell).click();
  await expect(page.getByRole('dialog', { name: 'Pad editor', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'REMOVE FROM DECK', exact: true })).toHaveCount(0);
});

test('delete pad shows its decks and removes it everywhere', async ({ page }) => {
  await newDeckButton(page).click();
  await tabs(page).first().waitFor();
  const cell = await addPadCell(page, 'Thunder');

  // Duplicate the deck: the copy places the same pad (ADR-0048)
  await closePadEditor(page);
  await openDeckActions(tabs(page).first());
  await tabs(page).first().getByRole('menuitem', { name: 'Duplicate', exact: true }).click();
  await expect(tabs(page)).toHaveCount(2);

  await page.getByTestId(cell).click();
  // One tap deletes; the undo toast says in how many decks the pad was (owner decision 2026-10-19)
  await page.getByRole('button', { name: 'DELETE PAD', exact: true }).click();
  await expect(undoToast(page)).toContainText("Deleted 'Thunder' · from 2 decks");

  await expect(page.getByTestId(cell)).toHaveCount(0);
  await openDeck(page, 1);
  await expect(page.getByTestId(cell)).toHaveCount(0);
  await allPadsButton(page).click();
  await expect(page.getByTestId(cell)).toHaveCount(0);
});

test('the deck checklist places the pad in another deck and takes it out', async ({ page }) => {
  const [deck1, deck2] = await twoDecks(page);
  await openDeck(page, 0);
  const cell = await addPadCell(page, 'Thunder');

  const box1 = deckBox(page, deck1);
  const box2 = deckBox(page, deck2);
  await expect(box1).toBeChecked();
  await expect(box2).not.toBeChecked();
  await box2.check();
  await expect(box2).toBeChecked();

  // The second deck shows it on its first free cell
  await closePadEditor(page);
  await openDeck(page, 1);
  await expect(page.getByTestId(cell)).toHaveAttribute('data-pos', '0,0');

  // Uncheck from All pads → gone from the second deck, still in the pool
  await allPadsButton(page).click();
  await page.getByTestId(cell).click();
  await deckBox(page, deck2).uncheck();
  await closePadEditor(page);
  await openDeck(page, 1);
  await expect(page.getByTestId(cell)).toHaveCount(0);
  await openDeck(page, 0);
  await expect(page.getByTestId(cell)).toBeVisible();
});

test('a rename and a deck checkbox right after it both survive a reload', async ({ page }) => {
  const [, deck2] = await twoDecks(page);
  await openDeck(page, 0);
  const cell = await addPadCell(page, 'Thunder');

  // Rename, SAVE, and check the second deck before that save is written (ADR-0084)
  await padName(page).fill('Rain');
  await save(page).click();
  await deckBox(page, deck2).check();
  // reopenFirstBoard waits for the saves

  await reopenFirstBoard(page);
  await openDeck(page, 1);
  await expect(page.getByTestId(cell)).toContainText('Rain');
});

const emptySlots = (page: Page) => page.locator('[data-testid^="pad-grid-cell-empty-slot-"]');

test('ADD PAD in All pads creates a pad that sits in no deck', async ({ page }) => {
  const [deck1] = await twoDecks(page);
  await allPadsButton(page).click();
  await page.getByText('ADD PAD', { exact: true }).click();
  await padName(page).fill('Wind');
  await save(page).click();
  const cell = padCells(page).first();
  await expect(cell).toContainText('Wind');
  await expect(deckBox(page, deck1)).not.toBeChecked();
  await closePadEditor(page);
  await openDeck(page, 0);
  await expect(padCells(page)).toHaveCount(0); // the deck holds no pad
});

test('a library file dropped on All pads becomes a pad in no deck', async ({ page }) => {
  await ensureTestAudio(page);
  await reopenFirstBoard(page);
  await enterSetupMode(page);
  await allPadsButton(page).click();
  await page.getByRole('button', { name: 'LIB, open the library', exact: true }).click();
  const row = page
    .locator('[data-testid^="library-panel-row-"]')
    .filter({ hasText: TEST_AUDIO_NAME })
    .first();
  await row.waitFor();
  await pointerDrag(page, row, page.getByText(/^No pads yet — /));
  await expect(padCells(page)).toHaveCount(1);
  await expect(padCells(page).first()).toContainText(TEST_AUDIO_NAME);
  await expect(allPadsButton(page)).toContainText('1');
});

test('an empty All pads names the next step of its mode', async ({ page }) => {
  await allPadsButton(page).click();
  await expect(
    page.getByText('No pads yet — ADD PAD adds one, or drop a file from the library.', {
      exact: true,
    }),
  ).toBeVisible();
  await enterGameMode(page);
  await expect(page.getByText('No pads yet — SETUP adds them.', { exact: true })).toBeVisible();
});

test('a board opens in the view it showed last', async ({ page }) => {
  await twoDecks(page);
  // A pad only in the second deck: visible there and in All pads, not in the first deck
  await openDeck(page, 1);
  await addPadCell(page, 'Rain');

  await reopenFirstBoard(page);
  await expect(padCells(page)).toContainText(['Rain']); // second deck again, not the first
  await expect(emptySlots(page)).toHaveCount(15);

  await allPadsButton(page).click();
  await reopenFirstBoard(page);
  await expect(padCells(page)).toContainText(['Rain']);
  await expect(emptySlots(page)).toHaveCount(0); // All pads has no empty cells
});

test('All pads sorts by name, by date added and reversed; the choice stays with the board', async ({
  page,
}) => {
  await newDeckButton(page).click();
  await tabs(page).first().waitFor();
  for (const name of ['Bravo', 'Alpha', 'Charlie']) await addPadCell(page, name);
  await closePadEditor(page);
  await allPadsButton(page).click();

  const order = async () =>
    (await padCells(page).allTextContents()).map(
      (t) => ['Alpha', 'Bravo', 'Charlie'].find((n) => t.includes(n)) ?? t,
    );
  const sort = page.getByRole('combobox', { name: 'Sort pads by', exact: true });
  expect(await order()).toEqual(['Alpha', 'Bravo', 'Charlie']); // Name A→Z by default

  await sort.selectOption({ label: 'Date added' });
  await expect.poll(order).toEqual(['Charlie', 'Alpha', 'Bravo']); // newest first

  await page.getByRole('button', { name: 'Reverse the order', exact: true }).click();
  await expect.poll(order).toEqual(['Bravo', 'Alpha', 'Charlie']); // oldest first

  await reopenFirstBoard(page); // the board opens in All pads again, with the same sort
  await expect.poll(order).toEqual(['Bravo', 'Alpha', 'Charlie']);
  await expect(sort).toHaveValue('added');
});

// A toggle on and off in the same open view; every entry path × every action
// (docs/development/testing.md#test-design-edge-case-checklist, "Toggles and views")

test('unchecking the deck the editor was opened from keeps the editor open; checking puts it back', async ({
  page,
}) => {
  const [deck1] = await twoDecks(page);
  await openDeck(page, 0);
  const cell = await addPadCell(page, 'Thunder');
  const own = deckBox(page, deck1);
  await expect(own).toBeChecked();

  await own.uncheck();
  await expect(own).not.toBeChecked();
  await expect(page.getByRole('dialog', { name: 'Pad editor', exact: true })).toBeVisible();
  await own.check();
  await expect(own).toBeChecked();

  await closePadEditor(page);
  await expect(page.getByTestId(cell)).toBeVisible();
});

test('the library panel opens and closes with LIB, and closes with its ×', async ({ page }) => {
  await newDeckButton(page).click();
  const lib = page
    .getByTestId('board-top-bar')
    .getByRole('button', { name: /^LIB, (open|close) the library$/ }); // the visible LIB first (WCAG 2.5.3)
  const panel = page.getByRole('region', { name: 'Library', exact: true });

  await lib.click();
  await expect(lib).toHaveAttribute('aria-pressed', 'true');
  await expect(panel).toBeVisible();
  await lib.click();
  await expect(lib).toHaveAttribute('aria-pressed', 'false');
  await expect(panel).toHaveCount(0);

  await lib.click();
  await panel.getByRole('button', { name: 'Close the library', exact: true }).click();
  await expect(panel).toHaveCount(0);
  await expect(lib).toHaveAttribute('aria-pressed', 'false');
});

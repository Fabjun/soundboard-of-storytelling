/**
 * @fileoverview Full E2E — Board CRUD (Slice-3 verification points 1–4)
 *
 * 1. Create board → appears in list
 * 2. Rename board → title updates
 * 3. Rename persists after page reload
 * 4. Delete board → one tap removes it from the list; the toast offers UNDO (its UNDO:
 *    board-undo.spec.ts)
 *
 * A board row is found by its buttons: the one that opens it is named by the board's name and its
 * counts ("Board 1 0 decks · 0 pads"), RENAME and DELETE by "… board <name>".
 */

import { test, expect, type Page } from '@playwright/test';
import { goToBoardList, reloadApp, openMainMenu } from './helpers';

/** NEW BOARD on the board list. */
const newBoard = (page: Page) => page.getByRole('button', { name: 'NEW BOARD', exact: true });
/** The button that opens a board, by its name — a new board has no decks and no pads. */
const openButton = (page: Page, name: string) =>
  page.getByRole('button', { name: `${name} 0 decks · 0 pads`, exact: true });
/** Every board's open button: one per row of the list. */
const boardRows = (page: Page) => page.getByRole('button', { name: /\d+ decks? · \d+ pads?$/ });

/** Renames the board `from` in place to `to` (the pencil, the name field, Enter). */
async function rename(page: Page, from: string, to: string): Promise<void> {
  await page.getByRole('button', { name: `Rename board ${from}`, exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Board name', exact: true });
  await input.fill(to);
  await input.press('Enter');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
});

// ── Test 1: Create board ──────────────────────────────────────────────────────

test('1 — create board → appears in list', async ({ page }) => {
  await goToBoardList(page);
  await newBoard(page).click();
  await expect(openButton(page, 'Board 1')).toBeVisible();
  await expect(boardRows(page)).toHaveCount(1);
});

// ── Test 2: Rename board ──────────────────────────────────────────────────────

test('2 — rename board inline → title updates', async ({ page }) => {
  await goToBoardList(page);
  await newBoard(page).click();
  await rename(page, 'Board 1', 'My Renamed Board');

  // The title as typed (CSS textTransform is visual only); the old name is gone
  await expect(openButton(page, 'My Renamed Board')).toBeVisible();
  await expect(openButton(page, 'Board 1')).toHaveCount(0);
});

// ── Test 3: Rename persists after reload ──────────────────────────────────────

test('3 — renamed board persists after page reload', async ({ page }) => {
  await goToBoardList(page);
  await newBoard(page).click();
  await rename(page, 'Board 1', 'Persistent Board');

  // The new title shows at once; reloadApp waits until it is also saved
  await expect(openButton(page, 'Persistent Board')).toBeVisible();

  await reloadApp(page);
  await openMainMenu(page);
  await page.getByRole('button', { name: 'BOARD', exact: true }).click();
  await newBoard(page).waitFor();

  // Board should still exist with the renamed title
  await expect(openButton(page, 'Persistent Board')).toBeVisible();
  await expect(boardRows(page)).toHaveCount(1);
});

// ── Test 4: Delete — one tap, then the undo toast ─────────────────────────────

test('4 — delete board: one tap removes it from the list and the toast offers UNDO', async ({
  page,
}) => {
  await goToBoardList(page);
  await newBoard(page).click();
  await expect(boardRows(page)).toHaveCount(1);

  // The delete icon is decorative; the button is named by its label (ADR-0085)
  const deleteBtn = page.getByRole('button', { name: 'Delete board Board 1', exact: true });
  await expect(deleteBtn).toHaveText('');

  await deleteBtn.click();
  await expect(boardRows(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'UNDO', exact: true })).toBeVisible();
});

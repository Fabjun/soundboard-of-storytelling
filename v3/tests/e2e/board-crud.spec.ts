/**
 * @fileoverview Full E2E — Board CRUD (Slice-3 verification points 1–4)
 *
 * 1. Create board → appears in list
 * 2. Rename board → title updates
 * 3. Rename persists after page reload
 * 4. Delete board → one tap removes it from the list; the toast offers UNDO (its UNDO:
 *    board-undo.spec.ts)
 */

import { test, expect } from '@playwright/test';
import { goToBoardList, reloadApp, openMainMenu } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
});

// ── Test 1: Create board ──────────────────────────────────────────────────────

test('1 — create board → appears in list', async ({ page }) => {
  await goToBoardList(page);
  await page.getByTestId('board-list-screen-new-button').click();
  await expect(page.locator('[data-testid^="board-list-screen-row-"]').first()).toBeVisible();
});

// ── Test 2: Rename board ──────────────────────────────────────────────────────

test('2 — rename board inline → title updates', async ({ page }) => {
  await goToBoardList(page);
  await page.getByTestId('board-list-screen-new-button').click();
  const boardRow = page.locator('[data-testid^="board-list-screen-row-"]').first();
  await boardRow.waitFor();

  // Click the edit (pencil) button
  const editBtn = boardRow.locator('[data-testid^="board-list-screen-edit-button-"]');
  await editBtn.click();

  // Find the inline input (rendered inside the row, replacing the title span)
  const input = boardRow.getByRole('textbox');
  await input.waitFor();
  await input.fill('My Renamed Board');
  await input.press('Enter');

  // Title should update (DOM text is stored as-typed; CSS textTransform is visual-only)
  await expect(boardRow.locator('[data-testid^="board-list-screen-name-text-"]')).toHaveText(
    'My Renamed Board',
  );
});

// ── Test 3: Rename persists after reload ──────────────────────────────────────

test('3 — renamed board persists after page reload', async ({ page }) => {
  await goToBoardList(page);
  await page.getByTestId('board-list-screen-new-button').click();
  const boardRow = page.locator('[data-testid^="board-list-screen-row-"]').first();
  await boardRow.waitFor();

  // Rename the board
  const editBtn = boardRow.locator('[data-testid^="board-list-screen-edit-button-"]');
  await editBtn.click();
  const input = boardRow.getByRole('textbox');
  await input.waitFor();
  await input.fill('Persistent Board');
  await input.press('Enter');

  // The new title shows at once; reloadApp waits until it is also saved
  await expect(boardRow.locator('[data-testid^="board-list-screen-name-text-"]')).toHaveText(
    'Persistent Board',
  );

  await reloadApp(page);
  await openMainMenu(page);
  await page.getByRole('button', { name: 'BOARD', exact: true }).click();
  await page.getByTestId('board-list-screen-new-button').waitFor();

  // Board should still exist with the renamed title
  await expect(page.locator('[data-testid^="board-list-screen-name-text-"]').first()).toHaveText(
    'Persistent Board',
  );
});

// ── Test 4: Delete — first tap shows confirm state ────────────────────────────

test('4 — delete board: one tap removes it from the list and the toast offers UNDO', async ({
  page,
}) => {
  await goToBoardList(page);
  await page.getByTestId('board-list-screen-new-button').click();
  const rows = page.locator('[data-testid^="board-list-screen-row-"]');
  await expect(rows).toHaveCount(1);

  const deleteBtn = rows.first().locator('[data-testid^="board-list-screen-delete-button-"]');
  // The delete icon is decorative; the button is named by its label (ADR-0085)
  await expect(deleteBtn).toHaveText('');
  await expect(deleteBtn).toHaveAccessibleName('Delete board Board 1');

  await deleteBtn.click();
  await expect(rows).toHaveCount(0);
  await expect(page.getByTestId('undo-toast-undo-button')).toBeVisible();
});

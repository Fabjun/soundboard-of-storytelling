// ─────────────────────────────────────────────────────────────────────────────
// Full E2E — Board CRUD (Slice-3 verification points 1–5)
//
// 1. Create board → appears in list
// 2. Rename board → title updates
// 3. Rename persists after page reload
// 4. Delete board → 2-tap confirmation (first tap: confirm state visible)
// 5. Delete board → 2nd tap removes it from list
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect } from '@playwright/test';
import { goToBoardList } from './helpers';

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

  // Wait for title to update (confirms IDB save has happened)
  await expect(boardRow.locator('[data-testid^="board-list-screen-name-text-"]')).toHaveText(
    'Persistent Board',
  );

  // Reload the page
  await page.reload();
  await page.getByRole('button', { name: 'BOARD' }).click();
  await page.getByTestId('board-list-screen-new-button').waitFor();

  // Board should still exist with the renamed title
  await expect(page.locator('[data-testid^="board-list-screen-name-text-"]').first()).toHaveText(
    'Persistent Board',
  );
});

// ── Test 4: Delete — first tap shows confirm state ────────────────────────────

test('4 — delete board: first tap shows confirm state (!! label)', async ({ page }) => {
  await goToBoardList(page);
  await page.getByTestId('board-list-screen-new-button').click();
  const boardRow = page.locator('[data-testid^="board-list-screen-row-"]').first();
  await boardRow.waitFor();

  const deleteBtn = boardRow.locator('[data-testid^="board-list-screen-delete-button-"]');
  // Initial state: "×" character
  await expect(deleteBtn).toHaveText('×');

  // First tap: should enter confirm state
  await deleteBtn.click();
  await expect(deleteBtn).toHaveText('!!');
  // Board is still in the list
  await expect(boardRow).toBeVisible();
});

// ── Test 5: Delete — second tap removes board ─────────────────────────────────

test('5 — delete board: second tap removes it from list', async ({ page }) => {
  await goToBoardList(page);
  await page.getByTestId('board-list-screen-new-button').click();
  const boardRow = page.locator('[data-testid^="board-list-screen-row-"]').first();
  await boardRow.waitFor();

  const deleteBtn = boardRow.locator('[data-testid^="board-list-screen-delete-button-"]');
  // Two taps
  await deleteBtn.click();
  await expect(deleteBtn).toHaveText('!!');
  await deleteBtn.click();

  // Board row should be gone; empty state visible
  await expect(boardRow).not.toBeVisible({ timeout: 3000 });
});

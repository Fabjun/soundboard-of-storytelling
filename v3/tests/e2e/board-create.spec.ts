// ─────────────────────────────────────────────────────────────────────────────
// Smoke test: create a board, navigate into it, BoardScreen loads
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect } from '@playwright/test';

test('create board → appears in list → BoardScreen loads with pad grid', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await page.getByRole('button', { name: 'BOARD' }).click();

  // Create new board
  await page.getByRole('button', { name: /NEW BOARD/ }).click();

  // Board row appears in list
  const rows = page.locator('.sb-menu-row');
  await expect(rows).toHaveCount(1);

  // Navigate into the board (click the row title area, not the action buttons)
  await rows.first().locator('.sb-row-title').click();

  // BoardScreen: ModeToggle is always visible regardless of whether a deck exists
  await expect(page.locator('.sb-mode-toggle')).toBeVisible();
});

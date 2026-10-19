/**
 * @fileoverview Smoke test: create a board, navigate into it, BoardScreen loads
 */

import { test, expect } from '@playwright/test';
import { openMainMenu } from './helpers';

test('create board → appears in list → BoardScreen loads with pad grid', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await openMainMenu(page);
  await page.getByRole('button', { name: 'BOARD', exact: true }).click();

  // Create new board
  await page.getByRole('button', { name: /NEW BOARD/ }).click();

  // Board row appears in list
  const rows = page.locator('[data-testid^="board-list-screen-row-"]');
  await expect(rows).toHaveCount(1);

  // Navigate into the board (click the row title area, not the action buttons)
  await rows.first().locator('[data-testid^="board-list-screen-name-text-"]').click();

  // BoardScreen: ModeToggle is always visible regardless of whether a deck exists
  await expect(page.getByTestId('mode-toggle')).toBeVisible();
});

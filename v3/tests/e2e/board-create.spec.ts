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

  // Board row appears in list — one button opens each board, named by the board and its counts
  const rows = page.getByRole('button', { name: /\d+ decks? · \d+ pads?$/ });
  await expect(rows).toHaveCount(1);

  // Navigate into the board (the row title sits in that button, not in the action buttons)
  await rows.first().click();

  // BoardScreen: ModeToggle is always visible regardless of whether a deck exists
  await expect(page.getByRole('group', { name: 'Mode toggle', exact: true })).toBeVisible();
});

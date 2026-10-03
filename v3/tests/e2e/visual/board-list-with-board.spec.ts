/**
 * @fileoverview Visual regression — the board list with one board
 *
 * Compared against the macOS baseline (CLAUDE.md workflow rule 10); stableScreenshot (helpers.ts) first
 * turns motion off and waits for the fonts.
 */

import { test, expect } from '@playwright/test';
import { stableScreenshot } from './helpers';
import { goToBoardList } from '../helpers';

test('BoardListScreen — with one board', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await page.getByTestId('board-list-screen-new-button').click();
  await page.locator('[data-testid^="board-list-screen-row-"]').first().waitFor();
  await stableScreenshot(page);
  await expect(page).toHaveScreenshot('board-list-with-board.png', {
    fullPage: false,
  });
});

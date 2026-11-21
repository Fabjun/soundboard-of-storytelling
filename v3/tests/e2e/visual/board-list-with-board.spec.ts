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
  await page.getByRole('button', { name: 'NEW BOARD', exact: true }).click();
  await page
    .getByRole('button', { name: /\d+ decks? · \d+ pads?$/ })
    .first()
    .waitFor();
  await stableScreenshot(page);
  await expect(page).toHaveScreenshot('board-list-with-board.png', {
    fullPage: false,
  });
});

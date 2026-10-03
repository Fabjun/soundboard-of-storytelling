/**
 * @fileoverview Visual regression — the board list with no boards (empty state)
 *
 * Compared against the macOS baseline (CLAUDE.md workflow rule 10); stableScreenshot (helpers.ts) first
 * turns motion off and waits for the fonts.
 */

import { test, expect } from '@playwright/test';
import { stableScreenshot } from './helpers';

test('BoardListScreen — empty state', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await page.getByRole('button', { name: 'BOARD' }).click();
  await page.getByTestId('board-list-screen-new-button').waitFor();
  await stableScreenshot(page);
  await expect(page).toHaveScreenshot('board-list-empty.png', { fullPage: false });
});

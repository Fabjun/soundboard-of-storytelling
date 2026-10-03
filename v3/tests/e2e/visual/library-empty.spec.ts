/**
 * @fileoverview Visual regression — the library with no audio files (empty state)
 *
 * Compared against the macOS baseline (CLAUDE.md workflow rule 10); stableScreenshot (helpers.ts) first
 * turns motion off and waits for the fonts.
 */

import { test, expect } from '@playwright/test';
import { stableScreenshot } from './helpers';

test('LibraryScreen — empty state', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await page.getByRole('button', { name: 'LIBRARY' }).click();
  await page.getByRole('button', { name: /IMPORT/ }).waitFor();
  await stableScreenshot(page);
  await expect(page).toHaveScreenshot('library-empty.png', { fullPage: false });
});

import { test, expect } from '@playwright/test';
import { stableScreenshot } from './visual-setup';

test('LibraryScreen — empty state', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await page.getByRole('button', { name: 'LIBRARY' }).click();
  await page.getByRole('button', { name: /IMPORT/ }).waitFor();
  await stableScreenshot(page);
  await expect(page).toHaveScreenshot('library-empty.png', { fullPage: false });
});

import { test, expect } from '@playwright/test';
import { stableScreenshot } from './visual-setup';

test('BoardListScreen — empty state', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await page.getByRole('button', { name: 'BOARD' }).click();
  await page.getByTestId('new-board-button').waitFor();
  await stableScreenshot(page);
  await expect(page).toHaveScreenshot('boardlist-empty.png', { fullPage: false });
});

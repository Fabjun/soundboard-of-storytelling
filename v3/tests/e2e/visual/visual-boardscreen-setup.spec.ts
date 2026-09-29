import { test, expect } from '@playwright/test';
import { stableScreenshot } from './visual-setup';
import { goToBoardList, createBoardAndNavigate, createDeck, enterSetupMode } from '../helpers';

test('BoardScreen — SETUP mode with one deck', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await stableScreenshot(page);
  await expect(page).toHaveScreenshot('boardscreen-setup.png', {
    fullPage: false,
  });
});

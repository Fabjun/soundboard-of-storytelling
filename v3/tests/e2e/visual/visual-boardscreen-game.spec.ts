import { test, expect } from '@playwright/test';
import { stableScreenshot } from './visual-setup';
import { goToBoardList, createBoardAndNavigate, createScene, enterGameMode } from '../helpers';

test('BoardScreen — GAME mode with one scene', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createScene(page);
  await enterGameMode(page);
  await stableScreenshot(page);
  await expect(page).toHaveScreenshot('boardscreen-game.png', {
    fullPage: false,
  });
});

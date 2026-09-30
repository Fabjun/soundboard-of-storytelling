import { test, expect } from '@playwright/test';
import { stableScreenshot } from './helpers';
import { goToBoardList, createBoardAndNavigate, createDeck, enterGameMode } from '../helpers';

test('BoardScreen — GAME mode with one deck', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterGameMode(page);
  await stableScreenshot(page);
  await expect(page).toHaveScreenshot('board-screen-game.png', {
    fullPage: false,
  });
});

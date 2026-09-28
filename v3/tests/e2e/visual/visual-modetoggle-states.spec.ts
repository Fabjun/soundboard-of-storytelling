import { test, expect } from '@playwright/test';
import { stableScreenshot } from './visual-setup';
import { goToBoardList, createBoardAndNavigate, enterSetupMode, enterGameMode } from '../helpers';

test('ModeToggle — GAME state (default)', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await enterGameMode(page);
  await stableScreenshot(page);
  const toggle = page.getByTestId('mode-toggle');
  await expect(toggle).toHaveScreenshot('modetoggle-game.png');
});

test('ModeToggle — SETUP state', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await enterSetupMode(page);
  await stableScreenshot(page);
  const toggle = page.getByTestId('mode-toggle');
  await expect(toggle).toHaveScreenshot('modetoggle-setup.png');
});

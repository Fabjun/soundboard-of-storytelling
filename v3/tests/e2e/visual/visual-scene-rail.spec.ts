import { test, expect } from '@playwright/test';
import { stableScreenshot } from './visual-setup';
import { goToBoardList, createBoardAndNavigate, createScene, enterSetupMode } from '../helpers';

test('SceneRail — two scenes, first active', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createScene(page);
  // Create a second scene
  await page.getByTestId('new-scene-button').click();
  await page.locator('[data-testid^="scene-tab-"]').nth(1).waitFor();
  await enterSetupMode(page);
  // Click the first scene tab to make it active
  await page.locator('[data-testid^="scene-tab-"]').first().click();
  await stableScreenshot(page);
  const rail = page.locator('.sb-scene-rail');
  await expect(rail).toHaveScreenshot('scene-rail-two-scenes.png');
});

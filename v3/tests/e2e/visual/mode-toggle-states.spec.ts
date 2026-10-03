/**
 * @fileoverview Visual regression — the mode toggle in its GAME and SETUP states
 *
 * Compared against the macOS baseline (CLAUDE.md workflow rule 10); stableScreenshot (helpers.ts) first
 * turns motion off and waits for the fonts.
 */

import { test, expect } from '@playwright/test';
import { stableScreenshot } from './helpers';
import { goToBoardList, createBoardAndNavigate, enterSetupMode, enterGameMode } from '../helpers';

test('ModeToggle — GAME state (default)', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await enterGameMode(page);
  await stableScreenshot(page);
  const toggle = page.getByTestId('mode-toggle');
  await expect(toggle).toHaveScreenshot('mode-toggle-game.png');
});

test('ModeToggle — SETUP state', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await enterSetupMode(page);
  await stableScreenshot(page);
  const toggle = page.getByTestId('mode-toggle');
  await expect(toggle).toHaveScreenshot('mode-toggle-setup.png');
});

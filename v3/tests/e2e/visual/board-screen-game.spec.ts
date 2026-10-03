/**
 * @fileoverview Visual regression — the board screen in GAME mode with one deck
 *
 * Compared against the macOS baseline (CLAUDE.md workflow rule 10); stableScreenshot (helpers.ts) first
 * turns motion off and waits for the fonts.
 */

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

import { test, expect } from '@playwright/test';
import { stableScreenshot } from './helpers';
import { goToBoardList, createBoardAndNavigate, createDeck, enterSetupMode } from '../helpers';

test('DeckRail — two decks, first active', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  // Create a second deck
  await page.getByTestId('deck-rail-new-button').click();
  await page.locator('[data-testid^="deck-rail-deck-tab-"]').nth(1).waitFor();
  await enterSetupMode(page);
  // Click the first deck tab to make it active
  await page.locator('[data-testid^="deck-rail-deck-tab-"]').first().click();
  await stableScreenshot(page);
  const rail = page.getByTestId('deck-rail');
  await expect(rail).toHaveScreenshot('deck-rail-two-decks.png');
});

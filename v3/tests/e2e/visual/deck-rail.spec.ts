/**
 * @fileoverview Visual regression — the deck rail with two decks, the first one active
 *
 * Compared against the macOS baseline (CLAUDE.md workflow rule 10); stableScreenshot (helpers.ts) first
 * turns motion off and waits for the fonts.
 */

import { test, expect } from '@playwright/test';
import { stableScreenshot } from './helpers';
import { goToBoardList, createBoardAndNavigate, createDeck, enterSetupMode } from '../helpers';

test('DeckRail — two decks, first active', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  // Create a second deck
  await page.getByRole('button', { name: 'NEW DECK', exact: true }).click();
  // The rail's decks, each named by position, name and pad count ("1 Deck 1 0")
  const decks = page.getByRole('list', { name: 'Decks', exact: true }).getByRole('button', {
    name: /^\d+ Deck \d+ \d+$/,
  });
  await decks.nth(1).waitFor();
  await enterSetupMode(page);
  // Click the first deck tab to make it active
  await decks.first().click();
  await stableScreenshot(page);
  // The rail's box, a container without a role: what the screenshot shows
  const rail = page.getByTestId('deck-rail');
  await expect(rail).toHaveScreenshot('deck-rail-two-decks.png');
});

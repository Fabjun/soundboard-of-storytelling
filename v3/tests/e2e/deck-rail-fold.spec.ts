/**
 * @fileoverview Full E2E — the deck list starts folded and its toggle opens and folds it
 *
 * Owner decision 2026-10-05: the deck list starts folded on every screen size, so the pads get the
 * width; the button at its top opens it. (The phone variant is tests/e2e/mobile/board-flow.spec.ts.)
 */

import { test, expect } from '@playwright/test';
import { allPadsButton, goToBoardList } from './helpers';

test('on a wide window the deck list starts folded and the toggle opens and folds it', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  // By hand, not createBoardAndNavigate: that helper unfolds the deck list
  await page.getByRole('button', { name: 'NEW BOARD', exact: true }).click();
  await page.getByRole('button', { name: 'Board 1 0 decks · 0 pads', exact: true }).click();
  await page.getByRole('group', { name: 'Mode toggle', exact: true }).waitFor();
  const toggle = page.getByRole('button', { name: /^(Show|Hide) the deck list$/ });
  const allPads = allPadsButton(page);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(allPads).toBeHidden();
  const foldedWidth = (await page.getByTestId('deck-rail').boundingBox())?.width ?? 0;

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(allPads).toBeVisible();
  const openWidth = (await page.getByTestId('deck-rail').boundingBox())?.width ?? 0;
  expect(foldedWidth).toBeLessThan(openWidth / 3);

  await toggle.click();
  await expect(allPads).toBeHidden();
});

/**
 * @fileoverview Full E2E — the bars that fold behind a toolbar icon (owner decision 2026-10-11)
 *
 * The search bar (magnifying glass), the quick-access bar (star) and, on a phone, the deck tabs
 * (hand of cards) fold to give the pads room; a folded bar stays folded after a reload; what is
 * in effect in a folded bar — a search, pads in the quick-access bar — marks its icon. The toggles
 * sit in the top bar on a wide window and at the end of the deck tabs on a phone. Needs no
 * playback — runs in WebKit too.
 */

import { test, expect, type Page } from '@playwright/test';
import {
  addNamedPad,
  boardOpenButtons,
  closePadEditor,
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  goToBoardList,
  padCells,
  reloadApp,
} from './helpers';

const PHONE = { width: 390, height: 844 };
// On a phone the All pads tab shows no count (the wide frame's deck list does)
const allPadsTab = (page: Page) => page.getByRole('button', { name: 'All pads', exact: true });
/** The bar each toggle shows or hides, as its name says it ("Show the search bar"). */
const BAR = { search: 'search bar', 'quick-access': 'quick-access bar', decks: 'deck tabs' };
const toggle = (page: Page, name: keyof typeof BAR) =>
  page.getByRole('button', { name: new RegExp(`^(Show|Hide) the ${BAR[name]}`) });
const searchInput = (page: Page) =>
  page.getByRole('searchbox', { name: 'Search pads by name', exact: true });
const quickAccess = (page: Page) => page.getByRole('group', { name: 'Quick access', exact: true });

async function boardWithTwoPads(page: Page) {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await addNamedPad(page, 'Rain');
  await addNamedPad(page, 'Wind');
  await closePadEditor(page);
}

test('on a phone the deck tabs fold behind the cards; the toggles stay; folded after a reload', async ({
  page,
}) => {
  await page.setViewportSize(PHONE);
  await boardWithTwoPads(page);
  const allPads = allPadsTab(page);
  await expect(toggle(page, 'decks')).toHaveAttribute('aria-expanded', 'true');
  await expect(allPads).toBeVisible();

  await toggle(page, 'decks').click();
  await expect(toggle(page, 'decks')).toHaveAttribute('aria-expanded', 'false');
  await expect(allPads).toHaveCount(0);
  await expect(toggle(page, 'search')).toBeVisible();

  // Reopened by hand: reopenFirstBoard would unfold the tabs (openDeckRail)
  await reloadApp(page);
  await goToBoardList(page);
  await boardOpenButtons(page).first().click();
  await expect(toggle(page, 'decks')).toHaveAttribute('aria-expanded', 'false');
  await expect(allPadsTab(page)).toHaveCount(0);
  await toggle(page, 'decks').click();
  await expect(allPadsTab(page)).toBeVisible();
});

test('a search stays in effect while its bar is folded, and the magnifying glass says so', async ({
  page,
}) => {
  await boardWithTwoPads(page);
  await searchInput(page).fill('rain');
  await expect(padCells(page)).toHaveCount(1);

  await toggle(page, 'search').click();
  await expect(searchInput(page)).toHaveCount(0);
  await expect(padCells(page)).toHaveCount(1);
  await expect(toggle(page, 'search')).toHaveAccessibleName(/in effect/);

  await toggle(page, 'search').click();
  await expect(searchInput(page)).toHaveValue('rain');
  await searchInput(page).fill('');
  await toggle(page, 'search').click();
  await expect(toggle(page, 'search')).toHaveAccessibleName('Show the search bar');
});

test('the quick-access bar folds behind the star, which is marked while the bar holds pads', async ({
  page,
}) => {
  await boardWithTwoPads(page);
  await padCells(page).first().getByRole('button').click();
  await page.getByRole('button', { name: 'In quick access', exact: true }).click();
  await closePadEditor(page);
  await expect(quickAccess(page)).toBeVisible();

  await toggle(page, 'quick-access').click();
  await expect(quickAccess(page)).toHaveCount(0);
  await expect(toggle(page, 'quick-access')).toHaveAccessibleName(/in effect/);
  await toggle(page, 'quick-access').click();
  await expect(quickAccess(page)).toBeVisible();
});

test('on a wide window the search and the star sit in the top bar; there is no cards toggle', async ({
  page,
}) => {
  await boardWithTwoPads(page);
  const topBar = page.getByTestId('board-top-bar');
  await expect(topBar.getByRole('button', { name: /^(Show|Hide) the search bar/ })).toBeVisible();
  await expect(
    topBar.getByRole('button', { name: /^(Show|Hide) the quick-access bar/ }),
  ).toBeVisible();
  await expect(toggle(page, 'decks')).toHaveCount(0);
});

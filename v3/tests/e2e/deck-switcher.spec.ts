/**
 * @fileoverview Full E2E — the deck switcher: tabs on a phone, the rail on wide screens (Slice 13b)
 *
 * docs/product/features/adaptive-layout.md L3 / L4 (owner decisions 2026-10-10): below 600 px the
 * decks are tabs above the pad grid — All pads first, then every deck; one tap switches, the
 * current deck is always visible; in SETUP a DECKS tab opens the deck actions, NEW DECK and PAD
 * SIZE. From 600 px the rail stays. Needs no playback — runs in WebKit too.
 */

import { test, expect, type Page } from '@playwright/test';
import {
  createBoardAndNavigate,
  enterGameMode,
  enterSetupMode,
  goToBoardList,
  reopenFirstBoard,
} from './helpers';

/**
 * The deck tabs, named by position and deck ("1 Deck 1"). The decks here keep their default names;
 * the DECKS list and the wide rail add the pad count ("1 Deck 1 0"), which this name excludes.
 */
const deckTabs = (page: Page) => page.getByRole('button', { name: /^\d+ Deck \d+$/ });
/** The All pads tab — the wide rail's entry adds the pad count ("All pads 0"). */
const allPadsTab = (page: Page) => page.getByRole('button', { name: 'All pads', exact: true });
const decksButton = (page: Page) => page.getByRole('button', { name: 'DECKS', exact: true });
/** The panel DECKS opens: a group named by the button. */
const decksPanel = (page: Page) => page.getByRole('group', { name: 'DECKS', exact: true });
/** The wide frame's button that folds the deck list. */
const railToggle = (page: Page) =>
  page.getByRole('button', { name: /^(Show|Hide) the deck list$/ });

/** Adds `n` decks through the DECKS panel (narrow frame, SETUP) and closes it again. */
async function addDecks(page: Page, n: number) {
  await enterSetupMode(page);
  await decksButton(page).click();
  const newDeck = decksPanel(page).getByRole('button', { name: 'NEW DECK', exact: true });
  for (let i = 0; i < n; i++) await newDeck.click();
  await expect(deckTabs(page)).toHaveCount(n);
  await decksButton(page).click();
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
});

test('below 600 px the decks are tabs above the grid: All pads first, one tap switches', async ({
  page,
}) => {
  await expect(railToggle(page)).toHaveCount(0);
  await addDecks(page, 2);
  await enterGameMode(page);
  await expect(deckTabs(page)).toHaveText(['1 Deck 1', '2 Deck 2']);
  await deckTabs(page).nth(1).click();
  await expect(deckTabs(page).nth(1)).toHaveAttribute('aria-current', 'true');
  // The top bar names the open deck after the board name
  await expect(page.getByText('· Deck 2', { exact: true })).toBeVisible();
  await allPadsTab(page).click();
  await expect(allPadsTab(page)).toHaveAttribute('aria-current', 'true');
  await expect(deckTabs(page).nth(1)).not.toHaveAttribute('aria-current');
});

test('the deck actions sit behind DECKS, in SETUP only', async ({ page }) => {
  await enterGameMode(page);
  await expect(decksButton(page)).toHaveCount(0);
  await enterSetupMode(page);
  await expect(decksButton(page)).toHaveAttribute('aria-expanded', 'false');
  await decksButton(page).click();
  const panel = decksPanel(page);
  const newDeck = panel.getByRole('button', { name: 'NEW DECK', exact: true });
  const padSize = panel.getByRole('slider', { name: 'PAD SIZE', exact: true });
  await expect(newDeck).toBeVisible();
  await expect(padSize).toHaveCount(0); // no deck open yet
  await newDeck.click();
  await expect(deckTabs(page)).toHaveCount(1);
  await expect(deckTabs(page).first()).toHaveAttribute('aria-current', 'true');
  await expect(padSize).toBeVisible();
  await decksButton(page).click();
  await expect(panel).toHaveCount(0);
});

test('with many decks the row scrolls sideways and keeps the current deck in view', async ({
  page,
}) => {
  await addDecks(page, 8);
  // NEW DECK opened the eighth deck; after a reload the board opens it again (its last view) with
  // the row at its start — the app must bring the tab into view. No click before the check: a
  // click scrolls its target into view by itself and would prove nothing.
  await reopenFirstBoard(page);
  const last = deckTabs(page).nth(7);
  await expect(last).toHaveAttribute('aria-current', 'true');
  await expect(last).toBeInViewport();
  await expect(deckTabs(page).first()).not.toBeInViewport();
  // DECKS stays in view at the end of the bar, however far the row is scrolled
  await enterSetupMode(page);
  await expect(decksButton(page)).toBeInViewport({ ratio: 1 });
  await deckTabs(page).first().click();
  await expect(decksButton(page)).toBeInViewport({ ratio: 1 });
  // The page itself does not scroll sideways (WCAG 2.2 SC 1.4.10)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('from 600 px the rail is back and the tabs are gone', async ({ page }) => {
  await addDecks(page, 1);
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(railToggle(page)).toBeVisible();
  await expect(deckTabs(page)).toHaveCount(0);
});

test('on a phone a deck moves in the DECKS list, and the tab row follows (Slice 13g)', async ({
  page,
}) => {
  await addDecks(page, 3);
  await decksButton(page).click();
  const panel = decksPanel(page);
  // The newest deck is active; its ▲ is a whole touch target inside the panel
  const up = panel.getByRole('button', { name: 'Move deck Deck 3 up', exact: true });
  await expect(up).toBeInViewport({ ratio: 1 });
  const box = (await up.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  await up.click();
  await decksButton(page).click();
  await expect(deckTabs(page)).toHaveText(['1 Deck 1', '2 Deck 3', '3 Deck 2']);
});

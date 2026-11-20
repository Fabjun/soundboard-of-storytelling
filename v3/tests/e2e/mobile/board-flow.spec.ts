/**
 * @fileoverview Mobile E2E — Board Flow (Playwright WebKit, iPhone 13 Pro profile)
 *
 * SCOPE: Verifies that creating a board and navigating into it works via
 * touch events on a 390×844 viewport.
 *
 *   A. NEW BOARD tap → board row appears
 *   B. Board row tap → BoardScreen loads (mode toggle visible)
 *   C. Back button tap → returns to BoardListScreen
 *
 * OUT OF SCOPE (see docs/development/manual-iphone-checklist.md):
 *   File upload, audio output, Ringer Switch, backgrounding.
 */

import { test, expect, type Page } from '@playwright/test';
import { goToBoardList } from '../helpers';

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
/** The button that opens the new board — named by the board and its counts. */
const openBoard = (page: Page) => button(page, 'Board 1 0 decks · 0 pads');
const modeToggle = (page: Page) => page.getByRole('group', { name: 'Mode toggle', exact: true });

test('A+B — NEW BOARD tap creates board; row title tap opens BoardScreen', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);

  // Create board via tap
  await button(page, 'NEW BOARD').tap();

  // Board row appears in the list; its title sits in the button that opens it
  await openBoard(page).tap();

  // BoardScreen is active — ModeToggle always present
  await expect(modeToggle(page)).toBeVisible();
});

test('on a phone the decks are tabs; in SETUP the DECKS tab opens and closes the deck list', async ({
  page,
}) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await button(page, 'NEW BOARD').tap();
  await openBoard(page).tap();
  // No rail on a phone — the tabs above the grid take its place (adaptive-layout.md L3, 2026-10-10;
  // the folded rail of 2026-10-05 stays in the wide frame, deck-rail-fold.spec.ts)
  await expect(page.getByRole('button', { name: /^(Show|Hide) the deck list$/ })).toHaveCount(0);
  await expect(button(page, 'All pads')).toBeVisible();
  await button(page, 'SETUP').tap();
  const decks = button(page, 'DECKS');
  const list = page.getByRole('group', { name: 'DECKS', exact: true });
  await decks.tap();
  await expect(decks).toHaveAttribute('aria-expanded', 'true');
  await expect(list.getByRole('button', { name: 'NEW DECK', exact: true })).toBeVisible();
  await decks.tap();
  await expect(list).toHaveCount(0);
});

test('C — Back button tap from BoardScreen returns to BoardListScreen', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);

  // Setup: create and enter a board
  await button(page, 'NEW BOARD').tap();
  await openBoard(page).tap();
  await modeToggle(page).waitFor();

  // Tap back
  await button(page, 'Back to the board list').tap();

  // We're back on BoardListScreen
  await expect(button(page, 'NEW BOARD')).toBeVisible();
});

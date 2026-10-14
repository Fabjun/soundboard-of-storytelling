/**
 * @fileoverview Full E2E — the quick-access bar (Slice 13d)
 *
 * docs/product/README.md#board-decks--quick-access (owner decisions 2026-09-28): board-wide, the
 * same in every deck, filled with pads of the pool. As V1's strip: above the grid, up to five pads,
 * pinned with ★ in the PAD editor. In GAME a tap plays or stops the pad; in SETUP it opens it in
 * the PAD editor. Plays sound, so Chromium only (like audio).
 */

import { test, expect, type Page } from '@playwright/test';
import {
  goToBoardList,
  addLoopPad,
  addNamedPad,
  closePadEditor,
  createBoardAndNavigate,
  createDeck,
  enterGameMode,
  enterSetupMode,
  goToLibrary,
  padCells,
  uploadTestAudio,
} from './helpers';

const bar = (page: Page) => page.getByRole('group', { name: 'Quick access' });
const star = (page: Page) => page.getByRole('button', { name: 'In quick access' });

/** Opens the pad in the n-th cell in the PAD editor and toggles ★ there (SETUP). */
async function togglePin(page: Page, n: number) {
  await padCells(page).nth(n).getByRole('button').click();
  await star(page).click();
  await closePadEditor(page);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await uploadTestAudio(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page); // through TAP TO START, which unlocks the audio
  await page.getByTestId('board-list-screen-new-button').waitFor();
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await addLoopPad(page, 0);
});

test('★ in the PAD editor pins a pad to the bar and takes it out again', async ({ page }) => {
  await expect(bar(page)).toHaveCount(0); // no bar while it is empty
  await padCells(page).first().getByRole('button').click();
  await expect(star(page)).toHaveAttribute('aria-pressed', 'false');
  await star(page).click();
  await expect(star(page)).toHaveAttribute('aria-pressed', 'true');
  await closePadEditor(page);
  await expect(bar(page).getByRole('button')).toHaveCount(1);
  await togglePin(page, 0);
  await expect(bar(page)).toHaveCount(0);
});

// A toggle is tested on and off in the same open view (docs/development/testing.md checklist)
test('★ pressed twice in the open PAD editor takes the pad out again', async ({ page }) => {
  await padCells(page).first().getByRole('button').click();
  await star(page).click();
  await expect(star(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(bar(page).getByRole('button')).toHaveCount(1);
  await star(page).click();
  await expect(star(page)).toHaveAttribute('aria-pressed', 'false');
  await expect(bar(page)).toHaveCount(0);
});

test('the bar is the same in every deck and in All pads; in SETUP it opens the pad', async ({
  page,
}) => {
  await togglePin(page, 0);
  await createDeck(page);
  await page.getByText('Deck 2', { exact: true }).click();
  await expect(padCells(page)).toHaveCount(0);
  await expect(bar(page).getByRole('button')).toHaveCount(1);
  await page.getByText('All pads', { exact: true }).click();
  await expect(bar(page).getByRole('button')).toHaveCount(1);
  // A pad not in the shown deck opens in the editor from the bar
  await page.getByText('Deck 2', { exact: true }).click();
  await bar(page).getByRole('button').click();
  await expect(page.getByRole('dialog', { name: 'Pad editor' })).toBeVisible();
  await expect(star(page)).toHaveAttribute('aria-pressed', 'true');
});

test('the bar holds five pads; the sixth ★ says it is full', async ({ page }) => {
  for (const name of ['B', 'C', 'D', 'E', 'F']) await addNamedPad(page, name);
  await closePadEditor(page);
  for (let i = 0; i < 5; i++) await togglePin(page, i);
  await expect(bar(page).getByRole('button')).toHaveCount(5);
  await padCells(page).nth(5).getByRole('button').click();
  await expect(star(page)).toBeDisabled();
  await expect(star(page)).toHaveAttribute('title', /full \(5 pads\)/);
});

test('in GAME a tap in the bar plays the pad and a second tap stops it', async ({ page }) => {
  await togglePin(page, 0);
  await enterGameMode(page);
  const pin = bar(page).getByRole('button');
  await pin.click();
  await expect(pin).toHaveAttribute('aria-pressed', 'true');
  // The same pad glows in the grid too
  await expect(padCells(page).first().getByRole('button', { pressed: true })).toBeVisible();
  await pin.click();
  await expect(pin).toHaveAttribute('aria-pressed', 'false');
});

// Every way the editor opens × ★ — the editor must stay with its pad (owner report 2026-10-11:
// opened from the bar in a deck without the pad, the second ★ made the editor vanish)

/** Opens the pinned pad from the bar, takes it out with ★ and puts it back, editor open. */
async function starOutAndBackFromBar(page: Page) {
  await bar(page).getByRole('button').click();
  await expect(star(page)).toHaveAttribute('aria-pressed', 'true');
  await star(page).click();
  await expect(star(page)).toHaveAttribute('aria-pressed', 'false');
  await expect(bar(page)).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'Pad editor' })).toBeVisible();
  await star(page).click();
  await expect(star(page)).toHaveAttribute('aria-pressed', 'true');
}

test('opened from the bar, ★ takes the pad out and back; the editor stays', async ({ page }) => {
  await togglePin(page, 0);
  await expect(padCells(page)).toHaveCount(1);
  await starOutAndBackFromBar(page);
});

test('opened from the bar in a deck without the pad, ★ out and back; the editor stays', async ({
  page,
}) => {
  await togglePin(page, 0);
  await createDeck(page);
  await expect(padCells(page)).toHaveCount(0);
  await starOutAndBackFromBar(page);
});

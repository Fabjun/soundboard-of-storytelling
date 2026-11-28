/**
 * @fileoverview Full E2E — the now-playing line in the status bar and the dock (Slice 13f)
 *
 * docs/product/features/adaptive-layout.md#decided L9 (owner decision 2026-10-11): one line says
 * which sounds play now — "N playing: a · b · c…" or "No sound" —, in the status bar on a wide
 * window and in the dock on a phone; a pad in another deck counts too. A playing Single shows its
 * time left instead of its running time, a Loop until stopped keeps its running time (owner
 * decision 2026-10-11). Needs playback, so Chromium only (like audio).
 */

import { test, expect, type Page } from '@playwright/test';
import {
  goToBoardList,
  addLoopPad,
  closePadEditor,
  createBoardAndNavigate,
  createDeck,
  deckRows,
  deckSelect,
  enterGameMode,
  enterSetupMode,
  goToLibrary,
  openDeckRail,
  padCells as pads,
  popoverAddPad,
  popoverFile,
  TEST_AUDIO_NAME,
  uploadTestAudio,
} from './helpers';

// A live region without a name, found by the words it says
const line = (page: Page) =>
  page.getByRole('status').filter({ hasText: /^(No sound|\d+ playing: )/ });
// A new pad takes the file's name, extension included
const NAME = `${TEST_AUDIO_NAME}.wav`;
const tap = (page: Page, n: number) => pads(page).nth(n).getByRole('button').click();

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await uploadTestAudio(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page); // through TAP TO START, which unlocks the audio
  await page.getByRole('button', { name: 'NEW BOARD', exact: true }).waitFor();
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await addLoopPad(page, 0);
  await addLoopPad(page, 1);
});

test('the status bar says No sound, then which pads play, and No sound again after they stop', async ({
  page,
}) => {
  await expect(line(page)).toHaveText('No sound');
  // Announced politely: a status, not an alert
  await expect(line(page)).toHaveRole('status');

  await enterGameMode(page);
  await tap(page, 0);
  await expect(line(page)).toHaveText(`1 playing: ${NAME}`);
  await tap(page, 1);
  await expect(line(page)).toHaveText(`2 playing: ${NAME} · ${NAME}`);

  await tap(page, 0);
  await tap(page, 1);
  await expect(line(page)).toHaveText('No sound');
});

test('a playing Single shows its time left; a Loop until stopped keeps its running time', async ({
  page,
}) => {
  // A Single from the first library file (the popover's default type) next to the two Loops
  await page.getByTestId('pad-grid-cell-empty-slot-2-0').click();
  await popoverFile(page).click();
  await popoverAddPad(page).click();
  await expect(pads(page)).toHaveCount(3);
  await expect(pads(page).nth(2)).toContainText('0:01');

  await enterGameMode(page);
  await tap(page, 2);
  await tap(page, 0);
  await expect(pads(page).nth(2)).toContainText('−0:01'); // the 1 s test file, time left
  await expect(pads(page).nth(0)).toContainText('0:01 ∞'); // a Loop has no end
  // The Single ends by itself: its running time again
  await expect(pads(page).nth(2)).not.toContainText('−');
  await expect(pads(page).nth(2)).toContainText('0:01');
});

test('a pad in another deck still counts', async ({ page }) => {
  // A mode switch stops every sound (Slice 12c): both decks exist before GAME starts
  await createDeck(page);
  const deckButton = (n: number) => deckSelect(deckRows(page).nth(n));
  await deckButton(0).click();
  await expect(pads(page)).toHaveCount(2);

  await enterGameMode(page);
  await tap(page, 0);
  await expect(line(page)).toHaveText(`1 playing: ${NAME}`);

  await openDeckRail(page);
  await deckButton(1).click();
  await expect(pads(page)).toHaveCount(0);
  await expect(line(page)).toHaveText(`1 playing: ${NAME}`);
});

test('on a phone the line is in the dock, next to STOP ALL, and stays inside the window', async ({
  page,
}) => {
  // Names long enough that the line cannot fit next to STOP ALL on a phone
  for (const n of [0, 1]) {
    await tap(page, n);
    await page
      .getByRole('dialog', { name: 'Pad editor', exact: true })
      .getByRole('textbox', { name: 'NAME', exact: true })
      .fill(`Thunder over the village ${n}`);
    await closePadEditor(page);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await enterGameMode(page);
  await tap(page, 0);
  await tap(page, 1);

  const dock = page.getByTestId('status-bar');
  // The status bar is a region without a role; the line is found inside it
  await expect(dock.locator(line(page))).toHaveText(/^2 playing: /);
  await expect(dock.getByRole('button', { name: 'STOP ALL', exact: true })).toBeVisible();
  // A long line gives way and ends in …; it never pushes the dock wider than the window
  await expect(dock.getByRole('button', { name: 'STOP ALL', exact: true })).toBeInViewport({
    ratio: 1,
  });
  const box = (await line(page).boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  // The line really is the long case: its text is wider than the room it got
  expect(await line(page).evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
});

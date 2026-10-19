/**
 * @fileoverview Full E2E — the now-playing line in the status bar and the dock (Slice 13f)
 *
 * docs/product/features/adaptive-layout.md#decided L9 (owner decision 2026-10-11): one line says
 * which sounds play now — "N playing: a · b · c…" or "No sound" —, in the status bar on a wide
 * window and in the dock on a phone; a pad in another deck counts too. Needs playback, so Chromium
 * only (like audio).
 */

import { test, expect, type Page } from '@playwright/test';
import {
  goToBoardList,
  addLoopPad,
  closePadEditor,
  createBoardAndNavigate,
  createDeck,
  enterGameMode,
  enterSetupMode,
  goToLibrary,
  openDeckRail,
  padCells as pads,
  TEST_AUDIO_NAME,
  uploadTestAudio,
} from './helpers';

const line = (page: Page) => page.getByTestId('status-bar-playing-text');
// A new pad takes the file's name, extension included
const NAME = `${TEST_AUDIO_NAME}.wav`;
const tap = (page: Page, n: number) => pads(page).nth(n).getByRole('button').click();

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

test('a pad in another deck still counts', async ({ page }) => {
  // A mode switch stops every sound (Slice 12c): both decks exist before GAME starts
  await createDeck(page);
  const deckButton = (n: number) =>
    page.locator('[data-testid^="deck-rail-select-button-"]').nth(n);
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
    await page.getByTestId('pad-editor-panel-name-input').fill(`Thunder over the village ${n}`);
    await closePadEditor(page);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await enterGameMode(page);
  await tap(page, 0);
  await tap(page, 1);

  const dock = page.getByTestId('status-bar');
  await expect(dock.getByTestId('status-bar-playing-text')).toHaveText(/^2 playing: /);
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

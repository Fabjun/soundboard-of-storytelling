/**
 * @fileoverview Full E2E — Space pauses every sound and resumes it (Slice 12d)
 *
 * docs/product/README.md#input-keyboard--numpad K7 / K8 (owner decisions 2026-09-28): Space
 * pauses all sounds and resumes them on the next press; while paused a sound action resumes
 * everything and plays the new sound; stop actions end the paused sounds; a clearly visible
 * PAUSED shows, as a button in the top bar (owner decision 2026-10-09). Needs playback, so
 * Chromium only.
 */

import { test, expect, type Page } from '@playwright/test';
import {
  addLoopPad,
  createBoardAndNavigate,
  createDeck,
  enterGameMode,
  enterSetupMode,
  goToLibrary,
  padCells as pads,
  uploadTestAudio,
} from './helpers';

const paused = (page: Page) => page.getByTestId('board-top-bar-paused-button');
const playing = (page: Page, n: number) => pads(page).nth(n).getByRole('button', { pressed: true });

/** Space with no control focused (a tapped pad would take Space itself). */
async function pressSpace(page: Page) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('Space');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await uploadTestAudio(page);
  await page.goto('/soundboard-of-storytelling/');
  await page.getByRole('button', { name: 'TAP TO UNLOCK' }).click();
  await page.getByTestId('board-list-screen-new-button').waitFor();
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await addLoopPad(page, 0);
  await addLoopPad(page, 1);
  await enterGameMode(page);
});

test('Space pauses — PAUSED shows, the pads keep their place — and Space resumes', async ({
  page,
}) => {
  await expect(paused(page)).toHaveCount(0);
  await pressSpace(page);
  await expect(paused(page)).toHaveCount(0); // nothing plays — nothing to pause

  await pads(page).nth(0).getByRole('button').click();
  await expect(playing(page, 0)).toBeVisible();
  await pressSpace(page);
  await expect(paused(page)).toBeVisible();
  await expect(playing(page, 0)).toBeVisible(); // paused, not stopped
  await pressSpace(page);
  await expect(paused(page)).toHaveCount(0);
});

test('while paused, a new sound resumes everything; a tap on PAUSED resumes too', async ({
  page,
}) => {
  await pads(page).nth(0).getByRole('button').click();
  await expect(playing(page, 0)).toBeVisible();
  await pressSpace(page);
  await expect(paused(page)).toBeVisible();
  await pads(page).nth(1).getByRole('button').click();
  await expect(paused(page)).toHaveCount(0);
  await expect(playing(page, 0)).toBeVisible();
  await expect(playing(page, 1)).toBeVisible();

  await pressSpace(page);
  await paused(page).click();
  await expect(paused(page)).toHaveCount(0);
});

test('STOP ALL during a pause stops everything at once and ends the pause', async ({ page }) => {
  await pads(page).nth(0).getByRole('button').click();
  await expect(playing(page, 0)).toBeVisible();
  await pressSpace(page);
  await expect(paused(page)).toBeVisible();
  await page.getByTestId('board-top-bar-stop-all-button').click();
  await expect(paused(page)).toHaveCount(0);
  await expect(playing(page, 0)).toHaveCount(0);
  await expect(page.getByTestId('board-top-bar-stop-all-button')).toHaveText('STOP ALL');
});

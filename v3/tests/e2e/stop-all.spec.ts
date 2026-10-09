/**
 * @fileoverview Full E2E — STOP ALL in two stages and "stop the last sound" (Slice 12b)
 *
 * docs/product/README.md#input-keyboard--numpad, K5 / K6 / K9 / K16 (owner decisions 2026-10-08;
 * the button's place and its STOP NOW label 2026-10-09): the STOP ALL
 * button shows in GAME; its first press fades every sound out, a second press while it fades
 * stops at once; the numpad decimal key is the same action; the numpad Enter, and Enter with no
 * control focused, stop the sound started last. Needs playback, so Chromium only (like audio).
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

const stopAll = (page: Page) => page.getByTestId('board-top-bar-stop-all-button');
const playing = (page: Page, n: number) => pads(page).nth(n).getByRole('button', { pressed: true });

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
});

test('STOP ALL shows in GAME only; the first press fades out, a second press during the fade stops', async ({
  page,
}) => {
  await expect(stopAll(page)).toHaveCount(0);
  await enterGameMode(page);
  await expect(stopAll(page)).toHaveText('STOP ALL');

  await pads(page).nth(0).getByRole('button').click();
  await pads(page).nth(1).getByRole('button').click();
  await expect(playing(page, 0)).toBeVisible();
  await expect(playing(page, 1)).toBeVisible();

  await stopAll(page).click();
  await expect(stopAll(page)).toHaveText('STOP NOW');
  await expect(playing(page, 0)).toHaveCount(0);
  await expect(playing(page, 1)).toHaveCount(0);
  await stopAll(page).click();
  // At once, well before the 2.5 s fade would end by itself
  await expect(stopAll(page)).toHaveText('STOP ALL', { timeout: 1_000 });
});

test('after the fade STOP ALL is back to its first stage', async ({ page }) => {
  await enterGameMode(page);
  await pads(page).nth(0).getByRole('button').click();
  await expect(playing(page, 0)).toBeVisible();
  await stopAll(page).click();
  await expect(stopAll(page)).toHaveText('STOP NOW');
  await expect(stopAll(page)).toHaveText('STOP ALL', { timeout: 5_000 });
});

test('the numpad Enter and Enter stop the sound started last; the numpad decimal is STOP ALL', async ({
  page,
}) => {
  await enterGameMode(page);
  await pads(page).nth(0).getByRole('button').click();
  await pads(page).nth(1).getByRole('button').click();
  await expect(playing(page, 1)).toBeVisible();

  // The tapped pad has focus: the numpad Enter still stops the last sound, not the pad
  await page.keyboard.press('NumpadEnter');
  await expect(playing(page, 1)).toHaveCount(0);
  await expect(playing(page, 0)).toBeVisible();

  // Enter with no control focused stops the one before
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('Enter');
  await expect(playing(page, 0)).toHaveCount(0);

  await pads(page).nth(0).getByRole('button').click();
  await expect(playing(page, 0)).toBeVisible();
  await page.keyboard.press('NumpadDecimal');
  await expect(stopAll(page)).toHaveText('STOP NOW');
  await expect(playing(page, 0)).toHaveCount(0);
  await page.keyboard.press('NumpadDecimal');
  await expect(stopAll(page)).toHaveText('STOP ALL', { timeout: 1_000 });
});

// Slice 12c (docs/product/README.md#switching-modes): a mode switch stops every sound at once
test('switching to SETUP stops every sound at once', async ({ page }) => {
  await enterGameMode(page);
  await pads(page).nth(0).getByRole('button').click();
  await pads(page).nth(1).getByRole('button').click();
  await expect(playing(page, 1)).toBeVisible();
  await enterSetupMode(page);
  await enterGameMode(page);
  await expect(playing(page, 0)).toHaveCount(0);
  await expect(playing(page, 1)).toHaveCount(0);
});

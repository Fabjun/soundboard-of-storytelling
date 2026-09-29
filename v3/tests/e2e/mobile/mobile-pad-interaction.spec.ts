// ─────────────────────────────────────────────────────────────────────────────
// Mobile E2E — Pad Touch Interaction (Playwright Chromium, iPhone 13 Pro profile)
//
// SCOPE: This is the core touch-wiring test. Verifies that a pad tap() in GAME
// mode triggers the correct Signal → DOM state change (.sb-pad.is-hot,
// .sb-pad.is-looping) on a 390×844 viewport with hasTouch: true.
//
// Runs under Chromium (not WebKit) because headless WebKit has no audio codec
// support — decodeAudioData fails, the upload pipeline skips the file, and any
// test waiting for library audio times out. Chromium decodes WAV correctly.
// The iPhone 13 Pro device settings (viewport, hasTouch, isMobile, UA) are
// preserved via the mobile-chromium project in playwright.config.ts.
//
// This is the class of bug that has occurred on the real device: pads failed
// to respond to touch events (Touch-Event-Wiring). The test catches it by
// asserting the DOM state change, not by listening for audio output.
//
//   B. SINGLE pad: tap → is-hot; tap again → is-hot gone
//   C. LOOP pad:   tap → is-looping; tap again → is-looping gone
//
// OUT OF SCOPE (see docs/development/manual-iphone-checklist.md):
//   Audio output (headless Chromium — no sound), Ringer Switch, backgrounding.
//   File upload uses the filechooser approach (IMPORT button → chooser.setFiles)
//   which bypasses the iOS native picker — upload is setup infrastructure only.
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect } from '@playwright/test';
import {
  goToLibrary,
  goToBoardList,
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  enterGameMode,
} from '../helpers';
import { mobileUploadTestAudio } from './mobile-helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');

  // Upload audio via IMPORT button filechooser (consistent with WebKit-safe pattern)
  await goToLibrary(page);
  await mobileUploadTestAudio(page);

  // Return to start and tap TAP TO UNLOCK (initialises AudioContext)
  await page.goto('/soundboard-of-storytelling/');
  await page.getByRole('button', { name: 'TAP TO UNLOCK' }).tap();
  await page.getByTestId('new-board-button').waitFor();

  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
});

test('B — SINGLE pad: tap → is-hot; tap again → is-hot removed', async ({ page }) => {
  // Create a SINGLE pad at cell (0,0) via tap on empty cell
  await page.getByTestId('pad-cell-empty-0-0').tap();
  const popover = page.getByTestId('pad-creation-popover');
  await popover.waitFor();

  const sourceItem = page.locator('[data-testid^="creation-source-item-"]').first();
  await sourceItem.waitFor({ timeout: 5_000 });
  await sourceItem.tap();
  // Default type for a 1-second clip is 'single' (< 10 s threshold)
  await page.getByTestId('creation-add-pad').tap();

  const padCell = page
    .locator('[data-testid^="pad-cell-"]:not([data-testid^="pad-cell-empty-"])')
    .first();
  await padCell.waitFor();

  await enterGameMode(page);

  // Core assertion: tap triggers is-hot via the Pointer Events chain
  await padCell.tap();
  await expect(padCell.locator('.sb-pad.is-hot')).toBeVisible({ timeout: 5_000 });

  await padCell.tap();
  await expect(padCell.locator('.sb-pad.is-hot')).not.toBeVisible({ timeout: 3_000 });
});

test('C — LOOP pad: tap → is-looping; tap again → is-looping removed', async ({ page }) => {
  await page.getByTestId('pad-cell-empty-0-0').tap();
  const popover = page.getByTestId('pad-creation-popover');
  await popover.waitFor();

  const sourceItem = page.locator('[data-testid^="creation-source-item-"]').first();
  await sourceItem.waitFor({ timeout: 5_000 });
  await sourceItem.tap();

  // Select the LOOP type pill
  await page.getByRole('button', { name: 'LOOP' }).tap();
  await page.getByTestId('creation-add-pad').tap();

  const padCell = page
    .locator('[data-testid^="pad-cell-"]:not([data-testid^="pad-cell-empty-"])')
    .first();
  await padCell.waitFor();

  await enterGameMode(page);

  await padCell.tap();
  await expect(padCell.locator('.sb-pad.is-looping')).toBeVisible({ timeout: 5_000 });

  await padCell.tap();
  await expect(padCell.locator('.sb-pad.is-looping')).not.toBeVisible({ timeout: 3_000 });
});

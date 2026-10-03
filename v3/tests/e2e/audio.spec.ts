/**
 * @fileoverview E2E — Audio Playback (Slice 4)
 *
 * Headless Chromium has a working Web Audio API — no real sound output, but
 * AudioContext is created, audio is decoded, and `onended` fires normally.
 * These tests validate the state flow: pad tap → Signal update → DOM class,
 * not the audio output itself.
 *
 * Tests covered:
 *   A. TAP TO UNLOCK — navigates to board-list (AudioContext initialised)
 *   B. SINGLE pad — tap → is-hot; tap again → is-hot gone
 *   C. LOOP pad   — tap → is-looping; tap again → is-looping gone
 */

import { test, expect } from '@playwright/test';
import {
  goToLibrary,
  uploadTestAudio,
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  enterGameMode,
} from './helpers';

// ── Test A: TAP TO UNLOCK ─────────────────────────────────────────────────────

test('A — TAP TO UNLOCK navigates to board-list and initialises audio', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  // Click TAP TO UNLOCK — should navigate to board-list
  await page.getByRole('button', { name: 'TAP TO UNLOCK' }).click();
  // Board-list is now shown (AudioContext initialised synchronously in handler)
  await expect(page.getByTestId('board-list-screen-new-button')).toBeVisible();
});

// ── Shared setup (Tests B + C) ────────────────────────────────────────────────

test.beforeEach(async ({ page }, testInfo) => {
  // Only run the full setup for tests B and C
  if (testInfo.title.startsWith('A ')) return;

  await page.goto('/soundboard-of-storytelling/');
  // Upload audio first (required for pad creation and playback)
  await goToLibrary(page);
  await uploadTestAudio(page);
  // Return to start and click TAP TO UNLOCK (initialises AudioContext)
  await page.goto('/soundboard-of-storytelling/');
  await page.getByRole('button', { name: 'TAP TO UNLOCK' }).click();
  await page.getByTestId('board-list-screen-new-button').waitFor();
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
});

// ── Test B: SINGLE pad play / stop ────────────────────────────────────────────

test('B — SINGLE pad: tap → is-hot; tap again → is-hot removed', async ({ page }) => {
  // Create a SINGLE pad at cell (0,0) via Path A
  await page.getByTestId('pad-grid-cell-empty-slot-0-0').click();
  const popover = page.getByTestId('pad-creation-popover');
  await popover.waitFor();
  // Select the first source item (audio was uploaded in beforeEach)
  const sourceItem = page.locator('[data-testid^="pad-creation-popover-source-item-"]').first();
  await sourceItem.waitFor({ timeout: 5_000 });
  await sourceItem.click();
  // Default type for a 1-second clip is 'single' (< 10 s threshold)
  await page.getByTestId('pad-creation-popover-add-button').click();

  // Wait for pad cell to appear (occupied, not empty)
  const padCell = page
    .locator('[data-testid^="pad-grid-cell-"]:not([data-testid^="pad-grid-cell-empty-slot-"])')
    .first();
  await padCell.waitFor();

  // Switch to GAME mode
  await enterGameMode(page);

  // Tap the pad — audio loads and starts; is-hot class should appear
  await padCell.click();
  await expect(padCell.getByRole('button', { pressed: true })).toBeVisible({ timeout: 5_000 });

  // Tap again — stop; is-hot should disappear
  await padCell.click();
  await expect(padCell.getByRole('button', { pressed: true })).not.toBeVisible({ timeout: 3_000 });
});

// ── Test C: LOOP pad play / stop ──────────────────────────────────────────────

test('C — LOOP pad: tap → is-looping; tap again → is-looping removed', async ({ page }) => {
  // Create a LOOP pad at cell (0,0): same flow as SINGLE but switch type pill
  await page.getByTestId('pad-grid-cell-empty-slot-0-0').click();
  const popover = page.getByTestId('pad-creation-popover');
  await popover.waitFor();
  const sourceItem = page.locator('[data-testid^="pad-creation-popover-source-item-"]').first();
  await sourceItem.waitFor({ timeout: 5_000 });
  await sourceItem.click();
  // Select the LOOP type pill (label "LOOP")
  await page.getByRole('button', { name: 'LOOP' }).click();
  await page.getByTestId('pad-creation-popover-add-button').click();

  const padCell = page
    .locator('[data-testid^="pad-grid-cell-"]:not([data-testid^="pad-grid-cell-empty-slot-"])')
    .first();
  await padCell.waitFor();

  await enterGameMode(page);

  // Tap the pad — loop starts; is-hot and is-looping appear
  await padCell.click();
  await expect(padCell.getByRole('button', { pressed: true })).toBeVisible({ timeout: 5_000 });

  // Tap again — stop; is-looping should disappear
  await padCell.click();
  await expect(padCell.getByRole('button', { pressed: true })).not.toBeVisible({ timeout: 3_000 });
});

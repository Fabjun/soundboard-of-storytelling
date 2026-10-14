/**
 * @fileoverview E2E — Audio Playback (Slice 4)
 *
 * Headless Chromium has a working Web Audio API — no real sound output, but
 * AudioContext is created, audio is decoded, and `onended` fires normally.
 * These tests validate the state flow: pad tap → Signal update → DOM class,
 * not the audio output itself.
 *
 * Tests covered:
 *   A. TAP TO START — navigates to board-list (AudioContext initialized)
 *   B. SINGLE pad — tap → is-hot; tap again → is-hot gone
 *   C. LOOP pad   — tap → is-looping; tap again → is-looping gone
 */

import { test, expect } from '@playwright/test';
import {
  goToBoardList,
  goToLibrary,
  uploadTestAudio,
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  enterGameMode,
  PAD_CELL,
} from './helpers';

// ── Test A: TAP TO START ─────────────────────────────────────────────────────

test('A — TAP TO START opens the main menu and initializes audio', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  // The start screen has one action (settings.md S15)
  await page.getByRole('button', { name: 'TAP TO START' }).click();
  // The main menu is shown; the AudioContext was started in the tap handler
  await expect(page.getByTestId('main-menu-screen')).toBeVisible();
  await expect(page.getByText('audio context running · ready')).toBeVisible();
});

// ── Shared setup (Tests B + C) ────────────────────────────────────────────────

test.beforeEach(async ({ page }, testInfo) => {
  // Only run the full setup for tests B and C
  if (testInfo.title.startsWith('A ')) return;

  await page.goto('/soundboard-of-storytelling/');
  // Upload audio first (required for pad creation and playback)
  await goToLibrary(page);
  await uploadTestAudio(page);
  // Back to the start screen: TAP TO START initializes the AudioContext, then BOARD
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
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
  const padCell = page.locator(PAD_CELL).first();
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

  const padCell = page.locator(PAD_CELL).first();
  await padCell.waitFor();

  await enterGameMode(page);

  // Tap the pad — loop starts; is-hot and is-looping appear
  await padCell.click();
  await expect(padCell.getByRole('button', { pressed: true })).toBeVisible({ timeout: 5_000 });

  // Tap again — stop; is-looping should disappear
  await padCell.click();
  await expect(padCell.getByRole('button', { pressed: true })).not.toBeVisible({ timeout: 3_000 });
});

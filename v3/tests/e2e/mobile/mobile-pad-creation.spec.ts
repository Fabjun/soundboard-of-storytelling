// ─────────────────────────────────────────────────────────────────────────────
// Mobile E2E — Pad Creation Flow (Playwright Chromium, iPhone 13 Pro profile)
//
// SCOPE: Verifies that the full pad-creation touch flow (empty cell tap →
// popover → source select → confirm) works on a 390×844 viewport.
//
//   A. Empty cell tap → PadCreationPopover opens
//   B. Source item tap + ADD PAD tap → pad appears in grid
//
// Runs under Chromium (not WebKit) because headless WebKit has no audio codec
// support — decodeAudioData fails, the upload pipeline skips the file, and any
// test waiting for library audio times out. Chromium decodes WAV correctly.
// The iPhone 13 Pro device settings (viewport, hasTouch, isMobile, UA) are
// preserved via the mobile-chromium project in playwright.config.ts.
//
// OUT OF SCOPE (see docs/MANUAL_IPHONE_CHECKLIST.md):
//   File upload via iOS native picker — the filechooser approach (IMPORT button
//   → chooser.setFiles) bypasses the native picker completely. The upload step
//   is setup infrastructure: it proves the pad-creation touch flow, not the
//   file-selection flow. Test the iOS picker manually on the real device.
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect } from '@playwright/test';
import {
  goToLibrary,
  goToBoardList,
  createBoardAndNavigate,
  createScene,
  enterSetupMode,
} from '../helpers';
import { mobileUploadTestAudio } from './mobile-helpers';

test('A+B — empty cell tap opens popover; source + ADD PAD tap creates pad', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');

  // Upload audio via IMPORT button filechooser (consistent with WebKit-safe pattern)
  await goToLibrary(page);
  await mobileUploadTestAudio(page);

  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createScene(page);
  await enterSetupMode(page);

  // Tap empty cell → popover opens (tests touch hit-target on pad grid)
  await page.getByTestId('pad-cell-empty-0-0').tap();
  const popover = page.getByTestId('pad-creation-popover');
  await expect(popover).toBeVisible();

  // Tap source item
  const sourceItem = page.locator('[data-testid^="creation-source-item-"]').first();
  await sourceItem.waitFor({ timeout: 5_000 });
  await sourceItem.tap();

  // Tap ADD PAD
  await page.getByTestId('creation-add-pad').tap();

  // Pad appeared — cell is no longer empty
  await expect(
    page.locator('[data-testid^="pad-cell-"]:not([data-testid^="pad-cell-empty-"])').first(),
  ).toBeVisible();
});

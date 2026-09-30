// ─────────────────────────────────────────────────────────────────────────────
// Mobile test helpers — shared utilities for tests/e2e/mobile/*.spec.ts
//
// NOTE: General navigation/upload helpers are in ../helpers.ts.
// This file contains mobile-specific utilities.
// ─────────────────────────────────────────────────────────────────────────────

import type { Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Absolute path to the 1-second WAV fixture (same file used in helpers.ts). */
const TEST_AUDIO_PATH = path.join(__dirname, '../../fixtures/test-audio-1s.wav');
const TEST_AUDIO_NAME = 'test-audio-1s';

/**
 * Upload the test WAV file to the library using the IMPORT button.
 *
 * In Playwright WebKit, `setInputFiles()` on a `display:none` input does NOT
 * dispatch the change event — the change handler is never called, so
 * processFilesSerial never runs. The `waitForEvent('filechooser')` approach
 * works because tapping the IMPORT button calls `fileInputRef.current.click()`
 * inside a user-gesture stack, which triggers a filechooser event that
 * Playwright can intercept and satisfy with the test file.
 *
 * Audio-dependent tests (pad-interaction, pad-creation) use the mobile-chromium
 * project (Chromium + iPhone 13 Pro device settings) because headless WebKit
 * has no audio codec support — decodeAudioData fails and processFilesSerial
 * skips the file entirely, timing out any test waiting for the filename to appear.
 *
 * Caller must already be on the LibraryScreen.
 */
export async function mobileUploadTestAudio(page: Page): Promise<void> {
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /IMPORT/ }).tap();
  const chooser = await chooserPromise;
  await chooser.setFiles(TEST_AUDIO_PATH);
  await page.getByText(TEST_AUDIO_NAME, { exact: false }).waitFor({
    timeout: 15_000,
  });
}

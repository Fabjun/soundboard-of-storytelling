/**
 * @fileoverview Full E2E — the library's preview (Slice 16b, docs/product/features/library.md L8)
 *
 * ▶ on a row plays the file once through the PAD editor's preview path; ■ stops it, and a file that
 * has played to its end shows ▶ again. Needs playback — Chromium only (headless WebKit cannot
 * decode audio, as for pad-editor-preview).
 */

import { test, expect, type Page } from '@playwright/test';
import { ensureTestAudio, goToLibrary, TEST_AUDIO_NAME } from './helpers';

const name = `${TEST_AUDIO_NAME}.wav`; // the library shows the file name
const play = (page: Page) => page.getByRole('button', { name: `Play ${name}`, exact: true });
const stop = (page: Page) => page.getByRole('button', { name: `Stop ${name}`, exact: true });

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await ensureTestAudio(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
});

test('▶ plays the file, ■ stops it', async ({ page }) => {
  await play(page).click();
  await expect(stop(page)).toBeVisible();
  await stop(page).click();
  // At once — well before the 1 s file ends on its own, which would show ▶ without a working stop
  await expect(play(page)).toBeVisible({ timeout: 400 });
});

test('a file played to its end shows ▶ again', async ({ page }) => {
  await play(page).click();
  await expect(stop(page)).toBeVisible();
  // The test file is 1 s long
  await expect(play(page)).toBeVisible({ timeout: 5_000 });
});

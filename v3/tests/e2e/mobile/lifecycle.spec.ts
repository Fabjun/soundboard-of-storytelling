/**
 * @fileoverview Mobile E2E — what a phone does to the audio around the app (iPhone 13 Pro profile,
 * Chromium for playback)
 *
 * Simulates three items of docs/development/manual-iphone-checklist.md as far as a browser can:
 *   - "Tab switch + return": iOS halts the AudioContext when the app goes to the background. The
 *     test halts it, hides the page and shows it again — the engine must start it again and the
 *     loop plays on.
 *   - "Simultaneous loops": three Loop pads play at once, and STOP ALL ends them.
 *   - "Short clip (< 0.5s)": a 0.2 s Single tapped six times in quick succession ends unlit, and no
 *     error reaches the page.
 * Not simulated: the sound itself, the real iOS lifecycle and memory (checklist, "Why manual").
 */

import { test, expect, type Page } from '@playwright/test';
import {
  addLoopPad,
  createBoardAndNavigate,
  createDeck,
  enterGameMode,
  enterSetupMode,
  goToBoardList,
  goToLibrary,
  padCells as pads,
} from '../helpers';
import { mobileUploadTestAudio } from './helpers';

const playing = (page: Page, n: number) => pads(page).nth(n).getByRole('button', { pressed: true });

/** A mono 16-bit WAV of `seconds` length with a quiet tone — made here, no fixture needed. */
function wav(seconds: number, rate = 8000): Buffer {
  const samples = Math.round(seconds * rate);
  const data = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) {
    data.writeInt16LE(Math.round(Math.sin((i / rate) * 2 * Math.PI * 440) * 3000), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

/** Opens a new board in SETUP with one deck, after TAP TO START unlocked the audio. */
async function newBoardInSetup(page: Page): Promise<void> {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page); // through TAP TO START, which unlocks the audio
  await page.getByTestId('board-list-screen-new-button').waitFor();
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
}

test.beforeEach(async ({ page }) => {
  // Every AudioContext the app makes, so the test can halt it as iOS does in the background
  await page.addInitScript(() => {
    const contexts: AudioContext[] = [];
    (window as unknown as { __contexts: AudioContext[] }).__contexts = contexts;
    const Original = window.AudioContext;
    window.AudioContext = class extends Original {
      constructor(options?: AudioContextOptions) {
        super(options);
        contexts.push(this);
      }
    };
  });
});

test('after the app was in the background the loop plays on: the engine starts the audio again', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await mobileUploadTestAudio(page);
  await newBoardInSetup(page);
  await addLoopPad(page, 0);
  await enterGameMode(page);
  await pads(page).nth(0).getByRole('button').tap();
  await expect(playing(page, 0)).toBeVisible();

  const states = () =>
    page.evaluate(() =>
      (window as unknown as { __contexts: AudioContext[] }).__contexts.map((c) => c.state),
    );
  // To the background: the context halts, the page is hidden — and the test sees that it halted,
  // so the check below cannot pass on an empty list
  await page.evaluate(async () => {
    const contexts = (window as unknown as { __contexts: AudioContext[] }).__contexts;
    await Promise.all(contexts.map((c) => c.suspend()));
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await states()).toContain('suspended');
  // Back to the app
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(states).not.toContain('suspended');
  await expect(playing(page, 0)).toBeVisible();
  expect(errors).toEqual([]);
});

test('three Loop pads play at once; STOP ALL ends all three', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await mobileUploadTestAudio(page);
  await newBoardInSetup(page);
  for (const col of [0, 1, 2]) await addLoopPad(page, col);
  await enterGameMode(page);
  for (const n of [0, 1, 2]) await pads(page).nth(n).getByRole('button').tap();
  for (const n of [0, 1, 2]) await expect(playing(page, n)).toBeVisible();
  const stopAll = page.getByRole('button', { name: /^STOP (ALL|NOW)$/ });
  await stopAll.tap();
  await stopAll.tap(); // the second tap stops at once (Slice 12b)
  for (const n of [0, 1, 2]) await expect(playing(page, n)).toHaveCount(0);
});

test('a 0.2 s Single tapped six times quickly ends unlit, without an error', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /IMPORT/ }).tap();
  await (await chooser).setFiles({ name: 'blip.wav', mimeType: 'audio/wav', buffer: wav(0.2) });
  await page.getByText('blip.wav', { exact: true }).waitFor({ timeout: 15_000 });

  await newBoardInSetup(page);
  await page.getByTestId('pad-grid-cell-empty-slot-0-0').tap();
  await page.locator('[data-testid^="pad-creation-popover-source-item-"]').first().tap();
  await page.getByTestId('pad-creation-popover-add-button').tap();
  await expect(pads(page)).toHaveCount(1);
  await enterGameMode(page);

  const pad = pads(page).nth(0).getByRole('button');
  for (let i = 0; i < 6; i++) await pad.tap();
  await expect(playing(page, 0)).toHaveCount(0, { timeout: 3_000 });
  expect(errors).toEqual([]);
});

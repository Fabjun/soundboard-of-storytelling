/**
 * @fileoverview Full E2E — backup: export and import (Slice 10, D1–D3 / D5, ADR-0061)
 *
 * - A V1 backup (gzip, as V1 writes it) → summary → IMPORT → the board with its pads and the
 *   audio are there and the pad plays
 * - A file that is not a backup → a clear message, nothing imported
 * - EXPORT → SAVE downloads one ZIP file; "last backup" shows today; that file restores the board
 *   and its audio in a fresh browser (round trip)
 *
 * Chromium only: headless WebKit cannot decode audio, and the import decodes every file.
 * Synthetic backups built from the test WAV — the owner's real backup is never committed.
 */

import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';
import {
  goToBoardList,
  TEST_AUDIO_PATH,
  TEST_AUDIO_NAME,
  goToLibrary,
  waitForSaves,
  setupBoardAndDeck,
  createPadAtCell00,
} from './helpers';

const wav = readFileSync(TEST_AUDIO_PATH);
const wavHash = createHash('sha256').update(wav).digest('hex');

/** A V1 backup in V1's own shape (version 179): one board, a single pad and a combo. */
function v1Backup(): Buffer {
  const doc = {
    version: 179,
    exported: '2026-09-28T10:00:00.000Z',
    settings: { 'font-scale': '1.2' },
    boards: [
      {
        id: 'board_1700000000000',
        name: 'Village Night',
        createdAt: 1700000000000,
        pads: [
          { id: 0, name: 'Owl', mode: 'once', files: [wavHash], key: 'Numpad1', volume: 80 },
          { id: 1, name: 'Dusk', mode: 'combo', steps: [{ pads: [0] }], volume: 80 },
        ],
      },
    ],
    library: [
      {
        hash: wavHash,
        name: 'owl.wav',
        type: 'audio/wav',
        size: wav.length,
        data: wav.toString('base64'),
      },
      { hash: 'template-1', type: 'pad', name: 'Template' },
    ],
  };
  return gzipSync(Buffer.from(JSON.stringify(doc)));
}

async function chooseImportFile(page: Page, name: string, buffer: Buffer) {
  await page.getByTestId('board-list-screen-import-input').setInputFiles({
    name,
    mimeType: 'application/gzip',
    buffer,
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
});

test('a V1 backup imports its audio and its board; the pad plays', async ({ page }) => {
  await chooseImportFile(page, 'botc-library-2026-09-28.json.gz', v1Backup());

  const summary = page.getByTestId('backup-import-panel-summary-text');
  await expect(summary).toContainText('Backup from the old app (V1)');
  await expect(summary).toContainText('1 board, 2 pads, 1 audio file — 0 already in the library');
  await expect(summary).toContainText('1 other entry');

  await page.getByTestId('backup-import-panel-confirm-button').click();
  await expect(page.getByTestId('backup-import-panel-result-text')).toContainText(
    'Done: 1 audio file added, 0 already there, 1 board added.',
  );
  await page.getByTestId('backup-import-panel-close-button').click();
  await expect(page.getByTestId('backup-import-panel')).toHaveCount(0);

  // The board is there, with one deck holding both pads
  await expect(page.locator('[data-testid^="board-list-screen-name-text-"]')).toHaveText([
    'Village Night',
  ]);
  // Unlock audio on the start screen (user gesture), then open the board
  await waitForSaves(page);
  await page.goto('/soundboard-of-storytelling/');
  await page.getByRole('button', { name: 'TAP TO UNLOCK' }).click();
  await page.locator('[data-testid^="board-list-screen-name-text-"]').first().click();
  const pads = page.locator(
    '[data-testid^="pad-grid-cell-"]:not([data-testid^="pad-grid-cell-empty-slot-"])',
  );
  await expect(pads).toHaveCount(2);
  await expect(pads.first()).toContainText('Owl');
  await expect(pads.first()).toContainText('Numpad1'); // the V1 key, on the placement

  // GAME mode: the imported pad plays its imported audio
  await page.getByRole('button', { name: 'GAME' }).click();
  await pads.first().getByRole('button').click();
  await expect(pads.first().getByRole('button')).toHaveAttribute('aria-pressed', 'true');

  // The audio is in the library under its V1 name
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await expect(page.getByText('owl.wav')).toBeVisible();
});

test('importing the same backup twice adds the board again but not the audio', async ({ page }) => {
  for (let i = 0; i < 2; i++) {
    await chooseImportFile(page, 'backup.json.gz', v1Backup());
    await page.getByTestId('backup-import-panel-confirm-button').click();
    await expect(page.getByTestId('backup-import-panel-result-text')).toContainText('Done');
    await page.getByTestId('backup-import-panel-close-button').click();
  }
  await expect(page.locator('[data-testid^="board-list-screen-name-text-"]')).toHaveText([
    'Village Night',
    'Village Night (2)',
  ]);
});

test('a file that is not a backup is refused with a message', async ({ page }) => {
  await page.getByTestId('board-list-screen-import-input').setInputFiles({
    name: 'notes.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"shopping": ["milk"]}'),
  });
  await expect(page.getByTestId('backup-import-panel-error-text')).toHaveText(
    'This file is not a Soundboard backup. Choose a file saved by EXPORT or by the old app (V1).',
  );
  await page.getByTestId('backup-import-panel-close-button').click();
  await expect(page.locator('[data-testid^="board-list-screen-row-"]')).toHaveCount(0);
});

test('no backup yet: the board list reminds to export', async ({ page }) => {
  await expect(page.getByTestId('board-list-screen-backup-text')).toHaveText(
    'No backup yet — EXPORT saves your boards and audio in one file.',
  );
});

test('EXPORT saves one file that restores the board and its audio in a fresh browser', async ({
  page,
  browser,
}) => {
  // A board with a pad that plays the uploaded test audio (the helper starts on the start screen)
  await page.goto('/soundboard-of-storytelling/');
  await setupBoardAndDeck(page);
  await createPadAtCell00(page); // named after the test audio file
  await waitForSaves(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);

  await page.getByTestId('board-list-screen-export-button').click();
  await expect(page.getByTestId('backup-export-panel-ready-text')).toContainText(
    /soundboard-backup-\d{4}-\d{2}-\d{2}\.zip/,
  );
  const downloading = page.waitForEvent('download');
  await page.getByTestId('backup-export-panel-save-button').click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/^soundboard-backup-\d{4}-\d{2}-\d{2}\.zip$/);
  const path = await download.path();
  await expect(page.getByTestId('backup-export-panel-saved-text')).toBeVisible();
  await expect(page.getByTestId('board-list-screen-backup-text')).toHaveText('Last backup: today');

  // A fresh browser (empty storage) imports the file
  const fresh = await browser.newContext();
  const other = await fresh.newPage();
  await other.goto('/soundboard-of-storytelling/');
  await goToBoardList(other);
  await other.getByTestId('board-list-screen-import-input').setInputFiles(path);
  await expect(other.getByTestId('backup-import-panel-summary-text')).toContainText(
    '1 board, 1 pad, 1 audio file — 0 already in the library',
  );
  await other.getByTestId('backup-import-panel-confirm-button').click();
  await expect(other.getByTestId('backup-import-panel-result-text')).toContainText(
    'Done: 1 audio file added, 0 already there, 1 board added.',
  );
  await other.getByTestId('backup-import-panel-close-button').click();
  await other.locator('[data-testid^="board-list-screen-name-text-"]').first().click();
  const pads = other.locator(
    '[data-testid^="pad-grid-cell-"]:not([data-testid^="pad-grid-cell-empty-slot-"])',
  );
  await expect(pads).toHaveCount(1);
  await expect(pads.first()).toContainText(TEST_AUDIO_NAME);
  await fresh.close();
});

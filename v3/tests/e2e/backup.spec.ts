/**
 * @fileoverview Full E2E — backup: export and import (Slice 10, D1–D3 / D5, ADR-0061)
 *
 * - A V1 backup (gzip, as V1 writes it) → summary → IMPORT → the board with its pads and the
 *   audio are there and the pad plays
 * - A file that is not a backup → a clear message, nothing imported
 * - EXPORT → SAVE downloads one ZIP file; "last backup" shows today; that file restores the board
 *   and its audio in a fresh browser (round trip)
 * - The own icons (ADR-0092) go along: the fresh browser lists them in the library's ICONS tab
 *
 * Chromium only: headless WebKit cannot decode audio, and the import decodes every file.
 * Synthetic backups built from the test WAV — the owner's real backup is never committed.
 */

import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  boardOpenButtons,
  goToBoardList,
  TEST_AUDIO_PATH,
  TEST_AUDIO_NAME,
  goToLibrary,
  waitForSaves,
  setupBoardAndDeck,
  createPadAtCell00,
  PAD_CELL,
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
      { hash: 'template-1', type: 'pad', name: 'Template' }, // no padData: no template
      {
        hash: 'pad_1700000000001',
        type: 'pad',
        name: 'Owl call',
        added: 1700000000001,
        padData: { name: 'Owl', mode: 'once', files: [wavHash], volume: 70 },
      },
    ],
  };
  return gzipSync(Buffer.from(JSON.stringify(doc)));
}

/** The import and export panels of the board list, each a named region. */
const importPanel = (p: Page) => p.getByRole('region', { name: 'Backup import', exact: true });
const exportPanel = (p: Page) => p.getByRole('region', { name: 'Backup export', exact: true });
/** What a panel says — its status region (progress, summary, result, error). */
const message = (panel: Locator) => panel.getByRole('status');
const button = (panel: Locator, name: string) => panel.getByRole('button', { name, exact: true });
/** The board list's line about the last backup. */
const backupLine = (p: Page) => p.getByText(/^(No backup yet|Last backup:)/);

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

  const summary = message(importPanel(page));
  await expect(summary).toContainText('Backup from the old app (V1)');
  await expect(summary).toContainText('1 board, 2 pads, 1 audio file — 0 already in the library');
  await expect(summary).toContainText('1 pad template');
  await expect(summary).toContainText('1 other entry');

  await button(importPanel(page), 'IMPORT').click();
  await expect(message(importPanel(page))).toContainText(
    'Done: 1 audio file added, 0 already there, 1 board added, 1 pad template added.',
  );
  await button(importPanel(page), 'OK').click();
  await expect(importPanel(page)).toHaveCount(0);

  // The board is there, with one deck holding both pads
  await expect(boardOpenButtons(page)).toHaveCount(1);
  await expect(boardOpenButtons(page)).toHaveAccessibleName(/^Village Night 1 deck · 2 pads$/);
  // Unlock audio on the start screen (user gesture), then open the board
  await waitForSaves(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page); // through TAP TO START, which unlocks the audio
  await boardOpenButtons(page).first().click();
  const pads = page.locator(PAD_CELL);
  await expect(pads).toHaveCount(2);
  await expect(pads.first()).toContainText('Owl');
  await expect(pads.first()).toContainText('N1'); // the V1 key, on the placement

  // GAME mode: the imported pad plays its imported audio
  await page.getByRole('button', { name: 'GAME', exact: true }).click();
  await pads.first().getByRole('button').click();
  await expect(pads.first().getByRole('button')).toHaveAttribute('aria-pressed', 'true');

  // The audio is in the library under its V1 name
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await expect(page.getByText('owl.wav', { exact: true })).toBeVisible();
});

test('importing the same backup twice adds the board again but not the audio', async ({ page }) => {
  for (let i = 0; i < 2; i++) {
    await chooseImportFile(page, 'backup.json.gz', v1Backup());
    await button(importPanel(page), 'IMPORT').click();
    // The template comes once: the second import finds it there (ADR-0090)
    await expect(message(importPanel(page))).toContainText(
      i === 0 ? '1 pad template added' : '0 pad templates added',
    );
    await button(importPanel(page), 'OK').click();
  }
  await expect(boardOpenButtons(page)).toHaveCount(2);
  await expect(boardOpenButtons(page).nth(0)).toHaveAccessibleName(/^Village Night \d/);
  await expect(boardOpenButtons(page).nth(1)).toHaveAccessibleName(/^Village Night \(2\) \d/);
});

test('a file that is not a backup is refused with a message', async ({ page }) => {
  await page.getByTestId('board-list-screen-import-input').setInputFiles({
    name: 'notes.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"shopping": ["milk"]}'),
  });
  await expect(message(importPanel(page))).toHaveText(
    'This file is not a Soundboard backup. Choose a file saved by EXPORT or by the old app (V1).',
  );
  await button(importPanel(page), 'CLOSE').click();
  await expect(boardOpenButtons(page)).toHaveCount(0);
});

test('no backup yet: the board list reminds to export', async ({ page }) => {
  await expect(backupLine(page)).toHaveText(
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

  await page.getByRole('button', { name: 'EXPORT', exact: true }).click();
  await expect(message(exportPanel(page))).toContainText(
    /soundboard-backup-\d{4}-\d{2}-\d{2}\.zip/,
  );
  const downloading = page.waitForEvent('download');
  await button(exportPanel(page), 'SAVE').click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/^soundboard-backup-\d{4}-\d{2}-\d{2}\.zip$/);
  const path = await download.path();
  await expect(message(exportPanel(page))).toHaveText('Backup saved.');
  await expect(backupLine(page)).toHaveText('Last backup: today');

  // A fresh browser (empty storage) imports the file
  const fresh = await browser.newContext();
  const other = await fresh.newPage();
  await other.goto('/soundboard-of-storytelling/');
  await goToBoardList(other);
  await other.getByTestId('board-list-screen-import-input').setInputFiles(path);
  await expect(message(importPanel(other))).toContainText(
    '1 board, 1 pad, 1 audio file — 0 already in the library',
  );
  await button(importPanel(other), 'IMPORT').click();
  await expect(message(importPanel(other))).toContainText(
    'Done: 1 audio file added, 0 already there, 1 board added.',
  );
  await button(importPanel(other), 'OK').click();
  await boardOpenButtons(other).first().click();
  const pads = other.locator(PAD_CELL);
  await expect(pads).toHaveCount(1);
  await expect(pads.first()).toContainText(TEST_AUDIO_NAME);
  await fresh.close();
});

test('a backup carries the own icons into a fresh browser (ADR-0092)', async ({
  page,
  browser,
}) => {
  const iconsTab = (p: Page) => p.getByRole('tab', { name: /^ICONS\s*\d+$/ });
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await iconsTab(page).click();
  await page.getByTestId('own-icons-tab-file-input').setInputFiles({
    name: 'Owl.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8"/></svg>',
    ),
  });
  await expect(page.getByText('Owl', { exact: true })).toBeVisible();
  await waitForSaves(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await page.getByRole('button', { name: 'EXPORT', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await button(exportPanel(page), 'SAVE').click();
  const path = await (await downloading).path();

  const fresh = await browser.newContext();
  const other = await fresh.newPage();
  await other.goto('/soundboard-of-storytelling/');
  await goToBoardList(other);
  await other.getByTestId('board-list-screen-import-input').setInputFiles(path);
  await expect(message(importPanel(other))).toContainText(
    '1 own icon — one already there is skipped.',
  );
  await button(importPanel(other), 'IMPORT').click();
  await expect(message(importPanel(other))).toContainText('1 own icon added');
  await button(importPanel(other), 'OK').click();
  await other.goto('/soundboard-of-storytelling/');
  await goToLibrary(other);
  await iconsTab(other).click();
  await expect(other.getByText('Owl', { exact: true })).toBeVisible();
  await fresh.close();
});

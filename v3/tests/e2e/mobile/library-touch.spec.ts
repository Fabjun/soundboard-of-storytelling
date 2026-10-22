/**
 * @fileoverview Mobile E2E — the library by touch (WebKit, iPhone 13 Pro profile)
 *
 * Simulates the library items of docs/development/manual-iphone-checklist.md with touch taps on a
 * 390 px phone, in the Safari engine:
 *   - "Delete for good asks first": two quick taps on the same bin — the first opens the question,
 *     the second lands on the dialog and does not delete (owner decision 2026-10-20, D7).
 *   - "Select several files and delete them": a tap on a file's name ticks its box.
 *   - "Folders": the folder choice above the list, MOVE into a new folder by touch, kept over a
 *     reload (the closest a browser test gets to closing and opening the app).
 * Not simulated: the phone's keyboard and native pickers, real storage (checklist, "Why manual").
 * The files are seeded as metadata — headless WebKit cannot decode audio.
 */

import { test, expect, type Page } from '@playwright/test';
import { goToLibrary, reloadApp, seedTestAudio, type SeedAudio } from '../helpers';

const files: SeedAudio[] = ['Rain.mp3', 'Thunder.mp3'].map((name, i) => ({
  id: `e2e${String(i + 8).padStart(61, '0')}`,
  name,
  duration: 2,
}));

const fileRow = (page: Page, file: string) =>
  page.getByRole('button', { name: `Rename ${file}`, exact: true });
const box = (page: Page, file: string) =>
  page.getByRole('checkbox', { name: new RegExp(`^${file.replace('.', '\\.')}`) });

test.beforeEach(async ({ page }) => {
  for (const file of files) await seedTestAudio(page, file);
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  for (const file of files) await expect(fileRow(page, file.name)).toBeVisible();
});

test('two quick taps on the bin in Recently deleted open the question and delete nothing', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Delete Rain.mp3', exact: true }).tap();
  await page.getByRole('button', { name: /^Recently deleted/ }).tap();
  const bin = page.getByRole('button', { name: 'Delete Rain.mp3 for good', exact: true });
  const b = (await bin.boundingBox())!;
  const x = b.x + b.width / 2;
  const y = b.y + b.height / 2;
  await page.touchscreen.tap(x, y);
  await expect(page.getByRole('alertdialog')).toBeVisible(); // the first tap asks
  await page.touchscreen.tap(x, y); // the finger lands on the same spot again at once

  // On a 390 px phone the second tap lands on the dialog's text (measured 2026-10-22: bin at
  // x 326–370, dialog x 35–355), which does nothing — the question still waits, nothing is deleted
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'CANCEL', exact: true }).tap();
  await expect(page.getByRole('button', { name: 'Restore Rain.mp3', exact: true })).toBeVisible();
});

test('in select mode a tap on a file name ticks its box', async ({ page }) => {
  await page.getByRole('button', { name: 'SELECT', exact: true }).tap();
  await page.getByText('Thunder.mp3', { exact: true }).tap();
  await expect(box(page, 'Thunder.mp3')).toBeChecked();
  await expect(box(page, 'Rain.mp3')).not.toBeChecked();
  await expect(page.getByRole('toolbar', { name: 'Selected files', exact: true })).toContainText(
    '1 file selected',
  );
});

test('MOVE by touch into a new folder; the folder choice opens it; kept over a reload', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'SELECT', exact: true }).tap();
  await page.getByText('Rain.mp3', { exact: true }).tap();
  await page.getByText('Thunder.mp3', { exact: true }).tap();
  await page
    .getByRole('toolbar', { name: 'Selected files', exact: true })
    .getByRole('button', { name: 'MOVE', exact: true })
    .tap();
  const dialog = page.getByRole('alertdialog');
  await dialog.getByText('New folder', { exact: true }).tap();
  await dialog.getByRole('textbox', { name: 'Name of the new folder', exact: true }).fill('Storm');
  await dialog.getByRole('button', { name: 'MOVE', exact: true }).tap();

  await reloadApp(page);
  await goToLibrary(page);
  await page.getByRole('combobox', { name: 'Folder', exact: true }).selectOption('Storm');
  await expect(page.getByRole('toolbar', { name: 'Folder', exact: true })).toContainText(
    "Folder 'Storm' · 2 files",
  );
});

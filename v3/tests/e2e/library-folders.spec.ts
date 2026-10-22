/**
 * @fileoverview Full E2E — the library's folders (Slice 16c, docs/product/features/library.md L2, ADR-0088)
 *
 * A file is in one folder or in none. The folders a V1 import kept as tags (B9) are folders at
 * once; MOVE in select mode puts files into a folder (also a new one), RENAME and REMOVE FOLDER work
 * on the open folder, and each move and remove offers UNDO. Everything is kept over a reload. Needs
 * no playback — runs in WebKit too (the files are seeded, metadata only).
 */

import { test, expect, type Page } from '@playwright/test';
import { goToLibrary, reloadApp, seedTestAudio, type SeedAudio } from './helpers';

const files: SeedAudio[] = [
  { name: 'Owl.mp3', tags: ['Forest'] },
  { name: 'Rain.mp3' },
  { name: 'Thunder.mp3' },
].map((f, i) => ({ id: `e2e${String(i + 5).padStart(61, '0')}`, duration: 2, ...f }));

const fileRow = (page: Page, file: string) =>
  page.getByRole('button', { name: `Rename ${file}`, exact: true });
const folderButton = (page: Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^${name} \\d+$`) });
const allButton = (page: Page) => page.getByRole('button', { name: /^All \d+$/ });
const box = (page: Page, file: string) =>
  page.getByRole('checkbox', { name: new RegExp(`^${file.replace('.', '\\.')}`) });
const toolbar = (page: Page, name: string) => page.getByRole('toolbar', { name, exact: true });
const toast = (page: Page) => page.getByTestId('undo-toast');
const undo = (page: Page) => toast(page).getByRole('button', { name: 'UNDO', exact: true });

async function moveToNewFolder(page: Page, chosen: string[], folder: string): Promise<void> {
  await page.getByRole('button', { name: 'SELECT', exact: true }).click();
  for (const file of chosen) await box(page, file).check();
  await toolbar(page, 'Selected files').getByRole('button', { name: 'MOVE', exact: true }).click();
  const dialog = page.getByRole('alertdialog');
  await dialog.getByRole('radio', { name: 'New folder', exact: true }).check();
  await dialog.getByRole('textbox', { name: 'Name of the new folder', exact: true }).fill(folder);
  await dialog.getByRole('button', { name: 'MOVE', exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  for (const file of files) await seedTestAudio(page, file);
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  for (const file of files) await expect(fileRow(page, file.name)).toBeVisible();
});

test('a V1 folder kept as a tag is a folder; opening it lists only its files', async ({ page }) => {
  await expect(folderButton(page, 'Forest')).toContainText('1');
  await folderButton(page, 'Forest').click();
  await expect(fileRow(page, 'Owl.mp3')).toBeVisible();
  await expect(fileRow(page, 'Rain.mp3')).toHaveCount(0);
  await expect(page.getByPlaceholder('Search 1 file in Forest…')).toBeVisible();
  await allButton(page).click();
  await expect(fileRow(page, 'Rain.mp3')).toBeVisible();
});

test('MOVE puts two files in a new folder; UNDO takes them out again; kept over a reload', async ({
  page,
}) => {
  await moveToNewFolder(page, ['Rain.mp3', 'Thunder.mp3'], 'Storm');
  await expect(toast(page)).toContainText("Moved 2 files to 'Storm'");
  await expect(folderButton(page, 'Storm')).toBeVisible();
  await undo(page).click();
  await expect(folderButton(page, 'Storm')).toHaveCount(0);

  await moveToNewFolder(page, ['Rain.mp3', 'Thunder.mp3'], 'Storm');
  await expect(folderButton(page, 'Storm')).toBeVisible();
  await reloadApp(page);
  await goToLibrary(page);
  await folderButton(page, 'Storm').click();
  await expect(fileRow(page, 'Rain.mp3')).toBeVisible();
  await expect(fileRow(page, 'Thunder.mp3')).toBeVisible();
  await expect(fileRow(page, 'Owl.mp3')).toHaveCount(0);
});

test('a new name that differs only in case joins the folder', async ({ page }) => {
  await moveToNewFolder(page, ['Rain.mp3'], 'FOREST');
  await expect(toast(page)).toContainText("Moved 1 file to 'Forest'");
  await expect(folderButton(page, 'Forest')).toContainText('2');
});

test('RENAME renames the open folder; REMOVE FOLDER keeps its files and UNDO brings it back', async ({
  page,
}) => {
  await folderButton(page, 'Forest').click();
  const bar = toolbar(page, 'Folder');
  await bar.getByRole('button', { name: 'RENAME', exact: true }).click();
  await bar.getByRole('textbox', { name: 'Folder name', exact: true }).fill('Woods');
  await bar.getByRole('button', { name: 'SAVE', exact: true }).click();
  await expect(folderButton(page, 'Woods')).toBeVisible();
  await expect(folderButton(page, 'Forest')).toHaveCount(0);
  await expect(bar).toContainText("Folder 'Woods' · 1 file");

  await bar.getByRole('button', { name: 'REMOVE FOLDER', exact: true }).click();
  await expect(folderButton(page, 'Woods')).toHaveCount(0);
  await expect(fileRow(page, 'Owl.mp3')).toBeVisible(); // back in All, not deleted
  await expect(toast(page)).toContainText("Removed folder 'Woods'");
  await undo(page).click();
  await expect(folderButton(page, 'Woods')).toBeVisible();
});

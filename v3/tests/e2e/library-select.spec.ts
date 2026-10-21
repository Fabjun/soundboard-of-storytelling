/**
 * @fileoverview Full E2E — the library's select mode (Slice 16c, docs/product/features/library.md L3)
 *
 * SELECT shows a checkbox on each row and a bar with SELECT ALL and DELETE; DONE ends it. A bulk
 * delete is the single delete's way (D4): the files go to "Recently deleted" and one toast offers
 * UNDO for all of them. Selection acts on the files shown — a search hides the others. Needs no
 * playback — runs in WebKit too (the files are seeded, metadata only).
 */

import { test, expect, type Page } from '@playwright/test';
import { goToLibrary, seedTestAudio, type SeedAudio } from './helpers';

const files: SeedAudio[] = ['Rain', 'Thunder', 'Wind'].map((name, i) => ({
  id: `e2e${String(i + 2).padStart(61, '0')}`,
  name: `${name}.mp3`,
  duration: 2,
}));

// The checkbox's label is the file name and the hint below it
const box = (page: Page, file: string) =>
  page.getByRole('checkbox', { name: new RegExp(`^${file.replace('.', '\\.')}`) });
const bar = (page: Page) => page.getByRole('toolbar', { name: 'Selected files', exact: true });
const clearSearch = (page: Page) =>
  page.getByRole('button', { name: 'Clear the search', exact: true });
const fileRow = (page: Page, file: string) =>
  page.getByRole('button', { name: `Rename ${file}`, exact: true });
const select = (page: Page) => page.getByRole('button', { name: 'SELECT', exact: true });
const toast = (page: Page) => page.getByTestId('undo-toast');

test.beforeEach(async ({ page }) => {
  for (const file of files) await seedTestAudio(page, file);
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  for (const file of files) await expect(fileRow(page, file.name)).toBeVisible();
});

test('SELECT, two files, DELETE: both go in one tap; one UNDO brings both back', async ({
  page,
}) => {
  await select(page).click();
  await expect(page.getByRole('button', { name: /^Delete .*\.mp3$/ })).toHaveCount(0);
  await expect(bar(page)).toContainText('0 files selected');
  await box(page, 'Rain.mp3').check();
  await box(page, 'Wind.mp3').check();
  await expect(bar(page)).toContainText('2 files selected');
  await bar(page).getByRole('button', { name: 'DELETE', exact: true }).click();

  await expect(fileRow(page, 'Rain.mp3')).toHaveCount(0);
  await expect(fileRow(page, 'Wind.mp3')).toHaveCount(0);
  await expect(fileRow(page, 'Thunder.mp3')).toBeVisible();
  await expect(select(page)).toBeVisible(); // the delete ends the select mode
  await expect(toast(page)).toContainText('Deleted 2 files');

  await toast(page).getByRole('button', { name: 'UNDO', exact: true }).click();
  for (const file of files) await expect(fileRow(page, file.name)).toBeVisible();
});

test('SELECT ALL takes the files the search shows; SELECT NONE and DONE change nothing', async ({
  page,
}) => {
  await page.getByPlaceholder('Search 3 files…').fill('in'); // Rain, Wind
  await select(page).click();
  const del = bar(page).getByRole('button', { name: 'DELETE', exact: true });
  await expect(del).toBeDisabled();

  await bar(page).getByRole('button', { name: 'SELECT ALL', exact: true }).click();
  await expect(bar(page)).toContainText('2 files selected');
  await expect(box(page, 'Rain.mp3')).toBeChecked();
  await expect(box(page, 'Wind.mp3')).toBeChecked();
  await expect(del).toBeEnabled();

  await bar(page).getByRole('button', { name: 'SELECT NONE', exact: true }).click();
  await expect(bar(page)).toContainText('0 files selected');
  await page.getByRole('button', { name: 'DONE', exact: true }).click();
  await expect(bar(page)).toHaveCount(0);
  await clearSearch(page).click();
  for (const file of files) await expect(fileRow(page, file.name)).toBeVisible();
});

test('a file the search hides is not deleted with the selection', async ({ page }) => {
  await select(page).click();
  await box(page, 'Thunder.mp3').check();
  await box(page, 'Rain.mp3').check();
  await page.getByPlaceholder('Search 3 files…').fill('Rain');
  await expect(bar(page)).toContainText('1 file selected');
  await bar(page).getByRole('button', { name: 'DELETE', exact: true }).click();
  await expect(toast(page)).toContainText("Deleted 'Rain.mp3'");
  await clearSearch(page).click();
  await expect(fileRow(page, 'Thunder.mp3')).toBeVisible();
  await expect(fileRow(page, 'Rain.mp3')).toHaveCount(0);
});

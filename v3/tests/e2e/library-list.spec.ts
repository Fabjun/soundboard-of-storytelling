/**
 * @fileoverview Full E2E — the library list of Slice 16b (docs/product/features/library.md)
 *
 * A renamed file shows the name it was uploaded with ("← name", V1's original name), also after a
 * reload. Needs no playback — runs in WebKit too (the audio is seeded there with its file name).
 */

import { test, expect, type Page } from '@playwright/test';
import { ensureTestAudio, goToLibrary, reloadApp, seedTestAudio, TEST_AUDIO_NAME } from './helpers';

const uploaded = `${TEST_AUDIO_NAME}.wav`; // the library shows the file name

const renameButton = (page: Page, name: string) =>
  page.getByRole('button', { name: `Rename ${name}`, exact: true });

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await ensureTestAudio(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await expect(renameButton(page, uploaded)).toBeVisible();
});

test('a renamed file shows its original name, also after a reload', async ({ page }) => {
  await renameButton(page, uploaded).click();
  await page.getByRole('textbox', { name: 'File name', exact: true }).fill('Owl at night');
  await page.keyboard.press('Enter');
  const row = renameButton(page, 'Owl at night');
  await expect(row).toContainText(`← ${uploaded}`);

  await reloadApp(page);
  await goToLibrary(page);
  await expect(renameButton(page, 'Owl at night')).toContainText(`← ${uploaded}`);
});

// library.md L9: the sort of All pads with a file's keys — newest first until another is chosen
test('the list is newest first; Duration and reverse reorder it and are kept', async ({ page }) => {
  // A second, longer file, added after the first
  await seedTestAudio(page, {
    id: 'e2e0000000000000000000000000000000000000000000000000000000000002',
    name: 'long-12s.wav',
    duration: 12,
  });
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  const order = () =>
    page
      .getByRole('button', { name: /^Rename / }) // every file row, in list order
      .evaluateAll((rows) => rows.map((r) => r.getAttribute('aria-label')));
  const newestFirst = [`Rename long-12s.wav`, `Rename ${uploaded}`];
  await expect.poll(order).toEqual(newestFirst);

  await page.getByRole('combobox', { name: 'Sort files by', exact: true }).selectOption('duration');
  await expect.poll(order).toEqual([...newestFirst].reverse()); // shortest first
  await page.getByRole('button', { name: 'Reverse the order', exact: true }).click();
  await expect.poll(order).toEqual(newestFirst); // longest first

  await reloadApp(page);
  await goToLibrary(page);
  await expect.poll(order).toEqual(newestFirst);
  await expect(page.getByRole('combobox', { name: 'Sort files by', exact: true })).toHaveValue(
    'duration',
  );
});

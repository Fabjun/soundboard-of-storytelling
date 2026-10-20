/**
 * @fileoverview Full E2E — the library's "Recently deleted" (Slice 16a, ADR-0087)
 *
 * A delete is one tap: the file moves to the trash and the toast offers UNDO, saying how many pads
 * lose their sound; each file says in how many pads it plays (library.md L5). In "Recently deleted"
 * RESTORE puts a file back; deleting for good and EMPTY ask first in a dialog (D7, owner decision
 * 2026-10-20). Needs no playback — runs in WebKit too (the audio is seeded there).
 */

import { test, expect, type Page } from '@playwright/test';
import {
  createBoardAndNavigate,
  createDeck,
  createPadAtCell00,
  enterSetupMode,
  ensureTestAudio,
  goToBoardList,
  goToLibrary,
  reloadApp,
  TEST_AUDIO_NAME,
} from './helpers';

const name = `${TEST_AUDIO_NAME}.wav`; // the library shows the file name
const fileRow = (page: Page) => page.getByRole('button', { name: `Rename ${name}`, exact: true });
// The category buttons carry their count ("Recently deleted 1") — a pattern for the changing part
const trashCategory = (page: Page) => page.getByRole('button', { name: /^Recently deleted/ });
const allCategory = (page: Page) => page.getByRole('button', { name: /^All/ });
const toast = (page: Page) => page.getByTestId('undo-toast');

async function deleteFile(page: Page): Promise<void> {
  await page.getByRole('button', { name: `Delete ${name}`, exact: true }).click();
  await expect(fileRow(page)).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await ensureTestAudio(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await expect(fileRow(page)).toBeVisible();
});

test('a delete is one tap; UNDO in the toast puts the file back', async ({ page }) => {
  await deleteFile(page);
  await expect(toast(page)).toContainText(`Deleted '${name}'`);
  await toast(page).getByRole('button', { name: 'UNDO', exact: true }).click();
  await expect(fileRow(page)).toBeVisible();
  await trashCategory(page).click();
  await expect(page.getByText('Nothing deleted recently.', { exact: true })).toBeVisible();
});

test('Recently deleted keeps the file over a reload; RESTORE puts it back', async ({ page }) => {
  await deleteFile(page);
  await reloadApp(page);
  await goToLibrary(page);
  await expect(fileRow(page)).toHaveCount(0);
  await trashCategory(page).click();
  await expect(page.getByText('30 days left', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: `Restore ${name}`, exact: true }).click();
  await expect(page.getByText('Nothing deleted recently.', { exact: true })).toBeVisible();
  await allCategory(page).click();
  await expect(fileRow(page)).toBeVisible();
});

test('deleting for good asks first: CANCEL keeps the file, DELETE removes it', async ({ page }) => {
  await deleteFile(page);
  await trashCategory(page).click();
  const forGood = page.getByRole('button', { name: `Delete ${name} for good`, exact: true });
  const question = page.getByRole('alertdialog', {
    name: `Delete '${name}' for good?`,
    exact: true,
  });

  await forGood.click();
  await expect(question).toBeVisible();
  const cancel = question.getByRole('button', { name: 'CANCEL', exact: true });
  await expect(cancel).toBeFocused(); // the safe answer first: a double tap does not delete
  await cancel.click();
  await expect(question).toHaveCount(0);
  await expect(forGood).toBeVisible();

  await forGood.click();
  await question.getByRole('button', { name: 'DELETE', exact: true }).click();
  await expect(page.getByText('Nothing deleted recently.', { exact: true })).toBeVisible();
  await reloadApp(page);
  await goToLibrary(page);
  await trashCategory(page).click();
  await expect(page.getByText('Nothing deleted recently.', { exact: true })).toBeVisible();
});

test('EMPTY asks first, then removes every deleted file', async ({ page }) => {
  await deleteFile(page);
  await trashCategory(page).click();
  await page.getByRole('button', { name: 'EMPTY', exact: true }).click();
  const question = page.getByRole('alertdialog', { name: 'Delete 1 file for good?', exact: true });
  await question.getByRole('button', { name: 'DELETE', exact: true }).click();
  await expect(page.getByText('Nothing deleted recently.', { exact: true })).toBeVisible();
});

test('a file says in how many pads it plays; deleting it says they lose their sound', async ({
  page,
}) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await createPadAtCell00(page);
  await reloadApp(page);
  await goToLibrary(page);
  await expect(fileRow(page)).toContainText('in 1 pad ·');
  await deleteFile(page);
  await expect(toast(page)).toContainText(`Deleted '${name}' · 1 pad loses its sound`);
});

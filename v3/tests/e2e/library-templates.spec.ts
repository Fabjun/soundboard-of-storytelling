/**
 * @fileoverview Full E2E — pad templates (Slice 16d, docs/product/features/library.md L6, ADR-0090)
 *
 * SAVE AS TEMPLATE in the PAD editor keeps a copy of the pad; the library's PADS tab lists it, and
 * ADD puts a new pad from it on a board's deck — kept over a reload. A template is renamed in place
 * and deleted in one tap with UNDO. Needs no playback — runs in WebKit too (the audio is seeded).
 */

import { test, expect, type Page } from '@playwright/test';
import {
  closePadEditor,
  createBoardAndNavigate,
  createDeck,
  createPadAtCell00,
  enterSetupMode,
  ensureTestAudio,
  goToBoardList,
  goToLibrary,
  padCells,
  reopenFirstBoard,
} from './helpers';

const padsTab = (page: Page) => page.getByRole('tab', { name: /^PADS\s*\d+$/ });
const templateRow = (page: Page, name: string) =>
  page.getByRole('button', { name: `Rename template ${name}`, exact: true });

/** A board with one deck and one pad, its editor open, the pad named `name` and saved. */
async function padInEditor(page: Page, name: string): Promise<void> {
  await ensureTestAudio(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await createPadAtCell00(page);
  await padCells(page).first().click();
  await page.getByTestId('pad-editor-panel-name-input').fill(name);
  await page.getByTestId('pad-editor-panel-save-button').click();
}

test('SAVE AS TEMPLATE, then ADD puts a copy on the deck — kept over a reload', async ({
  page,
}) => {
  await padInEditor(page, 'Owl');
  await page.getByRole('button', { name: 'SAVE AS TEMPLATE', exact: true }).click();
  await expect(page.getByText(/^Saved as a template: 'Owl'/)).toBeVisible();
  await closePadEditor(page);

  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await expect(padsTab(page)).toHaveText(/PADS\s*1/);
  await padsTab(page).click();
  await expect(templateRow(page, 'Owl')).toBeVisible();
  await page.getByRole('button', { name: 'Add Owl to a board', exact: true }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog.getByRole('combobox', { name: 'Deck', exact: true })).toHaveValue(/.+/);
  await dialog.getByRole('button', { name: 'ADD', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: "Added 'Owl'" })).toBeVisible();

  await reopenFirstBoard(page);
  await expect(padCells(page)).toHaveCount(2); // the pad and its copy, each with its own cell
  await expect(padCells(page).nth(1)).toContainText('Owl');
});

test('a combo cannot be saved as a template', async ({ page }) => {
  await padInEditor(page, 'Storm');
  await expect(page.getByRole('button', { name: 'SAVE AS TEMPLATE', exact: true })).toBeVisible();
  await page.getByTestId('pad-editor-panel-type-button-combo').click();
  // Switching the type asks first when the pad has files
  const confirm = page.getByRole('alertdialog');
  await confirm.getByRole('button', { name: 'SWITCH', exact: true }).click();
  await expect(page.getByRole('button', { name: 'SAVE AS TEMPLATE', exact: true })).toHaveCount(0);
});

test('a template is renamed in place, and deleted in one tap with UNDO', async ({ page }) => {
  await padInEditor(page, 'Owl');
  await page.getByRole('button', { name: 'SAVE AS TEMPLATE', exact: true }).click();
  await expect(page.getByText(/^Saved as a template: 'Owl'/)).toBeVisible();
  await closePadEditor(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await padsTab(page).click();

  await templateRow(page, 'Owl').click();
  const field = page.getByRole('textbox', { name: 'Template name', exact: true });
  await field.fill('Night owl');
  await field.press('Enter');
  await expect(templateRow(page, 'Night owl')).toBeVisible();

  await page.getByRole('button', { name: 'Delete template Night owl', exact: true }).click();
  await expect(templateRow(page, 'Night owl')).toHaveCount(0);
  await expect(page.getByText(/No templates yet\./)).toBeVisible();
  await page.getByTestId('undo-toast').getByRole('button', { name: 'UNDO', exact: true }).click();
  await expect(templateRow(page, 'Night owl')).toBeVisible();
});

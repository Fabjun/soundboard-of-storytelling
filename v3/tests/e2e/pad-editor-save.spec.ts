/**
 * @fileoverview Full E2E — the PAD editor's draft: SAVE, the discard question, undo and redo
 *
 * Owner decision 2026-10-11 (ADR-0084): changes in the PAD editor are a draft until SAVE; closing
 * with unsaved changes asks — KEEP EDITING or DISCARD CHANGES (the Material full-screen dialog
 * pattern); ↶ / ↷ and Cmd / Ctrl + Z undo and redo every step, the letters of a typed name as one.
 * Needs no playback — runs in WebKit too.
 */

import { test, expect, type Page } from '@playwright/test';
import {
  addNamedPad,
  closePadEditor,
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  goToBoardList,
  padCells,
} from './helpers';

const editor = (page: Page) => page.getByRole('dialog', { name: 'Pad editor', exact: true });
const nameInput = (page: Page) => page.getByTestId('pad-editor-panel-name-input');
const save = (page: Page) => page.getByTestId('pad-editor-panel-save-button');
// The editor's own ↶ / ↷ — the board has a pair of its own behind it (ADR-0086)
const undo = (page: Page) => editor(page).getByRole('button', { name: 'Undo', exact: true });
const redo = (page: Page) => editor(page).getByRole('button', { name: 'Redo', exact: true });
const close = (page: Page) =>
  page.getByRole('button', { name: 'Close the pad editor', exact: true });
const question = (page: Page) =>
  page.getByRole('alertdialog', { name: 'Discard changes?', exact: true });

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await addNamedPad(page, 'Rain'); // saved
  // A fresh editor: nothing to undo yet
  await closePadEditor(page);
  await padCells(page).first().click();
  await expect(nameInput(page)).toHaveValue('Rain');
});

test('SAVE is off without a change; a change shows on the pad only after SAVE', async ({
  page,
}) => {
  await expect(save(page)).toBeDisabled();
  await nameInput(page).fill('Wind');
  await expect(save(page)).toBeEnabled();
  await expect(padCells(page).first()).toContainText('Rain');
  await save(page).click();
  await expect(padCells(page).first()).toContainText('Wind');
  await expect(save(page)).toBeDisabled();
});

test('✕ without changes closes at once', async ({ page }) => {
  await close(page).click();
  await expect(editor(page)).toBeHidden();
});

test('✕ with changes asks; KEEP EDITING and Escape stay, DISCARD CHANGES drops the change', async ({
  page,
}) => {
  await nameInput(page).fill('Wind');
  await close(page).click();
  await expect(question(page)).toBeVisible();
  // The focus starts on the safe answer
  await expect(page.getByRole('button', { name: 'KEEP EDITING', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'KEEP EDITING', exact: true }).click();
  await expect(question(page)).toHaveCount(0);
  await expect(nameInput(page)).toHaveValue('Wind');

  await page.keyboard.press('Escape'); // the editor's Escape asks too
  await expect(question(page)).toBeVisible();
  await page.keyboard.press('Escape'); // and Escape on the question keeps editing
  await expect(question(page)).toHaveCount(0);
  await expect(editor(page)).toBeVisible();

  await close(page).click();
  await page.getByRole('button', { name: 'DISCARD CHANGES', exact: true }).click();
  await expect(editor(page)).toBeHidden();
  await expect(padCells(page).first()).toContainText('Rain');
  await padCells(page).first().click();
  await expect(nameInput(page)).toHaveValue('Rain'); // no draft came back
});

test('undo and redo step through the changes; typed letters are one step', async ({ page }) => {
  await expect(undo(page)).toBeDisabled();
  await nameInput(page).fill('W');
  await nameInput(page).pressSequentially('ind'); // within the merge time: one step with "W"
  await page.getByTestId('pad-editor-panel-type-button-loop').click(); // a second step
  await expect(undo(page)).toBeEnabled();

  await undo(page).click();
  await expect(page.getByTestId('pad-editor-panel-type-button-single')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(nameInput(page)).toHaveValue('Wind');
  await undo(page).click();
  await expect(nameInput(page)).toHaveValue('Rain');
  await expect(undo(page)).toBeDisabled();
  await expect(save(page)).toBeDisabled(); // back at what is saved

  await redo(page).click();
  await expect(nameInput(page)).toHaveValue('Wind');
  await expect(save(page)).toBeEnabled();
});

// A change that is no text: the browser's own undo of a text field cannot pass for ours
test('Ctrl / Cmd + Z undoes outside a text field; Shift redoes', async ({ page }) => {
  const loop = page.getByTestId('pad-editor-panel-type-button-loop');
  await loop.click();
  await expect(loop).toHaveAttribute('aria-pressed', 'true');
  await save(page).focus();
  await page.keyboard.press('ControlOrMeta+z');
  await expect(loop).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await expect(loop).toHaveAttribute('aria-pressed', 'true');
});

/**
 * @fileoverview Full E2E — combo editor, minimal first version (Slice 11, docs/product/README.md#combos--decided)
 *
 * - Steps with the pads that start together, the wait and "stop everything first" — kept after
 *   a reload
 * - A combo is never offered a pad that would make it start itself (no cycles)
 * - A tap removes a pad from a step or a step; the editor's undo brings each back
 *
 * No audio needed: pads come from ADD PAD (Chromium and WebKit).
 */

import { test, expect, type Page } from '@playwright/test';
import {
  addNamedPad,
  closePadEditor,
  goToBoardList,
  createBoardAndNavigate,
  enterSetupMode,
  newDeckButton,
  reopenFirstBoard,
  waitForSaves,
} from './helpers';

const editor = (page: Page) => page.getByRole('dialog', { name: 'Pad editor', exact: true });
const addStep = (page: Page) =>
  editor(page).getByRole('button', { name: '+ STEP', exact: true }).click();
/** The step with this number (from 1) — a group named by its STEP N caption. */
const stepGroup = (page: Page, n: number) =>
  editor(page).getByRole('group', { name: `STEP ${n}`, exact: true });
const padPicker = (page: Page, n: number) =>
  editor(page).getByRole('combobox', { name: `Add a pad to step ${n}`, exact: true });
const choose = (page: Page, n: number, label: string) => padPicker(page, n).selectOption({ label });
const wait = (page: Page, n: number) =>
  stepGroup(page, n).getByRole('spinbutton', { name: 'Wait (s)', exact: true });
const stopAll = (page: Page, n: number) =>
  stepGroup(page, n).getByRole('checkbox', { name: 'Stop everything first', exact: true });
/** A pad of a step — its button takes it out. */
const chip = (page: Page, pad: string, n: number) =>
  editor(page).getByRole('button', { name: `Remove ${pad} from step ${n}`, exact: true });

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await newDeckButton(page).click();
  await enterSetupMode(page);
});

test('a combo keeps its steps: pads, wait and "stop everything first"', async ({ page }) => {
  await addNamedPad(page, 'Owl');
  await addNamedPad(page, 'Rain');
  const day = await addNamedPad(page, 'Day', { combo: true });

  await addStep(page);
  await choose(page, 1, 'Owl');
  await choose(page, 1, 'Rain');
  await wait(page, 1).fill('2.5');
  await wait(page, 1).blur();
  await addStep(page);
  await stopAll(page, 2).check();

  // reopenFirstBoard waits for the saves, the waiting auto-save included — a fixed wait of 1 s
  // was too short on ubuntu-26.04 runners, 1 run in 3 (2026-10-04)
  await reopenFirstBoard(page);
  await enterSetupMode(page);
  await page.getByTestId(`pad-grid-cell-${day}`).click();
  await expect(chip(page, 'Owl', 1)).toContainText('Owl');
  await expect(chip(page, 'Rain', 1)).toContainText('Rain');
  await expect(wait(page, 1)).toHaveValue('2.5');
  await expect(stopAll(page, 2)).toBeChecked();
  await expect(stopAll(page, 1)).not.toBeChecked();
});

test('a combo is never offered itself or a combo that starts it', async ({ page }) => {
  await addNamedPad(page, 'Owl');
  const a = await addNamedPad(page, 'Dawn', { combo: true });
  await addNamedPad(page, 'Dusk', { combo: true });

  // Dusk starts Dawn
  await addStep(page);
  await choose(page, 1, 'Dawn');
  await waitForSaves(page);

  // In Dawn, Dusk would close a cycle and Dawn is itself: only Owl is offered
  await closePadEditor(page);
  await page.getByTestId(`pad-grid-cell-${a}`).click();
  await addStep(page);
  const options = await padPicker(page, 1).getByRole('option').allTextContents();
  expect(options).toEqual(['+ pad…', 'Owl']);
});

test('a tap takes a pad out of a step or removes a step; the editor undo brings each back', async ({
  page,
}) => {
  await addNamedPad(page, 'Owl');
  await addNamedPad(page, 'Day', { combo: true });
  await addStep(page);
  await choose(page, 1, 'Owl');
  const undo = editor(page).getByRole('button', { name: 'Undo', exact: true });

  const owl = chip(page, 'Owl', 1);
  await owl.click();
  await expect(owl).toHaveCount(0);
  await undo.click();
  await expect(owl).toBeVisible();

  const step = stepGroup(page, 1);
  await step.getByRole('button', { name: 'REMOVE STEP', exact: true }).click();
  await expect(step).toHaveCount(0);
  await undo.click();
  await expect(step).toBeVisible();
  await expect(owl).toBeVisible(); // with its pad
});

/**
 * @fileoverview Full E2E — keys play pads (Slice 12a, ADR-0077)
 *
 * Owner decisions (docs/product/README.md#input-keyboard--numpad): a key is assigned in the PAD
 * editor by tapping the field and pressing the key (K1), per deck (K2), shown short on the pad
 * (K10); a key another pad of the deck holds moves over on MOVE KEY HERE (2026-10-08); in GAME
 * the key plays its pad, in SETUP it does nothing (K3). Runs in WebKit too, so no sound plays:
 * a window listener (it runs after the app's document listener) sees whether the app took the key.
 */

import { test, expect, type Page } from '@playwright/test';
import {
  addNamedPad,
  closePadEditor,
  createBoardAndNavigate,
  createDeck,
  enterGameMode,
  enterSetupMode,
  goToBoardList,
  reopenFirstBoard,
} from './helpers';

const keyField = (page: Page) => page.getByTestId('pad-editor-panel-key-button');
/** The key label shown on a pad. No test ID: existing specs count pads by the `pad-grid-cell-` prefix. */
const padKey = (page: Page, padId: string, label: string) =>
  page.getByTestId(`pad-grid-cell-${padId}`).getByText(label, { exact: true });

/** Presses the key in the armed key field of the open PAD editor. */
async function assignKey(page: Page, code: string) {
  await keyField(page).click();
  await expect(keyField(page)).toHaveText('PRESS A KEY…');
  await page.keyboard.press(code);
}

/** Whether the app took the last key pressed (a pad was found for it). */
async function lastKeyTaken(page: Page): Promise<boolean> {
  return page.evaluate(() => (window as unknown as { lastKeyTaken: boolean }).lastKeyTaken);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
});

test('a key pressed in the key field becomes the pad key, shown short on the pad, also after a reload', async ({
  page,
}) => {
  const thunder = await addNamedPad(page, 'Thunder');
  await assignKey(page, 'Numpad1');
  await expect(keyField(page)).toHaveText('N1');
  await closePadEditor(page);
  await expect(padKey(page, thunder, 'N1')).toBeVisible();

  await reopenFirstBoard(page);
  await expect(padKey(page, thunder, 'N1')).toBeVisible();
});

test('a key another pad holds moves over on MOVE KEY HERE; Escape cancels and keeps the editor open', async ({
  page,
}) => {
  const thunder = await addNamedPad(page, 'Thunder');
  await assignKey(page, 'Numpad1');
  const rain = await addNamedPad(page, 'Rain');

  await assignKey(page, 'Escape');
  await expect(page.getByRole('dialog', { name: 'Pad editor' })).toBeVisible();
  await expect(keyField(page)).toHaveText('— not assigned —');

  await assignKey(page, 'Numpad1');
  await expect(page.getByTestId('pad-editor-panel-key-conflict-text')).toHaveText(
    'Key N1 is on Thunder',
  );
  await expect(keyField(page)).toHaveText('— not assigned —');
  await page.getByTestId('pad-editor-panel-key-move-button').click();
  await expect(keyField(page)).toHaveText('N1');
  await closePadEditor(page);
  await expect(padKey(page, rain, 'N1')).toBeVisible();
  await expect(padKey(page, thunder, 'N1')).toHaveCount(0);
});

test('a reserved key is refused with its reason; × removes the key', async ({ page }) => {
  await addNamedPad(page, 'Thunder');
  await assignKey(page, 'Enter');
  await expect(page.getByTestId('pad-editor-panel-key-note-text')).toHaveText(
    'Enter stops the last sound — pick another key',
  );
  await expect(keyField(page)).toHaveText('— not assigned —');

  await assignKey(page, 'Numpad2');
  await expect(keyField(page)).toHaveText('N2');
  await page.getByTestId('pad-editor-panel-key-clear-button').click();
  await expect(keyField(page)).toHaveText('— not assigned —');
});

test('in GAME the app takes the pad key; in SETUP and for a free key it does not', async ({
  page,
}) => {
  await addNamedPad(page, 'Thunder');
  await assignKey(page, 'Numpad1');
  await closePadEditor(page);
  await page.evaluate(() =>
    window.addEventListener('keydown', (e) => {
      (window as unknown as { lastKeyTaken: boolean }).lastKeyTaken = e.defaultPrevented;
    }),
  );

  await page.keyboard.press('Numpad1');
  expect(await lastKeyTaken(page)).toBe(false);

  await enterGameMode(page);
  await page.keyboard.press('Numpad1');
  expect(await lastKeyTaken(page)).toBe(true);
  await page.keyboard.press('Numpad5');
  expect(await lastKeyTaken(page)).toBe(false);
});

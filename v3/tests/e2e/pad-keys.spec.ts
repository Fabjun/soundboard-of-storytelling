/**
 * @fileoverview Full E2E — keys play pads (Slice 12a, ADR-0077)
 *
 * Owner decisions (docs/product/README.md#input-keyboard--numpad): a key is assigned in the PAD
 * editor by tapping the field and pressing the key (K1), per deck (K2), shown short on the pad
 * (K10); a key another pad of the deck holds moves over on MOVE KEY HERE (2026-10-08); in GAME
 * the key plays its pad, in SETUP it does nothing (K3). The keys of STOP ALL and PAUSE move in
 * Settings (K12): a key a pad plays is refused there, and the PAD editor refuses the moved key but
 * takes the old one. Runs in WebKit too, so no sound plays:
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
  waitForSaves,
} from './helpers';

/** The deck key field of the open PAD editor, and the quick-access key field (Slice 13d). */
const deckKey = (page: Page) => page.getByTestId('pad-editor-panel-deck-key-region');
const quickKey = (page: Page) => page.getByTestId('pad-editor-panel-quick-key-region');
const keyField = (page: Page) => deckKey(page).getByTestId('key-field-button');
/** The key label shown on a pad, found by its text inside the pad's cell. */
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
  await expect(page.getByRole('dialog', { name: 'Pad editor', exact: true })).toBeVisible();
  await expect(keyField(page)).toHaveText('— not assigned —');

  await assignKey(page, 'Numpad1');
  await expect(deckKey(page).getByTestId('key-field-conflict-text')).toHaveText(
    'Key N1 is on Thunder',
  );
  await expect(keyField(page)).toHaveText('— not assigned —');
  await deckKey(page).getByTestId('key-field-move-button').click();
  await expect(keyField(page)).toHaveText('N1');
  await closePadEditor(page);
  await expect(padKey(page, rain, 'N1')).toBeVisible();
  await expect(padKey(page, thunder, 'N1')).toHaveCount(0);
});

test('a reserved key is refused with its reason; × removes the key', async ({ page }) => {
  await addNamedPad(page, 'Thunder');
  await assignKey(page, 'Enter');
  await expect(deckKey(page).getByTestId('key-field-note-text')).toHaveText(
    'Enter stops a sound — pick another key',
  );
  await expect(keyField(page)).toHaveText('— not assigned —');

  await assignKey(page, 'Numpad2');
  await expect(keyField(page)).toHaveText('N2');
  await deckKey(page).getByTestId('key-field-clear-button').click();
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

// ── Quick-access keys (K13) and their clash with deck keys (K2), Slice 13d ──────

/** Presses `code` in the open PAD editor's quick-access key field. */
async function assignQuickKey(page: Page, code: string) {
  const field = quickKey(page).getByTestId('key-field-button');
  await field.click();
  await expect(field).toHaveText('PRESS A KEY…');
  await page.keyboard.press(code);
}

test('a quick-access key is shown on the bar and plays its pad in another deck too', async ({
  page,
}) => {
  await addNamedPad(page, 'Rooster');
  await expect(quickKey(page)).toHaveCount(0); // only for a pad in the bar
  await page.getByRole('button', { name: 'In quick access', exact: true }).click();
  await assignQuickKey(page, 'KeyQ');
  await expect(quickKey(page).getByTestId('key-field-button')).toHaveText('Q');
  await closePadEditor(page);
  await expect(page.getByRole('group', { name: 'Quick access', exact: true })).toContainText('Q');

  await createDeck(page);
  await page.getByText('Deck 2', { exact: true }).click();
  await page.evaluate(() =>
    window.addEventListener('keydown', (e) => {
      (window as unknown as { lastKeyTaken: boolean }).lastKeyTaken = e.defaultPrevented;
    }),
  );
  await enterGameMode(page);
  await page.keyboard.press('KeyQ');
  expect(await lastKeyTaken(page)).toBe(true);
});

test('a key is never both a deck key and a quick-access key (K2) — refused with its holder', async ({
  page,
}) => {
  await addNamedPad(page, 'Owl');
  await assignKey(page, 'Numpad1'); // a deck key in Deck 1
  await addNamedPad(page, 'Rooster');
  await page.getByRole('button', { name: 'In quick access', exact: true }).click();
  await assignQuickKey(page, 'Numpad1');
  await expect(quickKey(page).getByTestId('key-field-note-text')).toHaveText(
    'N1 plays Owl in Deck 1 — pick another key',
  );
  await expect(quickKey(page).getByTestId('key-field-button')).toHaveText('— not assigned —');

  await assignQuickKey(page, 'KeyQ');
  await assignKey(page, 'KeyQ'); // Rooster's own deck key: the bar has it
  await expect(deckKey(page).getByTestId('key-field-note-text')).toHaveText(
    'Q is the quick-access key of Rooster — pick another key',
  );
  await expect(keyField(page)).toHaveText('— not assigned —');
});

test('a quick-access key another bar pad holds moves over on MOVE KEY HERE', async ({ page }) => {
  await addNamedPad(page, 'Day');
  await page.getByRole('button', { name: 'In quick access', exact: true }).click();
  await assignQuickKey(page, 'KeyQ');
  await addNamedPad(page, 'Night');
  await page.getByRole('button', { name: 'In quick access', exact: true }).click();
  await assignQuickKey(page, 'KeyQ');
  await expect(quickKey(page).getByTestId('key-field-conflict-text')).toHaveText('Key Q is on Day');
  await quickKey(page).getByTestId('key-field-move-button').click();
  await expect(quickKey(page).getByTestId('key-field-button')).toHaveText('Q');
  await closePadEditor(page);
  const bar = page.getByRole('group', { name: 'Quick access', exact: true });
  await expect(bar.getByRole('button', { name: /Night/ })).toContainText('Q');
  await expect(bar.getByRole('button', { name: /Day/ })).not.toContainText('Q');
});

// ── Live-control keys moved in Settings (K12, settings.md S2), Slice 14d ──────────

/** The STOP ALL key field in Settings → CONTROLS. */
const stopAllKey = (page: Page) => page.getByTestId('settings-screen-stop-all-key-region');

/** Opens Settings from the board, through the board list. */
async function openSettings(page: Page) {
  await page.getByTestId('board-top-bar-back-button').click();
  await page.getByTestId('board-list-screen-settings-button').click();
}

/** Goes back from Settings to the board. */
async function backToBoard(page: Page) {
  await page.getByTestId('settings-screen-back-button').click();
  await page.getByText('Board 1', { exact: true }).click();
  await page.getByTestId('mode-toggle').waitFor();
}

/** Presses `code` in the armed STOP ALL key field of Settings. */
async function assignStopAllKey(page: Page, code: string) {
  const field = stopAllKey(page).getByTestId('key-field-button');
  await field.click();
  await expect(field).toHaveText('PRESS A KEY…');
  await page.keyboard.press(code);
}

test('STOP ALL gets another key in Settings; a pad key is refused there, the moved one in the PAD editor', async ({
  page,
}) => {
  await addNamedPad(page, 'Thunder');
  await assignKey(page, 'Numpad2');
  await closePadEditor(page);

  await openSettings(page);
  const field = stopAllKey(page).getByTestId('key-field-button');
  await expect(field).toHaveText('N.');
  await expect(page.getByTestId('settings-screen-reset-keys-button')).toBeDisabled();
  await assignStopAllKey(page, 'Numpad2');
  await expect(stopAllKey(page).getByTestId('key-field-note-text')).toHaveText(
    'N2 plays Thunder on Board 1 — pick another key',
  );
  await expect(field).toHaveText('N.');
  await assignStopAllKey(page, 'Space'); // PAUSE has it
  await expect(stopAllKey(page).getByTestId('key-field-note-text')).toHaveText(
    'Space pauses all sounds — pick another key',
  );
  await assignStopAllKey(page, 'KeyS');
  await expect(field).toHaveText('S');
  await expect(stopAllKey(page).getByTestId('key-field-clear-button')).toHaveCount(0);

  await backToBoard(page);
  await addNamedPad(page, 'Rain');
  await assignKey(page, 'KeyS');
  await expect(deckKey(page).getByTestId('key-field-note-text')).toHaveText(
    'S stops all sounds — pick another key',
  );
  await assignKey(page, 'NumpadDecimal'); // free again
  await expect(keyField(page)).toHaveText('N.');
  await closePadEditor(page);

  // The default key is a pad's now: RESET says which, and changes nothing
  await openSettings(page);
  await page.getByTestId('settings-screen-reset-keys-button').click();
  await expect(page.getByTestId('settings-screen-reset-keys-text')).toHaveText(
    'N. plays Rain on Board 1 — give that pad another key first',
  );
  await expect(field).toHaveText('S');
});

test('RESET KEYS TO DEFAULT gives STOP ALL its key back, also after a reload', async ({ page }) => {
  await openSettings(page);
  await assignStopAllKey(page, 'KeyS');
  await expect(stopAllKey(page).getByTestId('key-field-button')).toHaveText('S');
  await waitForSaves(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await page.getByTestId('board-list-screen-settings-button').click();
  await expect(stopAllKey(page).getByTestId('key-field-button')).toHaveText('S');
  await page.getByTestId('settings-screen-reset-keys-button').click();
  await expect(stopAllKey(page).getByTestId('key-field-button')).toHaveText('N.');
  await expect(page.getByTestId('settings-screen-reset-keys-button')).toBeDisabled();
});

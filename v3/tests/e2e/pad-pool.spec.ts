// ─────────────────────────────────────────────────────────────────────────────
// Full E2E — pad pool views and actions (Slice 9e,
// docs/architecture/0048-pad-pool-decks.md#2-behavior-final-not-provisional)
//
// 1. Remove from deck keeps the pad: All pads still shows it
// 2. Delete pad shows "used in N decks" and removes it from every deck and All pads
// 3. The PAD editor's deck checklist places the pad in another deck and takes it out again
// 4. A rename and a deck checkbox in quick succession both survive a reload
//
// No audio needed: pads come from ADD PAD (runs in Chromium and WebKit).
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect, type Page } from '@playwright/test';
import { goToBoardList, createBoardAndNavigate, enterSetupMode, reopenFirstBoard } from './helpers';

const tabs = (page: Page) => page.locator('[data-testid^="deck-rail-deck-tab-"]');
const occupied = (page: Page) =>
  page.locator('[data-testid^="pad-grid-cell-"]:not([data-testid^="pad-grid-cell-empty-slot-"])');

/** Two decks; returns their ids in rail order. */
async function twoDecks(page: Page): Promise<[string, string]> {
  await page.getByTestId('deck-rail-new-button').click();
  await page.getByTestId('deck-rail-new-button').click();
  await expect(tabs(page)).toHaveCount(2);
  const ids = await tabs(page).evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-testid')!.replace('deck-rail-deck-tab-', '')),
  );
  return [ids[0], ids[1]];
}

/** ADD PAD in the open deck, named in the editor; returns the pad's cell test id. */
async function addNamedPad(page: Page, name: string): Promise<string> {
  // Located by text: the button has no accessible name in Chromium yet (BACKLOG "Role-based E2E locators").
  await page.getByText('ADD PAD', { exact: true }).click();
  await page.getByTestId('pad-editor-panel-name-input').waitFor();
  const cellTestId = (await occupied(page).first().getAttribute('data-testid'))!;
  await page.getByTestId('pad-editor-panel-name-input').fill(name);
  await expect(page.getByTestId(cellTestId)).toContainText(name);
  return cellTestId;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await enterSetupMode(page);
});

test('1 — remove from deck keeps the pad in All pads', async ({ page }) => {
  await twoDecks(page);
  await tabs(page).first().click();
  const cell = await addNamedPad(page, 'Thunder');

  // Two taps: the first only arms the button
  const remove = page.getByTestId('pad-editor-panel-remove-button');
  await remove.click();
  await expect(remove).toHaveText('CONFIRM REMOVE');
  await expect(page.getByTestId(cell)).toBeVisible();
  await remove.click();
  await expect(page.getByTestId(cell)).toHaveCount(0);

  // All pads: the whole pool, including pads in no deck
  await page.getByTestId('deck-rail-all-pads-tab').click();
  await expect(page.getByTestId('deck-rail-all-pads-tab')).toContainText('1');
  await expect(page.getByTestId(cell)).toContainText('Thunder');
  await expect(page.locator('[data-testid^="pad-grid-cell-empty-slot-"]')).toHaveCount(0);

  // Opened from All pads: no deck → no key and no "remove from deck"
  await page.getByTestId(cell).click();
  await expect(page.getByTestId('pad-editor-panel')).toBeVisible();
  await expect(page.getByTestId('pad-editor-panel-remove-button')).toHaveCount(0);
});

test('2 — delete pad shows its decks and removes it everywhere', async ({ page }) => {
  await page.getByTestId('deck-rail-new-button').click();
  await tabs(page).first().waitFor();
  const cell = await addNamedPad(page, 'Thunder');

  // Duplicate the deck: the copy places the same pad (ADR-0048)
  await tabs(page).first().hover();
  await tabs(page).first().locator('[data-testid^="deck-rail-copy-button-"]').click();
  await expect(tabs(page)).toHaveCount(2);

  await page.getByTestId(cell).click();
  const del = page.getByTestId('pad-editor-panel-delete-button');
  await del.click();
  await expect(page.getByTestId('pad-editor-panel-delete-text')).toContainText('Used in 2 decks');
  await del.click();

  await expect(page.getByTestId(cell)).toHaveCount(0);
  await tabs(page).nth(1).click();
  await expect(page.getByTestId(cell)).toHaveCount(0);
  await page.getByTestId('deck-rail-all-pads-tab').click();
  await expect(page.getByTestId(cell)).toHaveCount(0);
});

test('3 — the deck checklist places the pad in another deck and takes it out', async ({ page }) => {
  const [deck1, deck2] = await twoDecks(page);
  await tabs(page).first().click();
  const cell = await addNamedPad(page, 'Thunder');

  const box1 = page.getByTestId(`pad-editor-panel-deck-input-${deck1}`);
  const box2 = page.getByTestId(`pad-editor-panel-deck-input-${deck2}`);
  await expect(box1).toBeChecked();
  await expect(box2).not.toBeChecked();
  await box2.check();
  await expect(box2).toBeChecked();

  // The second deck shows it on its first free cell
  await tabs(page).nth(1).click();
  await expect(page.getByTestId(cell)).toHaveAttribute('data-pos', '0,0');

  // Uncheck from All pads → gone from the second deck, still in the pool
  await page.getByTestId('deck-rail-all-pads-tab').click();
  await page.getByTestId(cell).click();
  await page.getByTestId(`pad-editor-panel-deck-input-${deck2}`).uncheck();
  await tabs(page).nth(1).click();
  await expect(page.getByTestId(cell)).toHaveCount(0);
  await tabs(page).first().click();
  await expect(page.getByTestId(cell)).toBeVisible();
});

test('4 — a rename and a deck checkbox right after it both survive a reload', async ({ page }) => {
  const [, deck2] = await twoDecks(page);
  await tabs(page).first().click();
  const cell = await addNamedPad(page, 'Thunder');

  // Rename (saved after a 500 ms debounce) and check the second deck before that save runs
  await page.getByTestId('pad-editor-panel-name-input').fill('Rain');
  await page.getByTestId(`pad-editor-panel-deck-input-${deck2}`).check();
  // Let the debounced rename save run (500 ms) before the reload
  await page.waitForTimeout(1000);

  await reopenFirstBoard(page);
  await tabs(page).nth(1).click();
  await expect(page.getByTestId(cell)).toContainText('Rain');
});

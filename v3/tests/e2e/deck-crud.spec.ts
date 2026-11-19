/**
 * @fileoverview Full E2E — Deck CRUD (Slice-3 verification points 6–11)
 *
 * 6.  Create deck → tab appears in DeckRail
 * 7.  Rename via double-click → tab label updates
 * 8.  Duplicate → new tab with "(copy)" suffix
 * 9.  Reorder via drag → order changes (Slice 13g; 9b ▲ / ▼, 9c only the active deck in SETUP)
 * 10. Delete → tab removed
 * 11. Undo delete → tab restored
 * Later tests (no Slice-3 number): duplicate shares pads; undo keeps later changes; a new deck
 * after a delete keeps gap-free badges and fills the name gap.
 */

import { test, expect, type Page } from '@playwright/test';
import {
  goToBoardList,
  createBoardAndNavigate,
  enterGameMode,
  enterSetupMode,
  closePadEditor,
  openDeckActions,
  deckRows,
  deckSelect,
  newDeckButton,
  undoToast,
  reopenFirstBoard,
  PAD_CELL,
} from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await enterSetupMode(page);
});

// ── Test 6: Create deck ──────────────────────────────────────────────────────

test('6 — create deck → tab appears in DeckRail', async ({ page }) => {
  await newDeckButton(page).click();
  await expect(deckRows(page).first()).toBeVisible();
});

// ── Test 7: Rename via double-click ───────────────────────────────────────────

test('7 — deck rename via double-click → tab label updates', async ({ page }) => {
  // Create a deck first
  await newDeckButton(page).click();
  const deckTab = deckRows(page).first();
  await deckTab.waitFor();

  // Double-click to enter rename mode
  await deckSelect(deckTab).dblclick();
  const nameInput = page.getByRole('textbox', { name: 'Deck name', exact: true });
  await nameInput.waitFor();
  await nameInput.fill('My Renamed Deck');
  await nameInput.press('Enter');

  // Tab label should update.
  // Note: deckTab div contains order number, name, pad count, and action chips —
  // use containsText with the exact name as stored in DOM (textTransform is CSS-visual only).
  await expect(deckTab).toContainText('My Renamed Deck');
});

// ── Test 8: Duplicate deck ───────────────────────────────────────────────────

test('8 — duplicate deck → new tab appears with suffix', async ({ page }) => {
  await newDeckButton(page).click();
  const firstTab = deckRows(page).first();
  await firstTab.waitFor();

  // The "⋯" menu holds the actions
  await openDeckActions(firstTab);
  await firstTab.getByRole('menuitem', { name: 'Duplicate', exact: true }).click();

  // A second tab should appear
  await expect(deckRows(page)).toHaveCount(2);
  // Second tab should have the "· 2" suffix (copy indicator)
  const secondTab = deckRows(page).nth(1);
  await expect(secondTab).toContainText('· 2');
});

// ── Test 9: Reorder via drag ──────────────────────────────────────────────────

// Slice 13g (docs/product/features/adaptive-layout.md#decided L6): the active deck in SETUP moves
// by its drag handle (Pointer Events) or with ▲ / ▼; the order is stored with the board.

const deckNames = (page: Page) => deckSelect(deckRows(page));

/** Three decks, Deck 3 — the newest — active. */
async function threeDecks(page: Page): Promise<void> {
  for (let i = 0; i < 3; i++) await newDeckButton(page).click();
  await expect(deckNames(page)).toHaveText([/Deck 1/, /Deck 2/, /Deck 3/]);
  await expect(deckNames(page).nth(2)).toHaveAttribute('aria-current', 'true');
}

test('9 — deck reorder via drag → order changes, also after reopening', async ({ page }) => {
  await threeDecks(page);
  const handle = page.locator('[data-testid^="deck-rail-drag-region-"]');
  await expect(handle).toHaveCount(1);
  const from = (await handle.boundingBox())!;
  const firstRow = (await deckNames(page).first().boundingBox())!;
  // Pressed on the handle, moved past the threshold, dropped on the top part of Deck 1
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2, from.y - 12, { steps: 4 });
  await page.mouse.move(from.x + from.width / 2, firstRow.y + 4, { steps: 15 });
  await page.mouse.up();
  await expect(deckNames(page)).toHaveText([/Deck 3/, /Deck 1/, /Deck 2/]);
  // The badges are positions: Deck 3 is number 1 now
  await expect(deckNames(page).first()).toHaveText(/^1\s*Deck 3/);

  await reopenFirstBoard(page);
  await expect(deckNames(page)).toHaveText([/Deck 3/, /Deck 1/, /Deck 2/]);
});

test('9b — ▲ / ▼ move the active deck one place; at the ends the button is off', async ({
  page,
}) => {
  await threeDecks(page);
  const down = page.getByRole('button', { name: 'Move deck Deck 3 down', exact: true });
  const up = page.getByRole('button', { name: 'Move deck Deck 3 up', exact: true });
  await expect(down).toBeDisabled();

  await up.click();
  await expect(deckNames(page)).toHaveText([/Deck 1/, /Deck 3/, /Deck 2/]);
  await up.click();
  await expect(deckNames(page)).toHaveText([/Deck 3/, /Deck 1/, /Deck 2/]);
  await expect(up).toBeDisabled();
  await down.click();
  await expect(deckNames(page)).toHaveText([/Deck 1/, /Deck 3/, /Deck 2/]);

  await reopenFirstBoard(page);
  await expect(deckNames(page)).toHaveText([/Deck 1/, /Deck 3/, /Deck 2/]);
});

test('9c — only the active deck in SETUP shows the reorder line; GAME shows none', async ({
  page,
}) => {
  await threeDecks(page);
  await expect(page.getByRole('group', { name: 'Move deck Deck 3', exact: true })).toBeVisible();
  await expect(page.getByRole('group', { name: /^Move deck/ })).toHaveCount(1);
  await enterGameMode(page);
  await expect(page.getByRole('group', { name: /^Move deck/ })).toHaveCount(0);
});

// ── Test 10: Delete deck ─────────────────────────────────────────────────────

test('10 — delete deck → tab removed from DeckRail', async ({ page }) => {
  await newDeckButton(page).click();
  const deckTab = deckRows(page).first();
  await deckTab.waitFor();

  // The "⋯" menu holds the actions
  await openDeckActions(deckTab);
  const deleteBtn = deckTab.getByRole('menuitem', { name: /^Delete/ });

  // One tap deletes, the undo toast follows (owner decision 2026-10-19, ADR-0086 amendment)
  await deleteBtn.click();
  await expect(deckTab).not.toBeVisible({ timeout: 3000 });
  await expect(undoToast(page)).toContainText("Deleted '");
});

// ── Test 11: Undo delete deck ────────────────────────────────────────────────

test('11 — undo deck delete → tab restored', async ({ page }) => {
  await newDeckButton(page).click();
  const deckTab = deckRows(page).first();
  await deckTab.waitFor();

  // Get the deck name before delete
  const deckText = await deckTab.textContent();

  // Delete it (one tap, the undo toast follows — owner decision 2026-10-19)
  await openDeckActions(deckTab);
  await deckTab.getByRole('menuitem', { name: 'Delete', exact: true }).click();
  await expect(deckTab).not.toBeVisible({ timeout: 3000 });

  // UndoToast should appear — click UNDO
  const undoBtn = undoToast(page).getByRole('button', { name: 'UNDO', exact: true });
  await undoBtn.waitFor({ timeout: 3000 });
  await undoBtn.click();

  // Deck tab restored
  await expect(deckRows(page).first()).toBeVisible({
    timeout: 3000,
  });
  // Original name preserved
  const restoredText = await deckRows(page).first().textContent();
  expect(restoredText).toContain((deckText ?? '').replace(/\s+/g, ' ').trim().split(' ')[1] ?? '');
});

// ── Duplicate deck shares its pads (pad pool, ADR-0048; Slice 9c) ─────────────

test('duplicate deck shares its pads: a rename in one deck shows in the other', async ({
  page,
}) => {
  await newDeckButton(page).click();
  const tabs = deckRows(page);
  await tabs.first().waitFor();

  // A pad without audio (ADD PAD), named in the editor and saved (ADR-0084). Located by its
  // text: the button has no accessible name in Chromium yet (BACKLOG "Role-based E2E locators").
  await page.getByText('ADD PAD', { exact: true }).click();
  await page.getByRole('textbox', { name: 'NAME', exact: true }).waitFor();
  const padCell = page.locator(PAD_CELL).first();
  const padTestId = (await padCell.getAttribute('data-testid'))!;
  await page.getByRole('textbox', { name: 'NAME', exact: true }).fill('Thunder');
  await page.getByRole('button', { name: 'SAVE', exact: true }).click();
  await expect(page.getByTestId(padTestId)).toContainText('Thunder');

  // Duplicate the deck and open the copy: the same pad (same id) is there
  await closePadEditor(page);
  await openDeckActions(tabs.first());
  await tabs.first().getByRole('menuitem', { name: 'Duplicate', exact: true }).click();
  await expect(tabs).toHaveCount(2);
  await deckSelect(tabs.nth(1)).click();
  await expect(page.getByTestId(padTestId)).toContainText('Thunder');

  // Rename it in the copy → the original deck shows the new name
  await page.getByTestId(padTestId).click();
  await page.getByRole('textbox', { name: 'NAME', exact: true }).fill('Storm');
  await page.getByRole('button', { name: 'SAVE', exact: true }).click();
  await expect(page.getByTestId(padTestId)).toContainText('Storm');
  await closePadEditor(page);
  await deckSelect(tabs.first()).click();
  await expect(page.getByTestId(padTestId)).toContainText('Storm');
});

// ── Board writes build on the latest board (BACKLOG "Bug: board writes from an outdated board copy lose changes") ──

test('undo of a deck delete keeps a deck rename made while the toast is shown', async ({
  page,
}) => {
  const tabs = deckRows(page);
  await newDeckButton(page).click();
  await newDeckButton(page).click();
  await expect(tabs).toHaveCount(2);

  // Delete the second deck (one tap)
  await openDeckActions(tabs.nth(1));
  await tabs.nth(1).getByRole('menuitem', { name: 'Delete', exact: true }).click();
  await expect(tabs).toHaveCount(1);

  // While the undo toast is shown: rename the remaining deck
  const undo = undoToast(page).getByRole('button', { name: 'UNDO', exact: true });
  await expect(undo).toBeVisible();
  await deckSelect(tabs.first()).dblclick();
  await page.getByRole('textbox', { name: 'Deck name', exact: true }).fill('Village');
  await page.getByRole('textbox', { name: 'Deck name', exact: true }).press('Enter');
  await expect(tabs.first()).toContainText('Village');

  // Undo brings the deck back and keeps the rename
  await undo.click();
  await expect(tabs).toHaveCount(2);
  await expect(tabs.first()).toContainText('Village');
});

test('a new deck after deleting a middle one: badges stay 1, 2, 3; the name fills the gap', async ({
  page,
}) => {
  const tabs = deckRows(page);
  for (let i = 0; i < 3; i++) await newDeckButton(page).click();
  await expect(tabs).toHaveCount(3);

  await openDeckActions(tabs.nth(1));
  await tabs.nth(1).getByRole('menuitem', { name: 'Delete', exact: true }).click();
  await expect(tabs).toHaveCount(2);

  await newDeckButton(page).click();
  await expect(tabs).toHaveCount(3);
  // Badge (order + 1) and name of every tab — the first two child elements of its select button
  const labels = await deckSelect(tabs).evaluateAll((els) =>
    els.map((el) => `${el.children[0]?.textContent} ${el.children[1]?.textContent}`),
  );
  // Badge = position in the rail; the new deck is appended and named after the free number
  expect(labels).toEqual(['1 Deck 1', '2 Deck 3', '3 Deck 2']);
});

test('a duplicated deck appears directly after its original', async ({ page }) => {
  const tabs = deckRows(page);
  await newDeckButton(page).click();
  await newDeckButton(page).click();
  await expect(tabs).toHaveCount(2);
  await openDeckActions(tabs.first());
  await tabs.first().getByRole('menuitem', { name: 'Duplicate', exact: true }).click();
  await expect(tabs).toHaveCount(3);
  // Badge (position) and name of each tab: the copy sits between Deck 1 and Deck 2
  const labels = await deckSelect(tabs).evaluateAll((els) =>
    els.map((el) => `${el.children[0]?.textContent} ${el.children[1]?.textContent}`),
  );
  expect(labels).toEqual(['1 Deck 1', '2 Deck 1 · 2', '3 Deck 2']);
});

// ── The deck's "⋯" actions menu (MenuButton, W3C APG menu button) ─────────────

test('the "⋯" menu works with the keyboard: opens on Enter, arrows move, Escape closes', async ({
  page,
}) => {
  await newDeckButton(page).click();
  const actions = page.getByRole('button', { name: 'Actions for deck Deck 1', exact: true });
  await expect(actions).toHaveAttribute('aria-haspopup', 'menu');
  await expect(actions).toHaveAttribute('aria-expanded', 'false');

  await actions.focus();
  await page.keyboard.press('Enter');
  await expect(actions).toHaveAttribute('aria-expanded', 'true');
  const items = page.getByRole('menuitem');
  await expect(items).toHaveText(['Rename', 'Duplicate', 'Delete']);
  await expect(items.first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(items.nth(1)).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect(items.nth(2)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(items.first()).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(actions).toBeFocused();
});

test('the "⋯" menu closes on a press outside; Rename from it starts the rename', async ({
  page,
}) => {
  await newDeckButton(page).click();
  const tab = deckRows(page).first();
  await openDeckActions(tab);
  await page.getByTestId('board-top-bar').click({ position: { x: 300, y: 10 } });
  await expect(page.getByRole('menu')).toHaveCount(0);

  await openDeckActions(tab);
  await page.getByRole('menuitem', { name: 'Rename', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Deck name', exact: true })).toBeFocused();
});

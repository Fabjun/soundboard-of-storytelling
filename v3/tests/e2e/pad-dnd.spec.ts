// ─────────────────────────────────────────────────────────────────────────────
// Full E2E — Pad Drag & Drop (verification points 20–21)
//
// 20. SWAP:   drag a pad onto another pad's centre → the two exchange positions
// 21. INSERT: drag a pad onto a cell's left edge → it is inserted there, the pads
//             in between shift by one slot
//
// padDnd.ts uses Pointer Events + setPointerCapture (never HTML5 DnD — iOS), so
// the drag is a real pointer sequence (helpers.pointerDrag). Three pads are used:
// with two, an INSERT and a SWAP produce the same layout and could not be told apart.
// Positions are read from the cells' data-pos ("col,row"); persistence is checked
// after a reload.
//
// History: until 2026-09-29 both tests were test.skip("flaky") — their bodies were
// never written (TODO stubs). Stability is checked with --repeat-each=20.
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect, type Page } from '@playwright/test';
import {
  ensureTestAudio,
  goToBoardList,
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  createPadAtCell00,
  padPosition,
  pointerDrag,
  reopenFirstBoard,
} from './helpers';

/** Create a pad in the empty cell (col, row) via the creation popover; returns its id. */
async function createPadAt(page: Page, col: number, row: number): Promise<string> {
  await page.getByTestId(`pad-grid-cell-empty-slot-${col}-${row}`).click();
  const popover = page.getByTestId('pad-creation-popover');
  await popover.waitFor();
  const sourceItem = page.locator('[data-testid^="pad-creation-popover-source-item-"]').first();
  await sourceItem.waitFor({ timeout: 5_000 });
  await sourceItem.click();
  await page.getByTestId('pad-creation-popover-add-button').click();
  await popover.waitFor({ state: 'hidden' });
  // Wait for the OCCUPIED cell at this position — right after the click the empty
  // cell (pad-cell-empty-c-r, same data-pos) can still be in the DOM.
  const cell = page.locator(
    `[data-pos="${col},${row}"][data-testid^="pad-grid-cell-"]:not([data-testid^="pad-grid-cell-empty-slot-"])`,
  );
  await cell.waitFor();
  const testid = await cell.getAttribute('data-testid');
  return testid!.replace('pad-grid-cell-', '');
}

/** Board with one deck and three pads: A at 0,0 · B at 1,0 · C at 2,0 (SETUP mode). */
async function setupThreePads(page: Page): Promise<{ a: string; b: string; c: string }> {
  await ensureTestAudio(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  const a = await createPadAtCell00(page);
  const b = await createPadAt(page, 1, 0);
  const c = await createPadAt(page, 2, 0);
  expect(await padPosition(page, a)).toBe('0,0');
  expect(await padPosition(page, b)).toBe('1,0');
  expect(await padPosition(page, c)).toBe('2,0');
  return { a, b, c };
}

/** The draggable element of a pad (onPointerDown lives on the pad button inside the cell). */
function padHandle(page: Page, padId: string) {
  return page.getByTestId(`pad-grid-cell-${padId}`).getByRole('button');
}

// ── Test 20: SWAP ─────────────────────────────────────────────────────────────

test('20 — SWAP: drag pad onto another pad centre → the two exchange positions', async ({
  page,
}) => {
  const { a, b, c } = await setupThreePads(page);

  await pointerDrag(page, padHandle(page, a), page.getByTestId(`pad-grid-cell-${c}`), 'center');

  await expect(page.getByTestId(`pad-grid-cell-${a}`)).toHaveAttribute('data-pos', '2,0');
  await expect(page.getByTestId(`pad-grid-cell-${c}`)).toHaveAttribute('data-pos', '0,0');
  await expect(page.getByTestId(`pad-grid-cell-${b}`)).toHaveAttribute('data-pos', '1,0');

  // Persisted
  await reopenFirstBoard(page);
  await expect(page.getByTestId(`pad-grid-cell-${a}`)).toHaveAttribute('data-pos', '2,0');
  await expect(page.getByTestId(`pad-grid-cell-${c}`)).toHaveAttribute('data-pos', '0,0');
  await expect(page.getByTestId(`pad-grid-cell-${b}`)).toHaveAttribute('data-pos', '1,0');
});

// ── Test 21: INSERT ───────────────────────────────────────────────────────────

test('21 — INSERT: drag pad onto a cell left edge → inserted there, others shift', async ({
  page,
}) => {
  const { a, b, c } = await setupThreePads(page);

  // C onto A's left edge → insert at index 0: C → 0,0 · A → 1,0 · B → 2,0
  await pointerDrag(page, padHandle(page, c), page.getByTestId(`pad-grid-cell-${a}`), 'left-edge');

  await expect(page.getByTestId(`pad-grid-cell-${c}`)).toHaveAttribute('data-pos', '0,0');
  await expect(page.getByTestId(`pad-grid-cell-${a}`)).toHaveAttribute('data-pos', '1,0');
  await expect(page.getByTestId(`pad-grid-cell-${b}`)).toHaveAttribute('data-pos', '2,0');

  // Persisted
  await reopenFirstBoard(page);
  await expect(page.getByTestId(`pad-grid-cell-${c}`)).toHaveAttribute('data-pos', '0,0');
  await expect(page.getByTestId(`pad-grid-cell-${a}`)).toHaveAttribute('data-pos', '1,0');
  await expect(page.getByTestId(`pad-grid-cell-${b}`)).toHaveAttribute('data-pos', '2,0');
});

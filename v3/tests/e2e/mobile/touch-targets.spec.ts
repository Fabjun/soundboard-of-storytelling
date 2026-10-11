/**
 * @fileoverview Mobile E2E — Touch Target Sizes (Playwright WebKit, iPhone 13 Pro profile)
 *
 * SCOPE: Verifies that interactive elements meet the iOS minimum touch target
 * of 44×44px on a 390×844 viewport. Failing elements print a descriptive
 * message.
 *
 * The global CSS enforces `min-height: 44px; min-width: 44px` on all button /
 * [role='button'] elements. This test catches regressions and layout contexts
 * where that rule is overridden (e.g., overflow: hidden clipping, flex shrink).
 *
 * Quarantined until 2026-10-09 as "the desktop layout fails at 390px" (deck rail and an
 * inspector panel squeezed the grid); the PAD editor became a full-screen dialog (ADR-0074) and
 * the deck list starts folded, and all tests passed when measured — so they guard the phone
 * layout now, also while Slice 13 rebuilds it.
 *
 * OUT OF SCOPE (see docs/development/manual-iphone-checklist.md):
 *   File upload, audio output, Ringer Switch, backgrounding.
 */

import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  TEST_AUDIO_NAME,
  addLoopPad,
  createBoardAndNavigate,
  createDeck,
  ensureTestAudio,
  enterSetupMode,
  goToBoardList,
  goToLibrary,
  padCells,
} from '../helpers';

const MIN = 44;

test.describe('touch targets on a 390px phone', () => {
  async function assertTarget(locator: Locator, label: string): Promise<void> {
    const box = await locator.boundingBox();
    expect(box, `${label}: boundingBox() returned null — element may not be in DOM`).not.toBeNull();
    expect(box!.width, `${label}: width ${box!.width}px < ${MIN}px`).toBeGreaterThanOrEqual(MIN);
    expect(box!.height, `${label}: height ${box!.height}px < ${MIN}px`).toBeGreaterThanOrEqual(MIN);
  }

  // ── StartScreen ─────────────────────────────────────────────────────────────

  test('StartScreen: TAP TO UNLOCK button is >= 44×44px', async ({ page }) => {
    await page.goto('/soundboard-of-storytelling/');
    await assertTarget(page.getByRole('button', { name: 'TAP TO UNLOCK' }), 'TAP TO UNLOCK');
  });

  test('StartScreen: BOARD and LIBRARY navigation buttons are >= 44×44px', async ({ page }) => {
    await page.goto('/soundboard-of-storytelling/');
    await assertTarget(page.getByRole('button', { name: 'BOARD' }), 'BOARD button');
    await assertTarget(page.getByRole('button', { name: 'LIBRARY' }), 'LIBRARY button');
  });

  // ── BoardListScreen ──────────────────────────────────────────────────────────

  test('BoardListScreen: NEW BOARD button is >= 44×44px', async ({ page }) => {
    await page.goto('/soundboard-of-storytelling/');
    await goToBoardList(page);
    await assertTarget(page.getByTestId('board-list-screen-new-button'), 'NEW BOARD button');
  });

  // ── BoardScreen ──────────────────────────────────────────────────────────────

  test('BoardScreen: back button and mode-toggle halves are >= 44px tall', async ({ page }) => {
    await page.goto('/soundboard-of-storytelling/');
    await goToBoardList(page);
    await createBoardAndNavigate(page);
    await createDeck(page);

    await assertTarget(page.getByTestId('board-top-bar-back-button'), 'board-top-bar-back-button');

    // Mode-toggle halves — width may be < 44px on very narrow viewports but
    // height must always be >= 44px (they fill the topbar height).
    const setupHalf = page.getByTestId('mode-toggle-setup-button');
    const gameHalf = page.getByTestId('mode-toggle-game-button');

    const setupBox = await setupHalf.boundingBox();
    expect(setupBox, 'mode-toggle-setup: boundingBox() null').not.toBeNull();
    expect(
      setupBox!.height,
      `mode-toggle-setup: height ${setupBox!.height}px < ${MIN}px`,
    ).toBeGreaterThanOrEqual(MIN);

    const gameBox = await gameHalf.boundingBox();
    expect(gameBox, 'mode-toggle-game: boundingBox() null').not.toBeNull();
    expect(
      gameBox!.height,
      `mode-toggle-game: height ${gameBox!.height}px < ${MIN}px`,
    ).toBeGreaterThanOrEqual(MIN);
  });

  test('BoardScreen: empty pad cells are >= 44×44px', async ({ page }) => {
    await page.goto('/soundboard-of-storytelling/');
    await goToBoardList(page);
    await createBoardAndNavigate(page);
    await createDeck(page);

    // Cell (0,0) — first cell in the grid; representative for all cells
    await assertTarget(
      page.getByTestId('pad-grid-cell-empty-slot-0-0'),
      'pad-grid-cell-empty-slot-0-0',
    );
  });
});

/**
 * Every visible control (`button`, `[role=button]`, `menuitem`) smaller than 44 × 44 px, named by
 * its test ID, label or text — empty when all keep the touch target (CLAUDE.md UI rules). The mode
 * toggle's halves are only checked for their height (their own test above).
 */
async function smallControls(page: Page): Promise<string[]> {
  return page.evaluate((min) => {
    const skip = ['mode-toggle-setup-button', 'mode-toggle-game-button'];
    return [...document.querySelectorAll<HTMLElement>('button, [role="button"], [role="menuitem"]')]
      .filter((el) => !skip.includes(el.dataset.testid ?? ''))
      .map((el) => ({ el, box: el.getBoundingClientRect() }))
      .filter(({ box }) => box.width > 0 && box.height > 0)
      .filter(({ box }) => box.width < min || box.height < min)
      .map(
        ({ el, box }) =>
          `${el.dataset.testid ?? el.getAttribute('aria-label') ?? el.textContent?.trim()} ${Math.round(box.width)}×${Math.round(box.height)}`,
      );
  }, MIN);
}

/**
 * Every visible control of the board in SETUP, with the DECKS list open and a deck's "⋯" menu
 * open, is at least 44 × 44 px (CLAUDE.md UI rules) — a sweep, so a new small button cannot slip
 * in unnoticed (found 2026-10-11: the deck actions were 28 px; BACKLOG "Small icon buttons below
 * the 44 px touch target"). The mode toggle's halves are only checked for their height above.
 */
test('BoardScreen: every visible control in SETUP is >= 44×44px', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await page.getByTestId('deck-rail-manage-button').click();
  const sheet = page.getByTestId('deck-rail-sheet-region');
  await sheet.locator('[data-testid^="deck-rail-actions-button-"]').first().click();
  await expect(sheet.getByRole('menu')).toBeVisible();

  expect(await smallControls(page), 'controls below 44 × 44 px').toEqual([]);
});

test('BoardListScreen: every visible control is >= 44×44px', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await page.getByTestId('board-list-screen-new-button').click();
  await page.locator('[data-testid^="board-list-screen-row-"]').first().waitFor();
  expect(await smallControls(page), 'controls below 44 × 44 px').toEqual([]);
});

test('LibraryScreen: every visible control is >= 44×44px, with a file in the list', async ({
  page,
}) => {
  await page.goto('/soundboard-of-storytelling/');
  await ensureTestAudio(page);
  // The app reads the library at start: load it again with the entry
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await expect(page.getByText(TEST_AUDIO_NAME).first()).toBeVisible();
  expect(await smallControls(page), 'controls below 44 × 44 px').toEqual([]);
});

test('PAD editor: every visible control is >= 44×44px', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await ensureTestAudio(page);
  // The app reads the library at start: load it again with the entry
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await addLoopPad(page, 0);
  await padCells(page).first().getByRole('button').click();
  await expect(page.getByTestId('pad-editor-panel-name-input')).toBeVisible();
  expect(await smallControls(page), 'controls below 44 × 44 px').toEqual([]);
});

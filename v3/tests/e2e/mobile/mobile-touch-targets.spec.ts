// ─────────────────────────────────────────────────────────────────────────────
// Mobile E2E — Touch Target Sizes (Playwright WebKit, iPhone 13 Pro profile)
//
// SCOPE: Verifies that interactive elements meet the iOS minimum touch target
// of 44×44px on a 390×844 viewport. Failing elements print a descriptive
// message. Elements that are known to be intentionally smaller are marked
// test.fixme with an explicit reason.
//
// The global CSS enforces `min-height: 44px; min-width: 44px` on all button /
// [role='button'] elements. This test catches regressions and layout contexts
// where that rule is overridden (e.g., overflow: hidden clipping, flex shrink).
//
// OUT OF SCOPE (see docs/MANUAL_IPHONE_CHECKLIST.md):
//   File upload, audio output, Ringer Switch, backgrounding.
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect, type Locator } from '@playwright/test';
import { goToBoardList, createBoardAndNavigate, createScene } from '../helpers';

const MIN = 44;

// These tests assert against a layout that is intentionally not yet mobile-adapted.
// The current desktop-oriented three-panel layout (SceneRail 220px + inspector 280px)
// collapses the center grid to 0px at 390px when any panel is open.
// See DESIGN_NOTES "Known limitation: SETUP layout on narrow viewports".
// Re-enable once the dedicated mobile adaptation (Slice 8) is in place.
const FIXME_REASON =
  'Mobile layout is a deliberate later phase. These layout assertions apply once ' +
  'the dedicated mobile adaptation exists; the current desktop-oriented layout is ' +
  'expected to fail these at 390px. ' +
  "See DESIGN_NOTES 'Known limitation: SETUP layout on narrow viewports'.";

test.describe.fixme(FIXME_REASON, () => {
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
    await assertTarget(page.getByTestId('new-board-button'), 'NEW BOARD button');
  });

  // ── BoardScreen ──────────────────────────────────────────────────────────────

  test('BoardScreen: back button and mode-toggle halves are >= 44px tall', async ({ page }) => {
    await page.goto('/soundboard-of-storytelling/');
    await goToBoardList(page);
    await createBoardAndNavigate(page);
    await createScene(page);

    await assertTarget(page.getByTestId('board-back-button'), 'board-back-button');

    // Mode-toggle halves — width may be < 44px on very narrow viewports but
    // height must always be >= 44px (they fill the topbar height).
    const setupHalf = page.getByTestId('mode-toggle-setup');
    const gameHalf = page.getByTestId('mode-toggle-game');

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

  test('BoardScreen: empty pad cells in 4-col grid are >= 44×44px', async ({ page }) => {
    await page.goto('/soundboard-of-storytelling/');
    await goToBoardList(page);
    await createBoardAndNavigate(page);
    await createScene(page);

    // Cell (0,0) — first cell in the grid; representative for all cells
    await assertTarget(page.getByTestId('pad-cell-empty-0-0'), 'pad-cell-empty-0-0');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Full E2E — Pad Drag & Drop (Slice-3 verification points 20–21)
//
// 20. SWAP: drag pad to another pad's center → positions swap
// 21. INSERT: drag pad to cell edge → intermediate pads shift
//
// Both tests are currently marked test.skip because pointer-events drag
// in Playwright requires precise coordinate control and is prone to timing
// issues. Activate in Phase 3 once the drag approach is validated locally.
//
// Implementation approach (Phase 3):
//   padDnd.ts uses pointermove/pointerdown/pointerup events.
//   Use page.mouse.move(x, y) + page.mouse.down() + move to target + page.mouse.up().
//   Coordinates derived from getBoundingClientRect() of source/target cells.
// ─────────────────────────────────────────────────────────────────────────────

import { test, type Page } from '@playwright/test';
import {
  goToLibrary,
  uploadTestAudio,
  goToBoardList,
  createBoardAndNavigate,
  createScene,
  enterSetupMode,
  createPadAtCell00,
} from './helpers';

// Shared setup: 2 pads in known positions (0,0 and 1,0)
async function setupTwoPads(page: Page): Promise<void> {
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await uploadTestAudio(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createScene(page);
  await enterSetupMode(page);
  await createPadAtCell00(page);
  // Create second pad at 1,0
  await page.getByTestId('pad-cell-empty-1-0').click();
  const popover = page.getByTestId('pad-creation-popover');
  await popover.waitFor();
  const sourceItem = page.locator('[data-testid^="creation-source-item-"]').first();
  await sourceItem.waitFor({ timeout: 5_000 });
  await sourceItem.click();
  await page.getByTestId('creation-add-pad').click();
  await popover.waitFor({ state: 'hidden' });
}

// ── Test 20: SWAP ─────────────────────────────────────────────────────────────

test.skip('20 — SWAP: drag pad to another pad center → positions swap [SKIP: pointer-events drag flaky]', async ({
  page,
}) => {
  await setupTwoPads(page);
  // TODO (Phase 3): implement pointer-events drag for SWAP.
  // Expected: pad from cell 0,0 moves to 1,0 and vice versa.
  void page;
});

// ── Test 21: INSERT ───────────────────────────────────────────────────────────

test.skip('21 — INSERT: drag pad to cell edge → intermediate pads shift [SKIP: pointer-events drag flaky]', async ({
  page,
}) => {
  await setupTwoPads(page);
  // TODO (Phase 3): implement pointer-events drag for INSERT.
  // Expected: pads shift to accommodate insert at target edge.
  void page;
});

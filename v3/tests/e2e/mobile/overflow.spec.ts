// ─────────────────────────────────────────────────────────────────────────────
// Mobile E2E — Horizontal Overflow (Playwright WebKit, iPhone 13 Pro profile)
//
// SCOPE: Verifies that key structural elements do not extend beyond the 390px
// viewport width on a 390×844 layout. Uses boundingBox() rather than
// toBeVisible() — an element can be "visible" while its actual content clips
// past the viewport edge if overflow is hidden on an ancestor.
//
//   Checks: pad-grid container, deck-rail, topbar, individual pad cells
//
// OUT OF SCOPE (see docs/development/manual-iphone-checklist.md):
//   Landscape orientation, audio output, file upload, Ringer Switch.
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect, type Locator, type Page } from '@playwright/test';
import { goToBoardList, createBoardAndNavigate, createDeck } from '../helpers';

// These tests assert against a layout that is intentionally not yet mobile-adapted.
// The current desktop-oriented three-panel layout (DeckRail 220px + inspector 280px)
// collapses the center grid to 0px at 390px when any panel is open.
// See docs/design/design-notes.md "Known limitation: SETUP layout on narrow viewports".
// Re-enable once the dedicated mobile adaptation (Slice 13) is in place.
const FIXME_REASON =
  'Mobile layout is a deliberate later phase. These overflow assertions apply once ' +
  'the dedicated mobile adaptation exists; the current desktop-oriented layout is ' +
  'expected to fail these at 390px. ' +
  "See docs/design/design-notes.md 'Known limitation: SETUP layout on narrow viewports'.";

// Quarantine: mobile layout not built yet (Slice 13) — BACKLOG "Re-enable mobile layout tests"
// eslint-disable-next-line playwright/no-skipped-test -- quarantine: mobile layout not built until Slice 13 (BACKLOG "Re-enable mobile layout tests")
test.describe.fixme(FIXME_REASON, () => {
  async function assertNoOverflow(page: Page, locator: Locator, label: string): Promise<void> {
    const vp = page.viewportSize()!;
    const box = await locator.boundingBox();
    expect(box, `${label}: boundingBox() null`).not.toBeNull();
    expect(
      box!.x,
      `${label}: left edge ${box!.x}px is outside viewport (< 0)`,
    ).toBeGreaterThanOrEqual(0);
    expect(
      box!.x + box!.width,
      `${label}: right edge ${box!.x + box!.width}px exceeds viewport ${vp.width}px`,
    ).toBeLessThanOrEqual(vp.width);
  }

  test('BoardScreen structural elements do not overflow 390px viewport', async ({ page }) => {
    await page.goto('/soundboard-of-storytelling/');
    await goToBoardList(page);
    await createBoardAndNavigate(page);
    await createDeck(page);

    // TopBar (the board-topbar wrapper)
    await assertNoOverflow(page, page.getByTestId('board-top-bar'), 'board-top-bar');

    // Pad grid container — the 4-column layout at 390px is the highest-risk element
    // No `if (count > 0)` guards: the grid had no test id, so such a guard skipped this check.
    await assertNoOverflow(page, page.getByTestId('pad-grid'), 'pad-grid');

    // First empty pad cell — representative for all cells
    await assertNoOverflow(
      page,
      page.getByTestId('pad-grid-cell-empty-slot-0-0'),
      'pad-grid-cell-empty-slot-0-0',
    );

    // Deck rail (horizontal scroll container) — the rail itself must not overflow
    await assertNoOverflow(page, page.getByTestId('deck-rail'), 'deck-rail');
  });

  test('StartScreen does not overflow 390px viewport', async ({ page }) => {
    await page.goto('/soundboard-of-storytelling/');
    const vp = page.viewportSize()!;

    // Body scroll width must not exceed viewport width (document-level overflow check)
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(
      scrollWidth,
      `StartScreen body.scrollWidth ${scrollWidth}px > viewport ${vp.width}px`,
    ).toBeLessThanOrEqual(vp.width);
  });
});

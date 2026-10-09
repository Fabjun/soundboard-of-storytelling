/**
 * @fileoverview Mobile E2E — Horizontal Overflow (Playwright WebKit, iPhone 13 Pro profile)
 *
 * SCOPE: Verifies that key structural elements do not extend beyond the 390px
 * viewport width on a 390×844 layout. Uses boundingBox() rather than
 * toBeVisible() — an element can be "visible" while its actual content clips
 * past the viewport edge if overflow is hidden on an ancestor.
 *
 *   Checks: pad-grid container, deck-rail, topbar, individual pad cells
 *
 * Quarantined until 2026-10-09 as "the desktop layout fails at 390px"; the PAD editor became a
 * full-screen dialog (ADR-0074) and the deck list starts folded, and all tests passed when
 * measured — so they guard the phone layout now, also while Slice 13 rebuilds it.
 *
 * OUT OF SCOPE (see docs/development/manual-iphone-checklist.md):
 *   Landscape orientation, audio output, file upload, Ringer Switch.
 */

import { test, expect, type Locator, type Page } from '@playwright/test';
import { goToBoardList, createBoardAndNavigate, createDeck } from '../helpers';

test.describe('no horizontal overflow on a 390px phone', () => {
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

    // Pad grid container — the widest element at 390px, the highest risk
    // No `if (count > 0)` guards: the grid had no test id, so such a guard skipped this check.
    await assertNoOverflow(page, page.getByTestId('pad-grid'), 'pad-grid');

    // First empty pad cell — representative for all cells
    await assertNoOverflow(
      page,
      page.getByTestId('pad-grid-cell-empty-slot-0-0'),
      'pad-grid-cell-empty-slot-0-0',
    );

    // Deck rail — the rail itself must not overflow
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

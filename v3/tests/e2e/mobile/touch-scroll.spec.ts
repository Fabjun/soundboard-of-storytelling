/**
 * @fileoverview Mobile E2E — a swipe scrolls wherever it starts; a finger drags a pad after a short
 * press (Playwright Chromium, iPhone 13 Pro profile)
 *
 * Owner report 2026-10-11: the board scrolled only when the swipe started between the pads — every
 * pad had `touch-action: none`. Pads keep the browser's panning now; a finger drags a pad in SETUP
 * only after a short press (src/lib/touchDrag.ts). Real touch input comes from the DevTools
 * protocol (`Input.dispatchTouchEvent`), which Playwright has no API for — so Chromium only; the
 * iPhone itself is in docs/development/manual-iphone-checklist.md.
 */

import { test, expect, type CDPSession, type Locator, type Page } from '@playwright/test';
import {
  goToBoardList,
  addLoopPad,
  createBoardAndNavigate,
  createDeck,
  enterGameMode,
  enterSetupMode,
  ensureTestAudio,
  padCells,
  padPosition,
} from '../helpers';

/** Sends one touch event at (x, y); `touchEnd` lifts the finger. */
async function touch(
  cdp: CDPSession,
  type: 'touchStart' | 'touchMove' | 'touchEnd',
  x = 0,
  y = 0,
): Promise<void> {
  await cdp.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: type === 'touchEnd' ? [] : [{ x, y }],
  });
}

/** The pad's center on the screen. */
async function centerOf(el: Locator): Promise<{ x: number; y: number }> {
  const box = (await el.boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** How far the pad grid has scrolled — the nearest scrolling ancestor of the first pad. */
async function gridScrollTop(page: Page): Promise<number> {
  return padCells(page)
    .first()
    .evaluate((el) => {
      for (let p = el.parentElement; p; p = p.parentElement) {
        const y = getComputedStyle(p).overflowY;
        if ((y === 'auto' || y === 'scroll') && p.scrollHeight > p.clientHeight) return p.scrollTop;
      }
      return -1;
    });
}

let cdp: CDPSession;

test.beforeEach(async ({ page }) => {
  await ensureTestAudio(page);
  await page.goto('/soundboard-of-storytelling/');
  // Unlocks the audio — without it no pad plays, and the GAME test below would prove nothing
  await goToBoardList(page); // through TAP TO START, which unlocks the audio
  await page.getByTestId('board-list-screen-new-button').waitFor();
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await addLoopPad(page, 0);
  // The largest pads: the deck's empty cells reach far below the window, so the grid scrolls
  await page.getByTestId('deck-rail-manage-button').click();
  await page.getByRole('slider', { name: 'PAD SIZE', exact: true }).focus();
  await page.keyboard.press('End');
  await page.getByTestId('deck-rail-manage-button').click();
  cdp = await page.context().newCDPSession(page);
});

test('in SETUP a quick swipe that starts on a pad scrolls the grid and moves no pad', async ({
  page,
}) => {
  const pad = padCells(page).first();
  const testId = (await pad.getAttribute('data-testid'))!.replace('pad-grid-cell-', '');
  const before = await padPosition(page, testId);
  expect(await gridScrollTop(page)).toBe(0);

  const { x, y } = await centerOf(pad);
  await touch(cdp, 'touchStart', x, y);
  for (let i = 1; i <= 10; i++) await touch(cdp, 'touchMove', x, y - i * 30);
  await touch(cdp, 'touchEnd');

  await expect.poll(() => gridScrollTop(page)).toBeGreaterThan(0);
  expect(await padPosition(page, testId)).toBe(before);
});

test('in SETUP a finger that rests on a pad drags it to another cell', async ({ page }) => {
  const pad = padCells(page).first();
  const testId = (await pad.getAttribute('data-testid'))!.replace('pad-grid-cell-', '');
  expect(await padPosition(page, testId)).toBe('0,0');
  const from = await centerOf(pad);
  const to = await centerOf(page.getByTestId('pad-grid-cell-empty-slot-1-0'));

  await touch(cdp, 'touchStart', from.x, from.y);
  await page.waitForTimeout(400); // longer than the press that starts a drag (LONG_PRESS_MS)
  for (let i = 1; i <= 10; i++)
    await touch(
      cdp,
      'touchMove',
      from.x + ((to.x - from.x) * i) / 10,
      from.y + ((to.y - from.y) * i) / 10,
    );
  await touch(cdp, 'touchEnd');

  await expect.poll(() => padPosition(page, testId)).toBe('1,0');
  expect(await gridScrollTop(page)).toBe(0);
});

test('in GAME a swipe that starts on a pad does not play it', async ({ page }) => {
  await enterGameMode(page);
  const pad = padCells(page).first();
  const button = pad.getByRole('button');
  // A tap plays and stops it — so the swipe below could play it, if it were taken for a tap
  await button.tap();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await button.tap();
  await expect(button).toHaveAttribute('aria-pressed', 'false');

  const { x, y } = await centerOf(pad);
  await touch(cdp, 'touchStart', x, y);
  for (let i = 1; i <= 10; i++) await touch(cdp, 'touchMove', x, y - i * 30);
  await touch(cdp, 'touchEnd');
  // Nothing to wait for: the check is that no sound starts
  await page.waitForTimeout(300);
  await expect(button).toHaveAttribute('aria-pressed', 'false');
});

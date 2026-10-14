/**
 * @fileoverview Full E2E — the browser's own touch gestures are off on every screen (ADR-0067)
 *
 * Reads the computed style of every element on the start screen, the library, the board list,
 * a board in SETUP with the pad creation popover, and the PAD editor with its library picker:
 * only scrolling is left to the browser (`touch-action: pan-x pan-y`, or `none` where the app
 * takes the touch itself), nothing can be selected, and every text field has at least 16 px text —
 * iOS zooms into a field with smaller text. Runs in Chromium and WebKit; the iOS long-press menu
 * (`-webkit-touch-callout`) exists only on iOS and is on the manual iPhone checklist.
 */

import { test, expect, type Page } from '@playwright/test';
import {
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  ensureTestAudio,
  goToBoardList,
  goToLibrary,
  openMainMenu,
  padCells,
} from './helpers';

/** What the browser may still do with a touch: scroll, or nothing where the app takes it. */
const ALLOWED_TOUCH = ['pan-x pan-y', 'none'];

/** Elements that break a rule on this screen, as "tag.class: property value". */
function offenders(page: Page): Promise<string[]> {
  return page.evaluate((allowed) => {
    const name = (el: Element) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`;
    const bad: string[] = [];
    for (const el of document.querySelectorAll('body *')) {
      const style = getComputedStyle(el);
      const touch = style.getPropertyValue('touch-action');
      if (!allowed.includes(touch)) bad.push(`${name(el)}: touch-action ${touch}`);
      const select =
        style.getPropertyValue('user-select') || style.getPropertyValue('-webkit-user-select');
      if (select !== 'none') bad.push(`${name(el)}: user-select ${select}`);
      // Fields that take typing (iOS zooms into them); not checkboxes, sliders or the file picker
      const typed =
        'input:not([type=checkbox]):not([type=range]):not([type=file]), select, textarea';
      if (el.matches(typed)) {
        const size = parseFloat(style.fontSize);
        if (size < 16) bad.push(`${name(el)}: font-size ${style.fontSize}`);
      }
    }
    return bad;
  }, ALLOWED_TOUCH);
}

test('no browser gestures and no small text fields on any screen', async ({ page }) => {
  await ensureTestAudio(page);
  await page.goto('/soundboard-of-storytelling/');
  expect(await offenders(page), 'start screen').toEqual([]);

  await goToLibrary(page);
  expect(await offenders(page), 'library').toEqual([]);

  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  expect(await offenders(page), 'board list').toEqual([]);

  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await page.getByTestId('pad-grid-cell-empty-slot-0-0').click();
  await page.getByTestId('pad-creation-popover').waitFor();
  expect(await offenders(page), 'pad creation popover').toEqual([]);

  // Add the pad from the open popover (the way createPadAtCell00 does), then open its editor
  await page.locator('[data-testid^="pad-creation-popover-source-item-"]').first().click();
  await page.getByTestId('pad-creation-popover-add-button').click();
  await padCells(page).first().click();
  await page.getByRole('button', { name: 'BROWSE' }).click();
  expect(await offenders(page), 'PAD editor with library picker').toEqual([]);
});

// Owner report 2026-10-14: tapping the menu flame quickly zoomed the page in and out on the iPhone.
// iOS WebKit's double-tap zoom ignores the global pan-x pan-y; the flame cancels the end of each
// touch, which keeps the browser from the double tap (and the click the flame does not need).
// Android Chrome has no double-tap zoom on a width=device-width page (Chrome 32+). A desktop
// engine never zooms on a double tap, so the test reads whether the touch's end was canceled.
test.describe('with a touch screen', () => {
  test.use({ hasTouch: true });

  test('a tap on the flame ends without a double-tap zoom, on the start screen and in the menu', async ({
    page,
  }) => {
    /** Taps the flame and tells whether its touchend was canceled — by the time it reaches window. */
    const tapCancelsZoom = async () => {
      await page.evaluate(() => {
        (window as { lastTouchEndPrevented?: boolean }).lastTouchEndPrevented = undefined;
        window.addEventListener(
          'touchend',
          (e) =>
            ((window as { lastTouchEndPrevented?: boolean }).lastTouchEndPrevented =
              e.defaultPrevented),
          { once: true },
        );
      });
      await page.getByRole('img', { name: 'Animated flame' }).tap();
      return page.evaluate(
        () => (window as { lastTouchEndPrevented?: boolean }).lastTouchEndPrevented,
      );
    };
    await page.goto('/soundboard-of-storytelling/');
    expect(await tapCancelsZoom(), 'start screen').toBe(true);
    await openMainMenu(page);
    expect(await tapCancelsZoom(), 'main menu').toBe(true);
    // A swipe still scrolls from the flame: its touch-action is the global one (codeGuards)
    expect(
      await page
        .getByRole('img', { name: 'Animated flame' })
        .evaluate((c) => getComputedStyle(c).getPropertyValue('touch-action')),
    ).toBe('pan-x pan-y');
  });
});

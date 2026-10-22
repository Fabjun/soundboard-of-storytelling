/**
 * @fileoverview Mobile E2E — portrait and landscape (WebKit, iPhone 13 Pro profile)
 *
 * Simulates "Portrait and landscape orientation" of docs/development/manual-iphone-checklist.md:
 * every core screen is turned from portrait (390 × 844) to landscape (844 × 390) and back, and
 * neither the page nor any visible control may stick out at the side — the app reflows. The
 * narrow / wide frame switch at 600 px (ADR-0082) happens on the way.
 * Not simulated: the device's rotation event and safe areas (checklist, "Why manual").
 */

import { test, expect, type Page } from '@playwright/test';
import {
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  goToBoardList,
  goToLibrary,
  seedTestAudio,
} from '../helpers';

const PORTRAIT = { width: 390, height: 844 };
const LANDSCAPE = { width: 844, height: 390 };

/** Checks that nothing sticks out at the side: the page and every visible button and field. */
async function fitsSideways(page: Page, where: string): Promise<void> {
  const width = page.viewportSize()!.width;
  // The frame renders after the resize — wait until the page fits, never read it at once
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth), {
      message: `${where}: the page is not wider than ${width}px`,
    })
    .toBeLessThanOrEqual(width);
  const outside = () =>
    page.evaluate((w) => {
      const controls = document.querySelectorAll<HTMLElement>(
        'button, input, select, [role="tab"]',
      );
      return [...controls]
        .filter((el) => el.offsetParent !== null && !el.closest('[inert]'))
        .filter((el) => {
          // A control inside a container that scrolls sideways (the deck tabs) may be out of view
          for (let p = el.parentElement; p; p = p.parentElement) {
            const s = getComputedStyle(p);
            if (/(auto|scroll)/.test(s.overflowX) && p.scrollWidth > p.clientWidth) return false;
          }
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.left < -1 || r.right > w + 1);
        })
        .map((el) => el.getAttribute('aria-label') ?? el.textContent?.trim() ?? el.tagName);
    }, width);
  await expect
    .poll(outside, { message: `${where}: controls outside the ${width}px width` })
    .toEqual([]);
}

async function assertFitsBothWays(page: Page, where: string): Promise<void> {
  await fitsSideways(page, `${where}, portrait`);
  await page.setViewportSize(LANDSCAPE);
  await fitsSideways(page, `${where}, landscape`);
  await page.setViewportSize(PORTRAIT);
  await fitsSideways(page, `${where}, portrait again`);
}

test('the start screen, the board list and the library reflow in both orientations', async ({
  page,
}) => {
  await seedTestAudio(page);
  await page.goto('/soundboard-of-storytelling/');
  await assertFitsBothWays(page, 'start screen');
  await goToBoardList(page);
  await assertFitsBothWays(page, 'board list');
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await assertFitsBothWays(page, 'library');
});

test('a board in GAME and in SETUP reflows in both orientations', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await assertFitsBothWays(page, 'board in GAME');
  await enterSetupMode(page);
  await assertFitsBothWays(page, 'board in SETUP');
});

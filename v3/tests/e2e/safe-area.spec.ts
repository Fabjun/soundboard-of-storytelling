/**
 * @fileoverview Full E2E — nothing lies under the notch (safe areas)
 *
 * The page uses viewport-fit=cover with a translucent status bar (index.html), so an installed
 * app on an iPhone draws up to the screen's top edge. Found 2026-11-22 on an iPhone: the top of
 * every screen lay under the notch. Chromium emulates the safe areas (DevTools protocol
 * Emulation.setSafeAreaInsetsOverride); each screen and the PAD editor must keep every visible
 * control inside them, upright and turned. WebKit's side: `v3/tests/e2e/mobile/orientation.spec.ts`
 * checks that it keeps the rules; the device: docs/development/manual-iphone-checklist.md.
 */

import { test, expect, type Page } from '@playwright/test';
import {
  addNamedPad,
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  goToBoardList,
  openMainMenu,
} from './helpers';

/** iPhone 13 Pro: the notch and status bar above, the home indicator below (in CSS px). */
const UPRIGHT = {
  size: { width: 390, height: 844 },
  insets: { top: 47, right: 0, bottom: 34, left: 0 },
};
/** The same phone turned: the notch at one side, both sides kept clear. */
const TURNED = {
  size: { width: 844, height: 390 },
  insets: { top: 0, right: 47, bottom: 21, left: 47 },
};

type Insets = typeof UPRIGHT.insets;

/** Gives the page a phone's size and safe areas. */
async function emulatePhone(page: Page, phone: typeof UPRIGHT): Promise<void> {
  await page.setViewportSize(phone.size);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: phone.insets });
}

/** The visible controls and headings that reach into a safe area at the top or the sides. */
async function intoInsets(page: Page, insets: Insets): Promise<string[]> {
  return page.evaluate(({ top, left, right }) => {
    const width = document.documentElement.clientWidth;
    const items = document.querySelectorAll<HTMLElement>(
      'button, input, select, [role="tab"], h1, h2, h3, [role="heading"]',
    );
    return [...items]
      .filter((el) => el.offsetParent !== null && !el.closest('[inert]'))
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.top < top - 0.5 || r.left < left - 0.5 || r.right > width - right + 0.5;
      })
      .map((el) => el.getAttribute('aria-label') ?? el.textContent?.trim() ?? el.tagName);
  }, insets);
}

for (const [label, phone] of [
  ['upright', UPRIGHT],
  ['turned', TURNED],
] as const) {
  test(`${label}: no control lies under the notch on any screen or in the PAD editor`, async ({
    page,
  }) => {
    await emulatePhone(page, phone);
    await page.goto('/soundboard-of-storytelling/');
    const found: string[] = [];
    const check = async (where: string) =>
      found.push(...(await intoInsets(page, phone.insets)).map((n) => `${where}: ${n}`));

    await page.getByRole('button', { name: 'TAP TO START', exact: true }).waitFor();
    await check('start screen');
    await openMainMenu(page);
    await check('main menu');
    await goToBoardList(page);
    await check('board list');
    await createBoardAndNavigate(page);
    await createDeck(page);
    await enterSetupMode(page);
    await check('board');
    await addNamedPad(page, 'Owl');
    await check('PAD editor');
    expect(found).toEqual([]);
  });
}

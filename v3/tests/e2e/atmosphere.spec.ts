/**
 * @fileoverview Full E2E — the atmosphere (Slice 14c, docs/product/features/settings.md S6)
 *
 * In GAME the spine of a Loop that does not play breathes; a Single does not, and nothing breathes
 * in SETUP. A playing pad has an aura behind it in its type's color, which breathes too; the loop
 * that plays stops its own breathing. With the system asking for reduced motion, or Settings →
 * VISUALS → Animations off, the aura stays and nothing moves (WCAG 2.2.2, S12). Read from the
 * computed styles of the pseudo-elements — the aura is the cell's ::before, the spine the pad's.
 * Needs playback, so Chromium only (like audio).
 */

import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  addLoopPad,
  createBoardAndNavigate,
  createDeck,
  enterGameMode,
  enterSetupMode,
  goToBoardList,
  goToLibrary,
  openMainMenu,
  padCells,
  reopenFirstBoard,
  uploadTestAudio,
  waitForSaves,
} from './helpers';

/** The animation of the pad's spine (the pad is the cell's first child). */
const spine = (cell: Locator) =>
  cell.evaluate((el) => getComputedStyle(el.firstElementChild!, '::before').animationName);
/** The aura behind the pad: whether it is drawn, its animation and its gradient. */
const aura = (cell: Locator) =>
  cell.evaluate((el) => {
    const s = getComputedStyle(el, '::before');
    return { drawn: s.content !== 'none', animation: s.animationName, image: s.backgroundImage };
  });

/** A Single in the empty cell (col, 0) from the first library file — the default type. */
async function addSinglePad(page: Page, col: number): Promise<void> {
  await page.getByTestId(`pad-grid-cell-empty-slot-${col}-0`).click();
  await page.locator('[data-testid^="pad-creation-popover-source-item-"]').first().click();
  await page.getByTestId('pad-creation-popover-add-button').click();
  await expect(padCells(page)).toHaveCount(col + 1);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await uploadTestAudio(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page); // through TAP TO START, which unlocks the audio
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await addLoopPad(page, 0);
  await addSinglePad(page, 1);
});

test('idle Loops breathe in GAME only; a Single does not', async ({ page }) => {
  const [loop, single] = [padCells(page).nth(0), padCells(page).nth(1)];
  expect(await spine(loop)).toBe('none'); // SETUP
  await enterGameMode(page);
  await expect.poll(() => spine(loop)).toBe('sb-pad-breath');
  expect(await spine(single)).toBe('none');
  expect((await aura(loop)).drawn).toBe(false); // nothing plays
});

test('a playing pad has an aura in its color that breathes; reduced motion stills it', async ({
  page,
}) => {
  const loop = padCells(page).nth(0);
  await enterGameMode(page);
  await loop.getByRole('button', { pressed: false }).first().click();
  await expect(loop.getByRole('button', { pressed: true })).toBeVisible();
  await expect.poll(async () => (await aura(loop)).animation).toBe('sb-aura-breath');
  // The Loop's glow color (--pad-loop-glow), and the playing loop no longer breathes
  expect((await aura(loop)).image).toContain('rgba(141, 213, 216, 0.55)');
  expect(await spine(loop)).toBe('none');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(async () => (await aura(loop)).animation).toBe('none');
  expect((await aura(loop)).drawn).toBe(true); // the aura stays, still
});

test('with Animations off in Settings nothing breathes, and the aura stands still', async ({
  page,
}) => {
  await waitForSaves(page);
  await page.goto('/soundboard-of-storytelling/');
  await openMainMenu(page);
  await page.getByRole('button', { name: 'SETTINGS', exact: true }).click();
  await page.getByRole('switch', { name: 'Animations', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Animations', exact: true })).toHaveAttribute(
    'aria-checked',
    'false',
  );
  await reopenFirstBoard(page);
  await enterGameMode(page);
  const loop = padCells(page).nth(0);
  expect(await spine(loop)).toBe('none');
  await loop.getByRole('button', { pressed: false }).first().click();
  await expect(loop.getByRole('button', { pressed: true })).toBeVisible();
  await expect.poll(async () => (await aura(loop)).drawn).toBe(true);
  expect((await aura(loop)).animation).toBe('none');
});

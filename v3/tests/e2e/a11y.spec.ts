/**
 * @fileoverview Full E2E — every screen passes an axe accessibility scan (owner rule 2026-10-02)
 *
 * CLAUDE.md UI rules: every control works with the Tab key and has an accessible name; error
 * messages say in plain words what happened and what to do. axe-core finds what a machine can
 * see — names, labels, roles, ARIA — on each screen in its real state (Playwright's documented
 * way: playwright.dev/docs/accessibility-testing). Tab reachability of click handlers is checked
 * statically in codeGuards. Runs in Chromium and WebKit.
 */

import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  addNamedPad,
  closePadEditor,
  createBoardAndNavigate,
  createDeck,
  ensureTestAudio,
  enterGameMode,
  enterSetupMode,
  goToBoardList,
  goToLibrary,
  openDeckRail,
  padCells,
} from './helpers';

/** WCAG 2.2 A and AA rules — the level the project's UI rules aim at. */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/**
 * Not checked here — color contrast: the muted text colors (`--text-mute` and others) are below
 * WCAG AA on many screens; changing them changes the whole look, a design decision for the owner
 * (BACKLOG "Text contrast below WCAG AA"). Review: when that item is decided.
 */
const NOT_CHECKED = ['color-contrast'];

/** The axe violations on the page as it is now, short enough to read in a failure message. */
async function violations(page: Page): Promise<string[]> {
  const result = await new AxeBuilder({ page }).withTags(TAGS).disableRules(NOT_CHECKED).analyze();
  return result.violations.flatMap((v) =>
    v.nodes.map((n) => `${v.id}: ${n.target.join(' ')} — ${v.help}`),
  );
}

test('start screen', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await expect(page.getByRole('button', { name: 'TAP TO UNLOCK' })).toBeVisible();
  expect(await violations(page)).toEqual([]);
});

test('library', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  expect(await violations(page)).toEqual([]);
});

test('board list with a board', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await page.getByTestId('board-top-bar-back-button').click();
  await page.getByTestId('board-list-screen-new-button').waitFor();
  expect(await violations(page)).toEqual([]);
});

test('board in SETUP and GAME, PAD editor', async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await addNamedPad(page, 'Thunder');
  const found = (await violations(page)).map((v) => `PAD editor — ${v}`);
  await closePadEditor(page);
  found.push(...(await violations(page)).map((v) => `SETUP — ${v}`));
  await enterGameMode(page);
  found.push(...(await violations(page)).map((v) => `GAME — ${v}`));
  expect(found).toEqual([]);
});

/**
 * Presses Tab until `target` has focus (at most `max` times) — the way a keyboard user gets
 * there. WebKit on macOS moves to links and fields only, unless "Press Tab to highlight each
 * item" is on; Option+Tab is that system's key for every control (Playwright's WebKit is macOS).
 */
async function tabTo(page: Page, target: Locator, max = 80): Promise<void> {
  const browser = page.context().browser()?.browserType().name();
  const key = browser === 'webkit' ? 'Alt+Tab' : 'Tab';
  for (let i = 0; i < max; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press(key);
  }
  throw new Error(`${key} never reached ${String(target)}`);
}

test('with the keyboard alone: open a board, choose a deck, make a pad from a library file', async ({
  page,
}) => {
  await ensureTestAudio(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await createDeck(page);
  await page.getByTestId('board-top-bar-back-button').click();
  await page.getByTestId('board-list-screen-new-button').waitFor();

  // The board list: Tab to the board, Enter opens it
  await tabTo(page, page.locator('[data-testid^="board-list-screen-open-button-"]').first());
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('mode-toggle')).toBeVisible();

  // The deck rail: Tab to the second deck, Enter shows it
  await enterSetupMode(page);
  await openDeckRail(page);
  const second = page.locator('[data-testid^="deck-rail-select-button-"]').nth(1);
  await tabTo(page, second);
  await page.keyboard.press('Enter');
  await expect(second).toHaveAttribute('aria-current', 'true');

  // A new pad: Tab to an empty cell, Enter opens the file choice; Tab to the file, Enter picks
  // it; Tab to ADD PAD, Enter adds the pad
  await tabTo(page, page.getByTestId('pad-grid-cell-empty-slot-0-0'));
  await page.keyboard.press('Enter');
  const file = page.locator('[data-testid^="pad-creation-popover-source-button-"]').first();
  await tabTo(page, file);
  await page.keyboard.press('Enter');
  await expect(file).toHaveAttribute('aria-pressed', 'true');
  await tabTo(page, page.getByTestId('pad-creation-popover-add-button'));
  await page.keyboard.press('Enter');
  await expect(padCells(page)).toHaveCount(1);
});

test('a file that cannot be imported says why in plain words, opened with the keyboard', async ({
  page,
}) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await page.getByTestId('library-screen-file-input').setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('not audio'),
  });
  await expect(page.getByRole('alert')).toContainText('1 failed');

  const why = page.getByText('Why it failed');
  await tabTo(page, why);
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('library-screen-upload-errors-region')).toContainText(
    'notes.txt: not an audio file this browser can play — use MP3, M4A or WAV',
  );
});

test("type and spacing follow the browser's text size (WCAG 1.4.4, ADR-0081)", async ({ page }) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  const newBoard = page.getByTestId('board-list-screen-new-button');
  const size = () =>
    newBoard.evaluate((el) => {
      const s = getComputedStyle(el);
      return { font: parseFloat(s.fontSize), pad: parseFloat(s.paddingLeft) };
    });
  const normal = await size();
  // A user who sets the browser's text size to 200 % (the root font size doubles)
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  const large = await size();
  expect(large.font).toBeCloseTo(normal.font * 2, 0);
  expect(large.pad).toBeCloseTo(normal.pad * 2, 0);
});

/**
 * @fileoverview Full E2E — no box is shorter than its content (owner decision 2026-11-18, option B)
 *
 * One error class, found three times: a child of a flex column shrank below its content — the icon
 * picker's categories (2026-10-04) and the PAD editor's tab panels (2026-10-23) ran into what came
 * next, the pad's type row (2026-11-18) was cut to 4 px. A flex child may shrink when the column
 * is short; with `overflow` other than visible, or `min-height: 0`, it may shrink to nothing, and
 * the browser shows no error. So the check measures what a person sees: walking every screen and
 * dialog at three window sizes, no box that does not scroll itself holds flowing content — text
 * or in-flow children — lower than its bottom (WCAG 2.2 SC 1.4.10: no loss of content); a menu or
 * a sheet placed out of the flow hangs below its button on purpose. Height only: a name cut short
 * with … is meant. What is larger on purpose is named in `MEANT` with its reason (ADR-0053). And
 * no visually hidden element leaves its parent: the radios of a segmented choice did (2026-11-18).
 */

import { test, expect, type Page } from '@playwright/test';
import {
  addNamedPad,
  closePadEditor,
  createBoardAndNavigate,
  createDeck,
  enterGameMode,
  enterSetupMode,
  goToBoardList,
  goToLibrary,
  openDeckRail,
  openMainMenu,
  seedTestAudio,
} from './helpers';

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const editor = (page: Page) => page.getByRole('dialog', { name: 'Pad editor', exact: true });
const picker = (page: Page) => page.getByRole('dialog', { name: 'Choose an icon', exact: true });
/** The PAD editor's + in its ICONS group. */
const addIcon = (page: Page) =>
  editor(page)
    .getByRole('group', { name: 'ICONS', exact: true })
    .getByRole('button', { name: 'Add an icon', exact: true });
const iconSearch = (page: Page) =>
  picker(page).getByRole('searchbox', { name: 'Search icons by name or word', exact: true });
/**
 * An icon of the picker, by its key. A test ID: the key is shown nowhere (only in the tooltip, no
 * locator — codeGuards), and an icon's name ("dragon") can occur in more than one collection.
 */
const pickerIcon = (page: Page, key: string) =>
  picker(page).getByTestId(`icon-picker-icon-button-${key}`);

/**
 * What may be larger than its box on purpose (ADR-0053: each with its reason) — taken out of the
 * page while it is measured, so the boxes around it are measured without it.
 */
const MEANT: Record<string, string> = {
  '.sb-visually-hidden': 'text only screen readers read — 1 px and clipped by design',
  '.sb-animated-flame-canvas': 'the flame overflows its box with room for sparks (its inventory)',
  '.sb-mode-toggle-half':
    'the 44 px touch target (button rule in global.css) around the 36 px SETUP / GAME pill',
  '.sb-tab': "the active tab's underline lies on the bar's bottom line (margin-bottom: -1px)",
};

/**
 * Every visible box of the page whose content is taller than the box and that does not scroll —
 * named by tag, class and test id, with its heights; `MEANT` is left out.
 */
function shortBoxes(page: Page): Promise<string[]> {
  return page.evaluate((meant) => {
    const style = document.createElement('style');
    style.textContent = `${meant.join(', ')} { display: none !important; }`;
    document.head.append(style);
    /**
     * The lowest edge of what flows in `el`: its text and its children, not what is placed out of
     * the flow (a menu or a sheet hangs below its button on purpose), and not inside a child that
     * clips — that child is measured itself.
     */
    const flowBottom = (el: Element): number => {
      let max = -Infinity;
      for (const c of el.childNodes) {
        if (c.nodeType === Node.TEXT_NODE && c.textContent?.trim()) {
          const range = document.createRange();
          range.selectNodeContents(c);
          const r = range.getBoundingClientRect();
          if (r.height > 0) max = Math.max(max, r.bottom);
        } else if (c instanceof Element) {
          const s = getComputedStyle(c);
          if (s.display === 'none' || ['absolute', 'fixed'].includes(s.position)) continue;
          max = Math.max(max, c.getBoundingClientRect().bottom);
          if (s.overflowY === 'visible') max = Math.max(max, flowBottom(c));
        }
      }
      return max;
    };
    try {
      return [...document.querySelectorAll<HTMLElement>('body *')]
        .filter((el) => {
          const s = getComputedStyle(el);
          if (['auto', 'scroll'].includes(s.overflowY)) return false; // it scrolls: nothing is lost
          if (s.display === 'none' || s.visibility === 'hidden') return false;
          const box = el.getBoundingClientRect();
          if (box.width === 0 || box.height === 0) return false;
          // No slack: the type row lost 1 px of 10 with the fallback font and 6 px with the pixel font
          if (el.scrollHeight <= el.clientHeight) return false;
          return flowBottom(el) > box.bottom - parseFloat(s.borderBottomWidth) + 0.5;
        })
        .map(
          (el) =>
            `${el.tagName.toLowerCase()}.${String(el.className).trim().replace(/\s+/g, '.')}` +
            `${el.dataset.testid ? `[${el.dataset.testid}]` : ''}: ${el.clientHeight} of ${el.scrollHeight}px`,
        );
    } finally {
      style.remove();
    }
  }, Object.keys(MEANT));
}

/**
 * Every visually hidden element that does not sit in its parent — an absolutely placed one that
 * takes the screen or the dialog as its frame stays where the page first put it, does not scroll
 * with it, and its focus can move a box nobody can scroll back (the radios of a segmented choice,
 * found 2026-11-18).
 */
function strayHidden(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.sb-visually-hidden')]
      .filter((el) => {
        const parent = el.parentElement;
        if (!parent || getComputedStyle(parent).display === 'none') return false;
        const a = el.getBoundingClientRect();
        const p = parent.getBoundingClientRect();
        return (
          a.top < p.top - 2 ||
          a.bottom > p.bottom + 2 ||
          a.left < p.left - 2 ||
          a.right > p.right + 2
        );
      })
      .map((el) => `${el.tagName.toLowerCase()} in ${el.parentElement?.className ?? '?'}`),
  );
}

/** Opens the deck list and its BOARD LIGHT — on a phone the list is the DECKS sheet above the grid. */
async function openBoardLight(page: Page): Promise<void> {
  await openDeckRail(page);
  const sheet = button(page, 'DECKS');
  if (await sheet.isVisible()) await sheet.click();
  await page.getByRole('button', { name: /^BOARD LIGHT/ }).click();
}

const SIZES = [
  { name: 'wide', width: 1280, height: 800 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'short', width: 1280, height: 400 },
];

for (const size of SIZES) {
  test(`no box is shorter than its content — ${size.name} window`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    const found: string[] = [];
    const look = async (place: string) => {
      found.push(...(await shortBoxes(page)).map((b) => `${place} — ${b}`));
      found.push(
        ...(await strayHidden(page)).map((b) => `${place} — hidden, not in its parent: ${b}`),
      );
    };

    await page.goto('/soundboard-of-storytelling/');
    await page.getByRole('button', { name: 'TAP TO START', exact: true }).waitFor();
    await look('start');
    await page.getByRole('button', { name: 'TAP TO START', exact: true }).click();
    await page.getByRole('dialog', { name: 'Welcome', exact: true }).waitFor();
    await look('welcome');
    await page.getByRole('button', { name: 'SKIP', exact: true }).click();
    await look('main menu');
    await page.getByRole('button', { name: 'SETTINGS', exact: true }).click();
    await button(page, 'BACK').waitFor();
    await look('settings');
    await page.goto('/soundboard-of-storytelling/');
    await openMainMenu(page);
    await page.getByRole('button', { name: 'HELP', exact: true }).click();
    await page.getByLabel('Search the help', { exact: true }).waitFor();
    await look('help');

    await seedTestAudio(page);
    await page.goto('/soundboard-of-storytelling/');
    await goToLibrary(page);
    await look('library, audio');
    for (const tab of ['ICONS', 'PADS']) {
      await page.getByRole('tab', { name: new RegExp(`^${tab}`) }).click();
      await look(`library, ${tab.toLowerCase()}`);
    }

    await page.goto('/soundboard-of-storytelling/');
    await goToBoardList(page);
    await look('board list, empty');
    await createBoardAndNavigate(page);
    await createDeck(page);
    await enterSetupMode(page);
    await addNamedPad(page, 'Dragon');
    await look('PAD editor, sound');
    await addIcon(page).click();
    // A category by its name and count
    await picker(page)
      .getByRole('button', { name: /^PEOPLE \d+$/ })
      .click();
    await look('icon picker, a category open');
    // Two icons: the pad's picture takes its full height, so a row that gives way shows it (the
    // type row was squeezed to 4 px with two icons, to 9 of 10 px with the placeholder)
    await iconSearch(page).fill('dragon');
    await pickerIcon(page, 'nikoichu:dragon').click();
    await addIcon(page).click();
    await iconSearch(page).fill('fire');
    await pickerIcon(page, 'pixelarticons:fire').click();
    await button(page, 'SAVE').click();
    await page.getByRole('tab', { name: 'LIGHT', exact: true }).click();
    for (const kind of ['Preset', 'Effect', 'Course', 'Off']) {
      await page
        .getByRole('tabpanel', { name: 'LIGHT', exact: true })
        .getByText(kind, { exact: true })
        .click();
      await look(`PAD editor, light ${kind.toLowerCase()}`);
    }
    await addNamedPad(page, 'Wind');
    await editor(page)
      .getByRole('group', { name: 'TYPE', exact: true })
      .getByRole('button', { name: 'LOOP', exact: true })
      .click();
    await button(page, 'SAVE').click();
    await addNamedPad(page, 'Nightfall', { combo: true });
    await button(page, '+ STEP').click();
    await look('PAD editor, combo');
    await closePadEditor(page);
    await look('board, setup');
    await openBoardLight(page);
    await page.getByText('Effect', { exact: true }).click();
    await look('board, deck list with the board light');
    await enterGameMode(page);
    await look('board, game');
    await page.goto('/soundboard-of-storytelling/');
    await goToBoardList(page);
    await look('board list, a board');

    expect(found).toEqual([]);
  });
}

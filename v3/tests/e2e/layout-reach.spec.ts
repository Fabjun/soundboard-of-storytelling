/**
 * @fileoverview Full E2E — every control can be reached on a short window
 *
 * Content that does not fit scrolls; nothing is cut off or hidden under another bar
 * (WCAG 2.2 SC 1.4.10 Reflow: no "loss of information or functionality"). Found 2026-10-02: the
 * deck grid of an imported 8-row deck had no scrolling — its last row slid under the ADD PAD
 * bar and could not be reached.
 *
 * Scrolled the way a person scrolls — the mouse wheel over the area — and then each control must
 * be WHOLLY visible (ratio 1; clipping by a parent counts). Two weaker versions of this test
 * stayed green against the bug: a click only needs the center visible, and Playwright's
 * scrollIntoView also scrolls an `overflow: hidden` box that no person can scroll.
 */

import { test, expect } from '@playwright/test';
import {
  goToBoardList,
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  PAD_CELL,
} from './helpers';

// Four rows of pads do not fit: the pads shrink to the 44 px touch target (src/lib/padFit.ts), and
// four rows of those (with gaps and padding) are still taller than the grid area at this height,
// so without scrolling the fourth row is cut off. At 400 px the shrunk pads still fit.
const SHORT = { width: 1280, height: 300 };

test.beforeEach(async ({ page }) => {
  await page.setViewportSize(SHORT);
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
});

test('the last grid cell can be reached and tapped on a short window', async ({ page }) => {
  // 13 pads: rows 1–3 full, one pad in row 4 — the last pad and the last empty cell sit in row 4
  for (let i = 0; i < 13; i++) {
    // Located by text: the button has no accessible name in Chromium yet (BACKLOG "Role-based E2E locators").
    await page.getByText('ADD PAD', { exact: true }).click();
    await page.getByTestId('pad-editor-panel-close-button').click();
  }
  const pads = page.locator(PAD_CELL);
  await expect(pads).toHaveCount(13);
  const grid = page.getByTestId('pad-grid');
  const overflow = await grid.evaluate((g) => g.scrollHeight - g.clientHeight);
  expect(overflow, 'the window must be short enough that the grid does not fit').toBeGreaterThan(0);

  await grid.hover();
  await page.mouse.wheel(0, 2000);
  await expect(pads.last()).toBeInViewport({ ratio: 1 });
  await pads.last().click();
  await expect(page.getByTestId('pad-editor-panel')).toBeVisible();
  await page.getByTestId('pad-editor-panel-close-button').click();

  const lastCell = page.locator('[data-testid^="pad-grid-cell-empty-slot-"]').last();
  await grid.hover();
  await page.mouse.wheel(0, 2000);
  await expect(lastCell).toBeInViewport({ ratio: 1 });
  await lastCell.click();
  await expect(page.getByTestId('pad-creation-popover')).toBeVisible();
});

test("the pad editor's delete button can be reached on a short window", async ({ page }) => {
  // Located by text: the button has no accessible name in Chromium yet (BACKLOG "Role-based E2E locators").
  await page.getByText('ADD PAD', { exact: true }).click();
  const remove = page.getByTestId('pad-editor-panel-delete-button');
  await page.getByTestId('pad-editor-panel').hover();
  await page.mouse.wheel(0, 2000);
  await expect(remove).toBeInViewport({ ratio: 1 });
  await remove.click(); // one tap deletes: the pad is gone and the undo toast offers it back
  await expect(page.getByTestId('undo-toast')).toBeVisible();
});

// Found 2026-10-23 — the second time after the icon picker below: the PAD editor's tab panels
// were sb-col (min-height 0) inside its scrolling column, got squeezed, and the settings below
// the cut could not be reached. Every control of both tabs, scrolled to with the wheel.
test('every control of both PAD editor tabs can be reached on a short window', async ({ page }) => {
  // A short phone: the narrow frame builds the editor as one scrolling column (ADR-0082)
  await page.setViewportSize({ width: 390, height: 500 });
  await page.getByText('ADD PAD', { exact: true }).click();
  const editor = page.getByTestId('pad-editor-panel');
  /**
   * How much of the element is in view, its parents' clipping included (IntersectionObserver) —
   * 0 when something else lies over its center, as a squeezed section overlaps the next one.
   */
  const shown = (el: Element) =>
    new Promise<number>((resolve) => {
      const io = new IntersectionObserver(([entry]) => {
        io.disconnect();
        const r = entry.boundingClientRect;
        const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        resolve(top !== null && el.contains(top) ? entry.intersectionRatio : 0);
      });
      io.observe(el);
    });
  const tabs = [
    { tab: 'SOUND', prepare: async () => {} },
    { tab: 'LIGHT', prepare: async () => {} },
    // "Off" shows the lamp choice and TRY — a tap on its label, as a person chooses it
    {
      tab: 'LIGHT',
      prepare: () =>
        page
          .getByRole('tabpanel', { name: 'LIGHT', exact: true })
          .getByText('Off', { exact: true })
          .click(),
    },
  ];
  for (const { tab, prepare } of tabs) {
    await page.getByRole('tab', { name: tab, exact: true }).click();
    await prepare();
    const panel = page.getByRole('tabpanel', { name: tab, exact: true });
    // A choice of a SegmentedChoice is tapped on its label; the radio itself is hidden
    const controls = panel.locator(
      'button:visible, select:visible, input:not([type="radio"]):visible, label:has(input[type="radio"]):visible',
    );
    const count = await controls.count();
    expect(count, `${tab}: controls found`).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const control = controls.nth(i);
      const name = (await control.getAttribute('aria-label')) ?? (await control.textContent());
      await editor.hover();
      await page.mouse.wheel(0, -10_000); // from the top, as a person would scroll down
      // Measured first, then one wheel step on — until the control is wholly in view
      await expect
        .poll(
          async () => {
            const ratio = await control.evaluate(shown);
            await page.mouse.wheel(0, 120);
            return ratio;
          },
          { message: `${tab}: "${name}" can be scrolled wholly into view`, intervals: [50] },
        )
        .toBeGreaterThan(0.99);
    }
  }
});

// Found 2026-10-04: in the icon picker an open category shrank to a sliver (a child of a
// scrolling flex column with min-height 0), its icons covered the category headers below it
test('in the icon picker, each category can be reached and opened while others are open', async ({
  page,
}) => {
  await page.getByText('ADD PAD', { exact: true }).click();
  await page.getByTestId('pad-editor-panel-add-icon-button').click();
  const people = page.getByTestId('icon-picker-category-button-people');
  await people.click();
  await people.hover(); // the wheel scrolls the area under the pointer
  // Each header sits right below the category opened before it
  for (const cat of ['creatures', 'animals']) {
    const header = page.getByTestId(`icon-picker-category-button-${cat}`);
    // Steps shorter than a header (44 px), so the wheel cannot pass it between two checks
    await expect(async () => {
      await page.mouse.wheel(0, 40);
      await expect(header).toBeInViewport({ ratio: 1, timeout: 100 });
    }).toPass({ timeout: 20_000 });
    await header.click(); // fails when anything covers the header
    await expect(header).toHaveAttribute('aria-expanded', 'true');
  }

  // No child of a scrolling flex column may be shorter than its content (it would overlap the next)
  const spilled = await page.evaluate(() =>
    [...document.querySelectorAll('*')]
      .filter((el) => {
        const s = getComputedStyle(el);
        return (
          ['auto', 'scroll'].includes(s.overflowY) &&
          /flex/.test(s.display) &&
          s.flexDirection === 'column'
        );
      })
      .flatMap((area) => [...area.children])
      .filter((child) => {
        const s = getComputedStyle(child);
        return (
          s.overflowY === 'visible' &&
          s.position !== 'absolute' &&
          child.scrollHeight > child.clientHeight + 1
        );
      })
      .map(
        (child) =>
          `${child.tagName.toLowerCase()}.${child.className}: ${child.clientHeight} of ${child.scrollHeight}px`,
      ),
  );
  expect(spilled).toEqual([]);
});

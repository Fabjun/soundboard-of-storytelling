/**
 * @fileoverview Full E2E — the browser's own touch gestures are off on every screen (ADR-0067)
 *
 * Reads the computed style of every element in each place with a form field — the start screen,
 * the main menu, Settings, the library with its rename fields and dialogs, the board list, a board
 * in SETUP, the pad creation popover, and the PAD editor with its pickers and combo steps:
 * only scrolling is left to the browser (`touch-action: pan-x pan-y`, or `none` where the app
 * takes the touch itself), nothing can be selected, and every text field has at least 16 px text —
 * iOS zooms into a field with smaller text. Runs in Chromium and WebKit; the iOS long-press menu
 * (`-webkit-touch-callout`) exists only on iOS and is on the manual iPhone checklist.
 */

import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  ensureTestAudio,
  goToBoardList,
  goToLibrary,
  openMainMenu,
  padCells,
  TEST_AUDIO_NAME,
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

// Each place with a form field is opened (2026-10-23: the scan visited five places, and the radios
// in Settings and the LIGHT tab slipped through). A new screen or dialog with a field joins one of
// these walks.
test('no browser gestures and no small text fields: start, main menu, Settings', async ({
  page,
}) => {
  await page.goto('/soundboard-of-storytelling/');
  expect(await offenders(page), 'start screen').toEqual([]);
  await openMainMenu(page);
  expect(await offenders(page), 'main menu').toEqual([]);
  await page.getByRole('button', { name: 'SETTINGS', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Lamp address', exact: true })).toBeVisible();
  expect(await offenders(page), 'Settings with the lamps').toEqual([]);
});

test('no browser gestures and no small text fields: the library and its dialogs', async ({
  page,
}) => {
  await ensureTestAudio(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  expect(await offenders(page), 'library').toEqual([]);

  const file = `${TEST_AUDIO_NAME}.wav`;
  await page.getByRole('button', { name: `Rename ${file}`, exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'File name', exact: true })).toBeVisible();
  expect(await offenders(page), 'library, a file renamed').toEqual([]);
  await page.keyboard.press('Enter');

  await page.getByRole('button', { name: 'SELECT', exact: true }).click();
  await page.getByRole('checkbox', { name: new RegExp(`^${file.replace('.', '\\.')}`) }).check();
  await page
    .getByRole('toolbar', { name: 'Selected files', exact: true })
    .getByRole('button', { name: 'MOVE', exact: true })
    .click();
  const dialog = page.getByRole('alertdialog');
  await dialog.getByRole('radio', { name: 'New folder', exact: true }).check();
  expect(await offenders(page), 'library, MOVE dialog').toEqual([]);
  await dialog.getByRole('textbox', { name: 'Name of the new folder', exact: true }).fill('Night');
  await dialog.getByRole('button', { name: 'MOVE', exact: true }).click();

  await page.getByRole('button', { name: /^Night \d+$/ }).click();
  const bar = page.getByRole('toolbar', { name: 'Folder', exact: true });
  await bar.getByRole('button', { name: 'RENAME', exact: true }).click();
  await expect(bar.getByRole('textbox', { name: 'Folder name', exact: true })).toBeVisible();
  expect(await offenders(page), 'library, a folder renamed').toEqual([]);
});

test('no browser gestures and no small text fields: boards, the PAD editor, templates', async ({
  page,
}) => {
  await ensureTestAudio(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  expect(await offenders(page), 'board list').toEqual([]);
  await page.getByTestId('board-list-screen-new-button').click();
  await page.locator('[data-testid^="board-list-screen-edit-button-"]').first().click();
  expect(await offenders(page), 'board list, a board renamed').toEqual([]);
  await page.keyboard.press('Enter');

  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await page.locator('[data-testid^="deck-rail-deck-tab-"]').first().dblclick();
  await page.getByTestId('deck-rail-name-input').waitFor();
  expect(await offenders(page), 'board, a deck renamed').toEqual([]);
  await page.keyboard.press('Enter');

  await page.getByTestId('pad-grid-cell-empty-slot-0-0').click();
  await page.getByTestId('pad-creation-popover').waitFor();
  expect(await offenders(page), 'pad creation popover').toEqual([]);

  // Add the pad from the open popover (the way createPadAtCell00 does), then open its editor
  await page.locator('[data-testid^="pad-creation-popover-source-item-"]').first().click();
  await page.getByTestId('pad-creation-popover-add-button').click();
  await padCells(page).first().click();
  await page.getByRole('button', { name: 'BROWSE', exact: true }).click();
  // The fields of the LIGHT tab are in the page too, in its hidden panel
  expect(await offenders(page), 'PAD editor with library picker').toEqual([]);
  await page.getByTestId('pad-editor-panel-add-icon-button').click();
  expect(await offenders(page), 'PAD editor, icon picker').toEqual([]);
  await page.keyboard.press('Escape'); // the picker on top closes first

  await page.getByRole('button', { name: 'SAVE AS TEMPLATE', exact: true }).click();
  await page.getByTestId('pad-editor-panel-type-button-combo').click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'SWITCH', exact: true }).click();
  await page.getByTestId('combo-steps-editor-add-button').click();
  expect(await offenders(page), 'PAD editor, combo steps').toEqual([]);

  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await page.getByRole('tab', { name: /^PADS\s*\d+$/ }).click();
  await page.getByRole('button', { name: /^Rename template / }).click();
  expect(await offenders(page), 'library, a template renamed').toEqual([]);
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: /^Add .+ to a board$/ }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  expect(await offenders(page), 'library, ADD a template').toEqual([]);
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
      await page.getByRole('img', { name: 'Animated flame', exact: true }).tap();
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
        .getByRole('img', { name: 'Animated flame', exact: true })
        .evaluate((c) => getComputedStyle(c).getPropertyValue('touch-action')),
    ).toBe('pan-x pan-y');
  });

  test('a tapped button looks as before afterwards — no hover stays on it', async ({ page }) => {
    await page.goto('/soundboard-of-storytelling/');
    await openMainMenu(page);
    const update = page.getByRole('button', { name: /^(UPDATE|CHECKING…)$/ });
    const before = await looks(update);
    await update.tap();
    await expect.poll(() => looks(update)).toEqual(before);
  });
});

/** The look of a control that a hover or a press would change: frame, label, shift, light. */
const looks = (control: Locator) =>
  control.evaluate((el) => {
    const s = getComputedStyle(el);
    return [s.getPropertyValue('--pix-border').trim(), s.color, s.transform, s.filter];
  });

// Owner decision 2026-10-14: no hover effects — a pointer resting on a button changes nothing; a
// press shows briefly (it sinks and lightens) and is gone when the button is let go.
test('a mouse over a button changes nothing; a press shows only while it lasts', async ({
  page,
}) => {
  await page.goto('/soundboard-of-storytelling/');
  await openMainMenu(page);
  const library = page.getByRole('button', { name: 'LIBRARY', exact: true });
  const idle = await looks(library);
  await library.hover();
  expect(await looks(library)).toEqual(idle);
  await page.mouse.down();
  const pressed = await looks(library);
  expect(pressed[2]).not.toBe('none'); // it sinks
  expect(pressed[3]).toContain('brightness'); // and lightens
  expect(pressed[0]).toBe(idle[0]); // frame and label keep their colors — readable
  expect(pressed[1]).toBe(idle[1]);
  await page.mouse.move(0, 0); // away, so letting go does not open the library
  await page.mouse.up();
  await expect.poll(() => looks(library)).toEqual(idle);
});

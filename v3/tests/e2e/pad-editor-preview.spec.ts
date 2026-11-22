/**
 * @fileoverview Full E2E — PAD editor: trim, fades and preview (Slice 15a)
 *
 * Headless Chromium decodes and "plays" audio without output, so the preview's state flow runs
 * for real: ▶ starts it, the playhead time runs, ⏸ holds the position, ⏹ goes back to the trim
 * start, a Single ends on its own. The test file is 1 s long. Trim values are set the ways that
 * need no dragging (WCAG 2.2 SC 2.5.7): number fields and the handles' slider keys. The playback
 * position is a seek slider (APG Media Seek Slider), located by its role and name (ADR-0054).
 */

import { test, expect, type Page } from '@playwright/test';
import {
  goToBoardList,
  ensureTestAudio,
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  createPadAtCell00,
  padCells,
  reopenFirstBoard,
} from './helpers';

/** The PAD editor, a full-screen dialog (ADR-0074). */
const editor = (page: Page) => page.getByRole('dialog', { name: 'Pad editor', exact: true });

/** A button of the PAD editor, by its name. */
const button = (page: Page, name: string) =>
  editor(page).getByRole('button', { name, exact: true });

/** A slider of the waveform editor: a trim or fade handle, or the playback position. */
const slider = (page: Page, name: string) =>
  editor(page).getByRole('slider', { name, exact: true });

/** A trim field of the selected file: Start (s) or End (s). */
const trimField = (page: Page, name: string) =>
  editor(page).getByRole('spinbutton', { name, exact: true });

/** Opens the PAD editor of the pad at cell 0,0. */
async function openEditor(page: Page): Promise<void> {
  await padCells(page).first().click();
  await editor(page).waitFor();
}

test.beforeEach(async ({ page }) => {
  await ensureTestAudio(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page); // TAP TO START unlocks the audio the preview needs
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await createPadAtCell00(page);
  await openEditor(page);
  await slider(page, 'Playback position').waitFor(); // the waveform editor is there
});

test('trim set by number field and slider keys is kept after a reload and a later edit', async ({
  page,
}) => {
  const start = trimField(page, 'Start (s)');
  const end = trimField(page, 'End (s)');

  await start.fill('0.2');
  await start.press('Enter');
  await expect(slider(page, 'Trim start')).toHaveAttribute('aria-valuenow', '0.2');

  const endHandle = slider(page, 'Trim end');
  await endHandle.press('ArrowLeft');
  await endHandle.press('ArrowLeft');
  await expect(end).toHaveValue('0.8');

  // A value outside the file lands where the rules allow, and the field shows it
  await start.fill('5');
  await start.press('Enter');
  await expect(start).toHaveValue('0.7'); // trim end − the shortest region (0.1 s)

  // The fade-in handle cannot pass the trimmed region
  const fadeIn = slider(page, 'Fade-in end');
  await fadeIn.press('End');
  await expect(fadeIn).toHaveAttribute('aria-valuenow', '0.8');

  // Another edit after the trim keeps it — it saves the whole pad
  await editor(page).getByRole('textbox', { name: 'NAME', exact: true }).fill('Trimmed');

  // Closing the editor writes the last change at once (it may still wait for its auto-save)
  await button(page, 'Close the pad editor').click();
  await reopenFirstBoard(page);
  await enterSetupMode(page);
  await openEditor(page);
  await expect(start).toHaveValue('0.7');
  await expect(end).toHaveValue('0.8');
  await expect(fadeIn).toHaveAttribute('aria-valuenow', '0.8');
});

test('a Loop preview runs, holds on pause and goes back to the trim start on stop', async ({
  page,
}) => {
  await editor(page)
    .getByRole('group', { name: 'TYPE', exact: true })
    .getByRole('button', { name: 'LOOP', exact: true })
    .click();
  const position = slider(page, 'Playback position');
  await expect(position).toHaveAttribute('aria-valuenow', '0');

  await button(page, 'Play a preview').click();
  await expect(button(page, 'Pause the preview')).toBeVisible();
  await expect(position).not.toHaveAttribute('aria-valuenow', '0'); // the playhead runs

  await button(page, 'Pause the preview').click();
  await expect(button(page, 'Play a preview')).toBeVisible();
  const held = await position.getAttribute('aria-valuenow');
  await page.waitForTimeout(300); // a paused preview does not move on
  await expect(position).toHaveAttribute('aria-valuenow', held ?? '');

  await button(page, 'Stop the preview').click();
  await expect(position).toHaveAttribute('aria-valuenow', '0');
});

test('a Single preview ends on its own', async ({ page }) => {
  await button(page, 'Play a preview').click();
  await expect(button(page, 'Pause the preview')).toBeVisible();
  // The file is 1 s long: ▶ shows again once it has played to its end
  await expect(button(page, 'Play a preview')).toBeVisible({
    timeout: 5_000,
  });
  await expect(slider(page, 'Playback position')).toHaveAttribute('aria-valuenow', '0');
});

test('a tap on the waveform sets where the preview starts', async ({ page }) => {
  // The waveform has no role of its own — a pointer surface, as a grid cell (testGuards)
  await page.getByTestId('waveform-editor').click(); // Playwright clicks the middle
  await expect(slider(page, 'Playback position')).toHaveAttribute(
    'aria-valuenow',
    /^0\.(49|5|51)$/, // the middle, to the pixel
  );
});

test('the playback position moves with the slider keys, within the trimmed region', async ({
  page,
}) => {
  const end = trimField(page, 'End (s)');
  await end.fill('0.6');
  await end.press('Enter');

  const position = slider(page, 'Playback position');
  await position.press('ArrowRight');
  await expect(position).toHaveAttribute('aria-valuenow', '0.1');
  await position.press('End');
  await expect(position).toHaveAttribute('aria-valuenow', '0.6'); // the trim end, not the file end
  await position.press('Home');
  await expect(position).toHaveAttribute('aria-valuenow', '0');
});

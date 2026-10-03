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
  ensureTestAudio,
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  createPadAtCell00,
  padCells,
  reopenFirstBoard,
} from './helpers';

/** Opens the PAD editor of the pad at cell 0,0. */
async function openEditor(page: Page): Promise<void> {
  await padCells(page).first().click();
  await page.getByTestId('pad-editor-panel').waitFor();
}

test.beforeEach(async ({ page }) => {
  await ensureTestAudio(page);
  await page.goto('/soundboard-of-storytelling/');
  await page.getByRole('button', { name: 'TAP TO UNLOCK' }).click(); // the preview needs audio
  await page.getByTestId('board-list-screen-new-button').waitFor();
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await createPadAtCell00(page);
  await openEditor(page);
  await page.getByTestId('waveform-editor').waitFor();
});

test('trim set by number field and slider keys is kept after a reload and a later edit', async ({
  page,
}) => {
  const start = page.getByTestId('pad-editor-panel-trim-start-input');
  const end = page.getByTestId('pad-editor-panel-trim-end-input');

  await start.fill('0.2');
  await start.press('Enter');
  await expect(page.getByTestId('waveform-editor-trim-start-slider')).toHaveAttribute(
    'aria-valuenow',
    '0.2',
  );

  const endHandle = page.getByTestId('waveform-editor-trim-end-slider');
  await endHandle.press('ArrowLeft');
  await endHandle.press('ArrowLeft');
  await expect(end).toHaveValue('0.8');

  // A value outside the file lands where the rules allow, and the field shows it
  await start.fill('5');
  await start.press('Enter');
  await expect(start).toHaveValue('0.7'); // trim end − the shortest region (0.1 s)

  // The fade-in handle cannot pass the trimmed region
  const fadeIn = page.getByTestId('waveform-editor-fade-in-slider');
  await fadeIn.press('End');
  await expect(fadeIn).toHaveAttribute('aria-valuenow', '0.8');

  // Another edit after the trim keeps it — it saves the whole pad
  await page.getByTestId('pad-editor-panel-name-input').fill('Trimmed');

  // Closing the editor writes the last change at once (it may still wait for its auto-save)
  await page.getByTestId('pad-editor-panel-close-button').click();
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
  await page.getByTestId('pad-editor-panel-type-button-loop').click();
  const position = page.getByRole('slider', { name: 'Playback position' });
  await expect(position).toHaveAttribute('aria-valuenow', '0');

  await page.getByTestId('pad-editor-panel-preview-play-button').click();
  await expect(page.getByTestId('pad-editor-panel-preview-pause-button')).toBeVisible();
  await expect(position).not.toHaveAttribute('aria-valuenow', '0'); // the playhead runs

  await page.getByTestId('pad-editor-panel-preview-pause-button').click();
  await expect(page.getByTestId('pad-editor-panel-preview-play-button')).toBeVisible();
  const held = await position.getAttribute('aria-valuenow');
  await page.waitForTimeout(300); // a paused preview does not move on
  await expect(position).toHaveAttribute('aria-valuenow', held ?? '');

  await page.getByTestId('pad-editor-panel-preview-stop-button').click();
  await expect(position).toHaveAttribute('aria-valuenow', '0');
});

test('a Single preview ends on its own', async ({ page }) => {
  await page.getByTestId('pad-editor-panel-preview-play-button').click();
  await expect(page.getByTestId('pad-editor-panel-preview-pause-button')).toBeVisible();
  // The file is 1 s long: ▶ shows again once it has played to its end
  await expect(page.getByTestId('pad-editor-panel-preview-play-button')).toBeVisible({
    timeout: 5_000,
  });
  await expect(page.getByRole('slider', { name: 'Playback position' })).toHaveAttribute(
    'aria-valuenow',
    '0',
  );
});

test('a tap on the waveform sets where the preview starts', async ({ page }) => {
  await page.getByTestId('waveform-editor').click(); // Playwright clicks the middle
  await expect(page.getByRole('slider', { name: 'Playback position' })).toHaveAttribute(
    'aria-valuenow',
    /^0\.(49|5|51)$/, // the middle, to the pixel
  );
});

test('the playback position moves with the slider keys, within the trimmed region', async ({
  page,
}) => {
  const end = page.getByTestId('pad-editor-panel-trim-end-input');
  await end.fill('0.6');
  await end.press('Enter');

  const position = page.getByRole('slider', { name: 'Playback position' });
  await position.press('ArrowRight');
  await expect(position).toHaveAttribute('aria-valuenow', '0.1');
  await position.press('End');
  await expect(position).toHaveAttribute('aria-valuenow', '0.6'); // the trim end, not the file end
  await position.press('Home');
  await expect(position).toHaveAttribute('aria-valuenow', '0');
});

/**
 * @fileoverview Full E2E — the status bar says whether changes are saved (Slice 12e)
 *
 * The slice table names "a visible saving / saved status" for Slice 12; the words and the place
 * (SAVING… / SAVED next to LIVE / EDIT) are the owner's decision of 2026-10-09. NOT SAVED after a failed
 * save is covered by tests/unit/boardWrites.test.ts (a failed IndexedDB write cannot be forced
 * here). Needs no playback — runs in WebKit too.
 */

import { test, expect } from '@playwright/test';
import {
  addNamedPad,
  createBoardAndNavigate,
  createDeck,
  enterSetupMode,
  goToBoardList,
} from './helpers';

test('SAVED after the board is stored; SAVING… while an edit waits, then SAVED again', async ({
  page,
}) => {
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  // The save status, by its words (it has no role while it says SAVING… or SAVED)
  const status = page.getByText(/^(SAVING…|SAVED|NOT SAVED)$/);
  await expect(status).toHaveText('SAVED');
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
  await expect(status).toHaveText('SAVED');

  await addNamedPad(page, 'Thunder');
  // The name waits half a second before it is written — the status says so meanwhile
  await page
    .getByRole('dialog', { name: 'Pad editor', exact: true })
    .getByRole('textbox', { name: 'NAME', exact: true })
    .pressSequentially('X');
  await expect(status).toHaveText('SAVING…');
  await expect(status).toHaveText('SAVED');
});

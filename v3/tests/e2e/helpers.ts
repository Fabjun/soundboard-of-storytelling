// ─────────────────────────────────────────────────────────────────────────────
// E2E test helpers — shared setup flows for the full Slice-3 suite
//
// All helpers are self-contained (no cross-helper state). Callers are
// responsible for starting from a fresh page.goto('/soundboard-of-storytelling/')
// if they need clean IndexedDB state.
// ─────────────────────────────────────────────────────────────────────────────

import { expect, type Locator, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Absolute path to the 1-second WAV fixture (8-bit mono 8kHz, silence). */
export const TEST_AUDIO_PATH = path.join(__dirname, '../fixtures/test-audio-1s.wav');
export const TEST_AUDIO_NAME = 'test-audio-1s';

// ── Navigation helpers ────────────────────────────────────────────────────────

/** Navigate to the LibraryScreen from StartScreen. */
export async function goToLibrary(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'LIBRARY' }).click();
  await page.getByRole('button', { name: /IMPORT/ }).waitFor();
}

/** Navigate to the BoardListScreen from StartScreen. */
export async function goToBoardList(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'BOARD' }).click();
  await page.getByTestId('board-list-screen-new-button').waitFor();
}

// ── Library helpers ───────────────────────────────────────────────────────────

/**
 * Upload the test WAV file to the library.
 * Caller must already be on the LibraryScreen (goToLibrary called first).
 * Waits for the file name to appear in the list (upload + decode complete).
 */
export async function uploadTestAudio(page: Page): Promise<void> {
  // The file input is hidden (display: none). Playwright can set files on it
  // directly without interacting with the visible IMPORT button.
  const fileInput = page.getByTestId('library-screen-file-input');
  await fileInput.setInputFiles(TEST_AUDIO_PATH);
  // Wait for the filename to appear in the library list (decode complete).
  await page.getByText(TEST_AUDIO_NAME, { exact: false }).waitFor({
    timeout: 10_000,
  });
}

/**
 * WebKit only: headless WebKit cannot decode audio, so the real upload fails there.
 * Instead, write one library entry (metadata shape of the upload pipeline, no audio) straight
 * into the app's IndexedDB and reload. The upload path itself stays covered in Chromium
 * (uploadTestAudio).
 *
 * The seed must never CREATE the database: an open without version would create an empty v1
 * database, and the app's upgrade from v1 then skips the library store (NotFoundError at boot).
 * `indexedDB.databases()` is no proof the app has finished creating it — on 2026-10-01 it listed
 * the database while a fresh document still had none (measured: seed opened an empty v1 at
 * t=111 ms, app failed at t=211 ms). So the seed aborts its own upgrade when the database does
 * not exist yet and retries until the app's library store is there.
 */
export async function seedTestAudio(page: Page): Promise<void> {
  await page.goto('/soundboard-of-storytelling/');
  await expect
    .poll(
      () =>
        page
          .evaluate(
            (name) =>
              new Promise<string>((resolve) => {
                const open = indexedDB.open('sos-v3');
                // No database yet: abort, so this open leaves nothing behind.
                open.onupgradeneeded = () => open.transaction!.abort();
                open.onerror = () => resolve('database not created yet');
                open.onsuccess = () => {
                  const db = open.result;
                  if (!db.objectStoreNames.contains('library')) {
                    db.close();
                    resolve('library store missing');
                    return;
                  }
                  const tx = db.transaction('library', 'readwrite');
                  tx.objectStore('library').put({
                    id: 'e2e0000000000000000000000000000000000000000000000000000000000001',
                    type: 'audio',
                    name,
                    size: 44,
                    tags: [],
                    addedAt: Date.now(),
                    duration: 1,
                    peaks: new Array(30).fill(0.5),
                    // No blob: Playwright's WebKit context (ephemeral, like Safari Private
                    // Browsing) cannot store Blobs in IndexedDB (verified 2026-09-29). The
                    // WebKit specs never play audio, and libGetAllMeta never reads the blob.
                  });
                  tx.oncomplete = () => {
                    db.close();
                    resolve('seeded');
                  };
                  tx.onerror = () => resolve(`seed failed: ${String(tx.error)}`);
                };
              }),
            `${TEST_AUDIO_NAME}.wav`,
          )
          // A navigation between two attempts destroys the evaluation context — try again.
          .catch((e: unknown) => `evaluate failed: ${String(e)}`),
      { message: 'seed the test audio into the app database', timeout: 10_000 },
    )
    .toBe('seeded');
  await page.reload();
}

/**
 * Make one test audio file available in the library: real upload in Chromium,
 * seeded entry in WebKit (no audio codecs headless). Ends on the StartScreen.
 */
export async function ensureTestAudio(page: Page): Promise<void> {
  const browser = page.context().browser()?.browserType().name();
  if (browser === 'webkit') {
    await seedTestAudio(page);
    return;
  }
  await page.goto('/soundboard-of-storytelling/');
  await goToLibrary(page);
  await uploadTestAudio(page);
}

// ── Board helpers ─────────────────────────────────────────────────────────────

/**
 * Create one board and navigate into its BoardScreen.
 * Caller must already be on the BoardListScreen.
 */
export async function createBoardAndNavigate(page: Page): Promise<void> {
  await page.getByTestId('board-list-screen-new-button').click();
  // Board row appears in the list
  const boardRow = page.locator('[data-testid^="board-list-screen-row-"]').first();
  await boardRow.waitFor();
  // Click the row title to open the board (action buttons stop propagation)
  await boardRow.locator('[data-testid^="board-list-screen-name-text-"]').click();
  // ModeToggle is always present in BoardScreen
  await page.getByTestId('mode-toggle').waitFor();
}

// ── Deck helpers ─────────────────────────────────────────────────────────────

/**
 * Create a new deck in the current BoardScreen.
 * Returns the deck's data-testid ID part (e.g. "abc123").
 */
export async function createDeck(page: Page): Promise<string> {
  await page.getByTestId('deck-rail-new-button').click();
  const deckTab = page.locator('[data-testid^="deck-rail-deck-tab-"]').first();
  await deckTab.waitFor();
  const testid = await deckTab.getAttribute('data-testid');
  return testid!.replace('deck-rail-deck-tab-', '');
}

// ── Mode helpers ──────────────────────────────────────────────────────────────

/** Switch the ModeToggle to SETUP mode. No-op if already in SETUP. */
export async function enterSetupMode(page: Page): Promise<void> {
  const setup = page.getByRole('button', { name: 'SETUP' });
  if ((await setup.getAttribute('aria-pressed')) === 'true') return;
  await setup.click();
  await page.getByRole('button', { name: 'SETUP', pressed: true }).waitFor();
}

/** Switch the ModeToggle to GAME mode. No-op if already in GAME. */
export async function enterGameMode(page: Page): Promise<void> {
  const game = page.getByRole('button', { name: 'GAME' });
  if ((await game.getAttribute('aria-pressed')) === 'true') return;
  await game.click();
  await page.getByRole('button', { name: 'GAME', pressed: true }).waitFor();
}

// ── Compound helpers ──────────────────────────────────────────────────────────

/**
 * Full setup: library audio → board → deck.
 * Starts from a fresh page (page.goto('/soundboard-of-storytelling/') already called).
 * After this call, the page is on a BoardScreen in SETUP mode with one deck.
 */
export async function setupBoardAndDeck(page: Page): Promise<void> {
  await goToLibrary(page);
  await uploadTestAudio(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await createBoardAndNavigate(page);
  await createDeck(page);
  await enterSetupMode(page);
}

/**
 * Create one pad at grid position (col=0, row=0) via Path A (tap-empty-cell).
 * Requires: BoardScreen in SETUP mode, deck exists, audio in library.
 * After this call, a pad occupying cell 0,0 exists.
 */
export async function createPadAtCell00(page: Page): Promise<string> {
  await page.getByTestId('pad-grid-cell-empty-slot-0-0').click();
  const popover = page.getByTestId('pad-creation-popover');
  await popover.waitFor();
  // Select the first source item in the RECENT tab
  const sourceItem = page.locator('[data-testid^="pad-creation-popover-source-item-"]').first();
  await sourceItem.waitFor({ timeout: 5_000 });
  await sourceItem.click();
  // Add the pad
  await page.getByTestId('pad-creation-popover-add-button').click();
  // Wait for the occupied cell (no longer pad-cell-empty-0-0)
  await page
    .locator('[data-testid^="pad-grid-cell-"]:not([data-testid^="pad-grid-cell-empty-slot-"])')
    .first()
    .waitFor();
  // Return the pad ID from the testid
  const padCell = page
    .locator('[data-testid^="pad-grid-cell-"]:not([data-testid^="pad-grid-cell-empty-slot-"])')
    .first();
  const testid = await padCell.getAttribute('data-testid');
  return testid!.replace('pad-grid-cell-', '');
}

// ── Pointer drag (Pointer Events DnD — padDnd.ts / libDnd.ts) ─────────────────

/** Where inside the target the pointer is released. */
export type DropPoint = 'center' | 'left-edge' | 'right-edge';

/**
 * Real pointer drag: press on `source`, move in small steps (well past the 8px
 * drag threshold) to `target`, release. The app uses Pointer Events with
 * setPointerCapture — Playwright's dragTo() (HTML5 DnD) would not trigger it.
 * Edge points are 4px inside the target's left/right border (INSERT zones are
 * min(25% width, 22px)).
 */
export async function pointerDrag(
  page: Page,
  source: Locator,
  target: Locator,
  drop: DropPoint = 'center',
): Promise<void> {
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error('pointerDrag: source or target not visible');
  const sx = from.x + from.width / 2;
  const sy = from.y + from.height / 2;
  const tx =
    drop === 'left-edge'
      ? to.x + 4
      : drop === 'right-edge'
        ? to.x + to.width - 4
        : to.x + to.width / 2;
  const ty = to.y + to.height / 2;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx + 12, sy + 12, { steps: 4 }); // cross the drag threshold
  await page.mouse.move(tx, ty, { steps: 15 });
  await page.mouse.up();
}

/** Grid position ("col,row") of a pad, read from its cell's data-pos attribute. */
export async function padPosition(page: Page, padId: string): Promise<string | null> {
  return page.getByTestId(`pad-grid-cell-${padId}`).getAttribute('data-pos');
}

/**
 * Waits until no board save is running. A change shows BEFORE it is stored (updateBoard), so a
 * visible change is no proof it is saved — wait for this before every reload or navigation.
 */
export async function waitForSaves(page: Page): Promise<void> {
  await expect(page.locator('html')).not.toHaveAttribute('data-saving');
}

/** Reload after the running board saves have finished (the only reload E2E specs use). */
export async function reloadApp(page: Page): Promise<void> {
  await waitForSaves(page);
  await page.reload();
}

/** Once the saves are done: StartScreen → board list → open the first board. */
export async function reopenFirstBoard(page: Page): Promise<void> {
  await waitForSaves(page);
  await page.goto('/soundboard-of-storytelling/');
  await goToBoardList(page);
  await page.locator('[data-testid^="board-list-screen-name-text-"]').first().click();
  await page.getByTestId('mode-toggle').waitFor();
}

// ── Pads ──────────────────────────────────────────────────────────────────────

/** The pads shown in the grid (not the empty cells). */
export const padCells = (page: Page) =>
  page.locator('[data-testid^="pad-grid-cell-"]:not([data-testid^="pad-grid-cell-empty-slot-"])');

/**
 * ADD PAD in the open deck or All pads, optionally made a Combo while it is still fresh (no
 * dialog), then named. Returns the new pad's id. Needs SETUP mode.
 */
export async function addNamedPad(
  page: Page,
  name: string,
  opts: { combo?: boolean } = {},
): Promise<string> {
  const before = await padCells(page).count();
  // Located by text: the button has no accessible name in Chromium yet (BACKLOG "Role-based E2E locators").
  await page.getByText('ADD PAD', { exact: true }).click();
  await expect(padCells(page)).toHaveCount(before + 1);
  const testId = (await padCells(page).nth(before).getAttribute('data-testid'))!;
  if (opts.combo) await page.getByTestId('pad-editor-panel-type-button-combo').click();
  await page.getByTestId('pad-editor-panel-name-input').fill(name);
  await expect(page.getByTestId(testId)).toContainText(name);
  return testId.replace('pad-grid-cell-', '');
}

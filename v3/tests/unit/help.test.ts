/**
 * @fileoverview help — opening and leaving the help (Slice 17a), the welcome (Slice 17d)
 *
 * Cases: the help opens at the topic of the place it came from, a board's by its mode; a topic can
 * be named; BACK returns to where it came from; from the help itself nothing changes. The welcome
 * shows on the first start only while it was never closed and nothing is made — no board, no
 * audio; closing it notes it as seen; the help opens it at any time.
 */

import { IDBFactory } from 'fake-indexeddb';
import { _resetDB } from '../../src/db/idb';
import {
  closeHelp,
  closeWelcome,
  openHelp,
  openWelcome,
  welcomeOnFirstStart,
} from '../../src/state/help';
import { getWelcomeSeen, loadPrefs } from '../../src/state/prefs';
import {
  boards,
  currentMode,
  currentScreen,
  helpReturn,
  helpTopic,
  libraryItems,
  welcomeOpen,
} from '../../src/state/store';
import type { Board, LibraryItemMeta } from '../../src/types';

beforeEach(async () => {
  currentScreen.value = 'menu';
  currentMode.value = 'play';
  helpReturn.value = 'menu';
  helpTopic.value = 'menu';
  welcomeOpen.value = false;
  boards.value = [];
  libraryItems.value = [];
  (globalThis as Record<string, unknown>).indexedDB = new IDBFactory();
  _resetDB();
  await loadPrefs(); // nothing seen yet
});

describe('openHelp / closeHelp', () => {
  it('opens at the topic of the place, a board by its mode; BACK returns there', () => {
    currentScreen.value = 'board';
    openHelp();
    expect([currentScreen.value, helpTopic.value, helpReturn.value]).toEqual([
      'help',
      'board-game',
      'board',
    ]);
    closeHelp();
    expect(currentScreen.value).toBe('board');

    currentMode.value = 'edit';
    openHelp();
    expect(helpTopic.value).toBe('board-setup');
  });

  it('a named topic wins; from the help itself nothing changes', () => {
    currentScreen.value = 'library';
    openHelp('backup');
    expect([helpTopic.value, helpReturn.value]).toEqual(['backup', 'library']);
    openHelp('keys');
    expect([helpTopic.value, helpReturn.value]).toEqual(['backup', 'library']);
  });
});

describe('the welcome', () => {
  it('shows on the first start of a fresh installation; closed, it is seen and stays away', () => {
    welcomeOnFirstStart();
    expect(welcomeOpen.value).toBe(true);
    closeWelcome();
    expect([welcomeOpen.value, getWelcomeSeen()]).toEqual([false, true]);
    welcomeOnFirstStart();
    expect(welcomeOpen.value).toBe(false);
  });

  it('an installation in use does not get it: a board or one audio file is enough', () => {
    boards.value = [{ id: 'b1' } as Board];
    welcomeOnFirstStart();
    expect(welcomeOpen.value).toBe(false);

    boards.value = [];
    libraryItems.value = [{ id: 'a1' } as LibraryItemMeta];
    welcomeOnFirstStart();
    expect(welcomeOpen.value).toBe(false);
  });

  it('the help opens it at any time, also once seen', () => {
    closeWelcome();
    boards.value = [{ id: 'b1' } as Board];
    openWelcome();
    expect(welcomeOpen.value).toBe(true);
  });
});

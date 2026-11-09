/**
 * @fileoverview help — opening and leaving the help (Slice 17a)
 *
 * Cases: the help opens at the topic of the place it came from, a board's by its mode; a topic can
 * be named; BACK returns to where it came from; from the help itself nothing changes.
 */

import { closeHelp, openHelp } from '../../src/state/help';
import { currentMode, currentScreen, helpReturn, helpTopic } from '../../src/state/store';

beforeEach(() => {
  currentScreen.value = 'menu';
  currentMode.value = 'play';
  helpReturn.value = 'menu';
  helpTopic.value = 'menu';
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

/**
 * @fileoverview helpTopics — the help texts (Slice 17a)
 *
 * Edge-case checklist: every topic has a title and text, ids are unique; every screen opens a
 * topic that exists, the board's by its mode (a screen without a topic does not compile — the
 * Record over the screen type); the search: empty finds all, one word, several words that must all
 * be there, case ignored, a search word the text does not hold, nothing found.
 */

import { HELP_TOPICS, searchHelp, topicForPlace } from '../../src/lib/helpTopics';
import type { AppScreen } from '../../src/state/store';

const SCREENS: AppScreen[] = [
  'start',
  'menu',
  'help',
  'settings',
  'library',
  'board-list',
  'board',
];

describe('HELP_TOPICS', () => {
  it('every topic has a title and at least one paragraph; no id twice', () => {
    expect(
      HELP_TOPICS.filter((t) => !t.title || t.text.length === 0 || t.text.some((p) => !p)),
    ).toEqual([]);
    expect(new Set(HELP_TOPICS.map((t) => t.id)).size).toBe(HELP_TOPICS.length);
  });
});

describe('topicForPlace', () => {
  it('every screen opens a topic that exists; a board opens the topic of its mode', () => {
    const ids = new Set(HELP_TOPICS.map((t) => t.id));
    expect(SCREENS.filter((s) => !ids.has(topicForPlace(s, 'edit')))).toEqual([]);
    expect(topicForPlace('board', 'play')).toBe('board-game');
    expect(topicForPlace('board', 'edit')).toBe('board-setup');
    expect(topicForPlace('library', 'play')).toBe('library');
  });
});

describe('searchHelp', () => {
  const titles = (q: string) => searchHelp(q).map((t) => t.title);

  it('an empty search finds every topic, in their order', () => {
    expect(titles('  ')).toEqual(HELP_TOPICS.map((t) => t.title));
  });

  it('finds by a word in the text, case ignored, and by a search word the text does not hold', () => {
    expect(titles('NUMPAD')).toContain('Keys and numpad');
    expect(titles('bluetooth')).toEqual(['Keys and numpad']);
  });

  it('several words must all be in one topic; nothing found is an empty list', () => {
    expect(titles('stop fade')).toEqual(expect.arrayContaining(['A board in GAME']));
    expect(titles('stop fade')).not.toContain('Library');
    expect(titles('zebra')).toEqual([]);
  });
});

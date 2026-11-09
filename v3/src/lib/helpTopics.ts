/**
 * @fileoverview helpTopics — the help texts, one topic for every place of the app (Slice 17a,
 * BACKLOG "Help screen and context help")
 *
 * The texts are data in one place, each topic with an id, so the help screen lists and searches
 * them and every screen can open its own topic. Short but complete, in plain words, with concrete
 * steps (NN/g heuristic 10: easy to search, focused on the task, concrete steps); app UI text, so
 * it may address the user (owner decision 2026-10-03). `topicForPlace` maps every screen — a
 * Record over the screen type, so a new screen without a topic does not compile.
 */

import type { AppMode } from '../types';
import type { AppScreen } from '../state/store';

/** The id of a help topic. */
export type HelpTopicId =
  | 'start'
  | 'menu'
  | 'board-list'
  | 'board-setup'
  | 'board-game'
  | 'pad-editor'
  | 'combo'
  | 'keys'
  | 'library'
  | 'light'
  | 'backup'
  | 'settings';

/** One topic: its title, its paragraphs, and words it is found by that the text does not hold. */
export interface HelpTopic {
  id: HelpTopicId;
  title: string;
  text: readonly string[];
  words: readonly string[];
}

/** Every topic, in the order the help lists them. */
export const HELP_TOPICS: readonly HelpTopic[] = [
  {
    id: 'start',
    title: 'Start',
    text: [
      'Tap TAP TO START. The tap lets the browser play sound — browsers play audio only after a tap — and opens the main menu.',
    ],
    words: ['begin', 'open', 'sound', 'unlock'],
  },
  {
    id: 'menu',
    title: 'Main menu',
    text: [
      'BOARD opens your boards. LIBRARY holds your audio files, your own icons and your pad templates. SETTINGS changes how the app works. HELP opens this help.',
      'UPDATE looks for a new version of the app. The version number at the bottom opens What’s new.',
    ],
    words: ['menu', 'version', 'whats new'],
  },
  {
    id: 'board-list',
    title: 'Boards',
    text: [
      'A board holds the pads and decks for one game session or campaign.',
      'NEW BOARD makes a board; tap a board’s name to open it. The pencil renames it. The bin deletes it: tap it, then CONFIRM.',
      'EXPORT and IMPORT save and restore everything in one file — see Backup and import.',
    ],
    words: ['board', 'new', 'rename', 'delete', 'campaign', 'session'],
  },
  {
    id: 'board-setup',
    title: 'A board in SETUP',
    text: [
      'SETUP is for building; GAME is for playing. Switch with SETUP / GAME at the top.',
      'NEW DECK makes a deck — your hand-picked selection of pads. Tap an empty cell or ADD PAD for a new pad, and tap a pad to change it in the PAD editor.',
      'Drag a pad onto another pad to swap the two, or onto a cell’s left edge to insert it there.',
      'The deck list — its button shows and hides it — holds All pads (every pad of the board), your decks and the PAD SIZE slider. ⋯ at a deck renames, duplicates or deletes it; ▲ and ▼ move it.',
      'LIB opens the library at the side: drag a file onto a cell to make a pad that plays it. The arrows at the top undo and redo your changes.',
    ],
    words: ['setup', 'edit', 'deck', 'pad', 'drag', 'move', 'undo', 'redo', 'size'],
  },
  {
    id: 'board-game',
    title: 'A board in GAME',
    text: [
      'Tap a pad to play it. A Single plays once — tap it again to stop it. A Loop plays until you tap it again. A Combo plays its steps.',
      'STOP ALL fades every sound out; a second press stops everything at once. The padlock keeps the app in GAME, so a stray tap cannot switch to SETUP.',
      'The star bar (quick access) holds pads you need in every deck. The line at the bottom says what plays now.',
      'The keyboard and a numpad play and stop pads too — see Keys and numpad.',
    ],
    words: ['game', 'play', 'live', 'stop', 'fade', 'lock', 'quick access', 'star'],
  },
  {
    id: 'pad-editor',
    title: 'PAD editor',
    text: [
      'NAME is the pad’s name. ICONS adds up to four pictures (+); your own icons come first, as OWN.',
      'SOUND: TYPE chooses SGL (a Single plays once), LOOP (plays until stopped) or COMBO (plays other pads in steps). AUDIO FILES: BROWSE adds files from the library; each file has its own start and end, set on its waveform. VOLUME, FADE IN and FADE OUT shape the sound.',
      'LIGHT: what the pad does to a lamp when it starts — see Light.',
      'HOTKEY: tap it, then press the key that plays the pad. DECKS: which decks show the pad. The star puts it in the quick-access bar.',
      'SAVE keeps your changes; the arrows in the editor undo and redo them. SAVE AS TEMPLATE keeps a copy in the library. REMOVE FROM DECK takes it off this deck; DELETE PAD removes it from the board.',
    ],
    words: [
      'editor',
      'single',
      'loop',
      'file',
      'trim',
      'waveform',
      'volume',
      'fade',
      'icon',
      'hotkey',
      'template',
    ],
  },
  {
    id: 'combo',
    title: 'Combos',
    text: [
      'A combo plays other pads of the board, step by step. In the PAD editor choose COMBO, then + STEP for each step.',
      'In a step, “+ pad…” adds the pads it plays together. “Wait (s)” is how long the step lasts before the next one starts. “Stop everything first” stops every sound before the step plays.',
    ],
    words: ['combo', 'step', 'sequence', 'wait', 'chain'],
  },
  {
    id: 'keys',
    title: 'Keys and numpad',
    text: [
      'In GAME a pad’s HOTKEY plays it — each deck has its own keys; the keys of the quick-access bar work in every deck. A key does nothing while its pad plays.',
      'Enter (also the numpad’s Enter) stops the sound started last — or every sound, if Settings says so. The numpad’s decimal key is STOP ALL. Space pauses every sound; press it again to go on.',
      'STOP ALL and PAUSE can move to other keys in Settings → CONTROLS. In SETUP and while you type in a field, keys do nothing.',
    ],
    words: ['key', 'keyboard', 'numpad', 'hotkey', 'enter', 'space', 'pause', 'bluetooth'],
  },
  {
    id: 'library',
    title: 'Library',
    text: [
      'AUDIO: IMPORT adds audio files — or drop them anywhere on the screen. Tap a name to rename the file; ▶ plays it. A chosen file shows which pads play it.',
      'The bin moves a file to Recently deleted, where it stays 30 days; RESTORE brings it back. SELECT chooses several files to MOVE into a folder or DELETE. Search and sort are above the list.',
      'ICONS: ADD ICONS takes SVG files up to 100 KB as your own pad icons. PADS: your pad templates — ADD puts a copy on a board.',
    ],
    words: [
      'audio',
      'file',
      'import',
      'upload',
      'folder',
      'trash',
      'deleted',
      'restore',
      'icon',
      'svg',
      'template',
    ],
  },
  {
    id: 'light',
    title: 'Light',
    text: [
      'A pad can start a light on a WLED lamp in your home network. In Settings → LIGHT add the lamp with its address (shown in the lamp’s own app) and TEST it; the browser may ask to reach the local network — allow it.',
      'Make presets in the lamp’s own app. In the PAD editor, LIGHT chooses a preset number or Off; TRY shows it at once. When a lamp does not answer, the status bar shows LIGHT ✕; the sound plays anyway.',
      'Browsers on an iPhone or iPad cannot reach a lamp; use a computer with Chrome or Brave.',
    ],
    words: ['lamp', 'wled', 'preset', 'light', 'color'],
  },
  {
    id: 'backup',
    title: 'Backup and import',
    text: [
      'Everything lives only in this browser. EXPORT in the board list makes one file with your boards, audio, templates and icons; SAVE it somewhere outside the browser — e.g. Files on the iPhone. The board list reminds you when the last backup is old.',
      'IMPORT reads such a file — or a backup of the old app —, says what it holds, and adds it. Nothing you have is changed: files already there are skipped, and boards come in as new boards.',
    ],
    words: ['backup', 'export', 'import', 'restore', 'save', 'file', 'zip', 'v1', 'old app'],
  },
  {
    id: 'settings',
    title: 'Settings',
    text: [
      'Every change applies at once. CONTROLS: what Enter stops, and the keys of STOP ALL and PAUSE. APPEARANCE: the theme, how wide screens get, and whether PAD SIZE is per board or the same on every board.',
      'VISUALS: the animations. LIGHT: your lamps. DATA: when the board list reminds you to back up. DEVELOPER: a log to read when something went wrong. ABOUT: the version and the licenses.',
    ],
    words: ['settings', 'options', 'theme', 'color', 'keys', 'reminder', 'log'],
  },
];

/** The topic each screen opens; the board's depends on its mode. Every screen has one. */
const TOPIC_OF_SCREEN: Record<AppScreen, HelpTopicId | { play: HelpTopicId; edit: HelpTopicId }> = {
  start: 'start',
  menu: 'menu',
  help: 'menu',
  settings: 'settings',
  library: 'library',
  'board-list': 'board-list',
  board: { play: 'board-game', edit: 'board-setup' },
};

/** Returns the topic of a place: the screen, and on a board its mode. */
export function topicForPlace(screen: AppScreen, mode: AppMode): HelpTopicId {
  const topic = TOPIC_OF_SCREEN[screen];
  return typeof topic === 'string' ? topic : topic[mode];
}

/**
 * Returns the topics a search finds: every word of `query` (case ignored) is in the topic's
 * title, text or search words. An empty query finds every topic.
 */
export function searchHelp(query: string): HelpTopic[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return HELP_TOPICS.filter((t) => {
    const all = [t.title, ...t.text, ...t.words].join(' ').toLowerCase();
    return words.every((w) => all.includes(w));
  });
}

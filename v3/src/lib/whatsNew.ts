/**
 * @fileoverview What's new — the release notes the app shows (ADR-0063)
 *
 * Written by hand for the people who use the app: only changes they can notice, in plain words,
 * saying what the app can do now. Grouped per version as New / Improved / Fixed / Removed, newest
 * first. The notes never address the reader — no "you", no commands; the app or the feature is the
 * subject (owner rule 2026-10-03). Internal work (tests, documentation, tooling) never appears
 * here — it is recorded in src/lib/changelog.ts, from which CHANGELOG.md is generated.
 * Checked by tests/unit/whatsNew.test.ts.
 */

/** One version's notes; every group is optional, but an entry has at least one sentence. */
export interface WhatsNewEntry {
  /** A version that exists in src/lib/changelog.ts. */
  version: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** Things the app can do that it could not do before. */
  new?: string[];
  /** Things that work better or differently. */
  improved?: string[];
  /** Mistakes that no longer happen. */
  fixed?: string[];
  /** Things that are gone. */
  removed?: string[];
}

/** The headings of the groups, in the order the app shows them. */
export const WHATS_NEW_GROUPS = [
  ['new', 'New'],
  ['improved', 'Improved'],
  ['fixed', 'Fixed'],
  ['removed', 'Removed'],
] as const;

/**
 * Returns the line at the top of What's new: the running version, and — when the newest notes
 * belong to an earlier version — which one, because versions without visible changes (tests,
 * documentation) have no notes (owner question 2026-10-03: "155 shown, notes end at 149").
 */
export function versionLine(appVersion: string, entries: readonly WhatsNewEntry[]): string {
  const latest = entries[0]?.version;
  return !latest || latest === appVersion
    ? `Version ${appVersion}.`
    : `Version ${appVersion} — the latest visible changes came with ${latest}.`;
}

/** The release notes the start screen shows, newest first (checked by whatsNew.test.ts). */
export const WHATS_NEW: WhatsNewEntry[] = [
  {
    version: '3.0.158',
    date: '2026-10-03',
    new: [
      'The PAD editor shows the waveform of a Single or Loop pad with handles for the trim start and end and for the fade-in and fade-out; each handle also moves with the keyboard, and the trim also has number fields.',
      'A preview plays the pad as it will sound — with its trim, fades and volume, a Loop within its trimmed part — with play, pause and stop and a moving playback position; a tap on the waveform or the arrow keys set where it starts.',
    ],
    fixed: ['A trimmed Loop repeats only its trimmed part.'],
  },
  {
    version: '3.0.157',
    date: '2026-10-03',
    fixed: [
      'On iPhone, pads can be heard with the ring/silent switch set to silent, like a music app.',
      'On iPhone, sound comes back after a call or another app has interrupted it.',
    ],
    improved: [
      "What's new names the running version and, when it brought no visible changes, the version with the latest ones.",
    ],
  },
  {
    version: '3.0.149',
    date: '2026-10-03',
    fixed: [
      'On a narrow screen, adding a pad to an empty cell no longer shows a wrong cell name in the title.',
    ],
  },
  {
    version: '3.0.145',
    date: '2026-10-03',
    improved: [
      'EXPORT now saves a ZIP file that holds the audio files as they are, so its sounds open in any player.',
      'Backups from the old app (V1) now import on iPhones with iOS 15 or an iOS 16 before 16.4 too.',
      'Importing a backup keeps the tags of the audio files; folders from the old app become tags.',
    ],
  },
  {
    version: '3.0.144',
    date: '2026-10-03',
    fixed: [
      'A change in the pad editor is saved even when the next pad opens, the editor closes or the app goes to the background right after typing.',
    ],
  },
  {
    version: '3.0.143',
    date: '2026-10-03',
    new: [
      'All pads can be sorted by name, date added, date modified, kind, duration or last played, or with the pads that are in no deck first — each order can be reversed, and every board remembers its choice.',
    ],
    improved: [
      'A duplicated deck appears directly after its original.',
      'The app keeps its settings in the same storage as the boards. After this update every board opens once in its first deck, and the board list shows "No backup yet" until the next export.',
    ],
  },
  {
    version: '3.0.142',
    date: '2026-10-03',
    new: [
      'The pad editor edits combos: steps can be added, each step names the pads that start together and the wait before the next step, and a step can stop everything first.',
    ],
    improved: [
      'A combo can no longer start itself, directly or through another combo — the editor only offers pads that cannot lead back to it.',
    ],
    fixed: ['A name typed right after ADD PAD now goes to the new pad, not to the one before.'],
  },
  {
    version: '3.0.141',
    date: '2026-10-03',
    new: [
      'EXPORT on the board list saves all boards and audio files in one backup file — on the iPhone through the share sheet, elsewhere as a download.',
      'IMPORT on the board list reads a backup from this app or from version 1: a summary comes first, then the progress, and afterwards a list of what could not be taken over.',
      'Importing adds boards and audio files and never changes or removes anything that is already there.',
      'The board list shows when the last backup was made and reminds after a week without one.',
    ],
    improved: [
      'The app asks the browser to keep its stored data, so boards and audio are not cleared when the device runs low on space.',
    ],
  },
  {
    version: '3.0.140',
    date: '2026-10-03',
    new: [
      'A Single can hold several files and plays the next one, or a random one, on each tap.',
      'A Loop can hold several files and plays them one after another, in order or shuffled.',
    ],
    improved: [
      'Three pad types instead of four: the Playlist became a Loop with several files.',
      'In a combo, a Loop with several files plays in the background, so the next step starts at once.',
      'A Loop with several files glows like any other Loop while it plays.',
    ],
    removed: [
      'Boards from earlier test versions are cleared once more by this update; the audio library stays.',
    ],
  },
  {
    version: '3.0.139',
    date: '2026-10-03',
    new: [
      'All pads can add pads that are in no deck yet — with ADD PAD or by dropping a file from the library.',
    ],
    improved: ['A board opens again in the view it was left in.'],
  },
  {
    version: '3.0.138',
    date: '2026-10-03',
    improved: [
      'The number on each deck tab shows its position: 1, 2, 3.',
      'A new deck takes the lowest free name, so after deleting "Deck 2" the next new deck is "Deck 2" again.',
    ],
    fixed: [
      'Undoing a deleted deck no longer throws away changes made in the meantime.',
      'Changes made quickly one after another are all kept.',
    ],
  },
  {
    version: '3.0.137',
    date: '2026-10-03',
    new: [
      'All pads shows every pad of a board in one place, including pads that are in no deck.',
      'A pad can be taken out of one deck and kept, or deleted from all decks at once.',
      'The pad editor has a checklist of the decks a pad appears in.',
    ],
  },
  {
    version: '3.0.136',
    date: '2026-10-03',
    improved: [
      'A pad now belongs to its board, and a deck places it — a duplicated deck shares its pads, so a renamed pad shows its new name in every deck.',
    ],
    removed: [
      'Boards from earlier test versions are cleared once by this update; the audio library stays.',
    ],
  },
  {
    version: '3.0.135',
    date: '2026-10-03',
    improved: [
      'This list now describes what changed in the app, in plain words, grouped into new, improved, fixed and removed.',
    ],
  },
  {
    version: '3.0.131',
    date: '2026-10-02',
    fixed: [
      'When a deck has more pads than fit on the screen, the grid now scrolls to reach all of them.',
      'In a small window, the start screen no longer hides the BOARD and LIBRARY buttons.',
      'The pad editor no longer shows internal planning labels.',
    ],
    removed: ['The A key no longer adds a pad — the ADD PAD button does.'],
  },
  {
    version: '3.0.120',
    date: '2026-10-02',
    fixed: [
      'A combo whose step holds a pad without sound now starts the next step once, not twice, and waits for the step to finish.',
    ],
  },
  {
    version: '3.0.115',
    date: '2026-10-02',
    fixed: ['A board created right after opening the app no longer disappears.'],
  },
  {
    version: '3.0.111',
    date: '2026-10-02',
    improved: [
      'A new pad is a Single unless another type is chosen — a long file no longer turns it into a Loop by itself.',
    ],
    fixed: [
      'When a different file is chosen while adding a pad, the suggested name now follows that file; a typed name stays.',
    ],
  },
  {
    version: '3.0.82',
    date: '2026-09-30',
    fixed: ['File sizes just below 1 MB are shown correctly.'],
  },
  {
    version: '3.0.66',
    date: '2026-09-30',
    improved: [
      'The app brings its own fonts, so it looks the same without an internet connection and loads nothing from other websites.',
    ],
  },
  {
    version: '3.0.57',
    date: '2026-09-30',
    improved: ['Screen readers announce which pads are playing and which pad type is selected.'],
  },
  {
    version: '3.0.40',
    date: '2026-09-29',
    improved: ['Scenes are now called decks.'],
  },
  {
    version: '3.0.38',
    date: '2026-09-29',
    new: [
      'The start screen shows an animated pixel flame — a tap makes it spark and freeze; left alone, it thaws and lights again.',
    ],
  },
  {
    version: '3.0.29',
    date: '2026-06-18',
    improved: ['Renaming a deck shows at once when another deck already has that name.'],
  },
  {
    version: '3.0.7',
    date: '2026-05-28',
    fixed: [
      'On iPhone, several loops can play at the same time.',
      'On iPhone, sound starts reliably after TAP TO UNLOCK.',
      'The iPhone file picker shows MP3 files.',
    ],
  },
  {
    version: '3.0.4',
    date: '2026-05-28',
    new: [
      'The first playable version: a library for audio files, boards with decks of pads, and pads that play once, loop, play a list or start other pads in steps.',
      'A pad is added by tapping an empty cell, by dragging a file from the library, or with ADD PAD.',
      'A pad dragged onto another swaps with it; dropped on the edge of a cell, it is inserted there.',
      'SETUP is for arranging and editing, GAME for playing; a toggle switches between them.',
      'Each audio file shows its waveform.',
    ],
  },
];

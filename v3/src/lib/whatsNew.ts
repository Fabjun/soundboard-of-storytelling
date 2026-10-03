// ─────────────────────────────────────────────────────────────────────────────
// What's new — the release notes the app shows (ADR-0063)
//
// Written by hand for the people who use the app: only changes they can notice, in plain words,
// saying what they can now do. Grouped per version as New / Improved / Fixed / Removed, newest
// first. Internal work (tests, documentation, tooling) never appears here — it is recorded in
// src/lib/changelog.ts, from which CHANGELOG.md is generated.
// Checked by tests/unit/whatsNew.test.ts.
// ─────────────────────────────────────────────────────────────────────────────

/** One version's notes; every group is optional, but an entry has at least one sentence. */
export interface WhatsNewEntry {
  /** A version that exists in src/lib/changelog.ts. */
  version: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** Things you can do that you could not do before. */
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

export const WHATS_NEW: WhatsNewEntry[] = [
  {
    version: '3.0.140',
    date: '2026-10-03',
    new: [
      'A Single can hold several files and plays the next one, or a random one, each time you tap it.',
      'A Loop can hold several files and plays them one after another, in order or shuffled.',
    ],
    improved: [
      'Three pad types instead of four: the Playlist became a Loop with several files.',
      'In a combo, a Loop with several files plays in the background, so the next step starts at once.',
      'A Loop with several files glows like any other Loop while it plays.',
    ],
    removed: [
      'Boards from earlier test versions are cleared once more by this update; your audio library stays.',
    ],
  },
  {
    version: '3.0.139',
    date: '2026-10-03',
    new: [
      'In All pads you can add pads that are in no deck yet — with ADD PAD or by dropping a file from the library.',
    ],
    improved: ['A board opens again in the view you left it in.'],
  },
  {
    version: '3.0.138',
    date: '2026-10-03',
    improved: [
      'The number on each deck tab shows its position: 1, 2, 3.',
      'A new deck takes the lowest free name, so after deleting "Deck 2" the next new deck is "Deck 2" again.',
    ],
    fixed: [
      'Undoing a deleted deck no longer throws away changes you made in the meantime.',
      'Changes made quickly one after another are all kept.',
    ],
  },
  {
    version: '3.0.137',
    date: '2026-10-03',
    new: [
      'All pads shows every pad of a board in one place, including pads that are in no deck.',
      'You can take a pad out of one deck and keep it, or delete it from all decks at once.',
      'In the pad editor, tick the decks a pad should appear in.',
    ],
  },
  {
    version: '3.0.136',
    date: '2026-10-03',
    improved: [
      'A pad now belongs to its board, and a deck places it — a duplicated deck shares its pads, so a pad you rename shows its new name in every deck.',
    ],
    removed: [
      'Boards from earlier test versions are cleared once by this update; your audio library stays.',
    ],
  },
  {
    version: '3.0.135',
    date: '2026-10-03',
    improved: [
      'This list now tells you what changed for you, in plain words, grouped into new, improved, fixed and removed.',
    ],
  },
  {
    version: '3.0.131',
    date: '2026-10-02',
    fixed: [
      'When a deck has more pads than fit on the screen, you can now scroll to reach all of them.',
      'In a small window, the start screen no longer hides the BOARD and LIBRARY buttons.',
      'The pad editor no longer shows internal planning labels.',
    ],
    removed: ['The A key no longer adds a pad — use the ADD PAD button.'],
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
    fixed: ['A board you create right after opening the app no longer disappears.'],
  },
  {
    version: '3.0.111',
    date: '2026-10-02',
    improved: [
      'A new pad is a Single unless you choose another type — a long file no longer turns it into a Loop by itself.',
    ],
    fixed: [
      'When you choose a different file while adding a pad, the suggested name now follows that file; a name you typed stays.',
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
      'The start screen shows an animated pixel flame — tap it to make it spark and freeze; left alone, it thaws and lights again.',
    ],
  },
  {
    version: '3.0.29',
    date: '2026-06-18',
    improved: [
      'When you rename a deck, the app tells you at once if another deck already has that name.',
    ],
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
      'The first playable version: a library for your audio files, boards with decks of pads, and pads that play once, loop, play a list or start other pads in steps.',
      'Add a pad by tapping an empty cell, dragging a file from the library, or with ADD PAD.',
      'Drag a pad onto another to swap them, or onto the edge of a cell to insert it there.',
      'Switch between SETUP, where you arrange and edit, and GAME, where you play.',
      'Each audio file shows its waveform.',
    ],
  },
];

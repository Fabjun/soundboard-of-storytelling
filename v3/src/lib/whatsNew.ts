/**
 * @fileoverview What's new — the release notes the app shows (ADR-0063)
 *
 * Written by hand for the people who use the app, in plain words, saying what the app can do now.
 * Every version has an entry (Keep a Changelog: "There should be an entry for every single
 * version"; owner decisions 2026-10-03): from `NOTES_SINCE` on written by hand; before it, the few
 * hand-written ones plus one generated entry per other version of the early development, which
 * shows its changes under "Details" (`withEarlyVersions`). Grouped per version as
 * New / Improved / Fixed / Removed, newest first; a version without a visible change says in
 * "Behind the scenes" what was done, in plain words. The technical detail stays in
 * src/lib/changelog.ts (CHANGELOG.md is generated from it); the app folds it out per version
 * under "Details" (ADR-0063 amendment). The notes never address the reader —
 * no "you", no commands; the app or the feature is the subject (owner rule 2026-10-03).
 * Checked by tests/unit/whatsNew.test.ts.
 */

import type { ChangelogEntry } from './changelog';

/** First version whose notes are all written by hand (ADR-0063). */
export const NOTES_SINCE = '3.0.135';

/** The sentence of a generated entry for a version of the early development. */
export const EARLY_VERSION_NOTE =
  'A version of the early development, before these notes were written; its changes are listed under Details.';

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
  /** Work that changes nothing visible (checks, documentation, plans), in plain words. */
  behindTheScenes?: string[];
}

/** The headings of the groups, in the order the app shows them. */
export const WHATS_NEW_GROUPS = [
  ['new', 'New'],
  ['improved', 'Improved'],
  ['fixed', 'Fixed'],
  ['removed', 'Removed'],
  ['behindTheScenes', 'Behind the scenes'],
] as const;

/**
 * Returns the line at the top of What's new: the running version, and — when the newest notes
 * belong to an earlier version — which one (owner question 2026-10-03: "155 shown, notes end at
 * 149"). Since every version has notes (ADR-0063 amendment, checked by whatsNew.test.ts), the
 * second form shows only if the notes of the running version were missing.
 */
export function versionLine(appVersion: string, entries: readonly WhatsNewEntry[]): string {
  const latest = entries[0]?.version;
  return !latest || latest === appVersion
    ? `Version ${appVersion}.`
    : `Version ${appVersion} — the latest visible changes came with ${latest}.`;
}

/** Orders two versions "major.minor.patch": negative when `a` is older than `b`. */
export function compareVersions(a: string, b: string): number {
  const [x, y] = [a, b].map((v) => v.split('.').map(Number));
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

/**
 * Returns `entries` plus one generated entry for every version before `NOTES_SINCE` that has none
 * — its changes show under Details — newest first. Versions from `NOTES_SINCE` on are never
 * generated: their notes are written by hand, and the check for gaps must see a missing one.
 */
export function withEarlyVersions(
  entries: readonly WhatsNewEntry[],
  changelog: readonly ChangelogEntry[],
): WhatsNewEntry[] {
  const covered = new Set(entries.map((e) => e.version));
  const early = changelog
    .filter((c) => compareVersions(c.version, NOTES_SINCE) < 0 && !covered.has(c.version))
    .map((c) => ({ version: c.version, date: c.date, behindTheScenes: [EARLY_VERSION_NOTE] }));
  return [...entries, ...early].sort((a, b) => compareVersions(b.version, a.version));
}

/** The release notes the start screen shows, newest first (checked by whatsNew.test.ts). */
export const WHATS_NEW: WhatsNewEntry[] = [
  {
    version: '3.0.182',
    date: '2026-10-08',
    new: [
      'Keys play pads: in the PAD editor, tap HOTKEY and press a key — for example on a Bluetooth numpad. In GAME that key plays the pad; pressing it again while the sound runs does not stop it. Keys belong to a deck, so the same key can play a different pad in each deck, and in All pads the keys of the last deck keep working.',
      'A key that another pad of the deck already has can be moved over with MOVE KEY HERE.',
      'The pad shows its key in short form: N1 is the numpad 1, 1 the 1 above the letters.',
    ],
  },
  {
    version: '3.0.181',
    date: '2026-10-08',
    behindTheScenes: [
      'A change now reaches the app only after every automatic check has passed. The app works exactly as before.',
    ],
  },
  {
    version: '3.0.180',
    date: '2026-10-08',
    behindTheScenes: [
      'Two development tools got small bug-fix updates, and the automatic checks were confirmed to run on the next server system. The app works exactly as before.',
    ],
  },
  {
    version: '3.0.179',
    date: '2026-10-08',
    behindTheScenes: [
      'A check of the pad layout on short windows sometimes failed for no real reason. It now waits until the pads have settled. The app works exactly as before.',
    ],
  },
  {
    version: '3.0.178',
    date: '2026-10-06',
    improved: [
      'The PAD SIZE slider now sets the size of all pads of a board at once: every deck and All pads show the same size, whichever of them the slider is moved in. In SETUP the slider also shows in All pads.',
    ],
  },
  {
    version: '3.0.177',
    date: '2026-10-06',
    new: [
      'A PAD SIZE slider at the top of the deck list sets how large the pads of a deck are, as in the first version of the app. It shows in SETUP, and each deck keeps its own size.',
    ],
    improved: [
      'A row holds as many pads as the screen allows: four on a phone, many more on a laptop. Nothing has to be scrolled sideways, and the pads keep their order on every screen.',
    ],
  },
  {
    version: '3.0.176',
    date: '2026-10-05',
    improved: [
      'The pad editor opens full screen, on the phone and on large screens, so all its settings have room. The ✕ button or the Escape key closes it and leads back to the board.',
    ],
  },
  {
    version: '3.0.175',
    date: '2026-10-05',
    new: [
      'An UPDATE button on the start screen looks for a new version at once and says what it found. A new version then offers RELOAD, as before.',
    ],
    improved: [
      'Pads adapt to the display: they shrink so that the whole grid is seen, with the width always fitting and the height as far as the touch size allows. Only what still does not fit scrolls down.',
      'The deck list starts folded on every screen and opens with the ▶ button.',
    ],
    fixed: ['On a phone, pads are no longer cut off at the right edge.'],
  },
  {
    version: '3.0.174',
    date: '2026-10-05',
    improved: [
      'The deck list on the left folds away with the ◀ button and comes back with ▶. On a phone it starts folded, so the pads get the room.',
      'Pads are squares of one size instead of growing and shrinking with the window. Where they do not all fit, the pad area scrolls. A long pad name ends in "…".',
    ],
  },
  {
    version: '3.0.173',
    date: '2026-10-04',
    new: [
      'In GAME the screen stays on, so it never goes dark during a game. The bottom bar shows SCREEN ON while it does. On iPhone this needs iOS 16.4 or newer; as an app on the home screen, iOS 18.4 or newer.',
    ],
  },
  {
    version: '3.0.172',
    date: '2026-10-04',
    behindTheScenes: [
      'All texts use one spelling, American English, and a check keeps it that way.',
    ],
  },
  {
    version: '3.0.171',
    date: '2026-10-04',
    behindTheScenes: [
      "The app's own small icons are now stored in the same format as the pad icons. They look exactly as before.",
    ],
  },
  {
    version: '3.0.170',
    date: '2026-10-04',
    improved: [
      'The icon list shows every icon that matches a search, however short the word — before, it stopped after 240. It draws only the icons in view, so even long lists scroll smoothly.',
      'In the icon list, Home and End jump to the start and end of a row.',
    ],
  },
  {
    version: '3.0.169',
    date: '2026-10-04',
    fixed: [
      'In the icon list, an open category no longer covers the categories below it on narrow screens.',
    ],
  },
  {
    version: '3.0.168',
    date: '2026-10-04',
    new: [
      'Pads can show up to four icons, chosen in the PAD editor from a collection of more than 2,000 pixel icons. The icon list can be searched by name or by a word like "night" or "poison", or browsed by category.',
      'A pad without its own icon shows a placeholder for its type: a circle for Single, an infinity sign for Loop, a double circle for Combo.',
    ],
    fixed: ['Pads imported from V1 keep their icons.'],
    behindTheScenes: [
      'Stored boards are converted to the new icon format automatically.',
      'The license notices name the authors of the icon packs.',
    ],
  },
  {
    version: '3.0.167',
    date: '2026-10-04',
    behindTheScenes: [
      'The automatic code check before each change now applies all of its rules again, so mistakes are caught earlier.',
    ],
  },
  {
    version: '3.0.166',
    date: '2026-10-04',
    new: [
      'REPEAT: a Loop pad can play a set number of times (1 to 999) and then stop by itself, or loop until stopped (∞). A Loop with several files repeats its whole list.',
    ],
    behindTheScenes: ['Repeat counts from V1 boards are kept on import instead of being dropped.'],
  },
  {
    version: '3.0.165',
    date: '2026-10-04',
    fixed: [
      'An edit made just before tapping RELOAD in the update notice is saved before the app reloads.',
    ],
  },
  {
    version: '3.0.164',
    date: '2026-10-04',
    behindTheScenes: [
      'The automatic checks that run before each release were prepared for a newer system on the check servers, so releases keep working after their switch in October.',
    ],
  },
  {
    version: '3.0.163',
    date: '2026-10-03',
    new: [
      'A Single or Loop pad can hold several audio files: the PAD editor adds several at once from the library, moves them up and down, removes one with a second tap, and plays them in order or shuffled.',
      'Each file of a pad has its own start and end; selecting a file shows it in the waveform editor and the preview.',
    ],
    fixed: ['A Loop with several files plays each file only within its own trimmed part.'],
    behindTheScenes: [
      'Stored boards and older backups are converted to the new format automatically; existing pads sound as before.',
    ],
  },
  {
    version: '3.0.162',
    date: '2026-10-03',
    behindTheScenes: [
      'The overview of the code’s main building blocks for developers is now written from the code itself, so it can no longer fall out of date.',
    ],
  },
  {
    version: '3.0.161',
    date: '2026-10-03',
    improved: [
      "What's new lists every version since the very first; versions from the early development show their changes under Details.",
    ],
  },
  {
    version: '3.0.160',
    date: '2026-10-03',
    behindTheScenes: [
      'The list of third-party licenses that comes with the app now also names the parts that keep it working offline.',
    ],
  },
  {
    version: '3.0.159',
    date: '2026-10-03',
    new: [
      'When a new version of the app is ready, a notice offers to reload; the app reloads only on request, never in the middle of a game.',
      "Every version in What's new folds out the full list of its changes under Details.",
    ],
    improved: [
      'Double tap, two-finger zoom and long press no longer zoom the page or select text; the app can use these gestures for itself later.',
      "What's new lists every version, also those that changed nothing visible.",
    ],
    fixed: ['On iPhone, tapping into the library search no longer zooms the page in.'],
  },
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
    version: '3.0.156',
    date: '2026-10-03',
    behindTheScenes: [
      'The plan for the PAD editor was laid out in four steps: preview and trimming, several files per pad, repeats, and icons; pad templates move to the library.',
    ],
  },
  {
    version: '3.0.155',
    date: '2026-10-03',
    behindTheScenes: [
      'A test on a real Android phone was planned for before the app is shared with other people.',
    ],
  },
  {
    version: '3.0.154',
    date: '2026-10-03',
    behindTheScenes: [
      'A correction was recorded: the backup was tested on a MacBook, not yet on an iPhone — the iPhone test is still open.',
    ],
  },
  {
    version: '3.0.153',
    date: '2026-10-03',
    behindTheScenes: [
      'The backup test was recorded and the public project description was brought up to date; the device of the test was corrected in 3.0.154.',
    ],
  },
  {
    version: '3.0.152',
    date: '2026-10-03',
    behindTheScenes: [
      'An idea was noted: built-in sample sounds that may be shared freely, for the first launch.',
    ],
  },
  {
    version: '3.0.151',
    date: '2026-10-03',
    behindTheScenes: [
      'All documents and these notes were rewritten so that they never address the reader; an automatic check keeps it that way.',
    ],
  },
  {
    version: '3.0.150',
    date: '2026-10-03',
    behindTheScenes: [
      'The checklist for manual tests on the iPhone gained the steps for saving and restoring a backup.',
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
    version: '3.0.148',
    date: '2026-10-03',
    behindTheScenes: [
      'The structure of the project was reviewed: outdated plan names and notes were removed, and the automatic checks now demand more test coverage.',
    ],
  },
  {
    version: '3.0.147',
    date: '2026-10-03',
    behindTheScenes: ['The remaining descriptions in the code were completed.'],
  },
  {
    version: '3.0.146',
    date: '2026-10-03',
    behindTheScenes: [
      'Every part of the code now carries a description in one common form, checked automatically; three unused definitions were removed.',
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

# Manual iPhone Verification Checklist

**Device target:** iPhone 13 Pro, Brave browser (primary) and Safari (secondary)

## When to use this checklist

Run this checklist:

- Before any release or deploy
- After any commit that touches audio code (`src/audio/`), the IDB layer (`src/db/`), or file-handling (import/export)
- After UI changes to the pad grid, TopBar, or library screens

## Why manual?

The automated `mobile` Playwright project (run with `npm run test:e2e:mobile`) covers
touch-wiring, touch target sizes, and layout overflow. It cannot cover the items below
because Playwright runs against a simulated environment:

- **File picker**: `setInputFiles()` bypasses the iOS native picker entirely. A test using
  it would be green even if the real device's file-picker integration is broken.
- **Audio output**: headless WebKit has no audio output. is-hot/is-looping DOM state is
  tested automatically, but whether sound actually plays is not.
- **Ringer Switch**: a hardware signal that cannot be simulated.
- **Backgrounding / interruptions**: iOS tab-switch and phone-call behavior requires a
  real device session.

---

## Section 1 — Audio

- [ ] **Unlock audio context**
  - Action: Open the app, tap TAP TO UNLOCK.
  - Expected: Button disappears, the board list opens. No "audio context suspended" message in the footer.
  - Why manual: AudioContext init from a user gesture requires the real iOS user-gesture window.

- [ ] **Single pad plays sound**
  - Action: In GAME mode, tap a pad configured as SINGLE.
  - Expected: Sound plays audibly, pad glows (is-hot).
  - Why manual: Audio output is not testable in headless WebKit.

- [ ] **Loop pad starts and loops**
  - Action: In GAME mode, tap a pad configured as LOOP.
  - Expected: Sound loops continuously, pad shows looping state. Tap again → stops.
  - Why manual: Same — audio output and loop scheduling require real audio hardware.

- [ ] **Stop pad stops playback**
  - Action: Tap a playing pad again.
  - Expected: Sound stops cleanly (no cut-off artifact). is-hot / is-looping removed.
  - Why manual: Fade-out behaviour requires audible verification.

- [ ] **Ringer Switch — pads play on silent**
  - Action: Set the physical Ringer Switch to silent, then tap a pad.
  - Expected: The pad is heard, like a music app (owner decision 2026-10-03, since 3.0.157: the
    audio session type is `playback`; before iOS 17 a looping silent clip).
  - Why manual: Hardware switch, cannot be simulated. Document each time to confirm it has not regressed.

- [ ] **Tab switch + return**
  - Action: Start a looping pad, switch to another app or tab, return to the soundboard.
  - Expected: Looping pad resumes or is cleanly stopped. No crash or frozen state.
  - Why manual: iOS Safari background/resume lifecycle requires a real device.

- [ ] **Simultaneous loops**
  - Action: Start 3+ loop pads at the same time.
  - Expected: All loops play simultaneously without dropout or crash.
  - Why manual: Memory + audio pipeline behaviour under load requires a real device.

- [ ] **Short clip (< 0.5s)**
  - Action: Upload a very short clip (< 0.5s), configure as SINGLE, tap rapidly.
  - Expected: No crash, no double-play artefacts.
  - Why manual: Edge case in the `onended` handler lifecycle.

- [ ] **Trimmed Loop repeats only its trimmed part** _(Slice 15a)_
  - Action: In the PAD editor, make a Loop pad, move the trim start and end inward, then play the
    pad in GAME mode.
  - Expected: Each repeat starts at the trim start and ends at the trim end — nothing from before
    or after is heard.
  - Why manual: The loop region is an engine change (owner approval); only hearing proves it.

- [ ] **Preview in the PAD editor** _(Slice 15a)_
  - Action: Open a Single or Loop pad in the PAD editor, tap ▶, then ⏸, ▶ again, ⏹; tap the
    waveform somewhere and tap ▶; close the editor while a Loop preview plays.
  - Expected: The preview sounds like the pad (trim, fades, volume); ⏸ holds the position, ▶ goes
    on from there; a tap on the waveform starts it there; closing the editor stops the sound.
  - Why manual: Audible playback and the touch drag of the handles need a real device.

- [ ] **Several files, each with its own trim** _(Slice 15b, engine change ADR-0068)_
  - Action: Before the update, export a backup. After it: open a Loop pad, BROWSE, tick two or
    three files, ADD; trim the first file shorter than the second; play the pad in GAME mode.
    Also open an existing pad from the V1 import and play it.
  - Expected: The Loop plays its files one after another, each only within its own trim; a file
    without a trim plays whole. The existing pads sound as before the update.
  - Why manual: The playlist trim is an engine change (owner approval); only hearing proves it.

---

## Section 2 — File System

- [ ] **Upload MP3 via iOS picker**
  - Action: Go to Library → IMPORT → select an MP3 file from iOS Files or Photos.
  - Expected: File appears in the library list with a waveform. No error.
  - Why manual: The iOS native file picker is bypassed by Playwright's `setInputFiles()`.

- [ ] **Upload M4A via iOS picker**
  - Action: Same as above but with an `.m4a` file.
  - Expected: Same result. M4A is the default iOS recording format — highest priority.
  - Why manual: MIME type + extension handling is iOS-specific.

- [ ] **Upload WAV via iOS picker**
  - Action: Same as above but with a `.wav` file.
  - Expected: Same result.
  - Why manual: Same MIME type handling.

- [ ] **Backup export** _(Slice 10)_
  - Action: board list → EXPORT → wait for "Backup ready: soundboard-backup-YYYY-MM-DD.zip (…)" →
    SAVE → in the share sheet choose "Save to Files".
  - Expected: the share sheet opens on SAVE; the ZIP file is in Files with a size above zero; the
    panel says "Backup saved." and the board list "Last backup: today".
  - Why manual: iOS share sheet / file system access is not testable in Playwright.

- [ ] **Backup import** _(Slice 10)_
  - Action: board list → IMPORT → choose the ZIP saved above → IMPORT.
  - Expected: the summary counts the boards, pads and audio files of the backup ("… — N already in
    the library"); after IMPORT "Done: … added"; the board appears in the list — on the same
    device as a copy "Name (2)" with every audio file "already there" — and, opened, its pads
    play. No crash. (V1 had a crash here — regression risk.)
  - Why manual: Same file system access. V1 crash was iOS-specific memory issue.

- [ ] **V1 backup import** _(Slice 10)_
  - Action: board list → IMPORT → choose a V1 backup (`.json.gz`) → IMPORT.
  - Expected: the summary starts "Backup from the old app (V1)."; afterwards the board is there
    and its pads play. No crash, also with the full library (about 227 MB).
  - Why manual: the largest file the app reads; memory limits only show on a device.

---

## Section 3 — Layout and Platform

- [ ] **No horizontal scroll on any core screen**
  - Action: Open StartScreen, BoardListScreen, BoardScreen (with pad grid), LibraryScreen. Swipe horizontally on each.
  - Expected: No unintended horizontal scroll. Only the deck rail should scroll horizontally.
  - Why manual: `document.body.scrollWidth` check in automated tests is coarse. Subtle overflow in sub-elements requires manual inspection.

- [ ] **Keyboard does not cover rename input**
  - Action: Long-press or tap-to-rename a pad or board. Begin typing.
  - Expected: The input field scrolls into view above the on-screen keyboard. No input is hidden.
  - Why manual: iOS virtual keyboard layout shift requires a real device.

- [ ] **Add to Home Screen (PWA)**
  - Action: In Brave, use "Add to Home Screen". Open the installed PWA.
  - Expected: App icon appears, app opens in standalone mode without browser chrome.
  - Why manual: PWA install / standalone mode cannot be simulated.

- [ ] **Portrait and landscape orientation**
  - Action: Rotate the device while using the app.
  - Expected: Layout reflows correctly in both orientations. No elements off-screen.
  - Why manual: Orientation change events and viewport resize require a real device.

- [ ] **Browser gestures are off** _(3.0.159, ADR-0067)_
  - Action: On the board and in the library: double-tap, pinch with two fingers, long-press a pad
    name and a label; tap into the library search field.
  - Expected: No zoom, no text selection, no iOS menu, no grey tap flash; the search field does not
    zoom in when tapped.
  - Why manual: The iOS long-press menu and focus zoom exist only on iOS.

- [ ] **Typing in text fields still works** _(3.0.159 — selection is off in fields too)_
  - Action: Rename a pad in the PAD editor, type in the library search, type a trim value.
  - Expected: Typing works in every field. If a field takes no input, report it — selection in
    text fields then comes back (BACKLOG "Text fields with selection off").
  - Why manual: The WebKit fault (selection off blocks typing) shows only on the device.

- [ ] **Update prompt** _(3.0.159, ADR-0066)_
  - Action: Keep the app open while a new version is published (or open it after one), wait a
    moment.
  - Expected: "A new version is ready." appears; LATER hides it; RELOAD reloads, and the version
    in the start screen footer is the new one.
  - Why manual: A real deploy and the installed app on the phone.

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
  - Expected: Button disappears, you land on the board list. No "audio context suspended" message in the footer.
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

- [ ] **Ringer Switch — mute is expected behaviour**
  - Action: Set the physical Ringer Switch to silent, then tap a pad.
  - Expected: No sound plays. This is correct (V1 behaviour — iOS platform limit, not a bug).
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

- [ ] **Backup export** _(Slice 7 — skip until implemented)_
  - Action: Export a board template/backup.
  - Expected: iOS system share sheet appears, file can be saved to Files app. File is not empty.
  - Why manual: iOS share sheet / file system access is not testable in Playwright.

- [ ] **Backup import** _(Slice 7 — skip until implemented)_
  - Action: Import an exported backup file.
  - Expected: Board and pads are restored. No crash. (V1 had a crash here — regression risk.)
  - Why manual: Same file system access. V1 crash was iOS-specific memory issue.

---

## Section 3 — Layout and Platform

- [ ] **No horizontal scroll on any core screen**
  - Action: Open StartScreen, BoardListScreen, BoardScreen (with pad grid), LibraryScreen. Swipe horizontally on each.
  - Expected: No unintended horizontal scroll. Only the Scene Rail should scroll horizontally.
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

# ADR-0065: Waveform peaks — 256 per file, computed once, backfilled for old entries

**Status:** Accepted
**Date:** 2026-10-03
**Slice:** Slice 15
**Refines:** —
**Category:** Audio engine & iOS memory

## Context

Library entries store waveform peaks computed at upload (CLAUDE.md "Waveform data": computed at
upload time, stored with the entry; re-decode only as a fallback for legacy entries). Until
Slice 15 an entry held 30 peaks — enough for a list row, too coarse for the PAD editor's waveform
(Slice 15a), on which trim and fade handles are placed to a tenth of a second. Decoding audio again
whenever the editor opens would break the iOS memory rules (CLAUDE.md "iPhone / iOS Safari —
memory & stability rules": never decode in parallel, release buffers).

## Decision

1. **Resolution:** an entry stores `PEAK_COUNT` = 256 peaks (`v3/src/lib/peaks.ts`), computed at
   upload from channel 0 (`computePeaks`). Lists show `LIST_BARS` = 30 bars, reduced from the
   stored peaks by taking the highest peak of each share (`downsamplePeaks`), so short transients
   stay visible. The PAD editor draws all 256.
2. **Precompute, never on view:** peaks are computed once when the audio is decoded anyway
   (upload), as waveform tools do — BBC's audiowaveform precomputes waveform data on the server
   and peaks.js only draws it.
3. **Backfill:** an entry stored before this ADR (30 peaks, `needsFinePeaks`) gets its fine peaks
   the first time the PAD editor shows it (`ensureFinePeaks` in `v3/src/lib/upload.ts`): the audio
   is decoded once in an `OfflineAudioContext` (no audio hardware, no iOS audio session), the
   peaks are written back with the entry and into the library list. Requests wait for each other,
   so two entries are never decoded at the same time (memory rule 2); a failed decode leaves the
   entry unchanged.

## Consequences

**Positive:**

- The PAD editor shows a waveform fine enough to place handles, without decoding on every open.
- Old libraries need no migration step: each entry is upgraded when it is first needed.
- Lists look as before (30 bars).

**Negative / Trade-offs:**

- An entry is about 1.5 KB larger in IndexedDB (256 instead of 30 numbers) — negligible next to
  the audio.
- The first open of an old entry in the editor decodes it once (one file, serial).

## Alternatives considered

**Decode on every editor open:** always exact, but a full decode per open — exactly what the iOS
memory rules avoid. Rejected.

**Bulk migration of all entries at boot:** decodes the whole library at once (serially, but for
minutes on a large library, at a time the user did not ask for). Rejected for the lazy backfill.

**Higher resolution (e.g. 1 024 peaks):** finer than the editor's width on a phone can show;
more storage for no visible gain. 256 can be raised later — `needsFinePeaks` compares against
`PEAK_COUNT`, so a raise backfills the same way.

## Related

- **Files:** `v3/src/lib/peaks.ts`, `v3/src/lib/upload.ts`, `v3/src/components/Waveform.tsx`,
  `v3/src/components/WaveformEditor.tsx`
- **ADRs:** ADR-0043 (AudioContext timing on iOS), ADR-0044 (audio engine module structure)
- **Sources:** https://github.com/bbc/audiowaveform · https://github.com/bbc/peaks.js ·
  https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext

# ADR-0072: The UI icons as the project's own icon set `sos-ui`

**Status:** Proposed
**Date:** 2026-10-04
**Slice:** Slice 15
**Refines:** ADR-0070
**Category:** UI architecture

## Context

The app's 24 UI icons (`PixelIcon`: play, loop, sparkle, search …) were lists of "x y" pixel
coordinates in `v3/src/components/PixelIcon.tsx`, drawn as one `<rect>` per pixel — a second icon
format next to the pad icon sets (ADR-0070: IconifyJSON, one path of pixel rectangles per icon).
Step 15d-4 was to bring them into the same format; it was held back because the UI icons are the
project's own work (All Rights Reserved), while ADR-0070's sets record a free license that
iconGuards allowed only as CC0 or MIT and that `third-party-licenses.txt` lists. Owner decision
2026-10-04 (review of PR #44): an own set, labelled with an SPDX `LicenseRef-…` id, left out of the
third-party notices and of the icon picker.

## Decision

1. **One format for all icons:** the UI icons are the IconifyJSON set `sos-ui`
   (`v3/src/icons/sets/sos-ui.json`), 16×16, one `<path fill="currentColor" d="…"/>` per icon, the
   same path form as the pad icon packs; category `interface`. `PixelIcon` keeps its API (`name`,
   `size`, `color`, `class`, `style`) and draws the path; its names are the set's icon names
   (`PixelIconName = keyof` the set's icons). The conversion was checked pixel by pixel: every
   icon has exactly the pixels of its coordinate list, and screenshots of the start, board list,
   board, PAD editor and picker screens are identical before and after (Chromium and WebKit).
2. **License label:** `info.license` = `{ title: "All Rights Reserved", spdx:
"LicenseRef-Proprietary", url: <the repository's LICENSE> }` — SPDX reserves `LicenseRef-` for
   licenses not on the SPDX list, and `LicenseRef-Proprietary` is the common id for proprietary
   terms ([PyPA license expressions](https://packaging.python.org/en/latest/specifications/license-expression/),
   [SPDX license expressions, FOSSA](https://fossa.com/blog/understanding-using-spdx-license-identifiers-license-expressions/)).
3. **Own, not third party:** a set with `LicenseRef-Proprietary` is not in the icon picker's
   loader nor in the catalog, and `third-party-licenses.txt` leaves it out. `iconGuards` checks the
   first two, `pwa.spec.ts` the notices; the other rules of ADR-0070 (names, drawings, one
   category, no drawing twice) apply to it too.
4. **Source and loading:** `sos-ui.json` is the source itself — `npm run build:icons` writes only
   the third-party packs. It is imported statically, so it is part of the start bundle: the first
   screen already shows UI icons.

## Consequences

**Positive:**

- One icon format and one drawing path for every icon in the app; a UI icon and a pad icon look
  alike when drawn (crisp pixels, one path).
- The license of every icon set is stated in the set itself and checked.

**Negative / Trade-offs:**

- A UI icon is edited as path data, no longer as a list of pixels; a new UI icon is drawn in a
  pixel editor and converted (the conversion is the path form of `maskToPath` in
  `v3/scripts/build-icons.ts`).

## Alternatives considered

**Keep the coordinate lists** — a second format next to IconifyJSON (CLAUDE.md: one scheme for
everything of a kind); rejected in the 15d plan.

**Leave the license out of the own set** — the scheme would then have one set without license
facts, and the checks could not tell an own set from a pack whose license was forgotten.

## Related

- **Files:** `v3/src/icons/sets/sos-ui.json`, `v3/src/components/PixelIcon.tsx`,
  `v3/src/lib/iconSet.ts` (`iconPath`), `v3/tests/unit/iconGuards.test.ts`,
  `v3/tests/e2e/pwa.spec.ts`, `v3/vite.config.ts`
- **ADRs:** ADR-0070 (pad icons), ADR-0057 (license notices)
- **Source documents:** [docs/backlog.md](../backlog.md) "UI icons in the icon set format"
- **Sources:** https://packaging.python.org/en/latest/specifications/license-expression/ ·
  https://fossa.com/blog/understanding-using-spdx-license-identifiers-license-expressions/ ·
  https://iconify.design/docs/types/iconify-json.html

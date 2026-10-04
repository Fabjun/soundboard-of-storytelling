# ADR-0057: Self-hosted assets and shipped license notices

**Status:** Accepted
**Date:** 2026-09-30
**Slice:** infrastructure
**Refines:** ADR-0005
**Refined by:** ADR-0070 (the pad icon sets add a section "Icons" to the license notices)
**Category:** Platform constraints

## Context

The structure audit of 2026-09-30 (BACKLOG "Structure audit 2026-09-30", A2) found that the app
loaded its three fonts from fonts.googleapis.com / fonts.gstatic.com at runtime:

- **Offline:** the service worker did not precache them (no `woff2` in its globs). They were only
  in the browser's HTTP cache, which iOS evicts readily — at the game table without network the
  app could fall back to system fonts. A test that emptied the HTTP cache confirmed this.
- **Privacy:** every visitor of the public site sent their IP address to Google. The Regional
  Court of Munich ruled such dynamic embedding without consent a GDPR violation (LG München I,
  20.01.2022, 3 O 17493/20); self-hosting is the standard remedy.
- **Licenses:** the bundle contains MIT/ISC code (Preact, Signals, idb, noble-hashes) whose
  licenses require the notice in copies, and self-hosted fonts under the SIL Open Font License
  must be accompanied by the license. Nothing shipped these notices.

## Decision

1. **No third-party origins at runtime.** The shipped app requests nothing from other origins.
   Fonts come from the `@fontsource/*` packages (the common way to self-host Google Fonts with a
   bundler; OFL-1.1) and are imported in `v3/src/main.tsx`.
2. **Fonts work offline.** The service worker precaches `woff2` (every supported browser reads
   it; the `woff` fallbacks are not precached).
3. **License notices ship with every build.** A small Vite plugin in `v3/vite.config.ts`
   (`licenseNotices`) writes `third-party-licenses.txt` into the build: the license text of
   every production dependency, direct and transitive, derived from `package.json` at build
   time. A dependency without a license file fails the build. An own plugin was chosen over
   `rollup-plugin-license`, which only sees JavaScript modules and missed the CSS-imported fonts.
4. **Guarded by `v3/tests/e2e/pwa.spec.ts`** (production build): no request leaves the app's
   origin; fonts load offline with an empty HTTP cache; the notices name every production
   dependency and include the OFL. Counter-checked: Google-hosted fonts, `woff2` removed from
   the precache, and an empty notice list each turn the matching test red.

## Exceptions

None.

## Consequences

**Positive:**

- The app looks the same offline; no visitor data goes to Google; license obligations are met
  and stay met as dependencies change.

**Negative / Trade-offs:**

- About 110 KB of font files (9 woff2 files) are precached on first visit (all unicode subsets of the three
  fonts).
- The notices file is not yet linked from the UI (BACKLOG, Slice 14 settings).

## Alternatives considered

**Keep Google Fonts and add runtime caching:** fixes offline, not privacy. Rejected.

**Copy the woff2 files into `public/` by hand:** no version tracking, license files would be a
hand copy. Rejected.

## Amendments

**2026-10-03:** The license notices are read from the bundle, not from `package.json` (owner
decision 2026-10-03; industry practice: rollup-plugin-license). The update prompt (ADR-0066)
ships `workbox-window` through vite-plugin-pwa's virtual module: as a runtime `dependency` knip
flagged it unused in production mode, as a dev dependency the old generator left out its
license. The generator in `v3/vite.config.ts` now takes every package whose modules Rollup
bundled, plus their runtime dependencies transitively — a prebuilt package can carry its
dependencies inside (workbox-window's file contains workbox-core, measured by its
`workbox:core` marker). Same list as before for the current build, minus nothing; `pwa.spec.ts`
checks `workbox-window` and `workbox-core` in the notices.

**2026-10-03 (3.0.160):** The service worker is covered too (owner approval 2026-10-03). Its
runtime is built separately by vite-plugin-pwa after the app bundle (`dist/sw.js`,
`dist/workbox-*.js`); every Workbox module in it carries a `workbox:<name>:<version>` marker. After
that build, the generator reads the markers and adds `workbox-<name>` with its dependencies —
workbox-precaching, -routing and -strategies were missing before. `pwa.spec.ts` derives the
expected packages from the markers of the shipped files.

## Related

- **Files:** `v3/src/main.tsx`, `v3/src/styles/global.css`, `v3/vite.config.ts`,
  `v3/tests/e2e/pwa.spec.ts`
- **ADRs:** ADR-0005 (vite-plugin-pwa), ADR-0049 (tested artifact is deployed)
- **Sources:** https://fontsource.org/docs/getting-started/install ·
  https://dejure.org/dienste/vernetzung/rechtsprechung?Text=3+O+17493/20 ·
  https://openfontlicense.org/open-font-license-official-text/

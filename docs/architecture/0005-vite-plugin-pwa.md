# ADR-0005: vite-plugin-pwa for the service worker

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 1
**Refines:** —
**Refined by:** ADR-0057 (fonts self-hosted and precached; license notices shipped)
**Category:** Tech stack

## Context

V3 is a PWA: it needs a service worker for offline capability and a web app manifest for "Add
to Home Screen" on iOS/Android. V1 had a manual `sw.js` — a proven source of errors.

V1 experience (from `v1-reference/CLAUDE.md`): the manual `sw.js` required disciplined care:
1. **SHELL list:** every new file had to be added to the cache list by hand. Forgotten →
   cache errors after an update.
2. **VERSION bump:** the version had to be incremented on every change. Forgotten → the
   browser uses a stale cache, the update is not rolled out.

`docs/architecture/concept-brief.md §4.9` sets `vite-plugin-pwa` explicitly, with the
reasoning: "V1's manual sw.js worked but required discipline. The plugin removes that failure
mode."

## Decision

`vite-plugin-pwa` generates the service worker automatically from the Vite build. The SHELL
list (precache manifest) is generated from the build output. The version is bumped
automatically. Configuration in `v3/vite.config.ts`.

Strategy: `generateSW` (standard mode). Configured for:
- cache-first for the app shell
- auto-update via `skipWaiting + clientsClaim`

## Consequences

**Positive:**
- No manual SHELL list management. New files in the build are picked up automatically.
- No manual VERSION bumping. The build hash in the output invalidates the cache.
- PWA validation in `npm run build` — precache entries are printed (the count varies with the
  build output; printed to the console on every build).

**Negative / Trade-offs:**
- Less control over the service worker compared with hand-written code. No problem for V3 —
  there are no dynamic requests that would need special cache strategies.
- The generated service worker cannot be edited directly. Custom logic requires
  `injectManifest` mode (not needed so far).

## Alternatives considered

**Manual `sw.js` like V1:** works, but requires discipline. The V1 experience shows that this
discipline often breaks in practice. The plugin approach removes the error class structurally.

**Workbox directly:** `vite-plugin-pwa` wraps Workbox — the same foundation, but with Vite
integration. A direct Workbox setup would need more configuration without added value.

## Related

- **Files:** `v3/vite.config.ts` (plugin configuration incl. the web app manifest — no separate manifest.json)
- **ADRs:** ADR-0003 (Vite), ADR-0006 (iOS targets shape the PWA requirements)
- **Source documents:** `docs/architecture/concept-brief.md §4.9`
- **Commits:** `8be64d4` — Slice 1 scaffold (plugin set up)

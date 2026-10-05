# ADR-0066: Service worker updates — a prompt with RELOAD, never an automatic reload

**Status:** Accepted
**Date:** 2026-10-03
**Slice:** cross-cutting
**Refines:** —
**Category:** Platform constraints

## Context

The app is a PWA whose service worker precaches the whole app (vite-plugin-pwa, `generateSW`).
Until 3.0.158 it ran with `registerType: 'autoUpdate'`, `skipWaiting` and `clientsClaim`, and the
page only registered the worker (`registerSW.js`). A reload therefore showed the version cached at
the last visit while the new one installed in the background — the new version appeared only at
the second reload, without any notice (owner report 2026-10-03: the phone showed 3.0.156 while
3.0.157 was live; measured on the live site).

## Decision

Owner decision 2026-10-03: a prompt with a reload button, built before Slice 15b.

1. `registerType: 'prompt'`, no `skipWaiting` / `clientsClaim`: a new worker installs and **waits**.
2. `UpdatePrompt` (`v3/src/components/UpdatePrompt.tsx`, `virtual:pwa-register/preact`) shows a
   toast on every screen while a worker waits: "A new version is ready." with **RELOAD** and
   **LATER**. RELOAD waits until no save runs (`whenSaved`, `v3/src/state/boardWrites.ts`), then
   activates the new worker and reloads. LATER hides the toast; the new version starts with the
   next launch.
3. An app left open checks for a new version every hour while online (vite-plugin-pwa, periodic
   service worker updates).
4. `workbox-window`, which the prompt ships through the virtual module, stays a dev dependency as
   vite-plugin-pwa's docs list it. Its license reaches `third-party-licenses.txt` because the
   notices are now read from the bundle (ADR-0057 amendment, owner decision 2026-10-03), not from
   `package.json` — a runtime `dependency` would have been flagged unused by knip in production
   mode.

Sources: vite-plugin-pwa — prompt for update (the default; for `autoUpdate`: "The user can lose
data in any browser windows/tabs in which the application is open and is filling in a form"),
Preact integration, periodic service worker updates; Chrome / Workbox "Handling service worker
updates" — with precached HTML, "strongly consider offering a reload button".

## Consequences

**Positive:**

- A new version never reloads the app by itself — no sound is cut off in the middle of a game.
- The running version is visible and changes when the user decides.

**Negative / Trade-offs:**

- A user who always taps LATER keeps the old version until every tab of the app is closed.
- An edit typed less than half a second before RELOAD relies on the save when the page is hidden
  (`v3/src/lib/debouncedSave.ts`); the browser does not promise that a write started during
  unload finishes. BACKLOG "Reload right after an edit".

## Alternatives considered

**Automatic reload** (`autoUpdate` with the virtual module): no prompt, but reloads in the middle
of a game and can lose input (vite-plugin-pwa warning). Rejected by the owner.

**Keep the silent update** (new version at the second reload): no work, but the running version
stays unclear — the cause of the owner report. Rejected.

## Amendments

**2026-10-05 (3.0.175):** An UPDATE button on the start screen checks for a new version at once
(owner decision 2026-10-05; V1 had a way to update by hand, `docs/product/v1-v2-inventory.md`).
It runs the same service worker update as the hourly check (`registration.update()`) and says how
it went — new version found, newest version, offline, no service worker in this window, or no
answer from the server (`v3/src/lib/updateCheck.ts`). Switching stays with the prompt and RELOAD:
a version found shows the prompt as soon as it is installed, and a version put off with LATER is
offered again. Checked in `v3/tests/e2e/pwa.spec.ts` against the production build (newest version;
simulated deploy; LATER, then UPDATE again) and in `v3/tests/e2e/update-check.spec.ts` (no service
worker, offline).

## Related

- **Files:** `v3/vite.config.ts`, `v3/src/components/UpdatePrompt.tsx`, `v3/src/App.tsx`,
  `v3/src/lib/updateCheck.ts`, `v3/src/screens/StartScreen.tsx`,
  `v3/src/state/boardWrites.ts`, `v3/src/pwa-env.d.ts`, `v3/tests/e2e/pwa.spec.ts`
- **ADRs:** ADR-0049 (deploy the tested build), ADR-0057 (no third-party origins, license notices)
- **Sources:** https://vite-pwa-org.netlify.app/guide/prompt-for-update.html ·
  https://vite-pwa-org.netlify.app/frameworks/preact.html ·
  https://vite-pwa-org.netlify.app/guide/periodic-sw-updates.html ·
  https://developer.chrome.com/docs/workbox/handling-service-worker-updates

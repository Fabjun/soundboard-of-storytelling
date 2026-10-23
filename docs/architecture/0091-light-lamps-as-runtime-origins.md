# ADR-0091: Lamps the user adds are the only runtime origins besides the app's own

**Status:** Accepted
**Date:** 2026-10-22
**Slice:** cross-cutting
**Refines:** ADR-0057
**Category:** Platform constraints

## Context

ADR-0057 keeps the app free of third-party origins at runtime: fonts and every other asset are
self-hosted, and `v3/tests/e2e/pwa.spec.ts` checks that a page load reaches no other origin. Light
per pad ([light.md](../product/features/light.md), C1, C5) has the app send commands to a WLED
lamp in the user's home network — an origin the user types in Settings, not one the app ships.

## Decision

1. **A lamp's address, as entered in Settings → LIGHT, is the one kind of runtime origin besides
   the app's own.** The app contacts it only to send a light command (a pad, TRY) or for the
   connection test — never to load code, styles, fonts or data it shows.
2. **Only what the user typed is contacted.** No discovery (no scanning of the network), no
   default address, no third-party service in between.
3. **Calls carry no data of the user** besides the command (`{"ps": n}`, `{"on": false}`) and go
   with a 1 s limit; a failed call changes nothing else in the app (light.md C6).
4. **The ADR-0057 check stays as it is:** a page load with no lamp set up still reaches no other
   origin; the light E2E tests intercept the lamp's address and never leave the machine.

## Consequences

**Positive:**

- The rule of ADR-0057 holds for everything the app loads; the exception is narrow, named, and
  under the user's control.

**Negative / Trade-offs:**

- On an iPhone or iPad no browser lets the app reach the lamp (WebKit blocks HTTP from an HTTPS
  page, light.md C5) — the exception helps only Chrome-based browsers on a computer or Android
  until a bridge is decided.

## Alternatives considered

- **A cloud service between app and lamp (e.g. a hosted MQTT broker):** a third-party origin the
  user does not control, and the light would need the internet. Rejected.
- **Discovery of lamps in the network:** browsers offer no mDNS, and scanning addresses is what
  Local Network Access exists to stop. Rejected.

## Related

- **Files:** `v3/src/light/wled.ts`
- **ADRs:** ADR-0057 (no third-party origins at runtime)
- **Source documents:** [light.md C5](../product/features/light.md#c5-how-the-app-reaches-the-lamp)
- **Sources:** https://developer.chrome.com/blog/local-network-access,
  https://kno.wled.ge/interfaces/json-api/

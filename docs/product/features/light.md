# Light per pad — concept

**Status:** Draft for review (2026-10-22). Written by Claude on the owner's instruction of
2026-10-22: "the pads should also control light, and that needs its own tab in the PAD editor —
designed as a concept, then built; the building blocks and a fitting UI can start now". Earlier
research and the owner's agreements: BACKLOG "Smart light per pad — idea (Open)". Nothing is
tested with a real lamp yet; the owner's Athom WLED 12W Color Bulb is on order.

**Built:** step 1 in 3.0.282 — Settings → LIGHT keeps the lamps (name, address) with TEST and
REMOVE, and the WLED client (`v3/src/light/wled.ts`) sends a preset or "off" with a 1 s limit
([ADR-0091](../../architecture/0091-light-lamps-as-runtime-origins.md)). Step 2 — a pad's light,
the SOUND / LIGHT tabs, the trigger — is next.

## Why

A pad starts a sound; with light it can also start what the room looks like — a slow sunrise,
a thunderstorm flash, a fire's flicker, a color for a moment of the game. The light belongs to the moment the
sound belongs to, so it is started from the same pad.

## Decided

| #   | Statement                                                                                                                                                                          | Source                                                    | Status      |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ----------- |
| G1  | The effect runs in the lamp; the app only starts it — WLED has the effects built in (Lightning, Sunrise, Fire 2012, Candle).                                                       | BACKLOG research 2026-10-19, kno.wled.ge/features/effects | **Decided** |
| G2  | A light command never waits and never touches the sound (product principle P6).                                                                                                    | docs/product/README.md P6                                 | **Decided** |
| G3  | The PAD editor gets two tabs, SOUND (default) and LIGHT; name and icons above them, decks and DELETE PAD below — they belong to the pad. WAI-ARIA tabs pattern, the `sb-tab` look. | owner agreement 2026-10-19                                | **Decided** |
| G4  | A device address the user enters is a new kind of runtime origin and needs its own ADR next to ADR-0057 — ADR-0091.                                                                | BACKLOG research 2026-10-19                               | **Decided** |

## Decisions C1–C6 (Decided by Claude — for review)

### C1 What a pad's light is

**A, a WLED preset or "off".** A pad's light is either nothing (default), a preset number of the
lamp, or "off". The lamp's own app makes presets — an effect with its colors, speed and
brightness, a sunrise of 10 minutes — and gives each a number; the pad names the number. This
keeps every effect parameter in one place (the lamp), works for every WLED effect without the app
listing them, and needs one short JSON call (`{"ps": n}`, WLED JSON API). Not chosen: **B** the
app sets effect, colors and speed itself (a second editor for what WLED already edits, and the
effect list differs between WLED versions); **C** both — B can follow if A proves too coarse.

### C2 Which lamp

**A, one or more lamps set up in Settings; a pad names one or all.** Settings → LIGHT lists the
lamps (name, address), with a connection test. A pad's light goes to one lamp or to all. WLED
syncs lamps among themselves too (UDP sync), so "all" stays simple. Not chosen: **B** one lamp
per app (the next stage, a strip on the floor, is already planned).

### C3 What happens when the pad stops

**A, nothing.** The light stays as the pad left it; the lamp's preset decides whether an effect
ends by itself (a lightning preset can be a short playlist that ends in the base light). Stopping
a sound and changing the light are two things: a thunder that ends must not switch off the storm
light. STOP ALL leaves the light too; a pad with "off" or a base-light preset changes it on
purpose. Not chosen: **B** back to a base light on stop (decided per pad later if needed).

### C4 Light in a combo

**A, per step through the pads it plays.** A combo step plays pads; a pad with light starts its
light. So a flash with the thunder of step 2 is a thunder pad with a lightning preset. No light of
its own on a combo. Not chosen: **B** a light field per step (a second place for the same thing).

### C5 How the app reaches the lamp

The browser decides what works (research 2026-10-19 and 2026-10-22):

| Where the app runs                               | Way                                                                                                                                                                     | Works                                                                                                                                                                              |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chrome / Brave on a Mac or PC, Chrome on Android | straight to the lamp: private IP addresses and `.local` names are exempt from mixed-content blocking once the user allows "local network" (Chrome Local Network Access) | yes, after one permission                                                                                                                                                          |
| Every browser on an iPhone or iPad (all WebKit)  | straight to the lamp                                                                                                                                                    | **no** — WebKit blocks HTTP requests from an HTTPS page and has no Local Network Access (secondary source, Chrome blog on Private Network Access; no newer WebKit statement found) |
| iPhone / iPad through a bridge                   | a small HTTPS bridge in the home network forwards to the lamp (e.g. Home Assistant with a valid certificate)                                                            | yes, with a bridge                                                                                                                                                                 |

WLED itself allows calls from a web page: it sends `Access-Control-Allow-Origin: *` on every
response and answers the preflight (`OPTIONS`) — read in WLED's source, `wled00/wled_server.cpp`.

**Decided for now: A, straight to the lamp where the browser allows it; the app says plainly
where it does not.** The building blocks talk to "a light" through one small interface, so a
bridge can be added without touching the pads. **Open (owner decision):** whether game nights run
the light from the laptop, or whether an iPhone / iPad bridge is set up (Home Assistant, a
Raspberry Pi) — this costs hardware and setup time and is the owner's call.

### C6 Failure

A light command is sent with a short time limit (1 s) and never awaited by the sound path. A lamp
that does not answer marks itself as unreachable in the status bar ("LIGHT ✕"), and the next pad
tries again. The connection test in Settings says in plain words what is wrong (no permission, the
browser blocks it, no answer at the address) and what to do (Nielsen heuristic 9).

## Building blocks (first step, testable without a lamp)

1. **Model:** `PadBase.light?: { target: 'all' | string; preset: number } | { target: 'all' |
string; off: true }` — optional, so every stored pad stays valid; the backup carries it.
2. **`v3/src/light/`:** `LightTarget` interface (`send(command)`), the WLED JSON client (`POST
http://<address>/json/state` with `targetAddressSpace: 'local'` where supported, 1 s timeout),
   and `startPadLight(pad)` called next to `play()` — fire and forget.
3. **Settings → LIGHT:** lamps (name, address), TEST (sends nothing visible: reads
   `/json/info`), REMOVE with UNDO.
4. **PAD editor tabs SOUND / LIGHT (G3):** LIGHT holds the lamp choice (All or one) and the preset
   number, with TRY to send it at once; without a lamp set up it says where to add one.
5. **Tests:** unit for the model, the client (fetch stubbed) and the fire-and-forget path; E2E with
   Playwright intercepting the lamp's address (no lamp needed); a real-lamp check in the iPhone
   checklist once the bulb is there.

## Not yet

Effects set from the app (C1 B), a base light per board, light for the quick-access bar, the
iPhone / iPad bridge (C5, owner decision).

## Sources

- WLED effects and JSON API: https://kno.wled.ge/features/effects/, https://kno.wled.ge/interfaces/json-api/
  ("ps": preset id −1 to 250; POST to `/json/state`; `/json/info`)
- WLED CORS headers: https://github.com/wled/WLED/blob/main/wled00/wled_server.cpp (`initServer`)
- Chrome Local Network Access: https://developer.chrome.com/blog/local-network-access
- MDN Local network access: https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Local_network_access
- WebKit and private network requests (secondary, older): https://developer.chrome.com/blog/private-network-access-update, https://bugs.webkit.org/show_bug.cgi?id=171934
- WLED and HTTPS (community): https://wled.discourse.group/t/making-wled-addressable-via-https/5948
- NN/g, Tabs, Used Right: https://www.nngroup.com/articles/tabs-used-right/

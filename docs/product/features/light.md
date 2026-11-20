# Light per pad — concept

**Status:** Draft for review (2026-10-22). Written by Claude on the owner's instruction of
2026-10-22: "the pads should also control light, and that needs its own tab in the PAD editor —
designed as a concept, then built; the building blocks and a fitting UI can start now". Earlier
research and the owner's agreements: BACKLOG "Smart light per pad — idea (Open)". Nothing is
tested with a real lamp yet; the owner's Athom WLED 12W Color Bulb is on order.

**Built:** step 1 in 3.0.282 — Settings → LIGHT keeps the lamps (name, address) with TEST and
REMOVE, and the WLED client (`v3/src/light/wled.ts`) sends a preset or "off" with a 1 s limit
([ADR-0091](../../architecture/0091-light-lamps-as-runtime-origins.md)). Step 2 in 3.0.283 — a
pad's light (`PadBase.light`: a preset or off, for all lamps or one), the PAD editor's SOUND /
LIGHT tabs (G3) with TRY, and the trigger in the audio bridge (`v3/src/light/padLight.ts`): every
pad that starts sends its light, also a pad a combo step plays (C4), with no change to the audio
engine; a lamp that does not answer leaves the sound alone (C6). In 3.0.289 the status bar shows
"LIGHT ✕" while a lamp did not answer, read out as what happened and where to look, until a pad
reaches every lamp again (C6). Not built yet: the iPhone / iPad path (C5, owner decision).

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

**Extended to C (3.0.314, provisional under CLAUDE.md Workflow rule 7b, for the owner's review;
the owner asked on 2026-11-17 for as much of the light as can be built before the real-lamp
test):** next to the preset, a pad can set an effect itself — the effect, one color, speed,
intensity and brightness (`PadLight` `{lamp, effect}`; `{"on": true, "bri", "seg": {"fx", "sx",
"ix", "col"}}`, a `seg` without an id goes to the main segment). The effect names are read from the
lamp (`GET /json/eff`; "RSVD" and "-" left out), so the version difference does not matter; the
pad keeps the name too, for when the lamp is not in reach, and the effect's number can be typed
then. Palettes and second and third colors are left for later (minimal first).

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
bridge can be added without touching the pads.

**Decided (owner decision 2026-11-20): the MacBook runs the light, at home and at game nights
away.** The iPhone and the iPad (both WebKit) play sound only. The lamp and the MacBook share one
network: the home Wi-Fi, or the iPhone's Personal Hotspot away from home (a private range, so
Chrome's exemption applies; that two hotspot clients reach each other is likely but "not
guaranteed" by Apple — Apple Developer Forums, DTS reply, thread 699414). WLED keeps up to five
saved networks and opens its own access point when none connects (WLED Discourse, developer post
"Multiple SSID support" — secondary). Its own access point does not serve: `4.3.2.1` is no
private address, so Chrome blocks the call from the HTTPS app as mixed content even with "local
network" allowed (measured 2026-11-20 with the owner's lamp, still in that mode).

**Parked — a way for the iPhone / iPad alone** (review trigger: the owner wants the light without
the MacBook). Options researched 2026-11-20: a bridge box with its own Wi-Fi and an HTTPS proxy
(a Raspberry Pi with Caddy `tls internal`, its certificate trusted once on iOS — WLED's own advice
for HTTPS is a reverse proxy); a native iOS shell around the app (Capacitor, local network
permission and ATS `NSAllowsLocalNetworking`; signing every 7 days with a free Apple ID or 99 $ a
year; whether its native HTTP honors the permission is unconfirmed — a spike first); iOS Shortcuts
(rejected: each light change leaves the app, and local HTTP in Shortcuts is reported unreliable).

### C6 Failure

A light command is sent with a short time limit (1 s) and never awaited by the sound path. A lamp
that does not answer marks itself as unreachable in the status bar ("LIGHT ✕"), and the next pad
tries again. The connection test in Settings says in plain words what is wrong (no permission, the
browser blocks it, no answer at the address) and what to do (Nielsen heuristic 9). An IPv4 address
over plain HTTP outside Chrome's local ranges is named before any call goes out — WLED's own setup
network (`4.3.2.x`) as such, any other as no home address — because no permission can make it
reachable (2026-11-20, after a lamp still in setup mode was typed in as `4.3.2.2`;
`outOfReach` in `v3/src/light/wled.ts`).

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

## Base light per board

**Built in 3.0.316 (provisional under CLAUDE.md Workflow rule 7b, for the owner's review):** a
board may have a base light — a preset, an effect or off, as a pad's light (`Board.light`) — that
goes out when the board switches to GAME, before any pad changes it. It is set in SETUP at the end
of the deck list, folded under BOARD LIGHT (set once per board, as PAD SIZE is a board setting
there); the same panel as the PAD editor's LIGHT tab (`v3/src/components/LightPanel.tsx`). Not
sent on STOP ALL — C3: stopping sound and changing light are two things. The backup carries it.

## Light course and short lights

**Status:** Decided — plan approved by the owner on 2026-11-18 (K1–K6 as below). **Built: the
course in 3.0.321, the short light in 3.0.322, the pause in 3.0.323.** Written on the owner's request of 2026-11-18: a pad starts the day — a
rooster crows and the light is very bright; the day runs 20 minutes or longer (adjustable) while
the light turns from bright to sunset red; at the end the light stays so and a bell strikes. A
thunder pad played meanwhile flashes the lamp, and afterwards the day goes on in the state and
light it has reached by then.

### What already works

- **The sequence and the sound:** a combo "Day" — step 1 plays "Rooster" and waits 1,200 s, step 2
  plays "Bell". A step's wait has no upper limit (`setStepDuration` in `v3/src/lib/comboModel.ts`).
- **Thunder during the day:** another pad does not stop a running combo — only its own stop, STOP
  ALL or a step with "Stop everything first" do (`stopPad` in `v3/src/audio/engine.ts`).
- **Bright light at the start, the flash:** the rooster pad's light, the thunder pad's light (the
  effect Lightning).

### Why the lamp cannot do it alone

1. **A change over 20 minutes.** A WLED crossfade is limited: the JSON API's `tt` — "Max
   transition time is 65 seconds" (kno.wled.ge, JSON API). WLED's nightlight fades for 1 to 255
   minutes, in mode 2 "color fade" from the color at its start to the secondary color (JSON API
   `nl`; a WLED developer: "linear faded from the actual color … to the secondary color", WLED
   forum) — but it fades from whatever the lamp shows when it starts, and whether a flash ends it
   is not documented.
2. **Going on after the flash.** The flash replaces the lamp's state; the lamp does not know where
   the day was. Stage lighting solves exactly this: a console runs a cue with a long fade, a
   submaster flashes on top, and on its release "control will be restored" to the previous state
   (ETC Eos, Submaster Properties, restore mode "background", the default) — the cue's fade has
   gone on meanwhile.

So the app keeps the day, as a console keeps its cue: it knows where the course stands at every
moment and sends it to the lamp.

### Decisions K1–K6

| #   | Question                     | Decided                                                                                                                                                                                                                                                                                                                           | Not chosen                                                                                                                              |
| --- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| K1  | Where the course runs        | **In the app:** at each step of 10 s it sends the point the course reaches one step later, with that step as the transition — smooth in the lamp, below WLED's 65 s, the same for every lamp and for "All lamps".                                                                                                                 | The lamp's nightlight: one call, but a flash may end it (undocumented), the app cannot know where it stands, and only one target color. |
| K2  | What a course is             | A kind of pad light next to preset and effect: **from** a color and brightness **to** a color and brightness **over** N minutes (1–255). The color is blended linearly, as WLED's own color fade does. At the end the lamp keeps the end light.                                                                                   | Several stops (morning, noon, evening): later, if one course proves too coarse (minimal first).                                         |
| K3  | Base and short light         | Every light a pad starts is the **base** (it replaces a running course), unless the pad marks it **short**. A short light (e.g. Lightning) lasts as long as the pad's sound plays (a Loop: until it stops); then the app sends the base again (no seconds for a pad without sound — such a pad sends no light; owner 2026-11-19). | Back to the base on every pad stop (C3 keeps sound and light apart; a pad that is not short leaves its light).                          |
| K4  | Pause and STOP ALL           | **Pause** holds the course and goes on with it; **STOP ALL** leaves the light, as C3 says — the course runs on; another pad's light or the board's base light replaces it.                                                                                                                                                        | STOP ALL ends the course (stopping sound and changing light are two things, C3).                                                        |
| K5  | The 20 minutes in two places | The combo's wait and the course's minutes are **two values**, set to the same number; the LIGHT tab says so.                                                                                                                                                                                                                      | One value that links both (a new dependency between combo and light for one use).                                                       |
| K6  | When the app is closed       | The course is not stored: after a reload the lamp keeps the last point it was sent.                                                                                                                                                                                                                                               | Resuming after a reload (a stored start time and a write each start — not worth it for one evening).                                    |

### Steps

1. **Course** — built in 3.0.321: `PadLight` `{lamp, course}` (`v3/src/types.ts`); the LIGHT
   tab's Course with FROM and TO (a color and a brightness each) and MINUTES, TRY plays the whole
   way in 10 s; `v3/src/light/course.ts` runs it — a step is 10 s, or a tenth of a shorter course;
   a timer the browser runs late (a hidden page that "has been silent for at least 30 seconds" is
   woken once a minute, Chrome) makes the next transition as long as the gap it measured, up to
   60 s; WLED gets `{"on": true, "bri", "tt", "seg": {"fx": 0, "col"}}` (`stateBody` in
   `v3/src/light/wled.ts`); any other light a pad starts ends the course, a pad without light
   leaves it; the status bar shows "LIGHT 12 min left". The backup carries it; `parseBoard`
   checks it.
2. **Short light and the return to the base** — built in 3.0.322: SHORT in the LIGHT tab of a pad
   (`PadLight.short`), for a preset, an effect or off — not for a course, which is a base itself,
   and not for the board's base light. A short light holds a running course (it goes on but sends
   nothing, `holdCourse`); when the pad stops — its sound ends, a tap or STOP ALL stops it — the
   audio bridge calls `endPadLight`, and the base comes back (`v3/src/light/padLight.ts`): a
   running course at the point it has reached, at once; a course that ended meanwhile, its end
   light; a preset, an effect or off as it was. Another light that starts meanwhile is the new
   base, and the stop of the short pad then changes nothing. **K3 narrowed, decided by the owner
   on 2026-11-19 (option A):** no SECONDS for a pad without sound — a pad sends its light only
   when its sound starts (the bridge's `onPadStarted` in `v3/src/audio/index.ts`), so a pad
   without sound sends none; a pad with light only (a flash without thunder) is a new ability
   for its own plan, once it is missed. TRY sends a short light without the return.
3. **Pause holds the course** — built in 3.0.323: `pause` and `resume` of the audio facade
   (`v3/src/audio/index.ts`, every way into and out of a pause) stop and start the course's time
   (`pauseCourse`, `resumeCourse`): at the pause the lamp gets the point reached, at once, so it
   stands still too (not while a short light is on); the minutes stand; after it the course goes
   on from that point and ends as much later as it stood.

Each step is tested on a simulated clock (unit) and with Playwright standing in for the lamp
(E2E); the real lamp is an item on the iPhone checklist. An iPhone or iPad reaches no lamp without
the bridge (C5).

## Not yet

Palettes and further colors of an effect, the iPhone / iPad bridge itself (C5, owner decision). A pad played from the quick-access bar already sends its light, as from the
grid — the audio bridge starts the light of every pad that starts (tested in
`v3/tests/e2e/pad-light.spec.ts`, 2026-11-18). The app already takes a bridge's address:
an address typed with `https://` is used as it is, so an HTTPS reverse proxy in the home network
that forwards `/json/*` to the lamp (for example Caddy or nginx with a certificate the iPhone
trusts) works without a change in the app (`lampUrl` in `v3/src/light/wled.ts`).

## Sources

- WLED effects and JSON API: https://kno.wled.ge/features/effects/, https://kno.wled.ge/interfaces/json-api/
  ("ps": preset id −1 to 250; POST to `/json/state`; `/json/info`)
- WLED CORS headers: https://github.com/wled/WLED/blob/main/wled00/wled_server.cpp (`initServer`)
- Chrome Local Network Access: https://developer.chrome.com/blog/local-network-access
- MDN Local network access: https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Local_network_access
- WebKit and private network requests (secondary, older): https://developer.chrome.com/blog/private-network-access-update, https://bugs.webkit.org/show_bug.cgi?id=171934
- WLED and HTTPS (community): https://wled.discourse.group/t/making-wled-addressable-via-https/5948
- NN/g, Tabs, Used Right: https://www.nngroup.com/articles/tabs-used-right/
- WLED JSON API (`tt`, `transition`, `nl`): https://kno.wled.ge/interfaces/json-api/
- WLED nightlight color fade (forum, a developer's description; secondary): https://wled.discourse.group/t/sunrise-effect/47
- ETC Eos, Submaster Properties (restore mode background): https://www.etcconnect.com/webdocs/Controls/IonOnlineHelp/en-us/Content/21_Submasters/Submaster_Properties.htm
- Chrome, timer throttling in Chrome 88: https://developer.chrome.com/blog/timer-throttling-in-chrome-88
- Chrome Local Network Access, the local address ranges: https://developer.chrome.com/docs/modern-web-guidance/guides/security/local-network-access
- WLED getting started (WLED-AP, `4.3.2.1`): https://kno.wled.ge/basics/getting-started/
- WLED saved networks (forum, a developer's description; secondary): https://wled.discourse.group/t/multiple-ssid-support/10755
- WLED behind a reverse proxy: https://kno.wled.ge/advanced/access-over-internet/
- Personal Hotspot clients (Apple Developer Forums, DTS reply): https://developer.apple.com/forums/thread/699414
- iOS local network in apps ("Local network prohibited", Apple Developer Forums): https://developer.apple.com/forums/thread/788044
- iOS certificate trust for a manually installed root: https://support.apple.com/en-us/102390
- Shortcuts x-callback-url: https://support.apple.com/guide/shortcuts/apdcd7f20a6f/

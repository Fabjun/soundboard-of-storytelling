/**
 * @fileoverview wled — talks to a WLED lamp over its JSON API (docs/product/features/light.md C1,
 * C5, C6; ADR-0091)
 *
 * The effect runs in the lamp; the app names a preset the lamp's own app made, sets an effect with
 * its color, speed, intensity and brightness (C1 B), or switches it off (`POST /json/state`, WLED
 * JSON API); the effect names come from the lamp (`GET /json/eff`), as their ids differ between
 * WLED versions. WLED answers web pages from any origin (it sends
 * `Access-Control-Allow-Origin: *`), so the browser only has to allow the call: Chrome does for a
 * private address after the user allows "local network" (`targetAddressSpace: 'local'`), WebKit —
 * every iPhone and iPad browser — does not. Each call has a short time limit and says in plain
 * words why it failed.
 */

import type { LightCourse, LightEffect, LightPoint } from '../types';

/**
 * What a pad asks the lamp for: one of its presets (1–250), an effect, one point of a course with
 * the transition to it in ms (light.md K1), or off.
 */
export type LightCommand =
  | { preset: number }
  | { effect: LightEffect }
  | { point: LightPoint; transitionMs: number }
  | { off: true };

/** Highest preset id WLED keeps (JSON API: "ps", −1 to 250). */
export const PRESET_MAX = 250;

/** The effect a pad starts with when Effect is chosen: WLED's first effect, Solid, in a warm light. */
export const EFFECT_DEFAULT: LightEffect = {
  fx: 0,
  name: 'Solid',
  color: '#ff8a1f',
  speed: 128,
  intensity: 128,
  brightness: 128,
};

/** The JSON body WLED takes for an effect: on, its brightness, and the main segment's effect. */
type EffectBody = {
  on: true;
  bri: number;
  seg: { fx: number; sx: number; ix: number; col: [[number, number, number]] };
};

/**
 * The JSON body WLED takes for a point of a course: on, its brightness, the transition in tenths of
 * a second (`tt`, for this call only), and the main segment in Solid (effect 0) with its color.
 */
type PointBody = {
  on: true;
  bri: number;
  tt: number;
  seg: { fx: 0; col: [[number, number, number]] };
};

/** Turns `#rrggbb` into WLED's color array `[r, g, b]`. */
function rgb(color: string): [number, number, number] {
  const n = parseInt(color.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const byte = (v: unknown, min: number): boolean =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= 255;

/** Tells whether `v` is an effect a pad may keep (the ranges of the WLED JSON API). */
export function isLightEffect(v: unknown): v is LightEffect {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as Record<string, unknown>;
  return (
    byte(e.fx, 0) &&
    typeof e.name === 'string' &&
    e.name.length <= 64 &&
    typeof e.color === 'string' &&
    /^#[0-9a-f]{6}$/i.test(e.color) &&
    byte(e.speed, 0) &&
    byte(e.intensity, 0) &&
    byte(e.brightness, 1)
  );
}

/** Tells whether `v` is a light of a course: a color `#rrggbb` and a brightness of 1–255. */
function isLightPoint(v: unknown): v is LightPoint {
  if (typeof v !== 'object' || v === null) return false;
  const p = v as Record<string, unknown>;
  return typeof p.color === 'string' && /^#[0-9a-f]{6}$/i.test(p.color) && byte(p.brightness, 1);
}

/** The longest course, in minutes — as long as WLED's own nightlight (JSON API `nl.dur`). */
export const COURSE_MINUTES_MAX = 255;

/** Tells whether `v` is a course a pad may keep: two lights and whole minutes, 1–255. */
export function isLightCourse(v: unknown): v is LightCourse {
  if (typeof v !== 'object' || v === null) return false;
  const c = v as Record<string, unknown>;
  return (
    isLightPoint(c.from) &&
    isLightPoint(c.to) &&
    typeof c.minutes === 'number' &&
    Number.isInteger(c.minutes) &&
    c.minutes >= 1 &&
    c.minutes <= COURSE_MINUTES_MAX
  );
}

/** How long a call may take before the lamp counts as not answering, in ms. */
export const LIGHT_TIMEOUT_MS = 1000;

/** How a call ended; anything but `ok` carries what to tell the user. */
export type LightResult =
  | { kind: 'ok'; name?: string }
  | { kind: 'no-answer' }
  | { kind: 'blocked' }
  | { kind: 'bad-address' }
  | { kind: 'not-local'; setupNetwork: boolean };

/**
 * IPv4 ranges a call over plain HTTP may reach from the HTTPS app, as [network, prefix length]:
 * Chrome's local and loopback spaces (10/8, 172.16/12, 192.168/16, 169.254/16, 127/8 — Chrome,
 * "Local Network Access"), and 100.64/10 and 198.18/15, whose class is not settled — tried rather
 * than refused, so no working address is turned away.
 */
const TRIED_RANGES: [string, number][] = [
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
];

/** The 32-bit value of a dotted IPv4 address, or null when `host` is none. */
function ipv4(host: string): number | null {
  const parts = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host)?.slice(1).map(Number);
  if (!parts || parts.some((p) => p > 255)) return null;
  return parts.reduce((v, p) => v * 256 + p, 0);
}

/**
 * Whether the lamp at `base` (from `lampUrl`) is out of reach before any call: an IPv4 address in
 * none of `TRIED_RANGES`, over plain HTTP, is mixed content the browser blocks even with "local
 * network" allowed. `4.3.2.x` is WLED's own setup network (WLED-AP, the lamp at 4.3.2.1 — WLED,
 * "Getting started"). Names and HTTPS addresses (a bridge may have a public one) are tried.
 */
function outOfReach(base: string): Extract<LightResult, { kind: 'not-local' }> | null {
  const url = new URL(base);
  const ip = ipv4(url.hostname);
  if (url.protocol !== 'http:' || ip === null) return null;
  const tried = TRIED_RANGES.some(([net, bits]) => {
    const size = 2 ** (32 - bits);
    return Math.floor(ip / size) === Math.floor((ipv4(net) ?? 0) / size);
  });
  if (tried) return null;
  return { kind: 'not-local', setupNetwork: Math.floor(ip / 256) === (ipv4('4.3.2.0') ?? 0) / 256 };
}

/** The base URL to call for `typed`, or why no call is made: a bad address, or one out of reach. */
function target(
  typed: string,
): string | Extract<LightResult, { kind: 'bad-address' } | { kind: 'not-local' }> {
  const base = lampUrl(typed);
  if (!base) return { kind: 'bad-address' };
  return outOfReach(base) ?? base;
}

/**
 * The lamp's base URL from what the user typed — `192.168.1.50`, `wled-kitchen.local`,
 * `http://192.168.1.50/` — or null when it is no host. Plain HTTP unless HTTPS is typed (a bridge
 * may have it; the lamp itself has not).
 */
export function lampUrl(typed: string): string | null {
  const raw = typed.trim();
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname || url.pathname.length > 1 || url.search || url.hash) return null;
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

/**
 * The JSON body WLED takes for a command: `{"ps": n}` for a preset, `{"on": false}` for off, and
 * for an effect `on`, `bri` and the main segment's `fx`, `sx`, `ix` and color — a `seg` without an
 * id goes to the main segment (WLED JSON API). A point of a course sets Solid and its color, with
 * `tt` in tenths of a second.
 */
export function stateBody(
  command: LightCommand,
): { ps: number } | { on: false } | EffectBody | PointBody {
  if ('off' in command) return { on: false };
  if ('preset' in command) return { ps: command.preset };
  if ('point' in command) {
    return {
      on: true,
      bri: command.point.brightness,
      tt: Math.round(command.transitionMs / 100),
      seg: { fx: 0, col: [rgb(command.point.color)] },
    };
  }
  const e = command.effect;
  return {
    on: true,
    bri: e.brightness,
    seg: { fx: e.fx, sx: e.speed, ix: e.intensity, col: [rgb(e.color)] },
  };
}

/** Tells whether `n` is a preset id a pad may name. */
export function isPreset(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= PRESET_MAX;
}

/** The parts of `fetch` the client needs — the real one, or a stand-in in tests. */
export type Fetch = (
  url: string,
  init: RequestInit & { targetAddressSpace?: 'local' },
) => Promise<Response>;

async function call(
  url: string,
  init: RequestInit,
  fetchImpl: Fetch,
  timeoutMs: number,
): Promise<Response | LightResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Chrome lets an HTTPS page reach a private address with the user's "local network"
    // permission; the hint is ignored where it is unknown
    return await fetchImpl(url, {
      ...init,
      signal: controller.signal,
      targetAddressSpace: 'local',
    });
  } catch (e) {
    // An abort is the time limit; any other failure is the browser refusing (mixed content, no
    // permission) or no host at all — a page cannot tell these apart (fetch only says TypeError)
    return controller.signal.aborted ? { kind: 'no-answer' } : { kind: 'blocked' };
  } finally {
    clearTimeout(timer);
  }
}

/** Sends a command to the lamp at `typed` (the address as entered); never throws. */
export async function sendLight(
  typed: string,
  command: LightCommand,
  fetchImpl: Fetch = fetch,
  timeoutMs = LIGHT_TIMEOUT_MS,
): Promise<LightResult> {
  const base = target(typed);
  if (typeof base !== 'string') return base;
  const r = await call(
    `${base}/json/state`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stateBody(command)),
    },
    fetchImpl,
    timeoutMs,
  );
  if (!(r instanceof Response)) return r;
  return r.ok ? { kind: 'ok' } : { kind: 'no-answer' };
}

/** Asks the lamp at `typed` who it is (`GET /json/info`) — the connection test; never throws. */
export async function testLamp(
  typed: string,
  fetchImpl: Fetch = fetch,
  timeoutMs = LIGHT_TIMEOUT_MS * 3,
): Promise<LightResult> {
  const base = target(typed);
  if (typeof base !== 'string') return base;
  const r = await call(`${base}/json/info`, { method: 'GET' }, fetchImpl, timeoutMs);
  if (!(r instanceof Response)) return r;
  if (!r.ok) return { kind: 'no-answer' };
  try {
    const info = (await r.json()) as { name?: unknown };
    return { kind: 'ok', ...(typeof info.name === 'string' ? { name: info.name } : {}) };
  } catch {
    return { kind: 'no-answer' }; // something answered, but not a WLED lamp
  }
}

/** One effect of a lamp: its id, which the JSON API takes, and its name. */
export interface LampEffect {
  id: number;
  name: string;
}

/**
 * Asks the lamp at `typed` for its effects (`GET /json/eff`, an array of names whose index is the
 * id); effects a build leaves out — named "RSVD" or "-", WLED JSON API — are dropped. Never throws.
 */
export async function listEffects(
  typed: string,
  fetchImpl: Fetch = fetch,
  timeoutMs = LIGHT_TIMEOUT_MS * 3,
): Promise<{ kind: 'effects'; effects: LampEffect[] } | Exclude<LightResult, { kind: 'ok' }>> {
  const base = target(typed);
  if (typeof base !== 'string') return base;
  const r = await call(`${base}/json/eff`, { method: 'GET' }, fetchImpl, timeoutMs);
  if (!(r instanceof Response)) {
    return r.kind === 'ok' ? { kind: 'no-answer' } : r;
  }
  if (!r.ok) return { kind: 'no-answer' };
  try {
    const names = (await r.json()) as unknown;
    if (!Array.isArray(names)) return { kind: 'no-answer' };
    const effects = names.flatMap((name, id) =>
      typeof name === 'string' && name !== 'RSVD' && name !== '-' ? [{ id, name }] : [],
    );
    return { kind: 'effects', effects };
  } catch {
    return { kind: 'no-answer' }; // something answered, but not a WLED lamp
  }
}

/** Says in plain words what a result means and what to do (Nielsen heuristic 9). */
export function describeResult(result: LightResult): string {
  switch (result.kind) {
    case 'ok':
      return result.name ? `Connected to ${result.name}.` : 'Connected.';
    case 'bad-address':
      return 'This is no lamp address — type its IP address, e.g. 192.168.1.50, or its name ending in .local.';
    case 'no-answer':
      return 'No lamp answered at this address — check that it is on and in the same network.';
    case 'blocked':
      return 'This browser does not let the app reach the lamp. In Chrome or Brave on a computer, allow "local network" for this site; on an iPhone or iPad no browser allows it yet.';
    case 'not-local':
      return result.setupNetwork
        ? "This is the lamp's own setup Wi-Fi (WLED-AP), which the app cannot reach. In the lamp's WiFi settings, join it to the Wi-Fi this device is in, then type the address it gets there."
        : 'This address is not in a home network, so the browser does not let the app reach it. Type the address the lamp has in this network, e.g. 192.168.1.50, or its name ending in .local.';
  }
}

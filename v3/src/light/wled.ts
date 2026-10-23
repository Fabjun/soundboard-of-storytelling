/**
 * @fileoverview wled — talks to a WLED lamp over its JSON API (docs/product/features/light.md C1,
 * C5, C6; ADR-0091)
 *
 * The effect runs in the lamp; the app only names a preset the lamp's own app made, or switches it
 * off (`POST /json/state`, WLED JSON API). WLED answers web pages from any origin (it sends
 * `Access-Control-Allow-Origin: *`), so the browser only has to allow the call: Chrome does for a
 * private address after the user allows "local network" (`targetAddressSpace: 'local'`), WebKit —
 * every iPhone and iPad browser — does not. Each call has a short time limit and says in plain
 * words why it failed.
 */

/** What a pad asks the lamp for: one of its presets (1–250), or off. */
export type LightCommand = { preset: number } | { off: true };

/** Highest preset id WLED keeps (JSON API: "ps", −1 to 250). */
export const PRESET_MAX = 250;

/** How long a call may take before the lamp counts as not answering, in ms. */
export const LIGHT_TIMEOUT_MS = 1000;

/** How a call ended; anything but `ok` carries what to tell the user. */
export type LightResult =
  | { kind: 'ok'; name?: string }
  | { kind: 'no-answer' }
  | { kind: 'blocked' }
  | { kind: 'bad-address' };

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

/** The JSON body WLED takes for a command: `{"ps": n}` for a preset, `{"on": false}` for off. */
export function stateBody(command: LightCommand): { ps: number } | { on: false } {
  return 'off' in command ? { on: false } : { ps: command.preset };
}

/**
 * Tells whether `n` is a preset id a pad may name.
 *
 * @reserved Parked — a pad's light, step 2 of docs/product/features/light.md (Building blocks 1, 4)
 */
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

/**
 * Sends a command to the lamp at `typed` (the address as entered); never throws.
 *
 * @reserved Parked — a pad's light, step 2 of docs/product/features/light.md (Building blocks 2)
 */
export async function sendLight(
  typed: string,
  command: LightCommand,
  fetchImpl: Fetch = fetch,
  timeoutMs = LIGHT_TIMEOUT_MS,
): Promise<LightResult> {
  const base = lampUrl(typed);
  if (!base) return { kind: 'bad-address' };
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
  const base = lampUrl(typed);
  if (!base) return { kind: 'bad-address' };
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
  }
}

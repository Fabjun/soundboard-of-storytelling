/**
 * @fileoverview wled — the WLED JSON client (light.md C1, C5, C6; ADR-0091)
 *
 * fetch is a stand-in: what the client sends (URL, method, body, the local-network hint), and each
 * way a call ends — answered, refused by the browser, timed out, a bad address, not a WLED lamp.
 * An effect's body and ranges; a course point's body and a course's ranges; the effect list read
 * from the lamp.
 */

import {
  COURSE_MINUTES_MAX,
  describeResult,
  EFFECT_DEFAULT,
  isLightCourse,
  isLightEffect,
  isPreset,
  lampUrl,
  listEffects,
  PRESET_MAX,
  sendLight,
  stateBody,
  testLamp,
  type Fetch,
} from '../../src/light/wled';

type Call = { url: string; init: Parameters<Fetch>[1] };

/** A fetch that records each call and answers with `respond`. */
function fakeFetch(respond: (call: Call) => Promise<Response>): { fetch: Fetch; calls: Call[] } {
  const calls: Call[] = [];
  return {
    calls,
    fetch: (url, init) => {
      const call = { url, init };
      calls.push(call);
      return respond(call);
    },
  };
}

describe('lampUrl', () => {
  it.each([
    ['192.168.1.50', 'http://192.168.1.50'],
    [' wled-kitchen.local ', 'http://wled-kitchen.local'],
    ['http://192.168.1.50/', 'http://192.168.1.50'],
    ['HTTP://10.0.0.2:8080', 'http://10.0.0.2:8080'],
    ['https://bridge.example', 'https://bridge.example'],
  ])('%s → %s', (typed, url) => {
    expect(lampUrl(typed)).toBe(url);
  });

  it.each(['', '   ', 'http://', '192.168.1.50/json', 'host?x=1', 'ftp://lamp', 'a b'])(
    '%s is no lamp address',
    (typed) => {
      expect(lampUrl(typed)).toBeNull();
    },
  );
});

describe('stateBody / isPreset', () => {
  it('a preset is {"ps": n}, off is {"on": false}', () => {
    expect(stateBody({ preset: 7 })).toEqual({ ps: 7 });
    expect(stateBody({ off: true })).toEqual({ on: false });
  });

  it('a preset is a whole number from 1 to 250', () => {
    for (const ok of [1, 42, PRESET_MAX]) expect(isPreset(ok)).toBe(true);
    for (const bad of [0, -1, PRESET_MAX + 1, 2.5, Number.NaN, '3', null, undefined])
      expect(isPreset(bad)).toBe(false);
  });

  it('an effect is on, its brightness, and the main segment with fx, sx, ix and its color', () => {
    const effect = {
      fx: 66,
      name: 'Fire 2012',
      color: '#ff8a1f',
      speed: 10,
      intensity: 200,
      brightness: 90,
    };
    expect(stateBody({ effect })).toEqual({
      on: true,
      bri: 90,
      seg: { fx: 66, sx: 10, ix: 200, col: [[255, 138, 31]] },
    });
  });

  it('an effect keeps the ranges of the WLED JSON API', () => {
    const ok = { ...EFFECT_DEFAULT };
    expect(isLightEffect(ok)).toBe(true);
    expect(isLightEffect({ ...ok, fx: 255, speed: 0, intensity: 255, brightness: 1 })).toBe(true);
    for (const bad of [
      { ...ok, fx: 256 },
      { ...ok, fx: -1 },
      { ...ok, speed: 1.5 },
      { ...ok, intensity: 300 },
      { ...ok, brightness: 0 },
      { ...ok, color: 'red' },
      { ...ok, color: '#12345' },
      { ...ok, name: 7 },
      { ...ok, name: 'x'.repeat(65) },
      null,
      'Solid',
    ])
      expect(isLightEffect(bad)).toBe(false);
  });

  it('a course point is on, its brightness, tt in tenths of a second, and Solid in its color', () => {
    expect(
      stateBody({ point: { color: '#ff8a1f', brightness: 90 }, transitionMs: 10_000 }),
    ).toEqual({ on: true, bri: 90, tt: 100, seg: { fx: 0, col: [[255, 138, 31]] } });
    expect(stateBody({ point: { color: '#000000', brightness: 1 }, transitionMs: 0 })).toEqual({
      on: true,
      bri: 1,
      tt: 0,
      seg: { fx: 0, col: [[0, 0, 0]] },
    });
  });

  it('a course has two lights (#rrggbb, brightness 1–255) and whole minutes from 1 to 255', () => {
    const point = { color: '#fff4e0', brightness: 255 };
    const ok = { from: point, to: { color: '#c2401a', brightness: 1 }, minutes: 20 };
    expect(isLightCourse(ok)).toBe(true);
    expect(isLightCourse({ ...ok, minutes: 1 })).toBe(true);
    expect(isLightCourse({ ...ok, minutes: COURSE_MINUTES_MAX })).toBe(true);
    for (const bad of [
      { ...ok, minutes: 0 },
      { ...ok, minutes: COURSE_MINUTES_MAX + 1 },
      { ...ok, minutes: 2.5 },
      { ...ok, minutes: '20' },
      { ...ok, from: { ...point, brightness: 0 } },
      { ...ok, to: { ...point, color: 'red' } },
      { ...ok, to: undefined },
      { from: point, to: point },
      null,
      'day',
    ])
      expect(isLightCourse(bad)).toBe(false);
  });
});

describe('listEffects', () => {
  it("GETs /json/eff; each name's index is its id; RSVD and - are left out", async () => {
    const { fetch, calls } = fakeFetch(() =>
      Promise.resolve(new Response(JSON.stringify(['Solid', 'Blink', 'RSVD', '-', 'Fire 2012']))),
    );
    expect(await listEffects('192.168.1.50', fetch)).toEqual({
      kind: 'effects',
      effects: [
        { id: 0, name: 'Solid' },
        { id: 1, name: 'Blink' },
        { id: 4, name: 'Fire 2012' },
      ],
    });
    expect(calls[0]).toMatchObject({
      url: 'http://192.168.1.50/json/eff',
      init: { method: 'GET' },
    });
  });

  it('no list, no WLED lamp, an error status, a refused call or a bad address says why', async () => {
    const notList = fakeFetch(() => Promise.resolve(new Response('{"a":1}')));
    expect(await listEffects('192.168.1.50', notList.fetch)).toEqual({ kind: 'no-answer' });
    const html = fakeFetch(() => Promise.resolve(new Response('<html>router</html>')));
    expect(await listEffects('192.168.1.1', html.fetch)).toEqual({ kind: 'no-answer' });
    const error = fakeFetch(() => Promise.resolve(new Response('', { status: 500 })));
    expect(await listEffects('192.168.1.1', error.fetch)).toEqual({ kind: 'no-answer' });
    const refused = fakeFetch(() => Promise.reject(new TypeError('Failed to fetch')));
    expect(await listEffects('192.168.1.1', refused.fetch)).toEqual({ kind: 'blocked' });
    expect(await listEffects('not a host/x', notList.fetch)).toEqual({ kind: 'bad-address' });
  });
});

describe('sendLight', () => {
  it('POSTs the command as JSON to /json/state, with the local-network hint', async () => {
    const { fetch, calls } = fakeFetch(() => Promise.resolve(new Response('{}')));
    expect(await sendLight('192.168.1.50', { preset: 3 }, fetch)).toEqual({ kind: 'ok' });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('http://192.168.1.50/json/state');
    expect(calls[0].init).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"ps":3}',
      targetAddressSpace: 'local',
    });
  });

  it('a refused call is "blocked", a call past the time limit "no answer", an error status too', async () => {
    const refused = fakeFetch(() => Promise.reject(new TypeError('Failed to fetch')));
    expect(await sendLight('192.168.1.50', { off: true }, refused.fetch)).toEqual({
      kind: 'blocked',
    });

    const silent = fakeFetch(
      ({ init }) =>
        new Promise((_, reject) =>
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          ),
        ),
    );
    expect(await sendLight('192.168.1.50', { off: true }, silent.fetch, 20)).toEqual({
      kind: 'no-answer',
    });

    const error = fakeFetch(() => Promise.resolve(new Response('', { status: 500 })));
    expect(await sendLight('192.168.1.50', { off: true }, error.fetch)).toEqual({
      kind: 'no-answer',
    });
  });

  it('a bad address sends nothing', async () => {
    const { fetch, calls } = fakeFetch(() => Promise.resolve(new Response('{}')));
    expect(await sendLight('not an address', { preset: 1 }, fetch)).toEqual({
      kind: 'bad-address',
    });
    expect(calls).toEqual([]);
  });
});

describe('testLamp', () => {
  it('GETs /json/info and names the lamp', async () => {
    const { fetch, calls } = fakeFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ name: 'Floor lamp', ver: '0.15.0' }))),
    );
    expect(await testLamp('wled.local', fetch)).toEqual({ kind: 'ok', name: 'Floor lamp' });
    expect(calls[0]).toMatchObject({ url: 'http://wled.local/json/info', init: { method: 'GET' } });
  });

  it('an answer that is not JSON is no WLED lamp; a nameless one is still connected', async () => {
    const html = fakeFetch(() => Promise.resolve(new Response('<html>router</html>')));
    expect(await testLamp('192.168.1.1', html.fetch)).toEqual({ kind: 'no-answer' });
    const nameless = fakeFetch(() => Promise.resolve(new Response('{}')));
    expect(await testLamp('192.168.1.2', nameless.fetch)).toEqual({ kind: 'ok' });
  });
});

describe('describeResult', () => {
  it('says what happened and what to do, for every result', () => {
    expect(describeResult({ kind: 'ok', name: 'Floor lamp' })).toBe('Connected to Floor lamp.');
    expect(describeResult({ kind: 'ok' })).toBe('Connected.');
    expect(describeResult({ kind: 'bad-address' })).toMatch(/192\.168\.1\.50/);
    expect(describeResult({ kind: 'no-answer' })).toMatch(/same network/);
    expect(describeResult({ kind: 'blocked' })).toMatch(/local network/);
  });
});

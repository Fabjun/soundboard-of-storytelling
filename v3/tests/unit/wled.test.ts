/**
 * @fileoverview wled — the WLED JSON client (light.md C1, C5, C6; ADR-0091)
 *
 * fetch is a stand-in: what the client sends (URL, method, body, the local-network hint), and each
 * way a call ends — answered, refused by the browser, timed out, a bad address, not a WLED lamp.
 */

import {
  describeResult,
  isPreset,
  lampUrl,
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
